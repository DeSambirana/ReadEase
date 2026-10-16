from enum import Enum

from pydantic import BaseModel, ConfigDict, Field, field_validator

from .config import settings
from .text import count_words


class Model(BaseModel):
    model_config = ConfigDict(extra="forbid")


class ReviewStatus(str, Enum):
    pending = "pending"
    accepted = "accepted"
    edited = "edited"
    rejected = "rejected"
    flagged = "flagged"


class Sentence(Model):
    id: str
    text: str
    word_count: int = Field(ge=0)
    paragraph_id: str


class Card(Model):
    id: str
    source_sentence_ids: list[str] = Field(min_length=1)
    adapted_text: str
    rule_id: str | None = None
    review_status: ReviewStatus = ReviewStatus.flagged
    warnings: list[str] = Field(default_factory=list)
    flagged_terms: list[str] = Field(default_factory=list)


class Exercise(Model):
    start: int = Field(ge=0)
    end: int = Field(gt=0)
    reviewed: bool = False
    id: str
    source_sentence_id: str
    answer: str
    blank_text: str


class Metrics(Model):
    avg_words_per_sentence: float = Field(ge=0)
    sentences_over_threshold: int = Field(ge=0)
    threshold: int = Field(default=settings.sentence_threshold, ge=1)
    words_per_block: list[int] = Field(default_factory=list)


class Document(Model):
    title: str = Field(max_length=200)
    sentences: list[Sentence]
    metrics_before: Metrics
    metrics_after: Metrics | None = None


class Options(Model):
    max_sentences_per_card: int = Field(default=2, ge=1, le=2)
    threshold: int = Field(default=settings.sentence_threshold, ge=1, le=200)


class AnalyzeRequest(Model):
    important_terms: list[str] = Field(default_factory=list, max_length=100)
    text: str = Field(min_length=1, max_length=settings.max_text_characters)
    title: str = Field(default="Materi tanpa judul", max_length=200)
    options: Options = Field(default_factory=Options)

    @field_validator("text")
    @classmethod
    def validate_text(cls, value: str) -> str:
        if not count_words(value):
            raise ValueError("Teks belum diisi.")
        if count_words(value) > settings.max_words:
            raise ValueError("Teks melebihi batas 1.500 kata.")
        return value


class Workspace(Model):
    document: Document
    cards: list[Card]
    exercises: list[Exercise] = Field(default_factory=list)


class Proposal(Card):
    manual_only: bool = False


class ReviewSummary(Model):
    pending: int = 0
    accepted: int = 0
    edited: int = 0
    rejected: int = 0
    unchanged_sentences: int = 0


class Decision(Model):
    proposal_id: str
    status: ReviewStatus
    edited_text: str | None = Field(default=None, max_length=30000)


class AnalyzeResponse(Workspace):
    summary: ReviewSummary = Field(default_factory=ReviewSummary)
    important_terms: list[str] = Field(default_factory=list)
    decisions: list[Decision] = Field(default_factory=list)
    proposals: list[Proposal] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
    is_example: bool = True


class RecomputeRequest(Workspace):
    max_sentences_per_card: int = Field(default=2, ge=1, le=2)
    decisions: list[Decision] = Field(default_factory=list)
    important_terms: list[str] = Field(default_factory=list, max_length=100)


class RecomputeResponse(AnalyzeResponse):
    pass


class KeywordSelection(Model):
    start: int | None = Field(default=None, ge=0)
    source_sentence_id: str
    keyword: str = Field(min_length=1)


class WorksheetRequest(Model):
    document: Document
    selections: list[KeywordSelection] = Field(
        default_factory=list, max_length=settings.worksheet_max_exercises
    )


class KeywordCandidate(Model):
    id: str
    source_sentence_id: str
    keyword: str
    start: int = Field(ge=0)
    end: int = Field(gt=0)
    occurrence: int = Field(ge=1)
    part_of_speech: str


class WorksheetResponse(Model):
    candidates: list[KeywordCandidate] = Field(default_factory=list)
    exercises: list[Exercise]
    warnings: list[str]
    is_example: bool = True


class PdfRequest(Workspace):
    student_name: str | None = Field(default=None, max_length=100)
    student_class: str | None = Field(default=None, max_length=50)
    teacher_notes: str | None = Field(default=None, max_length=1000)


class HealthResponse(Model):
    status: str = "ok"
    stage: int = 6
