import re

from ..risk import source_risks


def propose(text: str, terms: list[str]) -> str | None:
    """Hanya kandidat saran manual; tidak mengeluarkan kalimat hasil pemecahan."""
    if source_risks(text, terms):
        return None
    parts = re.split(r"\s+(?:dan|serta|namun)\s+", text)
    if len(parts) != 2 or any(len(part.split()) < 3 for part in parts):
        return None
    return text
