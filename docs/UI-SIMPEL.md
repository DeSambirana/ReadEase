# Pembaruan UI — preset dan Ruang Guru

## Yang dibuat
Halaman awal didahulukan untuk pembaca: tempel teks, pilih satu dari tiga kartu,
lalu Mulai membaca. Bacaan Nyaman, Fokus Bertahap, dan Standar memakai pengaturan
terpusat di presets.ts. Tombol navigasi Ruang Guru memisahkan istilah/ambang,
metrik, tinjauan bahasa, soal dan PDF dari halaman awal. Semua fitur lama tetap tersedia.

Navigasi memakai hash /#baca dan /#guru, tanpa dependensi/router baru. Teks, pilihan
preset, hasil dan edit guru tetap dalam satu state draf. Pergantian preset tidak
memanggil NLP atau menerima perubahan bahasa secara otomatis. Pratinjau HTML cetak
dibuat ulang bila kembali ke komponen cetak; hasil soal tetap tersimpan.

## Pengujian
- 126 uji backend lulus.
- Build, ESLint, typecheck frontend lulus.
- Ruff check dan format check lulus dari root proyek.
- Smoke UI Tahap 0–6 lulus pada navigasi Ruang Guru yang baru, termasuk PDF.
- Smoke baru: halaman awal bersih, radio preset lewat keyboard, perubahan ukuran
  langsung, isi tetap sama, fokus/progres, guru menerima perubahan, hasil terbawa
  ke halaman Baca, reload dan draf lama tetap terbaca.
- Desktop 1280 px dan lebar 360 px diuji tanpa horizontal overflow dan diperiksa visual.
- Setelah penamaan ulang navigasi kartu, smoke Tahap 2 dan UI simpel diulang dan lulus.

## Asumsi/penyimpangan
Sesuai PRD bagian 12, nama preset berdasarkan kebutuhan, bukan Mode Disleksia/ADHD.
Ukuran/jarak hanya pilihan awal desain yang masih bisa diubah, bukan rekomendasi klinis.
Pemisahan Baca/Ruang Guru menggantikan panel guru di halaman awal atas permintaan pengguna.
Standar adalah kombinasi pengaturan yang sudah ada. Bionic tetap opsional dan mati bawaan.
Mode layar tidak mengubah profil PDF. Backend, aturan NLP dan templat PDF tidak diubah.

## Yang belum berubah statusnya
Docker dan deployment publik belum terverifikasi. Cetak/fotokopi fisik serta uji guru
belum dilakukan. Pembaruan UI ini tidak berarti seluruh Definition of Done sudah terpenuhi.
Tidak ada pertanyaan yang menghalangi penggunaan lokal UI baru.
