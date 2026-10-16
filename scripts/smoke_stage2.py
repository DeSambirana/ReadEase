"""Uji desktop, ponsel, papan ketik, draf dan pengaturan baca."""

import asyncio

from playwright.async_api import Page, async_playwright

URL = "http://127.0.0.1:8000/#guru"
KEY = "aksarainklusi.draft.v2"


async def press_by_tab(page: Page, name: str) -> None:
    for _ in range(100):
        focused = page.locator(":focus")
        if await focused.count() and await focused.inner_text() == name:
            await page.keyboard.press("Enter")
            return
        await page.keyboard.press("Tab")
    raise AssertionError(f"Tombol tidak terjangkau Tab: {name}")


async def main() -> None:
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        for width in [1280, 360]:
            context = await browser.new_context(
                viewport={"width": width, "height": 900}
            )
            page = await context.new_page()
            await page.goto(URL)
            await press_by_tab(page, "Muat IPA")
            assert "Dr. Rani" in await page.get_by_label("Teks bacaan").input_value()
            await press_by_tab(page, "Mulai membaca →")
            await page.locator("article").first.wait_for()
            assert await page.locator("article").count() > 1
            first_text = await page.locator("article .reading-text").first.inner_text()
            await press_by_tab(page, "Satu per satu")
            assert await page.locator("article").count() == 1
            assert await page.get_by_role(
                "button", name="Sebelumnya", exact=True
            ).is_disabled()
            checkbox = page.get_by_role("checkbox", name="Sudah dibaca")
            await checkbox.focus()
            await page.keyboard.press("Space")
            assert await checkbox.is_checked()
            await page.get_by_role("button", name="Berikutnya").focus()
            await page.keyboard.press("Enter")
            assert (
                await page.locator("article .reading-text").inner_text() != first_text
            )
            assert not await checkbox.is_checked()
            await page.reload()
            await page.locator("article").wait_for()
            assert (
                await page.get_by_role("button", name="Satu per satu").get_attribute(
                    "aria-pressed"
                )
                == "true"
            )
            assert (
                await page.locator("article .reading-text").inner_text() != first_text
            )
            await page.get_by_role("button", name="Sebelumnya", exact=True).click()
            assert await checkbox.is_checked()
            assert (
                await page.locator("article .reading-text").inner_text() == first_text
            )
            summary = page.get_by_text("Pengaturan bacaan", exact=True)
            await summary.focus()
            await page.keyboard.press("Enter")
            slider = page.get_by_role("slider", name="Ukuran huruf")
            await slider.focus()
            await page.keyboard.press("End")
            await page.get_by_label("Kontras", exact=True).select_option("dark")
            for label in ["Jarak huruf", "Jarak kata", "Jarak baris", "Lebar kolom"]:
                await page.get_by_role("slider", name=label).focus()
                await page.keyboard.press("End")
            await page.get_by_role("slider", name="Kecepatan perkiraan").focus()
            await page.keyboard.press("Home")
            assert (
                await page.locator(".reading-text").evaluate(
                    "(el)=>getComputedStyle(el).fontSize"
                )
                == "32px"
            )
            assert await page.evaluate(
                "document.documentElement.scrollWidth <= innerWidth"
            ), "Horizontal overflow"
            await page.reload()
            await page.locator("article").wait_for()
            assert (
                await page.locator(".reading-text").evaluate(
                    "(el)=>getComputedStyle(el).fontSize"
                )
                == "32px"
            )
            assert (
                await page.locator(".reader").evaluate(
                    "(el)=>getComputedStyle(el).backgroundColor"
                )
                == "rgb(24, 35, 44)"
            )
            await page.get_by_role("button", name="Muat IPS", exact=True).click()
            assert await page.locator("article").count() == 0
            await page.get_by_role("button", name="Mulai membaca", exact=True).click()
            await page.locator("article").wait_for()
            assert not await checkbox.is_checked()
            for _ in range(40):
                next_button = page.get_by_role("button", name="Berikutnya")
                if await next_button.is_disabled():
                    break
                await next_button.click()
            assert await next_button.is_disabled()
            await page.get_by_role(
                "button", name="Muat Bahasa Indonesia", exact=True
            ).click()
            await page.get_by_role("button", name="Mulai membaca", exact=True).click()
            await page.locator("article").wait_for()
            assert await page.locator("article").count() == 1
            await page.get_by_label("Teks bacaan").fill(" ".join(["kata"] * 51) + ".")
            await page.get_by_role("button", name="Mulai membaca", exact=True).click()
            await page.locator(".card-warning").wait_for()
            assert await page.locator("article").count() == 1
            await context.close()
        context = await browser.new_context()
        page = await context.new_page()
        await page.goto(URL)
        await page.evaluate('(key)=>localStorage.setItem(key,"broken-json")', KEY)
        await page.reload()
        assert (
            await page.get_by_text("Draf tidak dapat dibaca.", exact=False).count() == 1
        )
        await page.add_init_script(
            "Storage.prototype.setItem = function(){throw new Error('quota')}"
        )
        await page.reload()
        await page.get_by_label("Teks bacaan").fill("Teks tetap bekerja.")
        await page.get_by_role("button", name="Mulai membaca", exact=True).click()
        await page.locator("article").wait_for()
        assert (
            await page.get_by_text("Draf tidak dapat disimpan", exact=False).count()
            == 1
        )
        await browser.close()
    print(
        "PASS Tahap 2: desktop/360px, Tab/Enter/Space, mode, slider, kontras, draf/progres, contoh, kartu panjang, storage rusak/penuh."
    )


if __name__ == "__main__":
    asyncio.run(main())
