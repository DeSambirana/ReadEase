# Laporan Tahap 4 — Soal isian dan kunci

## (a) Selesai
FR-18/19: kandidat kamus kata isi, pilihan kemunculan, satu lubang per kalimat sumber,
kunci dari irisan sumber, tinjauan per soal, penyimpanan draf dan invalidasi tinjauan lama.
Endpoint worksheet, skema Pydantic/OpenAPI/TypeScript dan validasi Zod diperbarui.
Konteks dibaca dari CLAUDE.md yang merupakan salinan konteks.md; PRD bagian soal isian ditinjau.

## (b) Hasil uji
- python -m pytest -q: 114 lulus (33 tambahan), termasuk setiap kandidat ketiga materi.
- Ruff check dan format check: lulus.
- npm run build, npm run lint, npm run typecheck: lulus.
- verify_local.py: seluruh smoke Tahap 0–4 lulus; desktop 1280 px, ponsel 360 px,
  papan ketik, kata berulang, huruf asli, tinjauan, draf, invalidasi.
- PDF A4 sederhana tahap awal tetap lulus regresi; bukan bukti PDF LKPD lengkap.
- Ada peringatan dependensi Starlette/httpx dan anotasi Zod dari build; tidak menggagalkan uji.
- CLI pytest tidak ada pada PATH runtime ini; modul yang sama dijalankan lewat python -m pytest.

## (c) Asumsi dan batasan
- Kamus konservatif terbatas; tidak menebak kata yang belum dikenali, tidak melakukan stemming.
  Kelas kata kamus belum divalidasi berdasarkan konteks atau oleh guru/GPK.
- Maksimal tiga soal; satu atau dua tetap boleh untuk tinjauan tahap ini.
- Soal selalu memakai kalimat sumber asli, bukan hasil perubahan bahasa.
- Offset memakai titik kode Unicode Python; browser memakai offset yang dikirim backend.
- Gerbang ekspor memeriksa kunci, teks soal dan reviewed. Ekspor dengan soal sah
  masih mengembalikan 409 karena implementasi PDF LKPD merupakan tahap berikutnya.
  Soal belum ditinjau/tidak cocok ditolak 422. UI menjelaskan batasan ini.
- Status tinjauan adalah pernyataan guru di browser, bukan autentikasi akun.
- Docker build dan uji cetak fisik belum dilakukan; tidak ada pekerjaan Tahap 5.

## (d) Pertanyaan terbuka
Tidak ada keputusan yang menghalangi Tahap 4. Perlu evaluasi kamus bersama guru/GPK
untuk materi di luar tiga contoh, sebelum memperluas cakupan kandidat.
