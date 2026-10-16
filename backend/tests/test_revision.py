from io import BytesIO

import pytest
from fastapi.testclient import TestClient
from pypdf import PdfReader

from app.main import app

client = TestClient(app)


@pytest.mark.parametrize("limit", [1, 2])
def test_personal_card_limit_survives_review(limit):
    data = client.post(
        "/api/analyze",
        json={
            "text": "Akar menyerap air. Daun memperoleh cahaya.",
            "options": {"max_sentences_per_card": limit},
        },
    ).json()
    assert all(len(c["source_sentence_ids"]) <= limit for c in data["cards"])
    result = client.post(
        "/api/recompute",
        json={
            **{k: data[k] for k in ("document", "cards", "exercises")},
            "max_sentences_per_card": limit,
        },
    )
    assert result.status_code == 200
    assert all(len(c["source_sentence_ids"]) <= limit for c in result.json()["cards"])


@pytest.mark.parametrize("limit", [0, 3])
def test_invalid_card_limit(limit):
    assert (
        client.post(
            "/api/analyze",
            json={"text": "Akar menyerap air.", "options": {"max_sentences_per_card": limit}},
        ).status_code
        == 422
    )


def test_reading_only_pdf_recipient_and_notes():
    data = client.post(
        "/api/analyze", json={"text": "Akar menyerap air. Daun memperoleh cahaya."}
    ).json()
    payload = {k: data[k] for k in ("document", "cards", "exercises")}
    payload.update(
        student_name="Nara Uji",
        student_class="4A",
        teacher_notes="<script>catatan literal</script>",
    )
    result = client.post("/api/pdf", json=payload)
    assert result.status_code == 200 and result.content.startswith(b"%PDF-")
    pages = PdfReader(BytesIO(result.content)).pages
    assert "Nara Uji" in pages[0].extract_text()
    assert "catatan literal" not in pages[0].extract_text()
    assert "catatan literal" in pages[-1].extract_text()
    preview = client.post("/api/pdf/preview", json=payload)
    assert "&lt;script&gt;catatan literal&lt;/script&gt;" in preview.text
    assert "<script>catatan literal</script>" not in preview.text


@pytest.mark.parametrize("status", ["pending", "flagged", "rejected"])
def test_unapproved_language_cannot_be_printed_without_questions(status):
    data = client.post("/api/analyze", json={"text": "Akar menyerap air."}).json()
    payload = {k: data[k] for k in ("document", "cards", "exercises")}
    payload["cards"][0].update(adapted_text="Isi berubah tanpa tinjauan.", review_status=status)
    for url in ("/api/pdf", "/api/pdf/preview"):
        result = client.post(url, json=payload)
        assert result.status_code == 422 and "ditinjau" in result.json()["detail"]
