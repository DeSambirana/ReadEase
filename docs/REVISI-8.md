# Laporan perbaikan versi 8 — 15 Oktober 2026

Sumber: ZIP `aksarainklusi 8(1).zip` hasil modifikasi teman pengguna.
Desain, stack FastAPI/React/Vite, dan fitur yang ada dipertahankan. Tidak ada
penambahan login, database server, generative AI, atau pembaruan versi dependensi.

## Keputusan produk
- PDF bacaan tanpa soal diperbolehkan. Jika ada 1–3 soal, seluruh soal/kunci wajib
  ditinjau. Ini menggantikan syarat tiga soal wajib pada dokumen tahap lama.
- Tombol PDF cepat membuka panel cetak untuk pemeriksaan sasaran. Tidak memilih
  murid pertama atau materi contoh diam-diam, dan tidak melewati persetujuan catatan.
- Pergantian murid dengan hasil aktif meminta konfirmasi untuk mengosongkan analisis,
  soal dan tinjauan. Teks sumber dipertahankan. Ini pilihan konservatif untuk mencegah
  materi hasil konfigurasi lama dikaitkan dengan murid baru. Analisis ulang diperlukan.
- Mode fokus profil murid mengatur satu kalimat utuh per kartu, nyaman maksimal dua.
  Satu kalimat panjang tidak dipotong; tetap diberi peringatan. Angka ambang hanya
  penanda kalimat panjang. Pengaturan visual tidak mengubah font/ukuran profil cetak.
- Profil baru kosong dari penilaian; Bionic nonaktif. Tidak menyimpulkan kebutuhan
  khusus dari nama atau profil baru. Font Dyslexie hanya lokal, alternatif Arial.
- Latihan kenyamanan memakai pilihan subjektif dan jawaban pada teks latihan, bukan
  diagnosis atau bukti manfaat klinis. Perpindahan gaya/soal manual. Waktu yang dicatat
  adalah durasi berlalu tanpa batas waktu dan tidak menghasilkan rekomendasi diagnosis.

## Perubahan kode
- Backend `pdf.py`: kembalikan penolakan teks berubah yang belum diterima/diedit guru;
  pertahankan validasi soal sumber dan pemisahan halaman guru. Templat cetak: nama
  panjang dapat membungkus, catatan tanpa latar warna. API penerima tetap kompatibel.
- `models.py`, `cards.py`, `analysis.py`, `review.py`: batas 1–2 kalimat per kartu di
  analisis dan hitung ulang, berikut OpenAPI dan tipe frontend yang diselaraskan.
- `PrintPreview.tsx`, `pdfDownload.ts`: satu panel cetak, pemeriksaan respons PDF,
  galat server yang jelas, invalidasi pratinjau untuk sasaran/catatan/judul/data,
  catatan cetak eksplisit terpisah dari observasi profil, sasaran umum aman.
- `main.tsx`, `draft.ts`, `AdaptivePreviewCards.tsx`: penerapan preferensi konsisten,
  pengosongan hasil saat berganti sasaran, ekspor tidak menaikkan progres atau skor.
- `studentStorage.ts`: validasi Zod, store v2 tunggal untuk write atomik, UUID,
  migrasi tanpa menghapus sumber v1, blokir data rusak dan stale write antar-tab,
  kegagalan kuota terlihat. Profil/log/catatan sesi disimpan bersama secara atomik.
- `StudentModal.tsx`, `ReadingHistoryModal.tsx`, `LogProgressEditor.tsx`: nilai nullable,
  nol sah, catatan dan status hasil guru tersimpan sesudah reload; angka penyelesaian
  dipisahkan dari nilai jawaban. Ekspor backup juga menyertakan catatan cepat.
- `StudentSidebar.tsx`: aktivitas berdasarkan waktu, bukan ranking; jumlah aktif
  berasal dari sesi tujuh hari terakhir. Sesi selesai dikonfirmasi guru, bukan skor otomatis.
- `ReadingComfortTest.tsx`: navigasi manual, klaim diperbaiki, metrik rata-rata diambil
  dari teks latihan, pencatatan hasil tidak menaikkan progres secara arbitrer.
- `Navbar.tsx`, `StudentGrid.tsx`, `StudentCard.tsx`, `useModalAccessibility.ts`, CSS:
  profil guru tidak lagi memakai identitas contoh, empty state jelas, modal Escape
  dan fokus keyboard, navigasi serta panel responsif 360 px, tidak mengambil Google Fonts.
- `scripts/run_local.py`: pemasangan Chromium pada Python yang sama, build/salin
  frontend, periksa browser dan port, server satu URL lokal. Perintah Windows/Linux/macOS
  di README. `--setup` untuk instal, `--build` untuk memperbarui build, tanpa opsi untuk ulang.
- `verify_local.py`: memakai regresi UI versi ini, pemeriksaan PDF tiga materi dan
  satu origin. Skrip UI tahap terdahulu dipertahankan sebagai arsip.

## Hasil verifikasi
- Backend: 133 pytest lulus. Delapan kasus baru meliputi konfigurasi kartu, penolakan
  perubahan bahasa belum ditinjau, PDF tanpa soal, identitas, HTML escape dan catatan guru.
- Build, ESLint, TypeScript typecheck lulus dengan dependensi dari npm ci / lockfile asli.
- Ruff check dan format check lulus (44 berkas Python).
- Regresi browser desktop 1440 px dan ponsel 360 px lulus: profil kosong/tambah,
  fokus satu kalimat, PDF nama/umum, privasi observasi, invalidasi pratinjau, tiga soal
  dan gerbang tinjauan, nilai 0/reload, modal keyboard, latihan kenyamanan manual,
  penghapusan profil/log/catatan tanpa data contoh muncul kembali, data rusak/kuota.
- PDF IPA, IPS, Bahasa Indonesia: enam halaman per materi (lima siswa, satu guru),
  18 kartu dan tiga soal; seluruh blok dalam batas halaman dan font tertanam.
- Satu origin menyajikan HTML, aset, health dan API sampai PDF.
- Peringatan anotasi Zod saat build dan deprecation Starlette/httpx nonfatal tetap ada;
  versi dependensi tidak diubah untuk menutup peringatan tersebut.

## Data lama dan batasan
- Kunci v1 tidak dihapus. Log berstatus printed lama dibaca sebagai 0 soal dikerjakan
  dan nilai null; skor ekspor lama bukan bukti belajar. Nilai completed lama dipertahankan
  karena tidak dapat dibedakan otomatis antara demo dan catatan asli. Tampil peringatan
  bahwa data lama belum diverifikasi, termasuk setelah migrasi tersimpan.
- Arsip contoh awal disimpan sebagai teks referensi di data/demo-students-reference.ts.txt;
  tidak diimpor aplikasi. Tidak menghapus data pengguna secara diam-diam.
- localStorage tidak terenkripsi, tidak menyediakan akun, dan tidak sinkron perangkat.
  Pencegahan stale write bukan transaksi multi-tab penuh; gunakan satu tab penyuntingan.
  Draf bacaan masih memakai mekanisme terpisah versi sebelumnya.
- Belum ada UI pemulihan cadangan JSON, login, pemisahan akses multi-guru, atau sinkronisasi.
  Jangan menganggap ini sistem produksi multi-pengguna.
- Pengujian dilakukan pada Linux/Chromium; panduan Windows disediakan tetapi belum
  dieksekusi pada komputer Windows pengguna. Docker dan deployment publik tidak diuji
  pada revisi ini. Cetak/fotokopi fisik dan uji bersama guru/murid tetap manual.
