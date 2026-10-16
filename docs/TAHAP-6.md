# Laporan Tahap 6 — implementasi dan verifikasi lokal

Status: kode dan pengujian lokal selesai, **Definition of Done belum terpenuhi seluruhnya**.
Tidak ada klaim deployment Docker/publik atau bukti cetak fisik yang belum dilakukan.

## (a) Selesai
- FR-17 Bionic Reading eksperimental, mati bawaan, berlabel, hanya layar; teks asli
  dan tanda istilah tetap sama. Draf lama kompatibel melalui nilai bawaan false.
- FR-16 tetap estimasi waktu, tanpa timer atau perpindahan otomatis; uji regresi lulus.
- Batas payload byte, batas laju per klien, concurrency dan timeout cetak, timeout klien.
- Penanganan galat aman tanpa menyalin isi teks atau pesan internal renderer.
- Uji GUI tiga contoh sampai unduh PDF, uji satu URL, benchmark dan skrip verifikasi Docker.
- Panduan deployment serta urutan demo enam langkah sesuai PRD bagian 16.

## (b) Uji yang lulus
- python -m pytest -q: 126 lulus; termasuk batas byte/chunked, batas laju, JSON rusak,
  galat renderer, kuota render, dan seluruh uji tahap sebelumnya.
- Ruff check dan format check dari root proyek lulus.
- npm run build, npm run lint, npm run typecheck lulus.
- verify_local.py: smoke Tahap 0–6, tiga PDF, GUI ketiga materi, serta satu origin lulus.
- Bionic diuji default mati, keyboard, draf, teks identik, penandaan istilah dan HTML aman;
  pratinjau PDF tidak mengandung penebalan awal kata dan isinya sama dengan kartu layar.
- verify_print.py tetap lulus untuk tiga contoh: A4, teks utuh, font tertanam, sumber,
  tiga soal dan kunci guru terpisah. Templat cetak tidak diubah pada Tahap 6.
- verify_docker.py dijalankan dan berhenti dengan pesan Docker tidak tersedia.
  Ini **bukan** uji Docker lulus. Tidak ada daemon/socket atau runtime alternatif tersedia.
- Peringatan dependensi Starlette/httpx dan anotasi Zod tetap non-fatal.

### Benchmark lokal (detik, median tiga percobaan)

| Kata | Analisis | PDF | Total alur API |
| --- | --- | --- | --- |
| 300 | 0.0078 | 0.5128 | 0.5364 |
| 500 | 0.0128 | 0.5253 | 0.5545 |
| 800 | 0.0256 | 0.5811 | 0.6308 |

Total mencakup analyze, recompute, dua panggilan worksheet (kandidat+pembuatan), PDF.
Materi sintetis berulang tepat 300/500/800 kata; berjalan serial pada Linux Python 3.12.14,
Chromium dimulai per ekspor. Angka mentah dan maksimum di artifacts/tahap-6/benchmark.json.
Seluruh percobaan memenuhi sasaran analisis <5 detik dan PDF <15 detik di lingkungan ini.
Bukan perkiraan waktu guru, uji beban, janji hosting, atau bukti manfaat pendidikan.

## Definition of Done (PRD bagian 13)

| Butir | Status | Bukti/tindak lanjut |
| --- | --- | --- |
| Tempel teks sampai unduh PDF pada 3 materi | Lulus lokal | smoke_stage6.py + verify_print.py |
| Setiap kartu menampilkan sumber, aturan, peringatan | Lulus | Reader + smoke_stage3.py |
| Satu kasus penolakan langsung | Lulus | Perubahan negasi diblokir di smoke_stage3.py; skrip demo langkah 4 |
| PDF dicetak dan difotokopi; hasil dibawa demo | BELUM | Harus dilakukan manusia, CHECKLIST-CETAK.md |

## (c) Asumsi dan penyimpangan
- Dockerfile tetap satu container non-root untuk API dan frontend. Access log dinonaktifkan.
  Skrip Docker tersedia, tetapi build/run belum terbukti karena Docker tidak tersedia.
- Satu URL dibuktikan pada server lokal sementara, bukan situs publik yang terus berjalan.
- Rate limiter adalah penghitung metadata sementara per proses, maksimum 1.024 klien,
  bukan penyimpanan dokumen. Proxy/NAT bisa membuat beberapa pengguna berbagi kuota.
  Bukan proteksi DDoS; tetap perlu penyesuaian saat hosting.
- Uji manusia 3–5 guru dan rencana perluasan set 5–10 materi belum dilakukan.
  Pengujian memakai tiga materi inti; tidak mengarang kualitas/makna ideal dari penilaian guru.
- Gerbang klausa manual tetap dipertahankan. Tidak menambah model atau fitur di luar MVP.

## (d) Pertanyaan terbuka / pekerjaan manusia
1. Mesin Docker atau lingkungan hosting mana yang akan dipakai? Jalankan verify_docker.py
   di sana sebelum menyatakan deployment siap. Belum ada akun/domain yang ditentukan.
2. Cetak dan fotokopi ketiga contoh, isi checklist, bawa hasil fisik saat demo.
3. Bila ada akses guru/GPK, lakukan uji awal dan catat hasil sebenarnya.
