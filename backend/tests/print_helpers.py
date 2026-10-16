from app.models import KeywordSelection, PdfRequest, WorksheetRequest
from app.worksheet import make_worksheet


def printable(data: dict) -> dict:
    request = WorksheetRequest(document=data["document"])
    candidates = make_worksheet(request).candidates
    request.selections = [
        KeywordSelection(source_sentence_id=c.source_sentence_id, keyword=c.keyword, start=c.start)
        for c in candidates[:3]
    ]
    result = make_worksheet(request)
    for exercise in result.exercises:
        exercise.reviewed = True
    return PdfRequest(
        document=data["document"], cards=data["cards"], exercises=result.exercises
    ).model_dump(mode="json")
