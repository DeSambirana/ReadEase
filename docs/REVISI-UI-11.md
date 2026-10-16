# ReadEase — revisi tampilan editor, versi 11

Logo ReadEase unggahan pengguna dipasang pada navigasi dan halaman masuk.
Berkas PNG disalin tanpa mengubah gambar; ruang transparan ditangani oleh CSS.
Judul tab, label merek masuk dan footer memakai ReadEase. Nama folder, key
penyimpanan dan skema database tetap kompatibel dengan AksaraInklusi sebelumnya.

Editor lembar baca didesain ulang: navigasi vertikal di kiri pada desktop,
bidang dokumen putih, judul serif, jarak kerja lebih lapang, garis pembatas tipis,
tombol sederhana. Di ponsel navigasi berada di atas. Hierarki Teks, Tinjauan,
Soal, Cetak & Bagikan tetap sama agar alur tinjauan tidak hilang. Ringkasan metrik
berupa angka dan label; badge dekoratif, ikon berulang, bayangan dan panel warna
berlebihan dikurangi. Teks instruksi dipersingkat. Peringatan risiko tetap terlihat.

Berkas utama: BrandLogo.tsx, components/Navbar.tsx, AuthGate.tsx, main.tsx,
Review.tsx, editor.css, index.html, assets/readease-logo.png. Tidak mengubah
backend, akun, data murid, aturan NLP, templat PDF atau dependensi.

Verifikasi: 143 pytest lulus; build, lint, typecheck dan Ruff lulus. Browser
Chromium pada 1440 dan 360 px lulus untuk logo, pilihan avatar, form, empat langkah,
tinjauan tiga soal, PDF, berbagi ke murid, pengerjaan dan hasil guru. Tidak ada
overflow horizontal atau galat JavaScript pada alur yang diuji. Uji dilakukan
Linux; Windows dan cetak fisik tetap belum diuji. Screenshot hanya untuk QA internal.

ZIP lengkap sumber + aset; gunakan --setup untuk instalasi baru atau --build
untuk memperbarui build. Pertahankan backend/data dari instalasi sebelumnya
saat server berhenti. Database pengguna tidak dibundel.
