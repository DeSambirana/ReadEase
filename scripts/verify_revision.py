"""Regresi perbaikan versi teman: browser nyata, data sintetis, server sementara."""

import asyncio
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

from playwright.async_api import async_playwright, expect
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
KEY = "aksarainklusi_store_v2"
URL = "http://127.0.0.1:8017"


async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        for width in (1440, 360):
            context = await browser.new_context(
                viewport={"width": width, "height": 1000}, accept_downloads=True
            )
            page = await context.new_page()
            errors = []
            page.on("pageerror", lambda e, errors=errors: errors.append(str(e)))
            page.on("dialog", lambda d: d.accept())
            await page.goto(URL)
            await expect(page.locator(".student-playful-card")).to_have_count(0)
            await page.get_by_role(
                "button", name="Tambah Murid", exact=False
            ).first.click()
            await page.locator("#student-name").fill("Nara Uji")
            await page.locator("#student-nickname").fill("Nara")
            await page.locator("#pedagogical-notes").fill(
                "Observasi privat jangan kirim"
            )
            await page.get_by_role("button", name="1 Kartu Fokus", exact=False).click()
            await page.locator(".btn-modal-save").click()
            await expect(page.locator(".student-playful-card")).to_have_count(1)
            state = await page.evaluate(f"JSON.parse(localStorage.getItem('{KEY}'))")
            assert state["students"][0]["completionRate"] == 0
            assert state["students"][0]["preferences"]["readingMode"] == "focus"
            await page.locator(".btn-create-worksheet").click()
            await page.locator("#text").fill(
                (ROOT / "data/samples/ipa.txt").read_text()
            )
            await page.get_by_role(
                "button", name="Mulai Adaptasi Teks", exact=False
            ).click()
            await expect(
                page.get_by_role("button", name="Unduh PDF A4", exact=True)
            ).to_be_visible()
            draft = await page.evaluate(
                "JSON.parse(localStorage.getItem('aksarainklusi.draft.v2'))"
            )
            assert all(
                len(c["source_sentence_ids"]) == 1 for c in draft["result"]["cards"]
            )
            requests = []
            page.on(
                "request",
                lambda r, requests=requests: (
                    requests.append(r.post_data or "") if "/api/" in r.url else None
                ),
            )
            await page.locator("#print-notes").fill("Catatan cetak khusus")
            async with page.expect_download() as info:
                await page.get_by_role(
                    "button", name="Unduh PDF A4", exact=True
                ).click()
            download = await info.value
            assert await download.failure() is None
            pdf = PdfReader(await download.path())
            assert "Nara Uji" in pdf.pages[0].extract_text()
            assert "Catatan cetak khusus" not in pdf.pages[0].extract_text()
            assert "Catatan cetak khusus" in pdf.pages[-1].extract_text()
            assert all("Observasi privat jangan kirim" not in r for r in requests)
            state = await page.evaluate(f"JSON.parse(localStorage.getItem('{KEY}'))")
            assert state["logs"][0]["comprehensionScore"] is None
            assert (
                state["logs"][0]["exercisesCompleted"]
                == state["logs"][0]["totalExercises"]
                == 0
            )
            # Preview invalidated on notes or recipient change, general PDF has no old identity.
            await page.get_by_role(
                "button", name="Pratinjau Cetak A4", exact=True
            ).click()
            await expect(page.locator("iframe")).to_have_count(1)
            await page.locator("#print-notes").fill("Catatan baru")
            await expect(page.locator("iframe")).to_have_count(0)
            await page.locator("#target-student-select").select_option("")
            async with page.expect_download() as info:
                await page.get_by_role(
                    "button", name="Unduh PDF A4", exact=True
                ).click()
            general = PdfReader(await (await info.value).path())
            assert "Nara Uji" not in general.pages[0].extract_text()
            # Worksheet UI: all selected keys need explicit teacher review before export.
            await page.get_by_role(
                "button", name="Temukan Pilihan Kata Kunci Bacaan", exact=False
            ).click()
            for i in range(3):
                await page.locator(".keyword-chip-label input").nth(i).check()
            await page.get_by_role(
                "button", name="Buat 3 Soal Isian Sekarang", exact=False
            ).click()
            await expect(
                page.get_by_role("button", name="Unduh PDF A4", exact=True)
            ).to_be_disabled()
            for checkbox in await page.locator(".checkbox-reviewed input").all():
                await checkbox.check()
            async with page.expect_download() as info:
                await page.get_by_role(
                    "button", name="Unduh PDF A4", exact=True
                ).click()
            with_questions = PdfReader(await (await info.value).path())
            assert "Soal 3" in "".join(p.extract_text() for p in with_questions.pages)
            # Explicit teacher assessment, including zero, persists after reload.
            await page.get_by_role("button", name="Riwayat LKPD", exact=False).click()
            await page.get_by_text("Catat hasil pengerjaan", exact=True).first.click()
            editor = page.locator("details[open] form").first
            await editor.get_by_label("Nilai latihan (%) — boleh kosong").fill("0")
            await editor.get_by_label("Status sesi").select_option("completed")
            await editor.get_by_role("button", name="Simpan hasil pengerjaan").click()
            state = await page.evaluate(f"JSON.parse(localStorage.getItem('{KEY}'))")
            assert state["logs"][0]["comprehensionScore"] == 0
            assert state["logs"][0]["status"] == "completed"
            await page.reload()
            assert (await page.evaluate(f"JSON.parse(localStorage.getItem('{KEY}'))"))[
                "logs"
            ][0]["comprehensionScore"] == 0
            await page.goto(URL + "/#murid")
            await page.get_by_role(
                "button", name="Profil & Progres", exact=False
            ).click()
            await page.keyboard.press("Escape")
            await expect(page.locator("[role=dialog]")).to_have_count(0)
            await page.screenshot(
                path=f"/tmp/aksara-revision-{width}.png", full_page=True
            )
            overflow = await page.evaluate(
                "() => [...document.querySelectorAll('body *')].filter(e=>e.getBoundingClientRect().right>innerWidth+1).map(e=>[e.tagName,e.className,e.getBoundingClientRect().right]).slice(0,15)"
            )
            assert await page.evaluate(
                "document.documentElement.scrollWidth <= innerWidth"
            ), f"overflow {width}: {overflow}"
            assert not errors, errors
            await page.screenshot(
                path=f"/tmp/aksara-revision-{width}.png", full_page=True
            )
            # Explicit manual navigation for comfort preference and quiz.
            await page.locator(".btn-comfort-test").click()
            await page.locator(".btn-comfort-start").click()
            for _ in range(3):
                await page.locator(".star-btn").nth(3).click()
                await page.get_by_role(
                    "button", name="Lanjut gaya berikutnya", exact=True
                ).click()
            await page.locator(".btn-comfort-next").click()
            for _ in range(3):
                await page.locator(".btn-done-reading").click()
                for _ in range(2):
                    await page.locator(".answer-option").first.click()
                    await page.get_by_role(
                        "button", name="Lanjutkan", exact=True
                    ).click()
            await page.locator(".btn-save-results").click()
            await expect(page.locator(".comfort-test-overlay")).to_have_count(0)
            saved = await page.evaluate(f"JSON.parse(localStorage.getItem('{KEY}'))")
            assert saved["students"][0]["completionRate"] == 0
            assert (
                saved["logs"][0]["exercisesCompleted"]
                == saved["logs"][0]["totalExercises"]
            )
            assert (
                saved["logs"][0]["avgWordsPerSentence"]
                != saved["students"][0]["preferences"]["sentenceThreshold"]
            )
            # Deletion is atomic and an empty list never resurrects demo records.
            await page.locator(".btn-card-edit").click()
            await page.get_by_role("button", name="Pengaturan", exact=False).click()
            await page.locator(".btn-modal-delete").click()
            await page.reload()
            await expect(page.locator(".student-playful-card")).to_have_count(0)
            saved = await page.evaluate(f"JSON.parse(localStorage.getItem('{KEY}'))")
            assert saved["students"] == saved["logs"] == saved["notes"] == []
            await context.close()
        # Corrupt data is not overwritten.
        c = await browser.new_context()
        await c.add_init_script(f"localStorage.setItem('{KEY}', '{{broken');")
        page = await c.new_page()
        await page.goto(URL)
        await expect(page.get_by_role("alert")).to_contain_text("rusak")
        assert await page.evaluate(f"localStorage.getItem('{KEY}')") == "{broken"
        await c.close()
        # Failed writes never appear as saved profiles.
        c = await browser.new_context()
        await c.add_init_script(
            f"const original=Storage.prototype.setItem; Storage.prototype.setItem=function(k,v){{if(k==='{KEY}')throw new DOMException('quota','QuotaExceededError');return original.call(this,k,v);}};"
        )
        page = await c.new_page()
        page.on("dialog", lambda d: d.accept())
        await page.goto(URL)
        await page.get_by_role("button", name="Tambah Murid", exact=False).first.click()
        await page.locator("#student-name").fill("Gagal Simpan")
        await page.locator(".btn-modal-save").click()
        await expect(page.locator("[role=dialog]")).to_have_count(1)
        assert await page.evaluate(f"localStorage.getItem('{KEY}')") is None
        await c.close()
        await browser.close()
    print(
        "PASS: desktop/360, profil/preset, PDF bernama/umum, catatan privat, pratinjau, skor nol/reload, keyboard, data rusak/kuota."
    )


if __name__ == "__main__":
    server = subprocess.Popen(
        [
            sys.executable,
            "-m",
            "uvicorn",
            "app.main:app",
            "--app-dir",
            "backend",
            "--port",
            "8017",
            "--no-access-log",
        ],
        cwd=ROOT,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    try:
        for _ in range(100):
            try:
                urllib.request.urlopen(URL + "/api/health")
                break
            except OSError:
                time.sleep(0.1)
        asyncio.run(run())
    finally:
        server.terminate()
        server.wait()
