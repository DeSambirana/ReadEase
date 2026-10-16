from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.analysis import analyze_text
from app.main import app
from app.models import AnalyzeRequest, Document, KeywordSelection, WorksheetRequest
from app.worksheet import candidates_for, make_worksheet, validate_exercises

client = TestClient(app)


def doc(text: str) -> Document:
    return analyze_text(AnalyzeRequest(text=text)).document


@pytest.mark.parametrize(
    "word",
    [
        "tidak",
        "bukan",
        "belum",
        "tak",
        "tanpa",
        "jangan",
        "jika",
        "apabila",
        "bila",
        "kecuali",
        "karena",
        "sehingga",
        "25",
        "12,5",
        "25%",
        "cm",
        "kg",
        "menit",
        "Rp",
        "dan",
        "bisa",
        "air2",
    ],
)
def test_forbidden(word: str) -> None:
    assert not candidates_for(doc(word))


@pytest.mark.parametrize(
    ("text", "keyword", "pos"),
    [
        ("Daun.", "Daun", "nomina"),
        ("menyerap.", "menyerap", "verba"),
        ("basah.", "basah", "adjektiva"),
        ("buku-buku.", "buku-buku", "nomina"),
    ],
)
def test_content_words(text: str, keyword: str, pos: str) -> None:
    c = candidates_for(doc(text))[0]
    assert c.keyword == keyword and c.part_of_speech == pos


def test_repeated_occurrence_and_preserve_source() -> None:
    source = "Jika air tidak tersedia, air dapat diganti kemudian."
    document = doc(source)
    candidates = [c for c in candidates_for(document) if c.keyword == "air"]
    assert [c.occurrence for c in candidates] == [1, 2]
    c = candidates[1]
    result = make_worksheet(
        WorksheetRequest(
            document=document,
            selections=[KeywordSelection(source_sentence_id="s1", keyword="air", start=c.start)],
        )
    )
    exercise = result.exercises[0]
    assert exercise.answer == source[c.start : c.end] == "air"
    assert exercise.blank_text == "Jika air tidak tersedia, ______ dapat diganti kemudian."
    assert not exercise.reviewed
    assert document.sentences[0].text == source
    with pytest.raises(ValueError):
        make_worksheet(
            WorksheetRequest(
                document=document,
                selections=[KeywordSelection(source_sentence_id="s1", keyword="air")],
            )
        )


def test_capitalization_unicode_and_punctuation() -> None:
    source = "“AIR”, air; 🌱 daun!"
    document = doc(source)
    c = next(c for c in candidates_for(document) if c.keyword == "AIR")
    exercise = make_worksheet(
        WorksheetRequest(
            document=document,
            selections=[KeywordSelection(source_sentence_id="s1", keyword="AIR", start=c.start)],
        )
    ).exercises[0]
    assert exercise.answer == "AIR"
    assert exercise.blank_text == "“______”, air; 🌱 daun!"


@pytest.mark.parametrize("name", ["ipa", "ips", "bahasa_indonesia"])
def test_sample_keys_exact(name: str) -> None:
    text = (Path(__file__).resolve().parents[2] / "data/samples" / f"{name}.txt").read_text()
    document = doc(text)
    candidates = candidates_for(document)
    assert candidates
    for c in candidates:
        result = make_worksheet(
            WorksheetRequest(
                document=document,
                selections=[
                    KeywordSelection(
                        source_sentence_id=c.source_sentence_id, keyword=c.keyword, start=c.start
                    )
                ],
            )
        )
        e = result.exercises[0]
        source = next(s.text for s in document.sentences if s.id == e.source_sentence_id)
        assert e.answer == source[e.start : e.end]
        assert e.blank_text[: e.start] + e.answer + e.blank_text[e.start + 6 :] == source


def test_invalid_duplicate_and_review_gate() -> None:
    document = doc("Akar menyerap air.")
    selection = KeywordSelection(source_sentence_id="s1", keyword="air")
    with pytest.raises(ValueError):
        make_worksheet(WorksheetRequest(document=document, selections=[selection, selection]))
    exercise = make_worksheet(
        WorksheetRequest(document=document, selections=[selection])
    ).exercises[0]
    with pytest.raises(ValueError, match="ditinjau"):
        validate_exercises(document, [exercise])
    exercise.reviewed = True
    validate_exercises(document, [exercise])
    exercise.answer = "Air"
    with pytest.raises(ValueError):
        validate_exercises(document, [exercise])


def test_api_selection_and_export_guard() -> None:
    data = client.post("/api/analyze", json={"text": "Akar menyerap air."}).json()
    req = {
        "document": data["document"],
        "selections": [{"source_sentence_id": "s1", "keyword": "air"}],
    }
    response = client.post("/api/worksheet", json=req)
    assert response.status_code == 200
    result = response.json()
    assert not result["is_example"] and result["exercises"][0]["answer"] == "air"
    pdf = {k: data[k] for k in ["document", "cards", "exercises"]}
    pdf["exercises"] = result["exercises"]
    assert client.post("/api/pdf", json=pdf).status_code == 422
    pdf["exercises"][0]["reviewed"] = True
    assert (
        client.post("/api/pdf", json=pdf).status_code == 200
    )  # Soal opsional; soal yang ada harus ditinjau.
    pdf["exercises"][0]["blank_text"] = "Teks palsu."
    assert client.post("/api/pdf", json=pdf).status_code == 422
    req["selections"] = [{"source_sentence_id": "s1", "keyword": "tidak"}]
    assert client.post("/api/worksheet", json=req).status_code == 422
    req["selections"] = [{"source_sentence_id": "s1", "keyword": "air", "start": 0}]
    assert client.post("/api/worksheet", json=req).status_code == 422
