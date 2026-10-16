# konteks.md — AksaraInklusi

Konteks proyek untuk AI builder. Baca berkas ini dan `docs/PRD.md` sebelum mengerjakan apa pun. Jika keduanya bertentangan dengan permintaan di chat, tanyakan dulu.

## Ringkasan

AksaraInklusi adalah aplikasi web tanpa akun untuk guru: tempel teks bacaan (300–800 kata) → analisis struktur → usulan adaptasi → tinjauan guru → kartu baca di layar dan PDF A4 hitam-putih (lembar siswa + kunci guru). Konteks: hackathon 72 jam. Prioritas utama adalah **satu alur ujung ke ujung yang selesai dan dapat diperiksa**, bukan banyak fitur.

Sumber kebenaran kebutuhan: `docs/PRD.md` (ID FR-01 s.d. FR-24, G1–G5, aturan di bagian 9).

## Stack

- Frontend: React + Vite + TypeScript, CSS/Tailwind. Folder `frontend/`.
- Backend: Python 3.11+, FastAPI + Pydantic. Folder `backend/`.
- NLP: tokenisasi dan aturan konservatif buatan sendiri + kamus kecil terkurasi. Stanza **opsional**, hanya setelah lolos uji awal pada materi uji.
- PDF: Playwright (Chromium) merender HTML/CSS cetak lewat `page.pdf()`.
- Deployment: satu container; backend juga menyajikan aset frontend hasil build.
- Server **stateless**: tidak ada database, tidak ada akun. Draf disimpan di browser (localStorage) saja.

## Struktur folder

```
aksarainklusi/
├── CLAUDE.md
├── docs/PRD.md
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI, endpoint
│   │   ├── models.py        # skema Pydantic (Sentence, Card, Exercise, Metrics)
│   │   ├── segmenter.py     # paragraf dan kalimat
│   │   ├── metrics.py       # metrik struktur
│   │   ├── rules/           # satu berkas per aturan adaptasi
│   │   ├── risk.py          # pemeriksaan risiko
│   │   ├── worksheet.py     # soal isian dan kunci
│   │   ├── pdf.py           # render PDF
│   │   └── templates/       # HTML/CSS cetak (satu templat untuk pratinjau dan PDF)
│   └── tests/
├── frontend/src/
├── data/samples/            # materi uji + hasil ideal (JSON/teks)
└── Dockerfile
```

## Perintah

```
# backend
cd backend && pip install -r requirements.txt
playwright install chromium
uvicorn app.main:app --reload
pytest -q

# frontend
cd frontend && npm install
npm run dev
npm run build
npm run lint && npm run typecheck
```

Jalankan `pytest` dan lint/typecheck sebelum menyatakan satu tugas selesai.

## Endpoint (stateless)

| Endpoint | Fungsi |
| --- | --- |
| POST /api/analyze | Teks → kalimat, metrik sebelum, kartu, usulan, peringatan |
| POST /api/recompute | Hasil tinjauan guru → kartu final, metrik sesudah |
| POST /api/worksheet | Kata kunci pilihan guru → soal isian + kunci |
| POST /api/pdf | Struktur data final → PDF A4 (lembar siswa + kunci guru) |

Skema request/response didefinisikan di `models.py` dan dipakai bersama oleh frontend (tipe TypeScript yang selaras). Jangan mengubah skema tanpa memperbarui kedua sisi dan uji.

## Aturan keras (jangan dilanggar)

1. **Jangan klaim tingkat kelas.** Tampilkan hanya metrik struktur: rata-rata kata per kalimat, jumlah kalimat di atas ambang (bawaan 20 kata, dapat diubah), kata per blok. Selalu beri label "Indikator struktur teks; bukan penentuan tingkat kelas."
2. **Jangan klaim "bebas halusinasi", "makna pasti sama", atau manfaat medis untuk disleksia/ADHD** di UI, README, maupun komentar.
3. **Jangan hapus stopword dan jangan stemming** (mis. Sastrawi) pada teks yang dibaca siswa. Kata seperti "tidak", "jika", "karena" membawa makna.
4. **Jangan menyebut penebalan huruf awal sebagai pemenggalan suku kata.** Bionic Reading hanya opsi eksperimen, mati secara bawaan, tidak aktif di PDF bawaan.
5. **Konservatif:** bila ragu, pertahankan kalimat asli dan tandai "Kalimat ini perlu ditinjau guru". Jangan memecah setiap "dan", "karena", atau "yang".
6. **Perubahan bahasa selalu berupa usulan** berstatus pending sampai guru menerima, mengedit, atau menolak. Adaptasi tampilan (membagi kalimat utuh ke kartu) tidak mengubah isi kalimat.
7. **Setiap kartu menyimpan `source_sentence_ids`, `rule_id`, `review_status`, `warnings`.** Fitur "Lihat sumber" wajib bekerja.
8. **Pemeriksaan risiko** mencakup negasi (tidak, bukan, belum, tak, tanpa, jangan), syarat (jika, apabila, bila, kecuali), sebab-akibat (karena, sebab, sehingga), angka, satuan, dan istilah penting. Perubahan yang memengaruhi kategori ini diblokir atau diberi peringatan. Ini alarm awal, bukan bukti kesetaraan makna.
9. **Tanpa hitung mundur dan tanpa perpindahan kartu otomatis.** Estimasi waktu baca hanya perkiraan.
10. **Privasi:** jangan simpan atau catat (log) isi teks guru di server. Log teknis tanpa isi teks.
11. **Escape semua teks input** sebelum dirender HTML (pratinjau maupun PDF).
12. **Satu struktur data, satu templat:** kartu layar dan PDF dirender dari data yang sama; PDF memakai templat HTML/CSS yang sama dengan pratinjau cetak.
13. **Jangan melatih model**, jangan memanggil LLM/AI generatif untuk mengarang atau mengubah isi.
14. **Jangan menambah fitur di luar lingkup MVP** (OCR, impor buku, akun, chatbot, analitik siswa, pemenggalan suku kata otomatis, penentuan tingkat kelas). Bila terasa perlu, tanyakan dulu.

## Aturan adaptasi bahasa (maksimal 3 untuk MVP)

- `split_independent_clauses`: dua klausa mandiri bersubjek sendiri dihubungkan "dan/serta/namun". Ditolak jika ada negasi, syarat, angka, atau satuan lintas klausa, atau subjek tidak jelas. Jika deteksi subjek tidak andal, turunkan menjadi saran manual yang ditandai.
- `list_to_bullets`: kalimat enumerasi ("meliputi A, B, dan C") → pengantar + butir. Ditolak jika ada klausa bersarang.
- `glossary_swap`: penggantian ungkapan dari kamus kecil terkurasi. Ditolak jika pasangan tidak ada di kamus atau istilah termasuk daftar istilah penting.

Setiap aturan wajib punya uji unit: kasus yang diterima **dan** kasus yang ditolak.

## Konvensi kode

- Python: type hints penuh, fungsi kecil dan murni untuk logika NLP (mudah diuji), Pydantic untuk semua batas I/O.
- TypeScript: `strict`, tanpa `any`; komponen kecil; state draf di satu tempat.
- Teks antarmuka dan pesan galat dalam bahasa Indonesia; identifier kode dalam bahasa Inggris.
- Konfigurasi dapat diubah (ambang 20 kata, kecepatan baca) ditaruh di satu berkas konfigurasi, bukan angka ajaib tersebar.
- Komentar menjelaskan *kenapa*, bukan *apa*.

## Pengujian

- Unit: segmentasi (singkatan dst., dll., Dr., angka desimal), metrik, tiap aturan adaptasi (terima/tolak), pemeriksaan risiko, pembuatan soal isian.
- Set uji di `data/samples/`: 3–5 materi (IPA, IPS, Bahasa Indonesia) berlisensi aman, masing-masing dengan hasil ideal dan kasus sulit (kalimat bersyarat, bernegasi, berangka).
- Integrasi: alur `analyze → recompute → worksheet → pdf` pada tiap materi contoh tanpa galat.
- PDF: tidak ada kartu atau soal terpotong antarhalaman; font tertanam.

## Cara bekerja

- Kerjakan **satu tahap per sesi** sesuai `PROMPT_BUILDER.md`. Jangan membangun semuanya sekaligus.
- Utamakan alur tipis ujung ke ujung dulu, perdalam NLP sesudahnya.
- Setelah tiap tahap: jalankan uji, lalu laporkan (a) apa yang selesai, (b) uji yang lulus, (c) keputusan atau penyimpangan dari PRD, (d) pertanyaan terbuka. Jangan menyatakan selesai bila ada uji gagal.
- Bila PRD ambigu, pilih opsi paling konservatif dan catat asumsinya di laporan.
- Gerbang jam ke-24: bila aturan adaptasi atau parser belum stabil, prioritaskan segmentasi, transparansi, dan tinjauan manual.

## Pembaruan alur yang disetujui pengguna (14 Oktober 2026)
Halaman awal memilih Disleksia, Fokus / ADHD, atau Bacaan Standar; berikutnya
halaman tempel teks, lalu hasil. Ruang Guru terpisah. Ini menggantikan penamaan
kartu pada PRD bagian 12 sesuai instruksi pengguna, tanpa mengubah aturan keras.
Font Dyslexie tidak dibundel: gunakan font lokal jika dapat dimuat, dengan alternatif
Arial dan status yang jujur. Jangan mengklaim font tersedia bila gagal dimuat.

## Revisi versi teman yang diotorisasi pengguna (15 Oktober 2026)
Pengguna meminta perbaikan hasil audit pada ZIP versi 8. Profil/riwayat/catatan lokal
serta latihan preferensi yang sudah ada dipertahankan, dengan pengecualian terbatas
terhadap cakupan awal MVP. Tidak menambah diagnosis, login atau database server.
PDF tanpa soal atau 1–3 soal ditinjau diperbolehkan. Progres tidak diturunkan dari
unduhan PDF. Aturan perubahan bahasa, sumber, privasi dan tinjauan tetap berlaku.
Kebutuhan dan keputusan revisi: docs/REVISI-8.md; dokumen tahap lama bersifat historis.

## Perubahan yang diotorisasi pengguna: login guru dan ruang murid (15 Oktober 2026)
Permintaan terbaru menggantikan larangan akun/database secara terbatas. Gunakan
SQLite lokal untuk akun guru, profil, kode murid, tugas yang sengaja dibagikan dan
progres. Guru masuk dengan password, murid dengan kode acak pribadi. Data/akses harus
terisolasi per pemilik di backend; kunci dan catatan guru tidak masuk DTO siswa.
Analisis/PDF tidak menyimpan materi; penyimpanan tugas hanya lewat aksi Bagikan.
Jangan melakukan deployment publik. Detail: docs/AKUN-GURU-MURID.md. Aturan NLP,
tinjauan, keterbacaan, privasi log, estimasi waktu dan PDF tetap berlaku.
