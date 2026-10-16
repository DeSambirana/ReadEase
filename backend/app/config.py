from pydantic import BaseModel


class Settings(BaseModel):
    max_request_bytes: int = 1_048_576
    api_requests_per_minute: int = 300
    rate_limit_max_clients: int = 1024
    pdf_concurrency: int = 2
    pdf_timeout_seconds: int = 45
    client_timeout_ms: int = 45000

    worksheet_max_exercises: int = 3
    sentence_threshold: int = 20
    card_max_sentences: int = 2
    card_target_min_words: int = 30
    card_target_max_words: int = 50
    reading_wpm: int = 120
    max_words: int = 1500
    recommended_min_words: int = 300
    recommended_max_words: int = 800
    max_text_characters: int = 30000


settings = Settings()
