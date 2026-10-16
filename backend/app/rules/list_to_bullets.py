import re

from ..risk import source_risks

ITEMS = {
    "akar",
    "batang",
    "daun",
    "bunga",
    "buah",
    "biji",
    "buku",
    "pensil",
    "penghapus",
    "penggaris",
    "meja",
    "kursi",
    "lemari",
}


def propose(text: str, terms: list[str]) -> str | None:
    if any(r != "istilah penting" for r in source_risks(text, terms)):
        return None
    match = re.fullmatch(r"(.+? meliputi) ([^.]+)\.", text)
    if not match:
        return None
    items = re.split(r",\s*(?:dan\s+)?|\s+dan\s+", match[2])
    if len(items) < 2 or any(item.lower().strip() not in ITEMS for item in items):
        return None
    return match[1] + ":\n" + "\n".join("• " + item.strip() for item in items)
