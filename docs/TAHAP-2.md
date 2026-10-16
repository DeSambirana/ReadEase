# Laporan Tahap 2 — Kartu baca dan mode tampilan

## (a) Yang selesai
- Kartu berisi maksimal dua kalimat sumber, sasaran 30–50 kata, mempertahankan
  urutan dan teks kalimat. Kartu panjang ditandai tanpa memotong kalimat.
- Setiap kartu memiliki ID sumber, rule_id, review_status, warnings dan Lihat sumber.
- Bacaan Nyaman: seluruh kartu dengan ukuran huruf, jarak huruf/kata/baris,
  lebar kolom serta kontras putih, krem atau gelap.
- Fokus Bertahap: satu kartu, navigasi manual, centang progres, perkiraan waktu.
- localStorage: teks, ambang, hasil, pengaturan, mode, posisi dan progres dipulihkan.
- Validasi draf saat pemulihan; penanganan JSON rusak dan storage penuh/ditolak.
- Tiga tombol contoh IPA, IPS, Bahasa Indonesia dari materi CC0 yang sama.
- Hasil/progres lama dihapus ketika sumber/ambang berganti; pengaturan baca bertahan.
- Konfigurasi backend dan tipe API diekspor ke frontend. Validasi respons/draf
  frontend memakai Zod; bentuk hasil diperiksa terhadap tipe API TypeScript.

## (b) Uji lulus
- pytest -q: 53 passed, satu peringatan deprecation HTTPX/TestClient.
- Ruff app/tests/scripts: lulus.
- npm run build, npm run lint, npm run typecheck: lulus.
- Chromium desktop 1280px dan 360px: input → kartu; dua mode; navigasi awal/akhir;
  centang; muat ulang mempertahankan posisi/progres/pengaturan; tiga contoh;
  kartu >50 kata; tidak meluber horizontal pada pengaturan huruf/spasi terbesar.
- Papan ketik: tombol contoh/Proses/mode melalui Tab dan Enter; centang melalui
  Space; slider melalui Home/End; fokus terlihat dan kontrol memakai elemen native.
- Draf rusak dan kegagalan menulis localStorage: aplikasi tetap dapat digunakan.
- Regresi metrik, HTML literal, galat API dan PDF A4: lulus.
- Build mengeluarkan peringatan komentar anotasi dari Zod/Rollup; build tetap berhasil.

## (c) Asumsi/penyimpangan
- TAHAP N ditafsirkan sebagai Tahap 2 sesuai rincian pengguna.
- Kartu tidak melintasi batas paragraf. Maksimal dua kalimat lebih diutamakan
  daripada minimum sasaran 30 kata; kalimat pendek boleh menghasilkan kartu pendek.
- Kalimat di dalam kartu dipisahkan satu spasi; isi setiap kalimat tetap identik.
- words_per_block sekarang menghitung kartu, menggantikan paragraf pada Tahap 1.
- 120 kata/menit adalah bawaan teknis sementara, belum dikalibrasi; label menyebut
  perkiraan dan dapat diubah. Tidak ada hitung mundur atau perpindahan otomatis.
- review_status mempertahankan nilai konservatif flagged dari skema sebelumnya;
  tidak ada perubahan bahasa atau persetujuan otomatis yang dibuat pada tahap ini.
- Bacaan Nyaman menampilkan semua kartu berurutan; Fokus menampilkan satu kartu,
  tetapi kartu yang panjang dapat memerlukan gulir vertikal agar isi tidak dipotong.
- Pengaturan dan draf terikat browser/perangkat; tidak ada akun atau sinkronisasi.
- Halaman tetap satu alur dengan panel berurutan, belum tab tinjauan/pratinjau cetak
  yang bergantung tahap selanjutnya. Sumber rinci dapat dilipat agar area baca ringkas.
- Pratinjau cetak lengkap, aturan adaptasi, tinjauan bahasa dan soal belum dikerjakan.
- Docker build, uji printer dan uji pengguna/guru belum dilakukan di lingkungan ini.

## (d) Pertanyaan terbuka
Tidak ada penghalang Tahap 2. Kecepatan baca bawaan perlu dikalibrasi bersama guru
atau GPK pada uji pengguna. Tidak ada tahap berikutnya yang dikerjakan.
