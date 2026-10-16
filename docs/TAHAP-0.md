# Laporan Tahap 0

## Yang dibuat
- Struktur folder sesuai CLAUDE.md, salinan konteks dan isi PRD lengkap.
- FastAPI: health, analyze, recompute, worksheet, pdf; skema Pydantic dan OpenAPI.
- React/Vite/TypeScript strict: teks, Proses, hasil contoh, sumber, penanganan galat.
- Tipe frontend dihasilkan dari OpenAPI backend.
- Playwright 1.51.0 dan Chromium; templat autoescape; PDF contoh A4.
- Tiga materi asli berlisensi CC0: IPA 325 kata, IPS 319, Bahasa Indonesia 327.
- Dockerfile multi-stage satu container, README, uji backend dan browser.

## Hasil verifikasi
- pytest -q: 10 passed (1 peringatan deprecation httpx dari Starlette).
- Ruff backend dan scripts: lulus.
- npm run build: lulus.
- npm run lint: lulus.
- npm run typecheck: lulus.
- Browser Chromium: input → API → respons tampil, sumber, teks HTML tidak dieksekusi,
  dan tampilan galat API: lulus.
- PDF: satu halaman A4, ukuran diperiksa otomatis; pdffonts menunjukkan font tertanam.
- Ketiga materi melalui kontrak analyze → recompute → worksheet → pdf tanpa galat.
- Docker build belum dijalankan: Docker tidak tersedia di lingkungan pengerjaan.
- Printer dan fotokopi fisik belum diuji.

## Asumsi dan batas tahap
- konteks.md menjadi CLAUDE.md; docs/PRD.md adalah ekstraksi seluruh PDF (21 halaman).
- Detail pembungkus request/response ditetapkan minimal karena PRD memberi rancangan umum.
- /api/pdf mengembalikan PDF sesuai PRD, bukan JSON contoh; masukannya PdfRequest.
- Analyze mempertahankan seluruh input sebagai satu unit contoh. Angka metrik belum
  mewakili hasil segmentasi. UI tidak menampilkan angka tersebut sebagai hasil analisis.
- Recompute belum menghitung ulang; worksheet belum menghasilkan soal. Respons
  is_example dan peringatan menjelaskan status sementara. Tidak ada perubahan bahasa.
- Hasil ideal JSON memuat kontrak stub serta kasus sulit untuk tahap NLP mendatang.
- Input pendek diperbolehkan untuk setup; batas 1.500 kata dan 30.000 karakter diterapkan.
- Playwright versi terbaru gagal mengunduh Chromium; 1.51.0 berhasil. Versi dipatok.
- Fitur NLP, editor tinjauan, pengaturan baca, localStorage, LKPD lengkap, kunci guru,
  pratinjau cetak dan pembatasan laju belum dibuat; menunggu instruksi tahap berikutnya.

## Pertanyaan terbuka
Tidak ada penghalang setup. Untuk tahap berikutnya: jenjang sasaran, rubrik resmi,
akses guru untuk uji penggunaan, dan tempat deployment.
