from io import BytesIO

import pytest
from fastapi.testclient import TestClient
from print_helpers import printable
from pypdf import PdfReader

from app.main import app
from app.models import PdfRequest
from app.pdf import render_html

client = TestClient(app)


def workspace() -> dict:
    return printable(
        client.post(
            "/api/analyze", json={"text": "Akar menyerap air. Daun memperoleh cahaya."}
        ).json()
    )


def test_print_contract_and_teacher_separation() -> None:
    data = workspace()
    html = render_html(PdfRequest(**data))
    assert "@font-face" in html and "data:font/ttf;base64," in html
    assert "font-weight:400" in html
    preview = client.post("/api/pdf/preview", json=data)
    assert preview.status_code == 200
    assert 'data-kind="teacher"' in preview.text and 'id="student"' not in preview.text
    assert preview.headers["cache-control"] == "no-store"
    pdf = client.post("/api/pdf", json=data)
    assert pdf.status_code == 200
    pages = PdfReader(BytesIO(pdf.content)).pages
    assert len(pages) == 2
    assert "Kunci jawaban" not in pages[0].extract_text()
    assert "Kunci jawaban" in pages[1].extract_text()
    assert "Nama:" in pages[0].extract_text() and "Kelas:" in pages[0].extract_text()


@pytest.mark.parametrize("case", ["unreviewed", "wrong_answer", "source", "pending", "oversized"])
def test_print_rejects_invalid_or_unfittable(case: str) -> None:
    data = workspace()
    if case == "unreviewed":
        data["exercises"][0]["reviewed"] = False
    if case == "wrong_answer":
        data["exercises"][0]["answer"] = "palsu"
    if case == "source":
        data["cards"][0]["source_sentence_ids"] = ["unknown"]
    if case == "pending":
        data["cards"][0]["review_status"] = "pending"
        data["cards"][0]["adapted_text"] = "Usulan belum diterima."
    if case == "oversized":
        data["cards"][0]["review_status"] = "edited"
        data["cards"][0]["adapted_text"] = "kalimat panjang " * 700
    for endpoint in ["/api/pdf", "/api/pdf/preview"]:
        response = client.post(endpoint, json=data)
        assert response.status_code == 422
        if case == "oversized":
            assert "terlalu panjang" in response.json()["detail"]


def test_print_escape_every_surface() -> None:
    data = workspace()
    data["document"]["title"] = "<img src=x onerror=alert(1)>"
    data["cards"][0]["review_status"] = "edited"
    data["cards"][0]["adapted_text"] = "<script>alert(1)</script>"
    data["cards"][0]["warnings"] = ["</style><script>bad()</script>"]
    html = render_html(PdfRequest(**data))
    assert "<script>" not in html and "<img src=x" not in html
    assert "&lt;script&gt;" in html and "&lt;img" in html
