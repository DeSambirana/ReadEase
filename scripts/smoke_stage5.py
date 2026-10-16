"""Alur guru sampai pratinjau dan unduh PDF; keyboard dan lebar 360px."""

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
                "Akar menyerap air. Daun memperoleh cahaya."
            )
            await page.get_by_role("button", name="Mulai membaca", exact=True).click()
            await page.get_by_role("button", name="Muat pilihan kata").click()
            await page.locator(".keyword-options input").first.wait_for()
            assert await page.get_by_role("button", name="Unduh PDF A4").is_disabled()
            for i in range(3):
                await page.locator(".keyword-options input").nth(i).check()
            await page.get_by_role("button", name="Buat soal isian").click()
            await page.locator(".exercise").first.wait_for()
            for i in range(3):
                await page.get_by_label(
                    f"Saya sudah meninjau soal dan kunci {i + 1}", exact=True
                ).check()
            await page.get_by_label("Judul lembar kerja").fill("Latihan tanaman")
            await page.get_by_role("button", name="Pratinjau cetak", exact=True).focus()
            await page.keyboard.press("Enter")
            frame = page.frame_locator("iframe")
            await frame.get_by_role(
                "heading", name="Kunci jawaban", exact=True
            ).wait_for()
            assert await frame.locator(".sheet").count() == 2
            assert await frame.locator('[data-kind="student"] .question').count() == 3
            assert await page.evaluate(
                "document.documentElement.scrollWidth <= innerWidth"
            )
            async with page.expect_download() as info:
                await page.get_by_role("button", name="Unduh PDF A4").click()
            download = await info.value
            assert download.suggested_filename == "aksarainklusi-lkpd.pdf"
            assert await download.failure() is None
            await page.get_by_label("Judul lembar kerja").fill("Judul baru")
            assert await page.locator("iframe").count() == 0
            await page.get_by_label(
                "Saya sudah meninjau soal dan kunci 1", exact=True
            ).uncheck()
            assert await page.get_by_role("button", name="Unduh PDF A4").is_disabled()
            await context.close()
        await browser.close()
    print(
        "PASS Tahap 5: gerbang tinjauan, judul, pratinjau, unduhan, invalidasi, desktop/360px."
    )


if __name__ == "__main__":
    asyncio.run(main())
