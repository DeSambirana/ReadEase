"""Alarm konservatif berbasis token; bukan pembuktian kesetaraan makna."""

import re
from collections import Counter

TOKENS = {
    "negasi": {"tidak", "bukan", "belum", "tak", "tanpa", "jangan"},
    "syarat": {"jika", "apabila", "bila", "kecuali"},
    "sebab-akibat": {"karena", "sebab", "sehingga", "akibatnya", "mengakibatkan", "menyebabkan"},
    "satuan": {
        "kg",
        "g",
        "mg",
        "km",
        "m",
        "cm",
        "mm",
        "ml",
        "liter",
        "persen",
        "menit",
        "detik",
        "jam",
        "rp",
        "°c",
    },
}


def occurrences(text: str, term: str) -> int:
    return len(re.findall(r"(?<!\w)" + re.escape(term) + r"(?!\w)", text, re.IGNORECASE))


def fingerprint(text: str, terms: list[str]) -> dict[str, Counter[str]]:
    words = re.findall(r"\w+|°c|%", text.lower())
    result = {name: Counter(w for w in words if w in values) for name, values in TOKENS.items()}
    result["angka"] = Counter(re.findall(r"\d+(?:[.,]\d+)*(?:\s*%)?", text))
    result["istilah penting"] = Counter(
        {term.lower(): occurrences(text, term) for term in terms if occurrences(text, term)}
    )
    return result


def proper_names(text: str) -> list[str]:
    # Perlindungan berlebih lebih aman daripada membuang nama yang tidak dikenal.
    return re.findall(r"\b[A-ZÀ-Ý][\w-]*\b", text)


def source_risks(text: str, terms: list[str]) -> list[str]:
    return [name for name, values in fingerprint(text, terms).items() if values]


def changed_risks(source: str, target: str, terms: list[str]) -> list[str]:
    protected = list(dict.fromkeys(terms + proper_names(source) + proper_names(target)))
    before, after = fingerprint(source, protected), fingerprint(target, protected)
    return [name for name in before if before[name] != after[name]]
