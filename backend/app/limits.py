"""Batas NFR. Hanya penghitung teknis sementara; tidak menyimpan isi materi."""

from collections import OrderedDict
from time import monotonic

from starlette.responses import JSONResponse
from starlette.types import ASGIApp, Message, Receive, Scope, Send

from .config import settings


class RequestLimits:
    def __init__(
        self,
        app: ASGIApp,
        max_bytes: int = settings.max_request_bytes,
        per_minute: int = settings.api_requests_per_minute,
    ) -> None:
        self.app = app
        self.max_bytes = max_bytes
        self.per_minute = per_minute
        self.clients: OrderedDict[str, tuple[float, int]] = OrderedDict()

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http" or not scope["path"].startswith("/api/"):
            await self.app(scope, receive, send)
            return
        if scope["method"] not in {"POST", "PUT", "PATCH"}:
            await self.app(scope, receive, send)
            return
        now = monotonic()
        while self.clients and now - next(iter(self.clients.values()))[0] >= 60:
            self.clients.popitem(last=False)
        client = (scope.get("client") or ("unknown", 0))[0]
        start, count = self.clients.get(client, (now, 0))
        if count >= self.per_minute:
            await JSONResponse(
                {"detail": "Terlalu banyak permintaan. Tunggu satu menit lalu coba lagi."},
                status_code=429,
                headers={"Retry-After": "60"},
            )(scope, receive, send)
            return
        if client not in self.clients and len(self.clients) >= settings.rate_limit_max_clients:
            self.clients.popitem(last=False)
        self.clients[client] = (start, count + 1)
        # Batasi byte yang sungguh diterima, termasuk bila Content-Length hilang/palsu.
        messages: list[Message] = []
        size = 0
        while True:
            message = await receive()
            if message["type"] == "http.disconnect":
                return
            size += len(message.get("body", b""))
            if size > self.max_bytes:
                await JSONResponse(
                    {
                        "detail": "Permintaan terlalu besar. Kurangi isi materi atau buat ulang hasil."
                    },
                    status_code=413,
                )(scope, receive, send)
                return
            messages.append(message)
            if not message.get("more_body", False):
                break
        iterator = iter(messages)

        async def replay() -> Message:
            return next(iterator, {"type": "http.request", "body": b"", "more_body": False})

        await self.app(scope, replay, send)
