import re

from ..risk import occurrences, source_risks

# Daftar awal terbatas; guru tetap harus meninjau setiap usulan.
GLOSSARY = {"memperoleh": "mendapatkan", "beraneka ragam": "beragam"}


def propose(text: str, terms: list[str]) -> str | None:
    if any(r != "istilah penting" for r in source_risks(text, terms)):
        return None
    for old, new in GLOSSARY.items():
        if not occurrences(text, old):
            continue
        if any(
            occurrences(text, term) and (occurrences(term, old) or occurrences(old, term))
            for term in terms
        ):
            return None
        return re.sub(
            r"(?<!\w)" + re.escape(old) + r"(?!\w)",
            lambda m, replacement=new: (
                replacement.capitalize() if m[0][0].isupper() else replacement
            ),
            text,
            flags=re.IGNORECASE,
        )
    return None
