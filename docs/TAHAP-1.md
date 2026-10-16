# Laporan Tahap 1 — Segmentasi dan metrik

## (a) Selesai
- Validasi anjuran 300–800 kata, maksimum 1.500 kata, penolakan kosong/tanda baca.
- Segmentasi kalimat s1, s2, dst. dan paragraf p1, p2, dst.
- Perlindungan singkatan Dr., dst., dll., dsb., angka 12.5 / 12,5 / Rp12.500.
- Metrik sebelum: rata-rata kata/kalimat, jumlah kalimat di atas ambang,
  kata/blok paragraf. Ambang bawaan 20 dan dapat diubah lewat UI.
- API analyze sekarang mengembalikan hasil nyata; frontend menampilkan metrik,
  label wajib, serta penanda teks dan warna untuk kalimat panjang.
- Pemetaan ke sumber dan escape HTML tetap bekerja; tidak ada perubahan bahasa.
- Kontrak OpenAPI dan TypeScript diselaraskan; konfigurasi UI dihasilkan dari backend.
- Fixture acuan terpisah dan diperiksa untuk semua 90 kalimat dalam tiga materi.

## (b) Uji
- pytest -q: 41 passed, satu peringatan deprecation TestClient/HTTPX dari dependensi.
- Ruff backend/tests/scripts: lulus.
- npm run build, npm run lint, npm run typecheck: lulus.
- Browser Chromium lokal: metrik 2,5 untuk 2 dan 3 kata; satu kalimat melampaui
  ambang 2; penanda kalimat panjang; input >1.500 menonaktifkan tombol; sumber;
  HTML literal; galat API dan penghapusan hasil lama: lulus.
- Regresi analyze → recompute → worksheet → pdf untuk tiga materi: lulus,
  dengan recompute dan worksheet tetap berstatus kerangka.
- Regresi PDF A4 satu halaman: lulus.

## (c) Asumsi dan batasan
- TAHAP N ditafsirkan sebagai TAHAP 1 sesuai rincian permintaan.
- Blok = paragraf asli; pemisah paragraf adalah baris kosong. Baris tunggal tetap utuh.
- Kata dihitung sebagai token spasi berhuruf/berangka. Rata-rata dibulatkan dua desimal.
- Singkatan daftar diikuti kapital dianggap menutup kalimat. Ini heuristik terbatas;
  nama diri setelah singkatan atau penggunaan tanda baca tidak baku bisa ambigu.
- Masukan pendek nonkosong diproses dengan peringatan, sesuai FR-01; tidak ada batas
  minimum keras lain yang ditambahkan. Batas teknis 30.000 karakter dari setup tetap ada.
- Escape dilakukan saat render, sehingga JSON tetap berisi sumber literal.
- metrics_after belum tersedia karena tinjauan/recompute bukan lingkup Tahap 1.
- Tidak mengimplementasikan aturan adaptasi, pemeriksaan risiko semantik, atau soal.
- Docker build dan cetak fisik belum diuji; lingkungan tidak menyediakan Docker/printer.

## (d) Pertanyaan terbuka
Tidak ada keputusan yang menghalangi tahap ini. Sebelum memperluas segmentasi, perlu
menentukan dukungan singkatan tambahan, daftar bernomor, dan format teks tidak baku.
