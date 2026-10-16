import asyncio

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from starlette.types import Message, Receive, Scope, Send

from app.limits import RequestLimits
from app.main import app


def test_size_and_rate_limits() -> None:
    service = FastAPI()
    service.add_middleware(RequestLimits, max_bytes=20, per_minute=2)

    @service.post("/api/test")
    def endpoint() -> dict:
        return {"ok": True}

    with TestClient(service) as client:
        assert client.post("/api/test", content=b"x" * 21).status_code == 413
        assert client.post("/api/test", content=b"{}").status_code == 200
        result = client.post("/api/test", content=b"{}")
        assert result.status_code == 429 and result.headers["retry-after"] == "60"
        assert "x" * 21 not in result.text


def test_chunked_size_limit() -> None:
    messages = iter(
        [
            {"type": "http.request", "body": b"ab", "more_body": True},
            {"type": "http.request", "body": b"cd", "more_body": False},
        ]
    )
    sent: list[Message] = []

    async def downstream(scope: Scope, receive: Receive, send: Send) -> None:
        raise AssertionError("Payload besar tidak boleh mencapai endpoint")

    async def receive() -> Message:
        return next(messages)

    async def send(message: Message) -> None:
        sent.append(message)

    asyncio.run(
        RequestLimits(downstream, max_bytes=3)(
            {"type": "http", "path": "/api/test", "method": "POST", "client": ("test", 0)},
            receive,
            send,
        )
    )
    assert sent[0]["status"] == 413


def test_invalid_json_does_not_echo_text() -> None:
    with TestClient(app) as client:
        response = client.post(
            "/api/analyze", content='{"text":"RAHASIA', headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 422 and "RAHASIA" not in response.text


def test_pdf_failure_and_busy_are_safe(monkeypatch: pytest.MonkeyPatch) -> None:
    import importlib

    from playwright.async_api import Error as BrowserError
    from print_helpers import printable

    main = importlib.import_module("app.main")

    async def failed_render(*args: object, **kwargs: object) -> bytes:
        raise BrowserError("RAHASIA internal renderer")

    monkeypatch.setattr(main, "render_print", failed_render)
    with TestClient(app) as client:
        data = printable(client.post("/api/analyze", json={"text": "Akar menyerap air."}).json())
        for endpoint in ["/api/pdf", "/api/pdf/preview"]:
            result = client.post(endpoint, json=data)
            assert result.status_code == 503 and "RAHASIA" not in result.text
            assert main.active_prints == 0
        monkeypatch.setattr(main, "active_prints", main.settings.pdf_concurrency)
        result = client.post("/api/pdf", json=data)
        assert result.status_code == 503 and "sibuk" in result.json()["detail"]
