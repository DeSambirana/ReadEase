from .config import settings
from .models import Metrics, Sentence
from .text import count_words


def compute_metrics(
    sentences: list[Sentence], blocks: list[str], threshold: int = settings.sentence_threshold
) -> Metrics:
    if threshold < 1:
        raise ValueError("Ambang harus lebih besar dari nol.")
    counts = [count_words(sentence.text) for sentence in sentences]
    return Metrics(
        avg_words_per_sentence=round(sum(counts) / len(counts), 2) if counts else 0,
        sentences_over_threshold=sum(count > threshold for count in counts),
        threshold=threshold,
        words_per_block=[count_words(block) for block in blocks],
    )
