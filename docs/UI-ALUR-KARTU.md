# Pembaruan: pilih bantuan → tempel teks → baca hasil

## Selesai
- Awal website hanya menampilkan tiga kartu tombol: Disleksia, Fokus / ADHD,
  Bacaan Standar. Tidak ada form atau alat guru di halaman pilihan.
- Pilihan membuka form terpisah dengan preset otomatis; Sesuaikan bacaan membuka
  hasil. Pengaturan ukuran, jarak, kontras, font dan mode masih bisa diubah.
- Navigasi hash: #pilih, #teks, #baca, #guru. #baca tanpa hasil membuka form.
  Tombol kembali browser bekerja; pergantian halaman memindahkan fokus ke judul.
- Draf v2 dipertahankan; readingProfile dan fontFamily ditambahkan dengan default
  untuk draf lama. Memilih preset mempertahankan teks, hasil dan keputusan guru.
- Font layar: Arial/sans-serif, Georgia/serif, Dyslexie lokal dengan alternatif Arial.
  Status font diperiksa lewat document.fonts.load; kegagalan ditampilkan secara jujur.
- Ruang Guru, analisis, sumber, peringatan, soal dan PDF tetap tersedia.

## Berkas yang berubah
- frontend/src/main.tsx: tiga halaman pembaca dan navigasi guru.
- PresetCards.tsx, presets.ts, style.css: kartu awal, preset dan tampilan responsif.
- draft.ts: migrasi kompatibel untuk profil pilihan dan jenis huruf.
- Reader.tsx, fonts.ts: pilihan font dan pemeriksaan Dyslexie lokal.
- scripts/smoke_simple_ui.py, verify_local.py: regresi alur baru dalam runner lengkap.
- CLAUDE.md, PRD.md, README.md, DEMO-6-LANGKAH.md: catatan keputusan dan alur baru.
- backend/static: build frontend baru. Backend dan kontrak API tidak berubah.

## Hasil pengujian 14 Oktober 2026
- pytest -q dari backend: 126 lulus.
- Ruff check serta format check backend/app, backend/tests dan scripts: lulus.
- npm run build, npm run lint, npm run typecheck: lulus.
- verify_local.py: lulus seluruh smoke Tahap 0–6 dan smoke alur kartu baru.
- Alur kartu diuji pada 1280 dan 360 px: keyboard, font alternatif, isi tetap,
  HTML literal, pemulihan draf lama/baru, navigasi guru, batas input dan galat jaringan.
- Tiga contoh lulus GUI sampai PDF, A4, font tertanam dan blok tidak terpotong.
- Satu origin lokal dan benchmark 300/500/800 kata lulus; data pengukuran terbaru
  ada di artifacts/tahap-6/benchmark.json. Tampilan awal/hasil diperiksa visual.
- Peringatan Starlette/httpx dan anotasi build Zod tidak menggagalkan uji.
- Instalasi browser sempat mencoba ulang mirror unduhan; berhasil. Uji PDF sempat
  berjalan sebelum Chromium selesai terpasang; setelah pemasangan, seluruh uji lulus.

## Asumsi dan penyimpangan yang disetujui
Label kartu memakai Disleksia dan ADHD atas arahan eksplisit pengguna; ketentuan
penamaan lama PRD bagian 12 diperbarui. Ini pilihan bantuan, bukan diagnosis atau
jaminan manfaat. Tidak ada penulisan ulang otomatis atau fitur Makna Jelas baru.

Dyslexie tidak dibundel atau diunduh aplikasi. Untuk mencobanya, pasang font dari
penyedia sesuai lisensinya, lalu muat ulang browser. Beberapa browser dapat membatasi
font lokal; bila tidak dapat dimuat, gunakan pilihan Arial/Georgia. Keberhasilan
memakai font Dyslexie asli belum diuji karena berkas berlisensi tidak tersedia di
lingkungan ini. Jalur alternatif Arial sudah diuji. Untuk menyediakannya bagi semua
pengunjung diperlukan lisensi webfont yang sesuai dan berkas font resmi.

PDF tetap memakai profil kelas DejaVu Sans yang tertanam. Font lokal pengguna tidak
tersedia di server dan tidak dikirim. Tidak ada perubahan versi dependensi atau stack.

## Pekerjaan yang masih memerlukan manusia
- Pastikan izin Dyslexie untuk distribusi web/PDF sebelum membundelnya.
- Docker, deployment publik, uji siswa/guru dan cetak/fotokopi nyata belum diverifikasi
  pada sesi ini. Status tersebut tidak dianggap selesai oleh perubahan antarmuka.
