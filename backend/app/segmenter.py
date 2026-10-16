"""Segmentasi konservatif; isi setiap kalimat diambil langsung dari sumber."""

import re

from .models import Sentence
from .text import count_words

TITLE_ABBREVIATIONS = {"dr", "prof", "ir", "no", "rp"}
LIST_ABBREVIATIONS = {"dst", "dll", "dsb", "etc"}
CLOSERS = "\"'”’)]}"


def split_paragraphs(text: str) -> list[str]:
    return [
        part.strip()
        for part in re.split(r"\n\s*\n", text.replace("\r\n", "\n").replace("\r", "\n"))
        if part.strip()
    ]


def split_sentences(paragraph: str) -> list[str]:
    sentences: list[str] = []
    start = 0
    i = 0
    while i < len(paragraph):
        char = paragraph[i]
        if char not in ".!?":
            i += 1
            continue
        if (
            char == "."
            and i > 0
            and i + 1 < len(paragraph)
            and paragraph[i - 1].isdigit()
            and paragraph[i + 1].isdigit()
        ):
            i += 1
            continue
        match = re.search(r"([^\W\d_]+)$", paragraph[:i], re.UNICODE)
        token = match.group(1) if match else ""
        next_text = paragraph[i + 1 :].lstrip()
        if char == "." and next_text:
            if token.lower() in TITLE_ABBREVIATIONS or (len(token) == 1 and token.isupper()):
                i += 1
                continue
            # Singkatan daftar dapat sekaligus menjadi akhir kalimat bila berikutnya kapital.
            if token.lower() in LIST_ABBREVIATIONS and not next_text[0].isupper():
                i += 1
                continue
        end = i + 1
        while end < len(paragraph) and paragraph[end] in ".!?" + CLOSERS:
            end += 1
        if end == len(paragraph) or paragraph[end].isspace():
            value = paragraph[start:end].strip()
            if value:
                sentences.append(value)
            start = end
        i = end
    tail = paragraph[start:].strip()
    if tail:
        sentences.append(tail)
    return sentences


def segment_text(text: str) -> list[Sentence]:
    result: list[Sentence] = []
    for paragraph_index, paragraph in enumerate(split_paragraphs(text), 1):
        for sentence in split_sentences(paragraph):
            result.append(
                Sentence(
                    id=f"s{len(result) + 1}",
                    text=sentence,
                    word_count=count_words(sentence),
                    paragraph_id=f"p{paragraph_index}",
                )
            )
    return result
