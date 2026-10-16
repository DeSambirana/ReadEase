"""Uji browser akun guru → kode murid → bacaan → hasil → PDF, data sintetis."""

import asyncio
import os
import subprocess
import sys
import tempfile
import time
import urllib.request
from pathlib import Path

from playwright.async_api import async_playwright, expect
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
URL = "http://127.0.0.1:8017"


async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        for width in (1440, 360):
            teacher = await browser.new_context(
                viewport={"width": width, "height": 1000}, accept_downloads=True
            )
            student = await browser.new_context(
                viewport={"width": width, "height": 1000}
            )
            page = await teacher.new_page()
            errors = []
            page.on("pageerror", lambda e, errors=errors: errors.append(str(e)))
            page.on("dialog", lambda d: d.accept())
            await page.goto(URL)
            await expect(page.locator(".welcome-portrait")).to_have_attribute(
                "src", "/assets/avatars/pilihan-1.png"
            )
            assert await page.locator(".welcome-portrait").evaluate(
                "async el => { await el.decode(); return el.naturalWidth > 0; }"
            )
            await page.screenshot(path=f"/tmp/aksara-login-{width}.png", full_page=True)
            await page.get_by_role(
                "button", name="Belum punya akun? Daftar guru"
            ).click()
            await page.get_by_label("Nama guru", exact=True).fill("Guru Demo")
            await page.get_by_label("Email", exact=True).fill(
                f"guru{width}@example.test"
            )
            await page.get_by_label("Kata sandi", exact=True).fill(
                "kata-sandi-uji-panjang"
            )
            await page.get_by_role("button", name="Buat akun guru", exact=False).click()
            await page.get_by_role(
                "button", name="Tambah Murid", exact=False
            ).first.click()
            await expect(page.locator(".avatar-preset-btn")).to_have_count(6)
            await page.get_by_role("button", name="Karakter 6", exact=False).click()
            await expect(
                page.get_by_role("button", name="Karakter 6", exact=False)
            ).to_have_attribute("aria-pressed", "true")
            assert await page.locator(".avatar-presets-grid").evaluate(
                "el=>[...el.children].every(c=>c.getBoundingClientRect().right<=el.getBoundingClientRect().right+1)"
            )
            await page.screenshot(
                path=f"/tmp/aksara-avatar10-{width}.png", full_page=True
            )
            await page.locator("#student-name").fill("Nara Uji")
            await page.locator("#student-nickname").fill("Nara")
            await page.locator("#pedagogical-notes").fill("RAHASIA OBSERVASI GURU")
            await page.get_by_role("button", name="1 Kartu Fokus", exact=False).click()
            await page.locator(".btn-modal-save").click()
            await expect(
                page.get_by_text("Semua perubahan tersimpan", exact=True)
            ).to_be_visible()
            await expect(page.locator(".card-avatar-frame img")).to_have_attribute(
                "src", "/assets/avatars/pilihan-6.png"
            )
            await page.locator(".profile-more summary").click()
            assert await page.locator(".profile-more button").first.evaluate(
                "el=>getComputedStyle(el).color==='rgb(42, 67, 107)' && !el.disabled"
            )
            await page.locator(".profile-more summary").click()
            await page.get_by_role("button", name="Kode masuk", exact=True).click()
            await page.get_by_role(
                "button", name="Buat / ganti kode", exact=True
            ).click()
            code = await page.locator(".code-result strong").inner_text()
            await page.get_by_text(
                "Kode masuk & aktivitas ruang murid", exact=True
            ).click()
            await page.screenshot(
                path=f"/tmp/aksara-dashboard-{width}.png", full_page=True
            )
            assert await page.evaluate(
                "document.documentElement.scrollWidth<=innerWidth"
            ), f"dashboard overflow {width}"
            await page.get_by_role(
                "button", name="Buat lembar baca", exact=False
            ).click()
            await expect(page.locator(".dark-brand img")).to_have_attribute(
                "alt", "ReadEase"
            )
            await page.screenshot(
                path=f"/tmp/readease-editor-{width}.png", full_page=True
            )
            await page.locator("#text").fill(
                (ROOT / "data/samples/ipa.txt").read_text()
            )
            await page.get_by_role(
                "button", name="Mulai Adaptasi Teks", exact=False
            ).click()
            await expect(
                page.locator(".teacher-steps button").nth(1)
            ).to_have_attribute("aria-current", "step")
            await expect(page.locator("#text")).not_to_be_visible()
            await page.screenshot(
                path=f"/tmp/aksara-teacher10-{width}.png", full_page=True
            )
            assert await page.evaluate(
                "document.documentElement.scrollWidth<=innerWidth"
            ), str(
                await page.evaluate(
                    "[...document.querySelectorAll('body *')].filter(e=>e.getBoundingClientRect().right>innerWidth+1).map(e=>[e.className,e.getBoundingClientRect().width]).slice(0,25)"
                )
            )
            await page.locator(".teacher-steps button").nth(2).click()
            await page.get_by_role(
                "button", name="Temukan Pilihan Kata Kunci Bacaan", exact=False
            ).click()
            for i in range(3):
                await page.locator(".keyword-chip-label input").nth(i).check()
            await page.get_by_role(
                "button", name="Buat 3 Soal Isian Sekarang", exact=False
            ).click()
            await expect(
                page.get_by_role(
                    "button", name="Unduh PDF A4", exact=True, include_hidden=True
                )
            ).to_be_disabled()
            for checkbox in await page.locator(".checkbox-reviewed input").all():
                await checkbox.check()
            await page.locator(".teacher-steps button").nth(3).click()
            await page.locator("#print-notes").fill("Catatan cetak khusus guru")
            async with page.expect_download() as download:
                await page.get_by_role(
                    "button", name="Unduh PDF A4", exact=True
                ).click()
            pdf = PdfReader(await (await download.value).path())
            assert "Nara Uji" in pdf.pages[0].extract_text()
            assert "Catatan cetak khusus guru" in pdf.pages[-1].extract_text()
            assert "Catatan cetak khusus guru" not in pdf.pages[0].extract_text()
            await page.get_by_label(
                "Saya telah meninjau isi bacaan", exact=False
            ).check()
            await page.get_by_role(
                "button", name="Bagikan ke ruang murid", exact=True
            ).click()
            await expect(
                page.get_by_text("Materi dibagikan ke ruang murid.", exact=False)
            ).to_be_visible()
            pupil = await student.new_page()
            pupil.on("pageerror", lambda e, errors=errors: errors.append(str(e)))
            await pupil.goto(URL)
            await pupil.get_by_role("button", name="Saya murid", exact=True).click()
            await pupil.get_by_label("Kode dari guru", exact=True).fill(code)
            await pupil.get_by_role(
                "button", name="Masuk ruang belajarku", exact=False
            ).click()
            await expect(pupil.locator(".lesson-card")).to_have_count(1)
            response = await student.request.get(URL + "/api/student/assignments")
            body = await response.json()
            assert "RAHASIA" not in str(body) and "teacher_notes" not in str(body)
            assert all("answer" not in e for e in body[0]["exercises"])
            assert (await student.request.get(URL + "/api/teacher/store")).status == 403
            await pupil.locator(".lesson-card").click()
            await expect(pupil.locator(".reading-sheet")).to_have_count(1)
            await pupil.screenshot(
                path=f"/tmp/aksara-student-{width}.png", full_page=True
            )
            assert await pupil.evaluate(
                "document.documentElement.scrollWidth<=innerWidth"
            ), f"student overflow {width}"
            for i in range(len(body[0]["cards"])):
                await pupil.get_by_label("Aku sudah membaca kartu ini").check()
                await expect(
                    pupil.get_by_label("Aku sudah membaca kartu ini")
                ).to_be_enabled()
                if i < len(body[0]["cards"]) - 1:
                    await pupil.get_by_role(
                        "button", name="Berikutnya", exact=False
                    ).click()
            for field in await pupil.locator(".student-questions input").all():
                await field.fill("jawaban uji")
            await pupil.get_by_role(
                "button", name="Kirim hasil ke guru", exact=True
            ).click()
            await expect(
                pupil.get_by_text("Hasilmu sudah dikirim kepada guru.", exact=False)
            ).to_be_visible()
            await pupil.reload()
            await expect(pupil.locator(".lesson-card")).to_contain_text("Selesai")
            await page.get_by_role(
                "button", name="Murid Bimbingan", exact=False
            ).click()
            await page.get_by_text(
                "Kode masuk & aktivitas ruang murid", exact=True
            ).click()
            await page.get_by_role(
                "button", name="Perbarui aktivitas", exact=True
            ).click()
            await expect(page.locator(".assignment-logs")).to_contain_text(
                "0/3 isian cocok persis"
            )
            await page.reload()
            await expect(page.locator(".student-playful-card")).to_have_count(1)
            await page.get_by_role("button", name="Keluar", exact=True).click()
            await expect(
                page.get_by_role("button", name="Saya guru", exact=True)
            ).to_be_visible()
            assert (await teacher.request.get(URL + "/api/teacher/store")).status == 401
            assert not errors, errors
            print(
                f"PASS {width}px: register, save, code, 3 questions, PDF, share, student read/submit, teacher progress, reload, logout; no overflow/errors"
            )
            await teacher.close()
            await student.close()
        await browser.close()


if __name__ == "__main__":
    with tempfile.TemporaryDirectory() as temp:
        env = {**os.environ, "AKSARA_DB": str(Path(temp) / "accounts.sqlite3")}
        server = subprocess.Popen(
            [
                sys.executable,
                "-m",
                "uvicorn",
                "app.main:app",
                "--port",
                "8017",
                "--no-access-log",
            ],
            cwd=ROOT / "backend",
            env=env,
            stdout=subprocess.DEVNULL,
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
