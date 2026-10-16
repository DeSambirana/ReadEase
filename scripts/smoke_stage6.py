"""Alur GUI lengkap tiap contoh, Bionic opsional, PDF tetap tanpa Bionic."""

import asyncio
from pathlib import Path

from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parents[1]


async def main() -> None:
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        for name in ["IPA", "IPS", "Bahasa Indonesia"]:
            context = await browser.new_context(viewport={"width": 360, "height": 900})
            page = await context.new_page()
            errors = []
            page.on(
                "pageerror",
                lambda error, collected=errors: collected.append(str(error)),
            )
            await page.goto("http://127.0.0.1:8000/#guru")
            await page.get_by_role("button", name="Muat " + name, exact=True).click()
            await page.get_by_role("button", name="Mulai membaca", exact=True).click()
            await page.locator(".proposal").first.wait_for()
            await (
                page.locator(".proposal")
                .first.get_by_role("button", name="Tolak usulan")
                .click()
            )
            await page.get_by_test_id("after-average").wait_for()
            await page.get_by_text("Pengaturan bacaan", exact=True).click()
            toggle = page.get_by_label("Bionic Reading (eksperimental)", exact=True)
            assert not await toggle.is_checked()
            original = await page.locator(".reading-text").all_text_contents()
            await toggle.focus()
            await page.keyboard.press("Space")
            assert await page.locator(".bionic-prefix").count() > 0
            assert await page.locator(".reading-text").all_text_contents() == original
            await page.reload()
            await page.get_by_text("Pengaturan bacaan", exact=True).click()
            assert await toggle.is_checked()
            assert await page.locator(".reading-text").all_text_contents() == original
            await page.get_by_role("button", name="Muat pilihan kata").click()
            await page.locator(".keyword-options input").first.wait_for()
            for i in range(3):
                await page.locator(".keyword-options input").nth(i).check()
            await page.get_by_role("button", name="Buat soal isian").click()
            await page.locator(".exercise").first.wait_for()
            for i in range(1, 4):
                await page.get_by_label(
                    f"Saya sudah meninjau soal dan kunci {i}", exact=True
                ).check()
            await page.get_by_role("button", name="Pratinjau cetak", exact=True).click()
            frame = page.frame_locator("iframe")
            await frame.get_by_role(
                "heading", name="Kunci jawaban", exact=True
            ).wait_for()
            assert await frame.locator(".bionic-prefix").count() == 0
            assert await frame.locator(".card-text").all_text_contents() == original
            async with page.expect_download() as info:
                await page.get_by_role("button", name="Unduh PDF A4").click()
            assert await (await info.value).failure() is None
            assert not errors
            assert await page.evaluate(
                "document.documentElement.scrollWidth <= innerWidth"
            )
            await context.close()
        # Teks mirip HTML aman juga saat Bionic aktif dan istilah diberi mark.
        page = await browser.new_page()
        await page.goto("http://127.0.0.1:8000/#guru")
        text = "<script>window.attacked=true</script> Air tidak hilang. Jika air berkurang, guru mencatat 12,5 cm."
        await page.get_by_label("Teks bacaan", exact=True).fill(text)
        await page.get_by_label("Istilah sulit/penting", exact=False).fill("air")
        await page.get_by_role("button", name="Mulai membaca", exact=True).click()
        await page.locator(".reading-text").first.wait_for()
        original = await page.locator(".reading-text").all_text_contents()
        await page.get_by_text("Pengaturan bacaan", exact=True).click()
        await page.get_by_label("Bionic Reading (eksperimental)", exact=True).check()
        assert await page.locator(".reading-text").all_text_contents() == original
        assert await page.locator(".reading-text mark b").count() > 0
        assert await page.evaluate("window.attacked") is None
        await browser.close()
    print(
        "PASS Tahap 6: tiga alur GUI lengkap; Bionic default mati, keyboard, draf, teks identik, HTML aman, PDF tanpa Bionic."
    )


if __name__ == "__main__":
    asyncio.run(main())
