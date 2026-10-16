# Menjalankan satu URL

## Status bukti
- HTML, aset JavaScript, seluruh API dan PDF lulus uji pada satu origin lokal.
- Dockerfile tersedia dan skrip build/run disiapkan. **Build dan runtime Docker belum
  terbukti di lingkungan pengerjaan**: tidak ada docker, dockerd, podman atau socket daemon.
- Belum ada deployment publik. Alamat dan akun hosting belum ditentukan.

## Verifikasi Docker di mesin dengan Docker Engine aktif

Pasang dependensi pengujian Python, lalu dari root proyek:

```bash
python -m pip install -r backend/requirements-dev.txt
python scripts/verify_docker.py
```

Skrip membangun image, menjalankan container non-root di port lokal acak, memeriksa
HTML/aset/API dan mengekspor PDF untuk ketiga materi. Container uji dihentikan setelah
selesai. Image aksarainklusi:verify tetap ada untuk digunakan ulang. Skrip berhenti
jelas dengan status gagal bila Docker tidak tersedia, bukan melewatkan pengujian.

## Menjalankan container setelah verifikasi lulus

```bash
docker build -t aksarainklusi:demo .
docker run --rm --init --shm-size=256m -p 127.0.0.1:8000:8000 -v aksara-data:/app/data aksarainklusi:demo
```

Buka http://localhost:8000. Backend sekaligus menyajikan hasil build frontend.
Tidak perlu server Vite atau URL API kedua. Port internal container: 8000.
Untuk hosting, arahkan satu domain melalui HTTPS/reverse proxy ke port tersebut.
Konfigurasi kepercayaan proxy harus sesuai jaringan hosting; jangan percaya header
forwarded dari semua alamat. Pilihan hosting dan domain belum ditetapkan.

## Batas operasional MVP

- Satu worker bawaan. Batas 300 POST per menit per alamat klien yang terlihat server,
  maksimal 1.024 penghitung di memori; di-reset saat proses berhenti. Di balik proxy/NAT
  beberapa pengguna dapat berbagi kuota. Ini batas dasar, bukan perlindungan DDoS.
- Payload maksimal 1 MiB, termasuk transfer bertahap tanpa Content-Length.
- Maksimal dua render cetak bersamaan, batas waktu render 20 detik, timeout klien 30 detik.
- Batas dapat diubah di backend/app/config.py lalu jalankan export_schema.py dan build.
- Materi yang secara eksplisit dibagikan, akun, profil dan progres disimpan SQLite.
  Analisis/PDF tetap sementara. Cadangkan volume aksara-data.
  Access log Uvicorn dimatikan dalam container; hindari log body pada reverse proxy.
- Draf berada di sessionStorage per tab, dibersihkan saat keluar.
- Login memakai cookie Secure pada HTTPS. Jangan membuka layanan HTTP ini ke internet.
  Panduan akun dan keterbatasan: AKUN-GURU-MURID.md.
