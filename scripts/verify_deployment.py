"""Bukti satu origin: HTML, aset, API dan PDF dari URL yang sama."""

import argparse
import re
import secrets
from pathlib import Path

import httpx

ROOT = Path(__file__).resolve().parents[1]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", default="http://127.0.0.1:8000")
    args = parser.parse_args()
    with httpx.Client(base_url=args.url, timeout=30, trust_env=False) as client:
        registered = client.post(
            "/api/auth/register",
            json={
                "email": secrets.token_hex(8) + "@example.test",
                "password": secrets.token_urlsafe(24),
                "name": "Guru Verifikasi",
            },
        )
        registered.raise_for_status()
        home = client.get("/")
        home.raise_for_status()
        assert 'id="root"' in home.text
        scripts = re.findall(r'src="([^"]+\.js)"', home.text)
        assert scripts
        for script in scripts:
            assert client.get(script).status_code == 200
        assert client.get("/api/health").json()["stage"] == 6
        for sample in sorted((ROOT / "data/samples").glob("*.txt")):
            response = client.post("/api/analyze", json={"text": sample.read_text()})
            response.raise_for_status()
            data = response.json()
            workspace = {k: data[k] for k in ["document", "cards", "exercises"]}
            response = client.post("/api/recompute", json=workspace)
            response.raise_for_status()
            workspace = {k: response.json()[k] for k in workspace}
            candidates = client.post(
                "/api/worksheet", json={"document": workspace["document"]}
            ).json()["candidates"][:3]
            exercises = client.post(
                "/api/worksheet",
                json={
                    "document": workspace["document"],
                    "selections": [
                        {k: c[k] for k in ["source_sentence_id", "keyword", "start"]}
                        for c in candidates
                    ],
                },
            ).json()["exercises"]
            for e in exercises:
                e["reviewed"] = True
            workspace["exercises"] = exercises
            pdf = client.post("/api/pdf", json=workspace)
            pdf.raise_for_status()
            assert pdf.content.startswith(b"%PDF")
    print(
        "PASS satu origin:",
        args.url,
        "HTML + aset + health + alur tiga materi sampai PDF",
    )


if __name__ == "__main__":
    main()
