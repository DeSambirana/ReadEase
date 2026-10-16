"""Uji PDF asli dan pratinjau pada tiga materi; server lokal harus aktif."""

import asyncio
import json
import re
import secrets
from pathlib import Path

import fitz
import httpx
from playwright.async_api import async_playwright
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "artifacts" / "tahap-5"


def compact(text: str) -> str:
    return re.sub(r"\s+", "", text)


async def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    reports = []
    with httpx.Client(
        base_url="http://127.0.0.1:8000", timeout=30, trust_env=False
    ) as client:
        registered = client.post(
            "/api/auth/register",
            json={
                "email": secrets.token_hex(8) + "@example.test",
                "password": secrets.token_urlsafe(24),
                "name": "Guru Verifikasi",
            },
        )
        registered.raise_for_status()
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            for source in sorted((ROOT / "data/samples").glob("*.txt")):
                title = json.loads(source.with_suffix(".expected.json").read_text())[
                    "title"
                ]
                data = client.post(
                    "/api/analyze", json={"text": source.read_text(), "title": title}
                ).json()
                workspace = {k: data[k] for k in ["document", "cards", "exercises"]}
                # Gunakan alur recompute; usulan pending tidak diterapkan.
                final = client.post("/api/recompute", json=workspace)
                final.raise_for_status()
                workspace = {k: final.json()[k] for k in workspace}
                candidates = client.post(
                    "/api/worksheet", json={"document": workspace["document"]}
                ).json()["candidates"]
                picks = []
                for c in candidates:
                    if c["source_sentence_id"] not in [
                        x["source_sentence_id"] for x in picks
                    ]:
                        picks.append(
                            {
                                k: c[k]
                                for k in ["source_sentence_id", "keyword", "start"]
                            }
                        )
                    if len(picks) == 3:
                        break
                worksheet = client.post(
                    "/api/worksheet",
                    json={"document": workspace["document"], "selections": picks},
                ).json()
                workspace["exercises"] = worksheet["exercises"]
                for e in workspace["exercises"]:
                    e["reviewed"] = True
                preview = client.post("/api/pdf/preview", json=workspace)
                preview.raise_for_status()
                page = await browser.new_page(java_script_enabled=False)
                await page.set_content(preview.text)
                await page.evaluate("document.fonts.ready")
                geometry = await page.evaluate("""() => [...document.querySelectorAll('.sheet')].map(sheet=>{
                  const content=sheet.querySelector('.content').getBoundingClientRect();
                  return {kind:sheet.dataset.kind,cards:[...sheet.querySelectorAll('[data-card]')].map(x=>x.dataset.card),
                   exercises:[...sheet.querySelectorAll('[data-exercise]')].map(x=>x.dataset.exercise),
                   fits:[...sheet.querySelectorAll('.block')].every(x=>{const r=x.getBoundingClientRect();return r.bottom<=content.bottom&&r.top>=content.top&&r.right<=content.right+1;})};
                })""")
                assert all(g["fits"] for g in geometry)
                response = client.post("/api/pdf", json=workspace)
                response.raise_for_status()
                output = OUT / f"{source.stem}.pdf"
                output.write_bytes(response.content)
                doc = fitz.open(output)
                pdf_reader = PdfReader(output)
                assert len(doc) == len(geometry)
                for i, pdfpage in enumerate(doc):
                    assert (
                        abs(pdfpage.rect.width - 595.28) < 1
                        and abs(pdfpage.rect.height - 841.89) < 1
                    )
                    text = compact(pdfpage.get_text())
                    assert text
                    for card_id in geometry[i]["cards"]:
                        card = next(c for c in workspace["cards"] if c["id"] == card_id)
                        assert compact(card["adapted_text"]) in text, (
                            source.stem,
                            card_id,
                        )
                    for exercise_id in geometry[i]["exercises"]:
                        e = next(
                            e for e in workspace["exercises"] if e["id"] == exercise_id
                        )
                        assert compact(e["blank_text"]) in text
                    if geometry[i]["kind"] == "student":
                        assert "Kuncijawaban" not in text
                    for word in pdfpage.get_text("words"):
                        assert (
                            word[0] >= 47
                            and word[2] <= 548
                            and word[1] >= 40
                            and word[3] <= 817
                        ), (source.stem, i, word)
                    for font in pdfpage.get_fonts(full=True):
                        if font[2] == "Type3":
                            resources = pdf_reader.pages[i]["/Resources"]["/Font"]
                            embedded = resources["/" + font[4]].get_object()[
                                "/CharProcs"
                            ]
                            assert embedded and all(
                                g.get_object().get_data() for g in embedded.values()
                            )
                        else:
                            assert doc.extract_font(font[0])[3], "Font tidak tertanam"
                alltext = compact(
                    "".join(
                        p.get_text()
                        for p in doc
                        if "KHUSUS GURU" in p.get_text()
                        or "Khusus guru" in p.get_text()
                    )
                )
                for i, e in enumerate(workspace["exercises"], 1):
                    assert compact(f"Kunci {i}: {e['answer']}") in alltext
                reports.append(
                    {
                        "sample": source.stem,
                        "pages": len(doc),
                        "student_pages": sum(g["kind"] == "student" for g in geometry),
                        "cards": len(workspace["cards"]),
                        "exercises": 3,
                        "embedded_fonts": True,
                        "all_blocks_inside_page": True,
                    }
                )
                await page.close()
            await browser.close()
    (OUT / "verification.json").write_text(json.dumps(reports, indent=2))
    print("PASS PDF tiga materi:", reports)


if __name__ == "__main__":
    asyncio.run(main())
