"""Soal ekstraktif satu lubang: seluruh teks lain dan kunci berasal dari sumber."""

import re
from collections import Counter

from .config import settings
from .content_words import CONTENT_WORDS
from .models import Document, Exercise, KeywordCandidate, WorksheetRequest, WorksheetResponse
from .risk import TOKENS
from .text import count_words

BLANK = "______"
BLOCKED = set().union(*TOKENS.values())
WORD = re.compile(r"(?<![\w-])[^\W\d_]+(?:-[^\W\d_]+)*(?![\w-])", re.UNICODE)


def candidates_for(document: Document) -> list[KeywordCandidate]:
    sentences = document.sentences
    if not sentences or len({s.id for s in sentences}) != len(sentences):
        raise ValueError("Sumber kosong atau ID kalimat tidak unik.")
    if (
        sum(count_words(s.text) for s in sentences) > settings.max_words
        or sum(len(s.text) for s in sentences) > settings.max_text_characters
    ):
        raise ValueError("Sumber melebihi batas teks.")
    result: list[KeywordCandidate] = []
    for sentence in sentences:
        counts: Counter[str] = Counter()
        for match in WORD.finditer(sentence.text):
            original = match.group()
            word = original.lower()
            if word not in CONTENT_WORDS or word in BLOCKED:
                continue
            counts[word] += 1
            result.append(
                KeywordCandidate(
                    id=f"{sentence.id}:{match.start()}",
                    source_sentence_id=sentence.id,
                    keyword=original,
                    start=match.start(),
                    end=match.end(),
                    occurrence=counts[word],
                    part_of_speech=CONTENT_WORDS[word],
                )
            )
    return result


def make_worksheet(data: WorksheetRequest) -> WorksheetResponse:
    candidates = candidates_for(data.document)
    sources = {s.id: s.text for s in data.document.sentences}
    exercises: list[Exercise] = []
    chosen: set[str] = set()
    for selection in data.selections:
        matches = [
            c
            for c in candidates
            if c.source_sentence_id == selection.source_sentence_id
            and c.keyword == selection.keyword
            and (selection.start is None or c.start == selection.start)
        ]
        if len(matches) != 1:
            raise ValueError(
                "Pilihan kata tidak valid atau muncul berulang. Pilih kemunculan dari daftar kandidat."
            )
        candidate = matches[0]
        if candidate.id in chosen:
            raise ValueError("Kemunculan kata yang sama tidak boleh dipilih dua kali.")
        chosen.add(candidate.id)
        source = sources[candidate.source_sentence_id]
        exercises.append(
            Exercise(
                id=f"e{len(exercises) + 1}",
                source_sentence_id=candidate.source_sentence_id,
                start=candidate.start,
                end=candidate.end,
                answer=source[candidate.start : candidate.end],
                blank_text=source[: candidate.start] + BLANK + source[candidate.end :],
                reviewed=False,
            )
        )
    warnings = ["Kandidat memakai daftar kata isi terbatas. Tinjau soal dan kunci sebelum ekspor."]
    if not candidates:
        warnings.append(
            "Tidak ada kandidat yang dikenali. Gunakan materi lain; tidak ada soal yang dikarang."
        )
    return WorksheetResponse(
        candidates=candidates, exercises=exercises, warnings=warnings, is_example=False
    )


def validate_exercises(document: Document, exercises: list[Exercise]) -> None:
    """Dipakai gerbang ekspor untuk menolak kunci atau teks soal yang dimodifikasi."""
    from .models import KeywordSelection

    if len({e.id for e in exercises}) != len(exercises):
        raise ValueError("ID soal harus unik.")
    request = WorksheetRequest(
        document=document,
        selections=[
            KeywordSelection(
                source_sentence_id=e.source_sentence_id, keyword=e.answer, start=e.start
            )
            for e in exercises
        ],
    )
    expected = make_worksheet(request).exercises
    for actual, original in zip(exercises, expected, strict=True):
        if (actual.answer, actual.blank_text, actual.end) != (
            original.answer,
            original.blank_text,
            original.end,
        ):
            raise ValueError("Soal atau kunci tidak cocok dengan sumber. Buat ulang soal.")
        if not actual.reviewed:
            raise ValueError("Semua soal dan kunci harus ditinjau guru sebelum ekspor.")
