"""Tinjauan guru, risiko, istilah, jejak dan pemulihan draf."""

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
            source = "Akar memperoleh air. Bagian tanaman meliputi akar, batang, dan daun.\n\nDaun menyerap cahaya dan akar menyerap air. Jika tanaman tidak memperoleh air, tanaman dapat layu."
            await page.get_by_label("Teks bacaan", exact=True).fill(source)
            await page.get_by_label("Istilah sulit/penting", exact=False).fill("air")
            await page.get_by_role("button", name="Mulai membaca", exact=True).click()
            await page.locator('[data-proposal="glossary_swap"]').wait_for()
            assert await page.locator("article mark").count() > 0
            # Split dibatasi bila istilah penting ada pada kalimat; uji manual terpisah.
            glossary = page.locator('[data-proposal="glossary_swap"]')
            await glossary.get_by_role("button", name="Terima usulan").focus()
            await page.keyboard.press("Enter")
            await page.get_by_test_id("after-average").wait_for()
            assert "Akar mendapatkan air." in await page.locator(".reader").inner_text()
            await glossary.locator("textarea").fill("Akar tidak mendapatkan air.")
            await glossary.get_by_role("button", name="Simpan edit").click()
            await page.get_by_text(
                "Perubahan diblokir: negasi", exact=True
            ).first.wait_for()
            assert "Akar memperoleh air." in await page.locator(".reader").inner_text()
            await glossary.locator("textarea").fill("Akar mendapatkan air bersih.")
            await glossary.get_by_role("button", name="Simpan edit").click()
            await page.wait_for_function(
                "document.querySelector('.reader').textContent.includes('Akar mendapatkan air bersih.')"
            )
            bullets = page.locator('[data-proposal="list_to_bullets"]')
            await bullets.get_by_role("button", name="Terima usulan").click()
            await page.wait_for_function(
                "document.querySelector('.reader').textContent.includes('• akar')"
            )
            await page.reload()
            await page.get_by_test_id("after-average").wait_for()
            assert "• akar" in await page.locator(".reader").inner_text()
            assert (
                "Akar mendapatkan air bersih."
                in await page.locator(".reader").inner_text()
            )
            await (
                page.locator('[data-proposal="glossary_swap"]')
                .get_by_role("button", name="Tolak usulan")
                .click()
            )
            await page.wait_for_function(
                "document.querySelector('.reader').textContent.includes('Akar memperoleh air.')"
            )
            await page.locator("article summary").first.click()
            assert "glossary_swap" in await page.locator("article").first.inner_text()
            assert (
                "Jika tanaman tidak memperoleh air, tanaman dapat layu."
                in await page.locator(".reader").inner_text()
            )
            assert await page.evaluate(
                "document.documentElement.scrollWidth <= innerWidth"
            )
            await page.get_by_label("Istilah sulit/penting", exact=False).fill("")
            await page.get_by_label("Teks bacaan", exact=True).fill(
                "Daun menyerap cahaya dan akar menyerap air."
            )
            await page.get_by_role("button", name="Mulai membaca", exact=True).click()
            manual = page.locator('[data-proposal="split_independent_clauses"]')
            await manual.wait_for()
            assert await manual.get_by_role(
                "button", name="Terima usulan"
            ).is_disabled()
            await manual.locator("textarea").fill(
                "Daun menyerap cahaya. Akar menyerap air."
            )
            await manual.get_by_role("button", name="Simpan edit").click()
            await page.get_by_test_id("after-average").wait_for()
            assert await page.get_by_test_id("after-average").inner_text() == "3"
            await context.close()
        await browser.close()
    print(
        "PASS Tahap 3: terima/edit/tolak, blokir risiko, manual gate, metrik, istilah, sumber, draf, desktop/360px."
    )


if __name__ == "__main__":
    asyncio.run(main())
