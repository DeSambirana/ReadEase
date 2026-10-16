// Dihasilkan dari backend/app/config.py; jangan edit manual.
export const config = {
  "max_request_bytes": 1048576,
  "api_requests_per_minute": 300,
  "rate_limit_max_clients": 1024,
  "pdf_concurrency": 2,
  "pdf_timeout_seconds": 45,
  "client_timeout_ms": 45000,

  "worksheet_max_exercises": 3,
  "sentence_threshold": 20,
  "card_max_sentences": 2,
  "card_target_min_words": 30,
  "card_target_max_words": 50,
  "reading_wpm": 120,
  "max_words": 1500,
  "recommended_min_words": 300,
  "recommended_max_words": 800,
  "max_text_characters": 30000
} as const;
