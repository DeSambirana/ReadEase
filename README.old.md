# AksaraInklusi — ruang guru & murid (versi 12)

Versi ini memperbaiki ZIP hasil modifikasi teman, bukan membangun ulang aplikasi.
Dashboard, profil murid, latihan preferensi, adaptasi dan LKPD tetap tersedia.
Laporan UI terbaru: [docs/REVISI-UI-12.md](docs/REVISI-UI-12.md).
Panduan akun: [docs/AKUN-GURU-MURID.md](docs/AKUN-GURU-MURID.md).

ZIP ini berisi sumber dan aset lengkap; hasil build dibuat oleh `--setup` atau
`--build`. Untuk memperbarui versi 9, pertahankan `backend/data` agar akun dan tugas
tidak hilang. Hentikan server dan buat cadangan data sebelum mengganti folder.

## Windows PowerShell
Pasang Python 3.12 dan Node.js 24. Ekstrak ZIP, buka terminal pada folder yang
memuat README ini. Jangan menjalankan langsung dari dalam ZIP.

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\python scripts/run_local.py --setup
```

Skrip memasang dependensi sesuai berkas yang ada, Chromium, menjalankan npm ci,
membangun frontend, menyalinnya ke backend/static, lalu menjalankan server.
Buka **http://127.0.0.1:8000**. Hentikan dengan Ctrl+C.
Menjalankan ulang tanpa instal:

```powershell
.\.venv\Scripts\python scripts/run_local.py
```

Sesudah mengubah kode frontend:

```powershell
.\.venv\Scripts\python scripts/run_local.py --build
```

## Linux / macOS
```bash
python3 -m venv .venv
.venv/bin/python scripts/run_local.py --setup
# berikutnya:
.venv/bin/python scripts/run_local.py
```
Pada Linux, jika Chromium memerlukan pustaka sistem:
`.venv/bin/python -m playwright install --with-deps chromium`.

## Alur guru dan murid
1. Buka Saya guru → Daftar guru. Buat akun dengan password minimal 12 karakter.
2. Tambah murid, simpan, lalu Kode masuk → Buat / ganti kode. Catat kode pribadi.
3. Buat lembar baca, analisis, tinjau materi dan soal. Pilih sasaran, centang tinjauan
   lalu Bagikan ke ruang murid. Unduh PDF tersedia terpisah.
4. Buka jendela privat/incognito → Saya murid → masukkan kode → baca dan kerjakan.
5. Kembali ke guru → Kode masuk & aktivitas ruang murid → Perbarui aktivitas.
Panduan lengkap: [docs/AKUN-GURU-MURID.md](docs/AKUN-GURU-MURID.md).

## Bila PDF gagal
- Jalankan backend, bukan hanya `npm run dev`. Cek http://127.0.0.1:8000/api/health.
- Gunakan Python virtualenv yang sama untuk memasang Chromium:
  `.\.venv\Scripts\python -m playwright install chromium` (Windows).
- `--build` menyamakan frontend yang ditampilkan backend dengan sumber terbaru.
- Soal yang sudah dibuat wajib ditinjau. Bacaan tanpa soal tetap dapat dicetak.
- Kartu terlalu panjang untuk A4 ditolak, bukan dipotong. Tinjau kalimatnya dahulu.

## Data dan akun
SQLite `backend/data/accounts.sqlite3` dibuat otomatis. Akun, profil, tugas yang
sengaja dibagikan dan hasil pengerjaan tersimpan pada server ini. Jangan hapus folder
ini saat memperbarui kode. Database tidak disertakan ZIP. Hentikan server lalu salin
folder data untuk backup. Lokasi dapat diganti melalui environment `AKSARA_DB`.
Draf berada di sessionStorage tab dan dihapus saat logout; analisis/PDF tetap sementara.
Data lokal versi lama tidak dihapus. Akun kosong dapat mengimpor store v2 secara
sengaja dari panel kode murid. Data belum otomatis dipindah atau dikaitkan ke akun.
Belum tersedia verifikasi email/reset password. Gunakan data sintetis untuk demo.

## Pengujian
Dari virtualenv aktif, atau ganti `python` dengan jalur Python .venv:
```bash
cd backend
python -m pytest -q
cd ..
python -m ruff check backend/app backend/tests scripts
python -m ruff format --check backend/app backend/tests scripts
npm --prefix frontend run build
npm --prefix frontend run lint
npm --prefix frontend run typecheck
# Salin frontend/dist ke backend/static sebelum pengujian browser.
python scripts/verify_local.py
```
`verify_local.py` menjalankan regresi UI terbaru, PDF tiga materi dengan login, dan pemeriksaan
satu origin. Port 8000 dan 8017 harus kosong. Skrip smoke tahap lama disimpan sebagai
arsip, karena nama tombol/alur UI telah berubah. Uji cetak/fotokopi fisik tetap manual.

Dokumen tahap lama merupakan riwayat. Kebutuhan terkini untuk revisi ini tercantum
pada docs/AKUN-GURU-MURID.md. Versi dependensi tidak diubah.
