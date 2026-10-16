# Laporan Tahap 5 — PDF A4 Profil Cetak Kelas

## (a) Yang selesai
- FR-20: judul yang dapat diisi, nama dan kelas, kartu baca bertahap, tepat tiga soal
  isian dan ruang jawaban 12 mm. Pratinjau dan unduhan terhubung ke UI.
- FR-21: halaman khusus guru di belakang PDF; kunci persis dari sumber,
  sumber setiap soal, perubahan diterima/diedit, serta peringatan kartu.
- FR-22: A4 hitam-putih, latar putih tanpa blok warna, bingkai 0,5 pt,
  font DejaVu Sans dibundel berlisensi terbuka dan tertanam, Bionic Reading mati.
- Templat tunggal print.html dan paginasi berbasis ukuran blok setelah font siap
  digunakan bersama oleh pratinjau HTML dan PDF Playwright.
- Checklist cetak/fotokopi manusia di CHECKLIST-CETAK.md; status belum dilakukan.

## (b) Uji lulus
- python -m pytest -q dari backend: 122 lulus.
- Dari root proyek: python -m ruff check backend/app backend/tests scripts dan
  python -m ruff format --check backend/app backend/tests scripts lulus.
  Jalankan dari root agar konfigurasi pemformatan skrip konsisten.
- npm run build, npm run lint, npm run typecheck: lulus.
- Smoke Tahap 0–5: lulus pada desktop 1280 px dan lebar 360 px, termasuk tombol
  papan ketik, gerbang tinjauan, unduhan, judul dan invalidasi pratinjau lama.
- verify_print.py: ketiga alur analyze → recompute → worksheet → preview/pdf lulus.
  Setiap PDF memiliki 6 halaman (5 siswa + 1 guru), 18 kartu, dan 3 soal.
- Teks tiap kartu dan soal ditemukan utuh pada satu halaman PDF yang sesuai
  pratinjau. Batas geometris, A4, pemisahan kunci, dan glyph font tertanam diperiksa.
- Halaman dirender dengan Poppler dan ditinjau visual; soal dikelompokkan pada
  halaman terakhir siswa, tidak ada teks terpotong pada ketiga materi.
- Font pada Chromium runtime ini berupa subset Type 3; isi CharProcs tertanam
  diperiksa dan pdffonts juga melaporkan embedding.
- Galat 422 diuji untuk soal belum ditinjau, kunci palsu, jumlah soal salah,
  sumber tidak cocok, usulan pending yang berubah, dan blok terlalu tinggi.
- Peringatan dependensi Starlette/httpx dan anotasi Zod masih ada, bukan kegagalan uji.

## (c) Asumsi/penyimpangan
- Kunci terpisah sebagai halaman, bukan berkas kedua. Pisahkan halaman guru
  sebelum membagikan atau memfotokopi lembar siswa.
- Tambahan endpoint POST /api/pdf/preview mengembalikan HTML dari PdfRequest.
  Skema OpenAPI/TypeScript diperbarui. /api/pdf kini mewajibkan tepat tiga soal;
  kontrak PDF sederhana tahap awal digantikan kontrak LKPD lengkap.
- Profil cetak tetap 12 pt/tinggi baris 1,65; pengaturan mode layar tidak diterapkan
  otomatis ke PDF. Pratinjau ponsel memakai area gulir ukuran A4 asli.
- Blok yang lebih tinggi dari halaman ditolak, tidak dikecilkan atau dipotong.
  Guru perlu meninjau materi lalu membuat ulang soal. Jaminan tata letak yang diuji
  berlaku pada set contoh, bukan seluruh teks yang mungkin dimasukkan.
- Usulan pending tidak dicetak sebagai perubahan; kartu pending yang masih sama
  dengan sumber boleh dicetak. Status tinjauan tetap pernyataan guru tanpa akun.
- Uji cetak fisik/fotokopi dan Docker build belum dilakukan. Tidak ada pekerjaan tahap lain.

## (d) Pertanyaan terbuka
Tidak ada keputusan pengembangan yang menghambat. Hasil cetak/fotokopi nyata perlu
menentukan apakah ukuran huruf, garis dan ruang jawaban sesuai mesin dan kelas tujuan.

## Berkas bukti
- artifacts/tahap-5/ipa.pdf
- artifacts/tahap-5/ips.pdf
- artifacts/tahap-5/bahasa_indonesia.pdf
- artifacts/tahap-5/verification.json
- docs/CHECKLIST-CETAK.md
