from io import BytesIO
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from print_helpers import printable
from pypdf import PdfReader

from app.main import app
from app.models import AnalyzeResponse, PdfRequest, RecomputeResponse, WorksheetResponse
from app.pdf import render_html

client = TestClient(app)
SAMPLES = Path(__file__).resolve().parents[2] / "data" / "samples"


def test_health():
    assert client.get("/api/health").json() == {"status": "ok", "stage": 6}


@pytest.mark.parametrize("sample", sorted(SAMPLES.glob("*.txt")), ids=lambda p: p.stem)
def test_contract_pipeline(sample):
    text = sample.read_text()
    assert 300 <= len(text.split()) <= 800
    response = client.post("/api/analyze", json={"text": text})
    assert response.status_code == 200
    data = AnalyzeResponse.model_validate(response.json())
    assert not data.is_example
    assert all(p.review_status.value == "pending" for p in data.proposals)
    assert [sid for card in data.cards for sid in card.source_sentence_ids] == [
        s.id for s in data.document.sentences
    ]
    for card in data.cards:
        assert card.adapted_text == " ".join(
            s.text for s in data.document.sentences if s.id in card.source_sentence_ids
        )
    workspace = data.model_dump(mode="json", include={"document", "cards", "exercises"})
    recompute = client.post("/api/recompute", json=workspace)
    assert recompute.status_code == 200
    final = RecomputeResponse.model_validate(recompute.json())
    assert final.document.metrics_after is not None
    source_ids = {sentence.id for sentence in data.document.sentences}
    assert {sid for card in final.cards for sid in card.source_sentence_ids} == source_ids
    for card in final.cards:
        assert set(card.source_sentence_ids) <= source_ids
        assert {
            "source_sentence_ids",
            "rule_id",
            "review_status",
            "warnings",
        } <= card.model_dump().keys()
    worksheet = client.post(
        "/api/worksheet", json={"document": workspace["document"], "selections": []}
    )
    assert WorksheetResponse.model_validate(worksheet.json()).exercises == []
    pdf = client.post("/api/pdf", json=printable(workspace))
    assert pdf.status_code == 200
    assert pdf.headers["content-type"] == "application/pdf"
    assert PdfReader(BytesIO(pdf.content)).pages


@pytest.mark.parametrize("text", ["", "   ", "kata " * 1501])
def test_invalid_text(text):
    response = client.post("/api/analyze", json={"text": text})
    assert response.status_code == 422
    assert list(response.json()) == ["detail"]


def test_schema_rejects_extra_fields():
    assert client.post("/api/analyze", json={"text": "Contoh.", "unknown": True}).status_code == 422


def test_safe_html_and_a4_pdf():
    data = AnalyzeResponse.model_validate(
        client.post(
            "/api/analyze",
            json={
                "text": "<script>window.attacked=true</script> Jika air tidak tersedia, tanaman dapat layu."
            },
        ).json()
    )
    workspace = PdfRequest(**printable(data.model_dump(mode="json")))
    html = render_html(workspace)
    assert "<script>" not in html and "&lt;script&gt;" in html
    response = client.post("/api/pdf", json=workspace.model_dump(mode="json"))
    reader = PdfReader(BytesIO(response.content))
    assert len(reader.pages) >= 2
    page = reader.pages[0]
    assert abs(float(page.mediabox.width) - 595.28) < 1
    assert abs(float(page.mediabox.height) - 841.89) < 1
    assert "tanaman dapat layu" in " ".join(page.extract_text().split())


def test_unknown_api():
    assert client.get("/api/missing").status_code == 404
