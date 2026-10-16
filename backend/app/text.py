"""Definisi kata bersama untuk validasi dan metrik."""


def count_words(text: str) -> int:
    # Tanda baca yang berdiri sendiri tidak dihitung sebagai kata.
    return sum(any(char.isalnum() for char in token) for token in text.split())
