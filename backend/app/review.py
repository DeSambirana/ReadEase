from .cards import build_cards
from .config import settings
from .metrics import compute_metrics
from .models import (
    Card,
    Decision,
    Document,
    Proposal,
    RecomputeRequest,
    RecomputeResponse,
    ReviewStatus,
    ReviewSummary,
    Sentence,
)
from .risk import changed_risks, occurrences, source_risks
from .rules import glossary_swap, list_to_bullets, split_independent_clauses
from .segmenter import split_sentences
from .text import count_words

NOTICE = "Pemeriksaan risiko adalah alarm awal. Guru perlu memeriksa hasil sebelum dipakai."


def normalize_terms(terms: list[str]) -> list[str]:
    if any(not term.strip() or len(term) > 100 for term in terms):
        raise ValueError("Istilah harus berisi 1–100 karakter.")
    return list(dict.fromkeys(term.strip() for term in terms))


def proposals_for(sentences: list[Sentence], terms: list[str]) -> list[Proposal]:
    proposals: list[Proposal] = []
    for sentence in sentences:
        for rule in (list_to_bullets, glossary_swap, split_independent_clauses):
            candidate = rule.propose(sentence.text, terms)
            if candidate is None or changed_risks(sentence.text, candidate, terms):
                continue
            name = rule.__name__.rsplit(".", 1)[1]
            manual = name == "split_independent_clauses"
            proposals.append(
                Proposal(
                    id=f"proposal-{sentence.id}-{name}",
                    source_sentence_ids=[sentence.id],
                    adapted_text=candidate,
                    rule_id=name,
                    review_status=ReviewStatus.pending,
                    manual_only=manual,
                    warnings=[
                        "Saran manual: subjek belum dapat dipastikan. Edit dan tinjau sendiri."
                    ]
                    if manual
                    else [],
                )
            )
            break
    return proposals


def annotate(card: Card, sources: list[Sentence], terms: list[str]) -> Card:
    categories = sorted({risk for s in sources for risk in source_risks(s.text, terms)})
    card.flagged_terms = [t for t in terms if occurrences(card.adapted_text, t)]
    if categories:
        card.warnings.extend(
            ["Kalimat ini perlu ditinjau guru.", "Kategori risiko: " + ", ".join(categories)]
        )
    card.warnings = list(dict.fromkeys(card.warnings))
    return card


def summarize(proposals: list[Proposal], sentences: list[Sentence]) -> ReviewSummary:
    return ReviewSummary(
        **{
            status: sum(p.review_status.value == status for p in proposals)
            for status in ["pending", "accepted", "edited", "rejected"]
        },
        unchanged_sentences=len(sentences)
        - sum(
            p.review_status in (ReviewStatus.accepted, ReviewStatus.edited)
            and p.adapted_text
            != next(s.text for s in sentences if s.id == p.source_sentence_ids[0])
            for p in proposals
        ),
    )


def recompute_review(data: RecomputeRequest) -> RecomputeResponse:
    terms = normalize_terms(data.important_terms)
    originals = [
        s.model_copy(update={"word_count": count_words(s.text)}) for s in data.document.sentences
    ]
    if (
        not originals
        or sum(s.word_count for s in originals) > settings.max_words
        or sum(len(s.text) for s in originals) > settings.max_text_characters
    ):
        raise ValueError("Sumber kosong atau melebihi batas.")
    if len({s.id for s in originals}) != len(originals):
        raise ValueError("ID sumber harus unik.")
    proposals = proposals_for(originals, terms)
    decisions = {d.proposal_id: d for d in data.decisions}
    if len(decisions) != len(data.decisions) or set(decisions) - {p.id for p in proposals}:
        raise ValueError(
            "Keputusan duplikat atau usulan tidak lagi tersedia. Analisis ulang sumber."
        )
    changed: dict[str, Proposal] = {}
    warnings = [NOTICE]
    safe_decisions: list[Decision] = []
    for proposal in proposals:
        decision = decisions.get(proposal.id)
        if not decision:
            continue
        if decision.status not in (
            ReviewStatus.pending,
            ReviewStatus.accepted,
            ReviewStatus.edited,
            ReviewStatus.rejected,
        ):
            raise ValueError("Status keputusan tidak valid.")
        source = next(s for s in originals if s.id == proposal.source_sentence_ids[0])
        target = proposal.adapted_text
        if decision.status == ReviewStatus.accepted and proposal.manual_only:
            raise ValueError(
                "Saran manual harus diedit dan ditinjau; tidak dapat diterima otomatis."
            )
        if decision.status == ReviewStatus.edited:
            target = (decision.edited_text or "").strip()
            if not count_words(target) or count_words(target) > settings.max_words:
                raise ValueError("Teks edit kosong atau melebihi batas.")
            if proposal.manual_only and target == source.text:
                raise ValueError("Saran manual belum diedit.")
        proposal.review_status = decision.status
        if decision.status in (ReviewStatus.accepted, ReviewStatus.edited):
            risks = changed_risks(source.text, target, terms)
            if risks:
                proposal.review_status = ReviewStatus.pending
                proposal.warnings.append("Perubahan diblokir: " + ", ".join(risks))
                warnings.append("Perubahan berisiko diblokir; sumber dipertahankan.")
                safe_decisions.append(
                    Decision(proposal_id=proposal.id, status=ReviewStatus.pending)
                )
                continue
            proposal.adapted_text = target
            changed[source.id] = proposal
        safe_decisions.append(decision)
    # Kelompokkan ulang kalimat hasil; setiap unit tetap menunjuk sumber aslinya.
    units: list[Sentence] = []
    mapping: dict[str, str] = {}
    for source in originals:
        proposal = changed.get(source.id)
        pieces = split_sentences(proposal.adapted_text) if proposal else [source.text]
        for piece in pieces:
            uid = f"u{len(units) + 1}"
            mapping[uid] = source.id
            units.append(
                Sentence(
                    id=uid,
                    text=piece,
                    word_count=count_words(piece),
                    paragraph_id=f"changed-{source.id}" if proposal else source.paragraph_id,
                )
            )
    if (
        sum(s.word_count for s in units) > settings.max_words
        or sum(len(s.text) for s in units) > settings.max_text_characters
    ):
        raise ValueError("Hasil tinjauan melebihi batas teks.")
    cards = build_cards(units, data.max_sentences_per_card)
    for card in cards:
        card.source_sentence_ids = list(
            dict.fromkeys(mapping[uid] for uid in card.source_sentence_ids)
        )
        applied = [changed[sid] for sid in card.source_sentence_ids if sid in changed]
        if applied:
            card.rule_id = applied[0].rule_id
            card.review_status = applied[0].review_status
        else:
            related = [
                p
                for p in proposals
                if any(sid in card.source_sentence_ids for sid in p.source_sentence_ids)
            ]
            if len(related) == 1:
                card.rule_id = related[0].rule_id
                card.review_status = related[0].review_status
            card.warnings.extend(w for p in related for w in p.warnings)
        annotate(card, [s for s in originals if s.id in card.source_sentence_ids], terms)
    source_cards = build_cards(originals, data.max_sentences_per_card)
    document = Document(
        title=data.document.title,
        sentences=originals,
        metrics_before=compute_metrics(
            originals,
            [c.adapted_text for c in source_cards],
            data.document.metrics_before.threshold,
        ),
        metrics_after=compute_metrics(
            units, [c.adapted_text for c in cards], data.document.metrics_before.threshold
        ),
    )
    return RecomputeResponse(
        document=document,
        cards=cards,
        proposals=proposals,
        important_terms=terms,
        decisions=safe_decisions,
        summary=summarize(proposals, originals),
        warnings=warnings,
        is_example=False,
    )
