"""Jalankan dari root proyek: PYTHONPATH=backend python scripts/export_schema.py."""

import json
from pathlib import Path

from app.config import settings
from app.main import app

Path("docs/openapi.json").write_text(
    json.dumps(app.openapi(), ensure_ascii=False, indent=2)
)

Path("frontend/src/config.ts").write_text(
    "// Dihasilkan dari backend/app/config.py; jangan edit manual.\nexport const config = "
    + json.dumps(settings.model_dump(), indent=2)
    + " as const;\n"
)

root = Path("data/samples")
samples = [
    {
        "id": p.stem,
        "title": json.loads(p.with_suffix(".expected.json").read_text())["title"],
        "text": p.read_text().strip(),
    }
    for p in sorted(root.glob("*.txt"))
]
Path("frontend/src/samples.ts").write_text(
    "// Dihasilkan dari data/samples (CC0-1.0).\nexport const samples = "
    + json.dumps(samples, ensure_ascii=False, indent=2)
    + " as const;\n"
)
