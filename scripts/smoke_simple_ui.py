"""Regresi alur pilihan → input → hasil, font alternatif dan draf lama."""

import asyncio

from playwright.async_api import async_playwright, expect


async def main() -> None:
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        for width in [1280, 360]:
            context = await browser.new_context(
                viewport={"width": width, "height": 1000}
            )
            page = await context.new_page()
            errors = []
            page.on("pageerror", lambda error, target=errors: target.append(str(error)))
            await page.goto("http://127.0.0.1:8000")
            await expect(page.locator(".choice-card")).to_have_count(3)
            assert await page.get_by_label("Teks bacaan", exact=True).count() == 0
            await page.screenshot(
                path=f"/tmp/aksara-choice-{width}.png", full_page=True
            )
            await page.get_by_role("button", name="Pilih Disleksia", exact=True).focus()
            await page.keyboard.press("Enter")
            await expect(page).to_have_url("http://127.0.0.1:8000/#teks")
            await expect(page.locator("h1")).to_be_focused()
            await expect(
                page.get_by_role("button", name="Sesuaikan bacaan")
            ).to_be_disabled()
            text = "Akar memperoleh air. Daun menyerap cahaya.\n\nJika tanah tidak basah, tanaman perlu diperiksa. <img src=x onerror=alert(1)>"
            await page.get_by_label("Teks bacaan", exact=True).fill(text)
            await page.get_by_role("button", name="Sesuaikan bacaan").click()
            await expect(page).to_have_url("http://127.0.0.1:8000/#baca")
            await expect(page.locator(".reading-text").first).to_be_visible()
            assert await page.get_by_label("Teks bacaan", exact=True).count() == 0
            await expect(
                page.get_by_text("Font Dyslexie belum tersedia", exact=False)
            ).to_be_visible()
            texts = await page.locator(".reading-text").all_text_contents()
            assert "Akar memperoleh air." in texts[0]
            assert "<img" in "".join(texts)
            assert await page.locator(".reader img").count() == 0
            assert (
                await page.locator(".reading-text").first.evaluate(
                    "el=>getComputedStyle(el).fontSize"
                )
                == "22px"
            )
            await page.get_by_text("Pengaturan bacaan", exact=True).click()
            await page.get_by_label("Jenis huruf", exact=True).select_option("serif")
            assert "Georgia" in await page.locator(".reading-text").first.evaluate(
                "el=>getComputedStyle(el).fontFamily"
            )
            await page.reload()
            await page.get_by_text("Pengaturan bacaan", exact=True).click()
            await expect(page.get_by_label("Jenis huruf", exact=True)).to_have_value(
                "serif"
            )
            await page.get_by_role("button", name="Ganti pilihan", exact=True).click()
            await page.get_by_role(
                "button", name="Pilih Fokus / ADHD", exact=True
            ).click()
            await expect(page.get_by_label("Teks bacaan", exact=True)).to_have_value(
                text
            )
            # Perubahan tampilan tidak memanggil analisis ulang / mereset hasil.
            await page.get_by_role(
                "button", name="Kembali ke hasil", exact=True
            ).click()
            assert await page.locator(".reader article").count() == 1
            await page.get_by_label("Sudah dibaca", exact=True).check()
            await page.get_by_role("button", name="Berikutnya", exact=True).click()
            assert (
                "Jika tanah tidak basah"
                in await page.locator(".reading-text").inner_text()
            )
            await page.get_by_role("button", name="Ruang Guru", exact=True).click()
            await (
                page.locator('[data-proposal="glossary_swap"]')
                .get_by_role("button", name="Terima usulan")
                .click()
            )
            await page.get_by_test_id("after-average").wait_for()
            await page.get_by_role("button", name="Baca", exact=True).click()
            assert (
                "Akar mendapatkan air."
                in await page.locator(".reading-text").inner_text()
            )
            await page.get_by_role("button", name="Ganti pilihan", exact=True).click()
            await page.get_by_role(
                "button", name="Pilih Bacaan Standar", exact=True
            ).click()
            await page.get_by_role(
                "button", name="Kembali ke hasil", exact=True
            ).click()
            assert (
                await page.locator(".reading-text").first.evaluate(
                    "el=>getComputedStyle(el).fontSize"
                )
                == "18px"
            )
            assert (
                await page.get_by_role(
                    "region", name="Tinjauan guru", exact=True
                ).count()
                == 0
            )
            assert await page.evaluate(
                "document.documentElement.scrollWidth <= innerWidth"
            )
            await page.screenshot(
                path=f"/tmp/aksara-reading-{width}.png", full_page=True
            )
            # Draf lama tanpa field baru tetap dapat dipulihkan.
            await page.evaluate(
                "()=>{const k='aksarainklusi.draft.v2';const d=JSON.parse(localStorage.getItem(k));delete d.readingProfile;delete d.preferences.fontFamily;localStorage.setItem(k,JSON.stringify(d));}"
            )
            await page.reload()
            await expect(page.locator(".reading-text").first).to_contain_text(
                "Akar mendapatkan air."
            )
            await page.get_by_role("button", name="← Edit teks", exact=True).click()
            await page.get_by_label("Teks bacaan", exact=True).fill("kata " * 1501)
            await expect(
                page.get_by_role("button", name="Sesuaikan bacaan")
            ).to_be_disabled()
            await page.get_by_role("button", name="Muat IPA", exact=True).click()
            await page.route("**/api/analyze", lambda route: route.abort())
            await page.get_by_role("button", name="Sesuaikan bacaan").click()
            await expect(page.get_by_role("alert")).to_contain_text(
                "Teks gagal diproses"
            )
            await expect(page.get_by_label("Teks bacaan", exact=True)).not_to_be_empty()
            assert not errors, errors
            await context.close()
        await browser.close()
    print(
        "PASS alur kartu: 1280/360 px, keyboard, font alternatif, teks aman, guru, draf lama/baru, batas input dan galat API."
    )


if __name__ == "__main__":
    asyncio.run(main())
