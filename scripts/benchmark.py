"""Pengukuran lokal serial, bukan klaim waktu guru atau benchmark produksi."""

import json
import platform
import statistics
from pathlib import Path
from time import perf_counter

import httpx

ROOT = Path(__file__).resolve().parents[1]


def main() -> None:
    records = []
    with httpx.Client(
        base_url="http://127.0.0.1:8000", timeout=30, trust_env=False
    ) as client:
        for words in [300, 500, 800]:
            text = " ".join(
                [
                    "Siswa membaca buku dan mencatat hasil pengamatan tanaman bersama guru."
                ]
                * (words // 10)
            )
            assert len(text.split()) == words
            runs = []
            for _ in range(3):
                times = {}

                def post(
                    endpoint: str, data: dict, timings: dict = times
                ) -> dict | bytes:
                    start = perf_counter()
                    response = client.post("/api/" + endpoint, json=data)
                    response.raise_for_status()
                    timings[endpoint] = round(perf_counter() - start, 4)
                    return response.content if endpoint == "pdf" else response.json()

                data = post("analyze", {"text": text})
                workspace = {k: data[k] for k in ["document", "cards", "exercises"]}
                final = post("recompute", workspace)
                workspace = {k: final[k] for k in workspace}
                start = perf_counter()
                candidates = post("worksheet", {"document": workspace["document"]})[
                    "candidates"
                ][:3]
                exercises = post(
                    "worksheet",
                    {
                        "document": workspace["document"],
                        "selections": [
                            {
                                k: c[k]
                                for k in ["source_sentence_id", "keyword", "start"]
                            }
                            for c in candidates
                        ],
                    },
                )["exercises"]
                times["worksheet"] = round(perf_counter() - start, 4)
                for e in exercises:
                    e["reviewed"] = True
                workspace["exercises"] = exercises
                post("pdf", workspace)
                times["total"] = round(sum(times.values()), 4)
                runs.append(times)
            records.append(
                {
                    "words": words,
                    "runs": runs,
                    "median_seconds": {
                        key: round(statistics.median(r[key] for r in runs), 4)
                        for key in runs[0]
                    },
                    "max_seconds": {key: max(r[key] for r in runs) for key in runs[0]},
                }
            )
    output = ROOT / "artifacts" / "tahap-6"
    output.mkdir(parents=True, exist_ok=True)
    report = {
        "method": "3 percobaan serial tiap ukuran, termasuk startup Chromium per ekspor; materi sintetis berulang, bukan validasi manfaat pendidikan",
        "python": platform.python_version(),
        "platform": platform.platform(),
        "results": records,
    }
    (output / "benchmark.json").write_text(json.dumps(report, indent=2))
    print(json.dumps(report, indent=2))
    assert all(
        r["max_seconds"]["analyze"] < 5 and r["max_seconds"]["pdf"] < 15
        for r in records
    ), "Target NFR waktu belum tercapai"


if __name__ == "__main__":
    main()
