"""Kelompokkan kalimat sumber tanpa mengubah isi kalimat."""

from .config import settings
from .models import Card, Sentence


def build_cards(
    sentences: list[Sentence], max_sentences: int = settings.card_max_sentences
) -> list[Card]:
    if max_sentences not in (1, 2):
        raise ValueError("Batas kartu harus 1 atau 2 kalimat.")
    groups: list[list[Sentence]] = []
    for sentence in sentences:
        if (
            groups
            and len(groups[-1]) < max_sentences
            and groups[-1][-1].paragraph_id == sentence.paragraph_id
            and sum(s.word_count for s in groups[-1]) < settings.card_target_min_words
            and sum(s.word_count for s in groups[-1]) + sentence.word_count
            <= settings.card_target_max_words
        ):
            groups[-1].append(sentence)
        else:
            groups.append([sentence])
    return [
        Card(
            id=f"c{i}",
            source_sentence_ids=[s.id for s in group],
            adapted_text=" ".join(s.text for s in group),
            warnings=(
                ["Kartu lebih dari 50 kata. Kalimat ini perlu ditinjau guru."]
                if sum(s.word_count for s in group) > settings.card_target_max_words
                else []
            ),
        )
        for i, group in enumerate(groups, 1)
    ]
