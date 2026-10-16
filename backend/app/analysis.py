from .cards import build_cards
from .config import settings
from .metrics import compute_metrics
from .models import AnalyzeRequest, AnalyzeResponse, Document
from .review import NOTICE, annotate, normalize_terms, proposals_for, summarize
from .segmenter import segment_text
from .text import count_words


def analyze_text(request: AnalyzeRequest) -> AnalyzeResponse:
    sentences = segment_text(request.text)
    warnings = [NOTICE]
    terms = normalize_terms(request.important_terms)
    words = count_words(request.text)
    if not settings.recommended_min_words <= words <= settings.recommended_max_words:
        warnings.append(
            f"Teks berisi {words} kata. Dianjurkan 300–800 kata; batas maksimal 1.500 kata."
        )
    cards = build_cards(sentences, request.options.max_sentences_per_card)
    for card in cards:
        annotate(card, [s for s in sentences if s.id in card.source_sentence_ids], terms)
    proposals = proposals_for(sentences, terms)
    return AnalyzeResponse(
        proposals=proposals,
        important_terms=terms,
        summary=summarize(proposals, sentences),
        document=Document(
            title=request.title,
            sentences=sentences,
            metrics_before=compute_metrics(
                sentences, [card.adapted_text for card in cards], request.options.threshold
            ),
        ),
        cards=cards,
        warnings=warnings,
        is_example=False,
    )
