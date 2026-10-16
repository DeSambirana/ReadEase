import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.metrics import compute_metrics
from app.segmenter import segment_text, split_sentences
from app.text import count_words


@pytest.mark.parametrize(
    ("text", "expected"),
    [
        ("Dr. Rani datang. Ia membaca.", ["Dr. Rani datang.", "Ia membaca."]),
        (
            "Bawa pensil, dll. untuk belajar. Selesai.",
            ["Bawa pensil, dll. untuk belajar.", "Selesai."],
        ),
        ("Bawa buku, dst. Mereka pulang.", ["Bawa buku, dst.", "Mereka pulang."]),
        ("Buku, dsb. masih tersedia.", ["Buku, dsb. masih tersedia."]),
        (
            "Nilainya 12.5 cm dan 12,5 cm. Harga Rp12.500.",
            ["Nilainya 12.5 cm dan 12,5 cm.", "Harga Rp12.500."],
        ),
        ("Ia bertanya, “Siapa?” Lalu pergi!", ["Ia bertanya, “Siapa?”", "Lalu pergi!"]),
        ("Jika air tidak ada, jangan pergi.", ["Jika air tidak ada, jangan pergi."]),
        ("Kalimat tanpa titik", ["Kalimat tanpa titik"]),
        ("", []),
        ("A. Rani membaca. Bagus.", ["A. Rani membaca.", "Bagus."]),
    ],
)
def test_sentence_boundaries(text: str, expected: list[str]) -> None:
    assert split_sentences(text) == expected


def test_paragraph_ids_and_preservation() -> None:
    result = segment_text("  Satu baris\nmasih sama.\r\n\r\n Kedua! Ketiga?  ")
    assert [s.id for s in result] == ["s1", "s2", "s3"]
    assert [s.paragraph_id for s in result] == ["p1", "p2", "p2"]
    assert result[0].text == "Satu baris\nmasih sama."


def test_metrics_exact_and_threshold() -> None:
    sentences = segment_text("Satu dua. Tiga empat lima.")
    result = compute_metrics(sentences, ["Satu dua. Tiga empat lima."], 2)
    assert result.avg_words_per_sentence == 2.5
    assert result.sentences_over_threshold == 1
    assert result.words_per_block == [5]
    assert compute_metrics([], []).avg_words_per_sentence == 0
    with pytest.raises(ValueError):
        compute_metrics(sentences, [], 0)


def test_word_definition() -> None:
    assert count_words("Dr. Rani — membawa 12,5 kg buku-buku.") == 6


@pytest.mark.parametrize(
    ("length", "status", "warn"),
    [
        (1, 200, True),
        (299, 200, True),
        (300, 200, False),
        (800, 200, False),
        (801, 200, True),
        (1500, 200, True),
        (1501, 422, False),
    ],
)
def test_word_limits(length: int, status: int, warn: bool) -> None:
    response = TestClient(app).post("/api/analyze", json={"text": "kata " * length})
    assert response.status_code == status
    if status == 200:
        assert any("Dianjurkan" in warning for warning in response.json()["warnings"]) == warn
    else:
        assert "1.500" in response.json()["detail"]


@pytest.mark.parametrize("threshold", [0, 201, 2.5])
def test_bad_threshold(threshold: float) -> None:
    assert (
        TestClient(app)
        .post("/api/analyze", json={"text": "Ada teks.", "options": {"threshold": threshold}})
        .status_code
        == 422
    )


def test_real_metrics_api() -> None:
    data = (
        TestClient(app)
        .post(
            "/api/analyze", json={"text": "Satu dua. Tiga empat lima.", "options": {"threshold": 2}}
        )
        .json()
    )
    assert data["document"]["metrics_before"] == {
        "avg_words_per_sentence": 2.5,
        "sentences_over_threshold": 1,
        "threshold": 2,
        "words_per_block": [5],
    }
    assert not data["is_example"]


@pytest.mark.parametrize("name", ["ipa", "ips", "bahasa_indonesia"])
def test_samples_against_gold(name: str) -> None:
    folder = Path(__file__).resolve().parents[2] / "data/samples"
    gold = json.loads((folder / f"{name}.segmentation.json").read_text())
    text = (folder / f"{name}.txt").read_text()
    sentences = segment_text(text)
    assert [s.text for s in sentences] == gold["sentences"]
    assert [s.paragraph_id for s in sentences] == gold["paragraph_ids"]
    assert sum(s.word_count for s in sentences) == gold["word_count"]
    metrics = compute_metrics(sentences, text.strip().split("\n\n"))
    assert metrics.model_dump() == gold["metrics"]


@pytest.mark.parametrize("text", ["   ", "... !!!", "\n\n"])
def test_empty_or_punctuation_only(text: str) -> None:
    response = TestClient(app).post("/api/analyze", json={"text": text})
    assert response.status_code == 422
    assert "belum diisi" in response.json()["detail"]


def test_html_remains_literal_and_errors_do_not_echo() -> None:
    text = "<img src=x onerror=alert(1)> Tidak dihapus."
    response = TestClient(app).post("/api/analyze", json={"text": text})
    assert response.json()["cards"][0]["adapted_text"] == text
    secret = "RAHASIA " * 1501
    response = TestClient(app).post("/api/analyze", json={"text": secret})
    assert "RAHASIA" not in response.text
