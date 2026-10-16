# AksaraInklusi — Pilih Bantuan Baca (berbasis Tahap 6)

Kerangka hackathon: FastAPI, React/Vite/TypeScript, dan PDF A4 Playwright.
Segmentasi, metrik, kartu baca, dua mode baca, pengaturan tampilan, contoh materi,
dan draf lokal sudah aktif.
Usulan adaptasi, pemeriksaan risiko, istilah dan tinjauan guru kini aktif.
Pemilihan kata, soal isian dari sumber, kunci persis, dan tinjauan soal kini aktif.

## Menjalankan lokal
Prasyarat Python 3.12 dan Node 24.

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements-dev.txt
python -m playwright install --with-deps chromium
cd frontend
npm ci
npm run build
cd ..
mkdir -p backend/static
cp -r frontend/dist/. backend/static/
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000
```
Buka http://localhost:8000. Pilih kartu bantuan, tempel teks, lalu tekan Sesuaikan bacaan.
Untuk pengembangan, jalankan `npm run dev` di frontend pada terminal kedua;
Vite meneruskan `/api` ke backend port 8000.

## Uji
```bash
cd backend
python -m pytest -q
python -m ruff check app tests
cd ../frontend
npm run build
npm run lint
npm run typecheck
cd ..
python scripts/smoke.py
```
Smoke test memerlukan server dengan build frontend terbaru. Menguji browser nyata
termasuk teks mirip HTML, Lihat sumber dan kegagalan API. Jalankan verify_local.py
untuk seluruh uji browser dan PDF lengkap; hasil di artifacts/tahap-5/.

## Kontrak
`backend/app/models.py` adalah sumber skema. Setelah perubahan:
```bash
PYTHONPATH=backend python scripts/export_schema.py
cd frontend
npx openapi-typescript ../docs/openapi.json -o src/api-types.ts
npm run typecheck
```
`GET /api/health` mengembalikan status dan stage 6. `/api/analyze` memecah
teks menjadi kalimat ber-ID, menghitung metrik sebelum, dan mengembalikan kartu berisi kalimat utuh beserta sumber. `is_example=false` berlaku untuk analisis ini saja.
`/api/recompute` memproses keputusan guru dan menghitung metrik sesudah.
`/api/worksheet` menghasilkan kandidat dan soal dari kalimat sumber. `/api/pdf` menghasilkan LKPD A4 lengkap dengan tepat tiga soal ditinjau. `/api/pdf/preview` menghasilkan HTML paginasi dari templat yang sama.
Konfigurasi frontend dihasilkan dari `backend/app/config.py` oleh export_schema.py.

## Perilaku analisis
- Anjuran 300–800 kata; di luarnya muncul peringatan, bukan penolakan.
- Batas keras 1.500 kata serta batas teknis 30.000 karakter. Input kosong atau hanya
  tanda baca ditolak. Pesan galat dalam bahasa Indonesia tanpa menyalin isi masukan.
- Kata adalah token dipisahkan spasi yang mengandung huruf atau angka. Angka desimal,
  singkatan dan kata berhubung dihitung satu token; tanda baca tunggal tidak dihitung.
- Paragraf dipisahkan baris kosong. Satu pergantian baris tetap di paragraf yang sama.
- Blok pada metrik sekarang berarti kartu baca; setiap kartu maksimal dua kalimat.
- Singkatan gelar Dr., Prof., Ir. dipertahankan bersama kata setelahnya. Untuk dst.,
  dll., dsb., kapital setelah titik dianggap awal kalimat baru. Konteks singkatan yang
  ambigu di luar set uji masih menjadi keterbatasan aturan; teks tidak ditulis ulang.
- Metrik menghitung rata-rata (dua desimal), jumlah kalimat dengan kata **lebih besar**
  daripada ambang (bawaan 20), serta kata per kartu. Ambang dapat diganti di UI.
- Semua teks tetap literal; escape dilakukan saat render React dan Jinja, bukan
  mengubah teks JSON menjadi entitas HTML yang mengganggu analisis.
- Tiga berkas *.segmentation.json berisi 30 kalimat acuan dan metrik masing-masing;
  fixture Tahap 0 tetap disimpan sebagai catatan historis.

## Docker
```bash
docker build -t aksarainklusi .
docker run --rm -p 8000:8000 aksarainklusi
```
Satu container menyajikan API dan build frontend. Dockerfile belum diuji build di
lingkungan pengerjaan karena Docker tidak tersedia.

## Catatan proyek
Sumber awal: konteks.md menjadi CLAUDE.md; seluruh PDF diekstrak ke docs/PRD.md.
Tiga materi contoh asli berlisensi CC0. Server tidak menyimpan atau mencatat isi teks.
Playwright dipatok 1.51.0 mengikuti versi Chromium yang berhasil dipasang pada Tahap 0.
Pembatasan laju dasar sudah tersedia. Uji cetak fisik masih harus dilakukan manusia. Pratinjau dan LKPD lengkap tersedia.

Jalankan `python scripts/verify_local.py` untuk uji browser dengan server sementara
(port 8000 harus kosong, build frontend sudah disalin ke backend/static).
Laporan UI terbaru: `docs/UI-ALUR-KARTU.md`. Status verifikasi sistem: `docs/TAHAP-6.md`. Laporan sebelumnya tetap disertakan.

## Kartu baca dan draf (Tahap 2)
- Pengelompokan mengikuti urutan sumber, maksimal dua kalimat, sasaran 30–50 kata,
  tanpa melewati batas paragraf. Kartu boleh kurang dari 30 kata; satu kalimat >50 kata
  dipertahankan utuh dan diberi tanda. Spasi antarkalimat disatukan saat tampil.
- Bacaan Nyaman menampilkan seluruh kartu. Fokus Bertahap menampilkan satu kartu,
  tombol Sebelumnya/Berikutnya dan centang manual. Centang tidak memindahkan kartu.
- Ukuran huruf, jarak huruf/kata/baris, lebar kolom dan tiga profil kontras dapat diatur.
- Perkiraan detik = ceil(jumlah kata / kata per menit * 60), minimum 1 detik.
  Bawaan 120 kata/menit adalah nilai teknis sementara yang belum dikalibrasi;
  pengguna dapat memilih 30–300. Tidak ada timer atau perpindahan otomatis.
- Kunci localStorage `aksarainklusi.draft.v2`: teks, ambang, hasil, pengaturan, mode,
  posisi dan progres. Draf tidak dikirim ulang saat halaman dimuat ulang.
- Draf divalidasi sebelum dipulihkan. Data rusak diabaikan dengan pesan; kegagalan
  penyimpanan tidak menghalangi penggunaan aplikasi dalam sesi aktif.
- Memuat contoh atau mengubah teks/ambang menghapus hasil serta progres yang lama.
  Pilihan tampilan tetap dipertahankan. Tidak ada penyimpanan teks di server.
- Tombol contoh mengambil teks CC0 dari `data/samples`, dikemas saat export_schema.py.
- Uji desktop 1280px dan ponsel 360px serta Tab/Enter/Space ada di
  `scripts/smoke_stage2.py`, dijalankan oleh `scripts/verify_local.py`.

## Adaptasi dan tinjauan (Tahap 3)
- Tiga aturan: list_to_bullets (daftar nominal terbatas), glossary_swap (dua ungkapan),
  split_independent_clauses (saran manual saja, tidak menawarkan hasil pemecahan).
- Masukkan istilah sulit/penting dipisahkan koma sebelum menekan Proses. Mengubah
  sumber, ambang atau istilah mereset hasil/tinjauan. Istilah ditandai di kartu dan
  tercantum di PDF sederhana; pratinjau cetak lengkap belum dikerjakan.
- Terima memakai usulan backend. Simpan edit memakai tulisan guru setelah diperiksa.
  Tolak mempertahankan sumber. Usulan pending tidak digunakan sebagai hasil final.
- Pemecahan klausa tidak dapat diterima otomatis; guru harus menulis edit sendiri.
- Pemeriksaan membandingkan jumlah token negasi/syarat/sebab-akibat/angka/satuan,
  istilah penting dan kata kapital calon nama. Perbedaan memblokir edit dan mengembalikan
  usulan ke pending. Ini alarm awal, bukan bukti kesetaraan makna.
- Sumber dengan negasi, syarat, sebab-akibat, angka atau satuan tidak mendapat
  transformasi otomatis; sumber tetap utuh dan diberi peringatan.
- /api/recompute menerima Workspace ditambah important_terms dan decisions
  [{proposal_id,status,edited_text}]. Proposals dibentuk ulang dari sumber;
  adapted_text pada cards dari klien diabaikan. Keputusan duplikat/tidak dikenal ditolak.
- Respons berisi proposals (manual_only), summary, decisions, important_terms,
  kartu dengan jejak sumber, metrics_before dan metrics_after. Tipe TS/OpenAPI diperbarui.
- Draf browser menyimpan keputusan dan edit yang belum dikirim. Progres baca direset
  setelah tinjauan karena susunan kartu mungkin berubah. Draf Tahap 2 dapat dibaca;
  tekan Proses untuk menghasilkan usulan dan pemeriksaan baru.
- Penomoran kartu bisa berubah setelah tinjauan; source_sentence_ids tetap mengacu
  kalimat asli. Daftar butir dihitung satu unit kalimat sumber dalam metrik.
- Kamus awal dan daftar nominal dibatasi secara teknis; belum ditinjau guru/GPK.
- Uji browser mencakup scripts/smoke_stage3.py melalui scripts/verify_local.py.

## Soal isian dan kunci (Tahap 4)
- Klik Muat pilihan kata, pilih 1–3 kemunculan kata, lalu Buat soal isian.
- Kamus kecil nomina/verba/adjektiva ada di content_words.py. Kata tidak dikenal,
  negasi, syarat, sebab-akibat, angka dan satuan tidak ditawarkan. Kategori kamus
  belum merupakan analisis kelas kata berdasarkan konteks; guru tetap meninjau.
- Satu soal mengosongkan tepat satu kemunculan pada kalimat asli, bukan hasil adaptasi.
  Huruf besar/kecil, tanda baca, angka dan kata lain tetap utuh. Tidak mengarang pertanyaan.
- Kunci adalah irisan sumber pada posisi start:end (indeks Unicode Python, bukan indeks
  UTF-16 JavaScript). Frontend mengirim posisi dari backend tanpa menghitung ulang.
- Tanpa start, pilihan API hanya diterima jika tepat satu kemunculan cocok.
  Kata/posisi palsu, pilihan duplikat, dan lebih dari 3 soal ditolak.
- Centang tinjauan berlaku per soal dan kunci; disimpan dalam draf lokal. Ganti pilihan,
  sumber, atau hasil tinjauan bahasa menghapus soal/tinjauan lama. Draf v2 lama tetap dibaca.
- /api/pdf memeriksa kecocokan soal dan kunci dengan sumber serta status reviewed.
  Pada Tahap 5, tepat tiga soal wajib; permintaan tidak sah mendapat 422.
- Uji browser Tahap 4 otomatis dijalankan lewat scripts/verify_local.py.

## Profil Cetak Kelas (Tahap 5)
- Setelah tiga soal ditinjau, isi judul lalu klik Pratinjau cetak atau Unduh PDF A4.
- Satu PDF berisi lembar siswa di depan dan halaman Khusus guru di belakang.
  Pisahkan kunci sebelum fotokopi/dibagikan. Halaman guru memuat kunci, sumber,
  daftar perubahan diterima/diedit, dan peringatan kartu.
- Satu templat backend/app/templates/print.html dan fungsi pembagi halaman dipakai
  kedua endpoint. Pratinjau iframe bersandbox menampilkan HTML halaman A4 asli
  dengan area gulir pada ponsel. Pratinjau tidak disimpan dalam localStorage.
- Kartu memakai data final yang sama dengan mode layar; usulan pending tidak dipakai.
  Kartu pending yang masih identik dengan sumber boleh dicetak. Usulan pending
  yang berbeda dari sumber ditolak. Kata awal tidak ditebalkan (Bionic mati).
- Ukuran font isi 12 pt, tinggi baris 1,65, margin sisi 17 mm; hanya hitam-putih,
  bingkai 0,5 pt, garis jawaban dengan tinggi ruang 12 mm. Pengaturan layar tidak
  mengubah profil cetak tetap ini.
- DejaVu Sans regular/bold dibundel beserta lisensi, ditanam melalui data URI.
  Chromium di lingkungan uji menyimpan subset glyph Type 3 yang tertanam.
- Pembagi halaman mengukur tinggi blok sesudah font siap, lalu memindahkan blok
  utuh. Blok lebih tinggi dari satu halaman ditolak 422 dengan arahan tinjauan ulang;
  tidak mengecilkan font atau memotong teks diam-diam.
- Server tidak menyimpan PDF/teks; respons no-store. Berkas contoh hanya ditulis oleh
  skrip uji yang memakai materi CC0. Teks Jinja di-escape, jaringan renderer diblokir.
- API tambahan POST /api/pdf/preview menerima PdfRequest dan mengembalikan text/html.
  Endpoint /api/pdf sekarang menolak ekspor kosong/satu soal dari kontrak tahap awal.
- scripts/verify_print.py memeriksa teks lengkap per kartu/soal pada halaman yang sama,
  batas geometris, A4, pemisahan guru dan embedding glyph font pada tiga contoh.
- artifacts/contoh-a4.pdf adalah artefak historis tahap awal; contoh terbaru berada
  dalam artifacts/tahap-5/. Checklist cetak nyata: docs/CHECKLIST-CETAK.md.

## Polesan dan verifikasi akhir (Tahap 6)
- Bionic Reading di Pengaturan bacaan, eksperimental, mati bawaan. Pilihan tersimpan
  dalam draf; tidak mengubah teks, kunci, sumber, atau PDF. Bukan pemenggalan suku kata.
- Seluruh POST API memakai batas payload 1 MiB dan 300 permintaan/menit per klien
  (memori proses terbatas, tanpa menyimpan teks). Render PDF maksimal dua bersamaan.
- Galat input 422, payload 413, batas laju 429, renderer sibuk/gagal 503 disampaikan
  tanpa membocorkan isi materi. Permintaan frontend dibatasi 30 detik.
- scripts/verify_local.py mencakup tiga alur GUI lengkap, Bionic, PDF, satu origin
  dan benchmark serial 300/500/800 kata. Gunakan port 8000 kosong.
- Benchmark lokal: artifacts/tahap-6/benchmark.json. Tiga percobaan per ukuran,
  termasuk startup Chromium; bukan uji beban produksi atau pengukuran kerja guru.
- scripts/verify_docker.py melakukan build, run dan alur tiga PDF di container.
  **Belum lulus di lingkungan pengerjaan karena Docker tidak tersedia.** Jangan
  menyebut deployment terverifikasi sebelum skrip ini berhasil di mesin Docker.
- docs/DEMO-6-LANGKAH.md berisi skrip demo PRD bagian 16;
  docs/DEPLOYMENT.md berisi cara verifikasi dan menjalankan satu URL.
- DoD belum penuh: tiga alur, jejak kartu dan demo penolakan sudah diuji;
  bukti cetak/fotokopi fisik belum ada. Gunakan docs/CHECKLIST-CETAK.md.

## Pembaruan antarmuka: Baca dan Ruang Guru
- Halaman awal /#baca hanya menampilkan kotak teks, contoh materi, tiga kartu preset
  dan tombol Mulai membaca. Usulan, metrik, istilah, soal dan PDF di /#guru.
- Preset Bacaan Nyaman: 22 px, jarak huruf 0,8 px, kata 3 px, baris 1,9, lebar 680 px.
- Preset Fokus Bertahap: 22 px, huruf 0,3 px, kata 1 px, baris 1,8, lebar 640 px,
  satu kartu per layar dan progres manual.
- Preset Standar: 18 px, jarak huruf/kata normal, baris 1,6, lebar 760 px.
- Angka merupakan pilihan awal desain, bukan standar medis atau jaminan manfaat.
  Semua preset berlatar putih dan Bionic mati; dapat diubah lewat Pengaturan bacaan.
- Klik preset pada hasil yang sudah ada langsung mengubah tampilan tanpa analisis ulang
  atau menghapus keputusan guru, soal, kunci dan progres. Preset ditaruh di presets.ts.
- Semua kartu / Satu per satu hanya mengubah cara navigasi tanpa mereset ukuran huruf.
  Mengubah pengaturan manual menandai preset sebagai pengaturan sendiri.
- Ruang Guru tetap menampilkan pratinjau bacaan di bawah alat tinjauan. Tidak ada akun,
  pembatasan peran, layanan baru atau perubahan API.
- Draf lama tetap dibuka sebagai pengaturan sendiri; draf baru memakai Bacaan Nyaman.
- scripts/smoke_simple_ui.py menguji halaman baru, preset, navigasi, migrasi draf dan 360px.
  Uji UI tahap sebelumnya memakai /#guru karena kontrol teknis dipindahkan ke sana.
- Panduan demo: masuk Ruang Guru sebelum tinjauan/perubahan/soal/PDF, kembali ke Baca
  untuk menunjukkan preset. Tombol Proses kini bernama Mulai membaca.
