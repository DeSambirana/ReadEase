import asyncio
from pathlib import Path

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse, Response
from fastapi.staticfiles import StaticFiles
from playwright.async_api import Error as BrowserError

from .accounts import require_teacher
from .accounts import router as accounts_router
from .analysis import analyze_text
from .config import settings
from .limits import RequestLimits
from .models import (
    AnalyzeRequest,
    AnalyzeResponse,
    HealthResponse,
    PdfRequest,
    RecomputeRequest,
    RecomputeResponse,
    WorksheetRequest,
    WorksheetResponse,
)
from .pdf import render_print
from .review import recompute_review
from .worksheet import make_worksheet

app = FastAPI(title="AksaraInklusi", version="0.6.0")

app.add_middleware(RequestLimits)


@app.middleware("http")
async def private_responses(request: Request, call_next):
    response = await call_next(request)
    if request.url.path.startswith("/api/"):
        response.headers["Cache-Control"] = "no-store"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "no-referrer"
    return response


app.include_router(accounts_router)
active_prints = 0


async def guarded_print(data: PdfRequest, preview: bool = False) -> bytes | str:
    global active_prints
    if active_prints >= settings.pdf_concurrency:
        print(f"[guarded_print] Busy: active_prints={active_prints} >= {settings.pdf_concurrency}")
        raise HTTPException(status_code=503, detail="Pencetakan sedang sibuk. Coba lagi sebentar.")
    active_prints += 1
    try:
        async with asyncio.timeout(settings.pdf_timeout_seconds):
            return await render_print(data, preview=preview)
    except (TimeoutError, BrowserError) as exc:
        import traceback
        print(f"[guarded_print] Error {type(exc)}: {exc}")
        traceback.print_exc()
        raise HTTPException(
            status_code=503,
            detail="PDF belum berhasil dibuat. Coba lagi; jika berulang, periksa pemasangan Chromium.",
        ) from exc
    finally:
        active_prints -= 1



@app.exception_handler(RequestValidationError)
async def validation_error(request: Request, exc: RequestValidationError) -> JSONResponse:
    # Jangan mengembalikan atau mencatat nilai input dari galat validasi.
    detail = "Masukan tidak valid. Periksa teks dan struktur data."
    for error in exc.errors():
        if error["loc"] == ("body", "text"):
            if error["type"] == "value_error":
                detail = error["msg"].removeprefix("Value error, ")
            elif error["type"] == "string_too_long":
                detail = "Teks melebihi batas 30.000 karakter."
            else:
                detail = "Teks belum diisi atau bukan berupa teks."
        elif error["loc"] == ("body", "options", "threshold"):
            detail = "Ambang harus berupa bilangan bulat antara 1 dan 200."
    return JSONResponse(status_code=422, content={"detail": detail})


@app.get("/api/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse()


@app.post("/api/analyze", dependencies=[Depends(require_teacher)], response_model=AnalyzeResponse)
def analyze(data: AnalyzeRequest) -> AnalyzeResponse:
    try:
        return analyze_text(data)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@app.post(
    "/api/recompute", dependencies=[Depends(require_teacher)], response_model=RecomputeResponse
)
def recompute(data: RecomputeRequest) -> RecomputeResponse:
    try:
        return recompute_review(data)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@app.post(
    "/api/worksheet", dependencies=[Depends(require_teacher)], response_model=WorksheetResponse
)
def worksheet(data: WorksheetRequest) -> WorksheetResponse:
    try:
        return make_worksheet(data)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@app.post(
    "/api/pdf",
    dependencies=[Depends(require_teacher)],
    responses={200: {"content": {"application/pdf": {}}}},
    response_class=Response,
)
async def pdf(data: PdfRequest) -> Response:
    try:
        result = await guarded_print(data)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    filename = "aksarainklusi-lkpd"
    if data.student_name:
        safe_name = "".join(c for c in data.student_name if c.isalnum() or c in " -_").strip()
        if safe_name:
            filename = f"aksarainklusi-lkpd-{safe_name}"
    return Response(
        result,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}.pdf"',
            "Cache-Control": "no-store",
        },
    )



@app.post("/api/pdf/preview", dependencies=[Depends(require_teacher)], response_class=Response)
async def print_preview(data: PdfRequest) -> Response:
    try:
        html = await guarded_print(data, preview=True)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return Response(
        html,
        media_type="text/html",
        headers={
            "Cache-Control": "no-store",
            "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; font-src data:",
        },
    )


@app.api_route("/api/{path:path}", methods=["GET", "POST"], include_in_schema=False)
def unknown_api(path: str) -> JSONResponse:
    return JSONResponse(status_code=404, content={"detail": "Endpoint tidak ditemukan."})


static_path = Path(__file__).resolve().parents[1] / "static"
if not static_path.is_dir():
    frontend_dist = Path(__file__).resolve().parents[2] / "frontend" / "dist"
    if frontend_dist.is_dir():
        static_path = frontend_dist
if static_path.is_dir():
    app.mount("/", StaticFiles(directory=static_path, html=True), name="frontend")

