"""Satu templat dan satu pembagi halaman untuk pratinjau serta PDF."""

import base64
from functools import lru_cache
from pathlib import Path

from jinja2 import Environment, FileSystemLoader, select_autoescape
from playwright.async_api import async_playwright

from .config import settings
from .models import PdfRequest, ReviewStatus
from .worksheet import validate_exercises

ROOT = Path(__file__).parent
environment = Environment(
    loader=FileSystemLoader(ROOT / "templates"), autoescape=select_autoescape(["html"])
)


@lru_cache(maxsize=2)
def font_data(name: str) -> str:
    return base64.b64encode((ROOT / "fonts" / name).read_bytes()).decode("ascii")


def validate_print(data: PdfRequest) -> None:
    if data.exercises:
        validate_exercises(data.document, data.exercises)
    ids = [s.id for s in data.document.sentences]
    if (
        not data.cards
        or list(dict.fromkeys(sid for c in data.cards for sid in c.source_sentence_ids)) != ids
    ):
        raise ValueError("Urutan dan sumber kartu tidak cocok dengan dokumen.")
    if len({c.id for c in data.cards}) != len(data.cards):
        raise ValueError("ID kartu harus unik.")
    sources = {s.id: s.text for s in data.document.sentences}
    for card in data.cards:
        original = " ".join(sources[sid] for sid in card.source_sentence_ids)
        if (
            card.review_status not in {ReviewStatus.accepted, ReviewStatus.edited}
            and card.adapted_text != original
        ):
            raise ValueError("Perubahan bahasa harus ditinjau guru sebelum ekspor.")
    if sum(len(c.adapted_text) for c in data.cards) > settings.max_text_characters:
        raise ValueError("Isi kartu melebihi batas teks.")


def render_html(data: PdfRequest) -> str:
    validate_print(data)
    sources = {s.id: s.text for s in data.document.sentences}
    changes = []
    for card in data.cards:
        original = " ".join(sources[sid] for sid in card.source_sentence_ids)
        if card.review_status in {ReviewStatus.accepted, ReviewStatus.edited} and (
            card.adapted_text != original or card.rule_id
        ):
            changes.append(card)
    return environment.get_template("print.html").render(
        data=data,
        regular=font_data("DejaVuSans.ttf"),
        bold=font_data("DejaVuSans-Bold.ttf"),
        sources=sources,
        changes=changes,
    )



# Ukuran elemen diukur setelah font siap; blok terlalu tinggi ditolak, bukan dipotong.
PAGINATE = """() => {
 const groups = ['student','teacher'];
 let number=0;
 for(const group of groups){
  const source=document.getElementById(group);
  let content;
  function newPage(){
   const sheet=document.createElement('section');sheet.className='sheet';sheet.dataset.kind=group;
   content=document.createElement('div');content.className='content';sheet.append(content);
   const footer=document.createElement('div');footer.className='footer';
   footer.textContent=(group==='student'?'Lembar siswa':'Khusus guru')+' · Halaman '+(++number);
   sheet.append(footer);document.body.append(sheet);
  }
  newPage();
  for(const block of [...source.children]){
   // Kelompok soal tetap satu halaman bila seluruhnya muat.
   if(block.matches('.question') && !document.querySelector('.sheet .question')){
    const questions=[...source.querySelectorAll('.question')];
    const total=questions.reduce((n,q)=>n+q.getBoundingClientRect().height+parseFloat(getComputedStyle(q).marginBottom),0);
    const used=content.children.length?content.lastElementChild.getBoundingClientRect().bottom-content.getBoundingClientRect().top+16:0;
    if(total<=content.clientHeight && used+total>content.clientHeight && content.children.length)newPage();
   }
   content.append(block);
   const fits=()=>block.getBoundingClientRect().bottom <= content.getBoundingClientRect().bottom-1;
   if(!fits()){
    block.remove();
    if(!content.children.length) return false;
    newPage();content.append(block);
    if(!fits()) return false;
   }
  }
  source.remove();
 }
 return true;
}"""


async def render_print(data: PdfRequest, preview: bool = False) -> bytes | str:
    html = render_html(data)
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch()
        try:
            # JS harus aktif agar evaluate() dan document.fonts.ready dapat berjalan.
            # Semua konten sudah inline (font base64); blokir hanya jaringan eksternal.
            page = await browser.new_page()
            await page.route(
                "**/*",
                lambda route: route.continue_()
                if route.request.resource_type in {"document", "stylesheet", "font"}
                else route.abort(),
            )
            await page.set_content(html, wait_until="domcontentloaded")
            await page.evaluate("() => document.fonts.ready")
            if not await page.evaluate(f"({PAGINATE})()"):
                raise ValueError(
                    "Satu kartu atau soal terlalu panjang untuk halaman A4. Ringkas melalui tinjauan guru, lalu buat ulang soal."
                )
            if preview:
                return await page.content()
            return await page.pdf(format="A4", print_background=True, prefer_css_page_size=True)

        finally:
            await browser.close()


async def render_pdf(data: PdfRequest) -> bytes:
    result = await render_print(data)
    assert isinstance(result, bytes)
    return result
