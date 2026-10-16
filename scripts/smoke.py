"""Jalankan setelah frontend dibangun dan backend aktif di port 8000."""

import asyncio
from pathlib import Path

import httpx
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parents[1]


async def main() -> None:
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        errors: list[str] = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        await page.goto("http://127.0.0.1:8000/#guru")
        button = page.get_by_role("button", name="Mulai membaca", exact=True)
        assert await button.is_disabled()
        text = "<script>window.attacked=true</script> Jika hujan tidak turun, tanaman perlu diperiksa."
        await page.get_by_label("Teks bacaan").fill(text)
        await button.click()
        await page.locator("article").wait_for()
        assert await page.locator("article > p").first.inner_text() == text
        assert await page.evaluate("window.attacked") is None
        await page.get_by_text("Lihat sumber", exact=True).click()
        assert await page.locator("article details p.source-text").inner_text() == text
        await page.get_by_label("Teks bacaan").fill("Satu dua. Tiga empat lima.")
        await page.get_by_label("Ambang kalimat panjang (kata)").fill("2")
        await button.click()
        await page.locator("article").wait_for()
        assert await page.get_by_test_id("average").inner_text() == "2.5"
        assert await page.get_by_test_id("over-threshold").inner_text() == "1"
        assert await page.locator('[data-long="true"]').count() == 1
        await page.get_by_label("Teks bacaan").fill("kata " * 1501)
        assert await button.is_disabled()
        assert await page.locator("article").count() == 0
        await page.get_by_label("Teks bacaan").fill("Teks aman.")
        await page.route("**/api/analyze", lambda route: route.fulfill(status=500))
        await button.click()
        await page.get_by_role("alert").wait_for()
        assert await page.locator("article").count() == 0
        assert not errors
        await browser.close()
    with httpx.Client(
        base_url="http://127.0.0.1:8000", timeout=30, trust_env=False
    ) as client:
        data = client.post(
            "/api/analyze",
            json={
                "text": "Jika tanah tidak basah, periksa kebutuhan air tanaman.",
                "title": "Contoh A4 regresi Tahap 1",
            },
        ).json()
        workspace = {key: data[key] for key in ["document", "cards", "exercises"]}
        response = client.post("/api/pdf", json=workspace)
        assert (
            response.status_code == 422
        )  # Profil lengkap memerlukan tiga soal ditinjau.
    print(
        "PASS: input → API → hasil; metrik; ambang; batas kata; sumber; HTML aman; galat; gerbang PDF lengkap."
    )


if __name__ == "__main__":
    asyncio.run(main())
