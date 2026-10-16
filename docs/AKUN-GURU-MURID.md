# Ruang guru dan ruang murid — 15 Oktober 2026

## Alur demo
1. Buka aplikasi → Saya guru → Daftar guru. Gunakan email contoh dan kata sandi
   minimal 12 karakter. Ini akun aplikasi lokal, bukan akun Google/Microsoft.
2. Tambah murid → simpan nama, kelas, avatar dan preferensi. Tunggu tulisan
   “Semua perubahan tersimpan”. Pilih “Kode masuk” pada kartu → “Buat / ganti kode”.
3. Catat kode 12 karakter yang ditampilkan sekali. Kode bersifat pribadi; membuat
   kode baru membatalkan kode dan sesi lama. Menghapus profil juga menghapus akses
   dan tugasnya. Tidak ada daftar nama murid yang terbuka di halaman masuk.
4. Klik “Buat lembar baca” → tempel teks/pilih contoh → analisis → tinjau perubahan.
   Bila membuat soal, tinjau kunci. Di panel cetak, periksa murid sasaran dan judul,
   centang persetujuan lalu “Bagikan ke ruang murid”. Unduh PDF tetap terpisah.
5. Buka jendela privat/incognito (atau browser berbeda), alamat yang sama → Saya
   murid → masukkan kode. Buka bacaan, centang tiap kartu setelah dibaca, pindah
   secara manual, isi soal, lalu kirim. Tidak perlu email atau akun murid terpisah.
6. Pada jendela guru: Daftar Murid → Kode masuk & aktivitas ruang murid → Perbarui
   aktivitas. Lihat kartu dibaca, jawaban, dan jumlah isian cocok dengan kunci.
   Riwayat LKPD sebelumnya tetap untuk catatan guru/cetak; bukan otomatis bukti belajar.

## Ruang murid
Hanya materi yang secara eksplisit dibagikan gurunya. Tidak menerima catatan
pedagogis, daftar murid, email guru atau field kunci jawaban. Teks sumber tetap
tersedia karena tugas ini latihan membaca terbuka, bukan ujian tertutup.
Mode nyaman menampilkan semua kartu; fokus satu kartu. Ukuran huruf dapat diperbesar,
progres disimpan server, perkiraan waktu tanpa batas waktu. Bionic opsional mengikuti
preferensi guru, berlabel eksperimen. Dyslexie hanya bila font terpasang; alternatif Arial.
Jawaban satu kali per tugas; guru dapat membagikan tugas baru untuk latihan ulang.
Nilai adalah jumlah isian cocok persis (setelah memangkas spasi luar, peka huruf besar),
bukan penilaian medis atau ukuran pemahaman menyeluruh. Guru dapat membaca jawaban asli.

## Arsitektur dan akses
- Stack tetap React/Vite/TypeScript + FastAPI/Pydantic + Playwright.
- SQLite bawaan Python; tidak menambah dependensi atau memperbarui versinya.
- `backend/data/accounts.sqlite3` dibuat otomatis. Override lokasi: `AKSARA_DB`.
  Data akun, profil/riwayat/catatan guru, kode hashed, sesi hashed, materi yang dibagikan
  dan hasil pengerjaan tersimpan pada server. Ini menggantikan aturan stateless awal,
  sesuai permintaan eksplisit pengguna untuk login dan ruang murid.
- Analisis, recompute dan PDF tetap tidak menyimpan materi. Hanya “Bagikan” menyimpan
  materi. Tidak mencatat password, kode atau isi bacaan dalam access log.
- Password PBKDF2-SHA256 600.000 iterasi dengan salt acak per akun. Kode acak
  12 karakter alfabet 32 simbol; disimpan hash SHA256, bukan kode mentah.
- Sesi acak HttpOnly, SameSite=Strict, Secure pada HTTPS; kedaluwarsa 8 jam. Logout
  dan pergantian kode membatalkan sesi server. Semua endpoint guru memeriksa peran
  dan semua data persisten dibatasi pemiliknya. Health boleh dibuka tanpa login.
- Penolakan Origin lintas situs pada mutasi; respons API no-store. Percobaan autentikasi
  dibatasi 20 per 15 menit per IP/kategori. Payload POST/PUT/PATCH maksimal 1 MiB.
- Profil guru dimuat dari server; perubahan dikirim berurutan dengan revisi agar tab
  lama tidak menimpa data terbaru. Kegagalan simpan terlihat di bagian atas. Jika gagal,
  cadangkan melalui Riwayat sebelum reload. Jangan tutup sebelum konfirmasi tersimpan.
- Draf bacaan sessionStorage per tab, dibersihkan saat logout/pergantian akun.
  Data localStorage lama tidak dihapus atau diimpor diam-diam. Pada akun kosong:
  Kode & aktivitas → Impor data lokal versi sebelumnya, lalu konfirmasi. Hanya store
  v2 dari revisi 8 didukung tombol ini; profil dari format lain perlu diperiksa dahulu.

## Antarmuka
Kartu murid dengan potret ilustrasi clay, nama di kiri, avatar besar di kanan,
label pastel dan tombol utama lembar baca. Empat avatar lokal dipakai konsisten
pada kartu, pemilih avatar dan profil. Tidak mengambil gambar dari layanan eksternal.
Topbar gelap dan sidebar aktivitas dipertahankan. Tombol pratinjau guru diberi nama
“Pratinjau Bacaan” agar tidak disamakan dengan login murid sesungguhnya.
Tidak menampilkan ranking anak atau menganggap unduhan PDF sebagai kemajuan belajar.

## Berkas utama
`backend/app/accounts.py`, `main.py`, `limits.py`; frontend `AuthGate.tsx`,
`StudentRoom.tsx`, `AccessPanel.tsx`, `authApi.ts`, `accounts.css`, `studentStorage.ts`,
`PrintPreview.tsx`, `main.tsx`, `draft.ts`, komponen kartu/avatar/navbar; OpenAPI dan
api-types diperbarui. Dockerfile menambahkan direktori/volume data yang dimiliki user
non-root. Uji baru: test_accounts.py dan verify_accounts.py; runner lama disesuaikan.

## Batas yang belum diselesaikan
- Prototipe lokal, belum siap dinyatakan sistem sekolah produksi. Tidak ada verifikasi
  email, persetujuan sekolah untuk pendaftaran guru, reset password, pemulihan email,
  MFA, atau audit akses. Siapa pun dapat mendaftar akun guru sendiri, tetapi tidak dapat
  mengakses akun lain. Jangan gunakan data anak nyata untuk demo.
- SQLite/cadangan tidak dienkripsi pada disk. Admin komputer/server memiliki akses file.
  Hentikan server sebelum menyalin database untuk cadangan. Jangan kirim DB pribadi ke ZIP.
- Satu sesi per browser: gunakan jendela privat untuk melihat guru dan murid bersamaan.
  `localhost` pada ponsel berarti ponsel itu sendiri. Perangkat lain perlu alamat server
  yang bisa dijangkau. Sesi lintas perangkat bergantung pada server yang sama tetap hidup.
- Tidak melakukan hosting publik pada revisi ini. HTTPS, proxy terpercaya, backup, izin
  data sekolah dan kebijakan pemulihan diperlukan sebelum penggunaan nyata.
- Docker build/runtime dan Windows belum diuji di lingkungan ini. Cetak/fotokopi fisik
  serta uji kegunaan bersama guru/murid masih manual. Dokumen tahap lama historis.

## Bukti pengujian revisi ini
- `pytest -q`: 143 lulus. 133 uji NLP/PDF/kontrak yang ada mengisolasi lapisan
  pemrosesan dari login; 10 uji akun memakai autentikasi sebenarnya tanpa bypass.
- Uji akun: hash password, cookie/logout/expiry, pembatasan percobaan, Origin,
  isolasi dua guru/dua murid, rotasi kode/sesi, penghapusan, konflik revisi,
  validasi profil, tinjauan soal, kunci tidak terkirim, penilaian cocok persis,
  dan larangan pengiriman ulang.
- Build, ESLint, TypeScript typecheck, Ruff check/format lulus. Peringatan anotasi
  Zod, npm environment proxy dan deprecation Starlette/httpx bersifat nonfatal.
- Chromium desktop 1440 px dan ponsel 360 px: daftar akun → profil → kode → analisis
  IPA → tiga soal → tinjauan → PDF → bagikan → masuk murid → seluruh kartu → kirim
  → hasil guru → reload → logout. Tidak ada overflow horizontal atau galat JavaScript.
- PDF IPA, IPS, Bahasa Indonesia: masing-masing 6 halaman (5 siswa + 1 guru),
  18 kartu dan 3 soal, font tertanam, seluruh blok di dalam batas A4.
- Satu URL lokal melayani HTML/aset/health dan seluruh alur API sampai PDF dengan login.
  Server uji memakai database sementara sintetis dan dihentikan setelah pengujian.
