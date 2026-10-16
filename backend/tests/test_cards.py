from pathlib import Path

import pytest

from app.analysis import analyze_text
from app.cards import build_cards
from app.models import AnalyzeRequest
from app.segmenter import segment_text


@pytest.mark.parametrize(
    "lengths,expected",
    [
        ([15, 20], [2]),
        ([30, 10], [1, 1]),
        ([25, 26], [1, 1]),
        ([51, 4], [1, 1]),
        ([5, 5, 5], [2, 1]),
        ([50], [1]),
        ([51], [1]),
        ([], []),
    ],
)
def test_card_grouping(lengths: list[int], expected: list[int]) -> None:
    source = " ".join(" ".join(["kata"] * n) + "." for n in lengths)
    sentences = segment_text(source)
    cards = build_cards(sentences)
    assert [len(c.source_sentence_ids) for c in cards] == expected
    assert [sid for c in cards for sid in c.source_sentence_ids] == [s.id for s in sentences]
    for c in cards:
        original = [s for s in sentences if s.id in c.source_sentence_ids]
        assert c.adapted_text == " ".join(s.text for s in original)
        assert bool(c.warnings) == (sum(s.word_count for s in original) > 50)
        assert c.rule_id is None


def test_paragraph_boundary() -> None:
    assert len(build_cards(segment_text("Satu.\n\nDua."))) == 2


@pytest.mark.parametrize("name", ["ipa", "ips", "bahasa_indonesia"])
def test_sample_cards(name: str) -> None:
    path = Path(__file__).resolve().parents[2] / "data/samples" / f"{name}.txt"
    data = analyze_text(AnalyzeRequest(text=path.read_text()))
    assert all(len(c.source_sentence_ids) <= 2 for c in data.cards)
    assert [sid for c in data.cards for sid in c.source_sentence_ids] == [
        s.id for s in data.document.sentences
    ]
    assert len(data.document.metrics_before.words_per_block) == len(data.cards)
    assert sum(data.document.metrics_before.words_per_block) == sum(
        s.word_count for s in data.document.sentences
    )
