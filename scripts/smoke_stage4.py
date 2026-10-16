"""Pilihan kemunculan, kunci persis, tinjauan, dan invalidasi draf soal."""

import asyncio

from playwright.async_api import async_playwright


async def main() -> None:
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        for width in [1280, 360]:
            context = await browser.new_context(
                viewport={"width": width, "height": 900}
            )
            page = await context.new_page()
            await page.goto("http://127.0.0.1:8000/#guru")
            await page.get_by_label("Teks bacaan", exact=True).fill(
                "Jika air tidak tersedia, air diperlukan. Akar memperoleh air."
            )
            await page.get_by_role("button", name="Mulai membaca", exact=True).click()
            await page.get_by_role("button", name="Muat pilihan kata").click()
            choice = page.get_by_label("air · nomina · kemunculan 2 (s1)", exact=True)
            await choice.focus()
            await page.keyboard.press("Space")
            await page.get_by_role("button", name="Buat soal isian").focus()
            await page.keyboard.press("Enter")
            await page.get_by_test_id("answer").wait_for()
            assert await page.get_by_test_id("answer").inner_text() == "air"
            assert (
                await page.get_by_test_id("blank-text").inner_text()
                == "Jika air tidak tersedia, ______ diperlukan."
            )
            review = page.get_by_label(
                "Saya sudah meninjau soal dan kunci 1", exact=True
            )
            await review.check()
            await page.reload()
            assert await review.is_checked()
            assert await page.evaluate(
                "document.documentElement.scrollWidth <= innerWidth"
            )
            await choice.uncheck()
            assert await page.get_by_test_id("answer").count() == 0
            await page.get_by_label(
                "Akar · nomina · kemunculan 1 (s2)", exact=True
            ).check()
            await page.get_by_role("button", name="Buat soal isian").click()
            await page.get_by_test_id("answer").wait_for()
            assert await page.get_by_test_id("answer").inner_text() == "Akar"
            assert not await review.is_checked()
            await (
                page.locator('[data-proposal="glossary_swap"]')
                .get_by_role("button", name="Terima usulan")
                .click()
            )
            await page.get_by_test_id("after-average").wait_for()
            assert await page.get_by_test_id("answer").count() == 0
            assert await page.locator(".keyword-group").count() == 0
            await page.get_by_role("button", name="Muat pilihan kata").click()
            await page.locator(".keyword-group").first.wait_for()
            await page.get_by_label("Teks bacaan", exact=True).fill(
                "Daun menyerap air."
            )
            assert (
                await page.get_by_role("button", name="Muat pilihan kata").count() == 0
            )
            await context.close()
        await browser.close()
    print(
        "PASS Tahap 4: kata berulang, huruf asli, tinjauan, draf, invalidasi, keyboard, desktop/360px."
    )


if __name__ == "__main__":
    asyncio.run(main())
