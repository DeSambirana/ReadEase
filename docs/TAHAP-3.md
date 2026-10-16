# Laporan Tahap 3 — Adaptasi, risiko, sumber dan tinjauan

## (a) Selesai
- Tiga aturan dengan uji kandidat diterima dan ditolak: glossary_swap,
  list_to_bullets, split_independent_clauses (saran manual).
- Usulan berstatus pending; kartu awal tetap memakai sumber. Terima, edit dan tolak
  diproses server. Penolakan atau pending memakai kalimat sumber.
- Pemeriksaan negasi, syarat, sebab-akibat, angka, satuan, istilah penting dan calon
  nama diri. Perubahan token/jumlah kemunculan memblokir edit dan mempertahankan sumber.
- /api/recompute membangun ulang usulan dari sumber, memeriksa keputusan,
  membentuk kartu dengan pemetaan ke sumber dan menghitung metrik sesudah.
- Guru memasukkan daftar istilah; istilah ditandai di layar dan dicantumkan di PDF.
- Ringkasan pending/diterima/diedit/ditolak/kalimat dibiarkan; metrik sesudah ditampilkan.
- Semua kartu menyimpan source_sentence_ids, rule_id (nullable), review_status,
  warnings (boleh kosong); Lihat sumber menampilkan sumber, aturan, status dan peringatan.
- Keputusan dan isi editor tersimpan dalam draf lokal. Progres baca direset setelah
  tinjauan karena susunan kartu bisa berubah.

## (b) Verifikasi
- pytest -q: 81 passed; satu peringatan deprecation TestClient/HTTPX.
- Ruff app/tests/scripts: lulus; build, lint dan typecheck frontend: lulus.
- Browser desktop 1280px dan 360px: terima, edit, tolak, blokir tambahan negasi,
  istilah, hasil daftar butir, sumber, ringkasan, metrik, pemulihan tinjauan dari draf.
- Pemecahan manual: tombol Terima nonaktif; API menolak accepted; setelah guru
  mengedit dua kalimat, metrik sesudah dan jejak sumber benar.
- Regresi Tahap 0–2: input, metrik, tampilan, draf, papan ketik dan PDF lulus.
- Kontrak tiga materi memeriksa sumber lengkap pada setiap kartu hasil recompute.
- Kegagalan PDF awal terjadi saat Chromium masih dipasang; uji diulang setelah
  pemasangan selesai dan lulus. Tidak ada uji gagal yang disisakan.

## (c) Keputusan gerbang dan batasan
- split_independent_clauses diturunkan menjadi SARAN MANUAL sejak tahap ini.
  Tidak ada parser teruji untuk memastikan subjek dua klausa; heuristik penghubung
  hanya mencari kandidat. Kandidat yang ambigu tidak menghasilkan pemecahan otomatis.
  Ini keputusan keandalan, bukan klaim bahwa 24 jam aktual sudah berlalu.
- Dua aturan lain konservatif: glossary dua pasangan (memperoleh → mendapatkan,
  beraneka ragam → beragam); enumerasi hanya daftar nominal dalam whitelist.
  Kosakata di luar daftar dan klausa bersarang ditolak. Kurasi pedagogis masih terbuka.
- Sumber bernegasi/bersyarat/berangka/bersatuan/bersebab-akibat tidak diubah oleh
  aturan. Semuanya diberi tanda. Istilah penting tidak boleh hilang atau berganti.
- Pemeriksaan berbasis token dan jumlah kemunculan. Belum memahami hubungan angka
  dengan objek, urutan sebab-akibat, atau makna menyeluruh. Nama dikenali lewat kapital
  secara konservatif, sehingga dapat menolak edit yang sebenarnya wajar.
- Usulan hanya satu per kalimat, urutan prioritas: daftar, kamus, saran pemecahan.
- Usulan manual tetap memerlukan edit eksplisit; edit guru tetap diperiksa risikonya.
- Nilai summary menghitung usulan; unchanged_sentences menghitung sumber yang
  teksnya masih sama. Satu kalimat sumber bisa menghasilkan beberapa kartu.
- Penandaan istilah dilakukan lewat daftar dipisahkan koma, bukan seleksi teks mouse.
  Mengubah daftar menghapus tinjauan dan memerlukan Proses ulang agar usulan tidak usang.
- Sumber dikirim ulang klien karena server stateless; tidak ada verifikasi asal buku.
  Server tidak mempercayai kartu/usulan hasil kiriman sebagai hasil final.
- rule_id null berarti tidak ada aturan bahasa yang diterapkan; warnings kosong
  berarti tidak ada alarm token, bukan jaminan kesetaraan makna.
- Daftar butir tetap satu unit kalimat sumber untuk penghitungan metrik.
- Soal/LKPD lengkap, pratinjau cetak lengkap dan fitur tahap berikutnya belum dibuat.
- Docker build, printer, serta uji guru/siswa belum dijalankan di lingkungan ini.

## (d) Pertanyaan terbuka
Tidak ada penghalang tahap ini. Perlu validasi guru/GPK terhadap pasangan kamus dan
whitelist nominal, serta korpus beranotasi sebelum mengaktifkan pemecahan otomatis.
