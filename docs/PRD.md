> Pembaruan yang disetujui pengguna 15 Oktober 2026: akun guru, kode akses murid,
> ruang murid dan penyimpanan tugas SQLite. Cakupan serta pengecualian stateless/MVP
> dijelaskan di AKUN-GURU-MURID.md. Aturan NLP dan tinjauan tetap berlaku.

> Revisi 15 Oktober 2026 yang disetujui pengguna: perbaikan versi 8 hasil teman.
> PDF bacaan tanpa soal / 1–3 soal ditinjau, profil lokal, pencatatan hasil nyata,
> dan latihan preferensi tanpa diagnosis. Rincian: REVISI-8.md. Ketentuan lama
> yang berbeda digantikan terbatas pada keputusan dalam laporan tersebut.

> Pembaruan UX atas permintaan pengguna, 14 Oktober 2026: alur awal sekarang
> pilih kartu Disleksia / Fokus-ADHD / Bacaan Standar → tempel teks → hasil.
> Ketentuan penamaan dan tata letak lama di bagian 12 digantikan untuk alur ini.
> Preset dapat disesuaikan, tidak menentukan diagnosis/manfaat klinis. Ruang Guru
> terpisah. Aturan perubahan bahasa, sumber, risiko, soal dan PDF tetap berlaku.
> Dyslexie hanya melalui font lokal bila tersedia; tidak didistribusikan dalam proyek.

PRD AksaraInklusi




  PRD — AksaraInklusi
    Oct 13, 2026    · ​@Gede Celagi Sambirana


  1. Ringkasan Produk
  AksaraInklusi adalah aplikasi web yang membantu guru mengubah teks bacaan padat
  menjadi bacaan bertahap dan lembar kerja cetak, dengan setiap perubahan dapat ditinjau
  guru sebelum dipakai.


     Item                    Keterangan

     Nama produk             AksaraInklusi

     Jenis                   Aplikasi web tanpa akun: tempel teks → adaptasi →
                             tinjau → baca/cetak

     Konteks                 Hackathon 72 jam (juri Ilmu Komputer UGM)

     Pengguna utama          Guru kelas dan guru pendamping khusus (GPK) di
                             SD/SMP

     Penerima manfaat        Siswa yang kesulitan membaca, termasuk siswa
                             disleksia dan ADHD

     Status dokumen          Versi 1.0, draf MVP


  Visi: satu materi, beberapa cara mengaksesnya, dengan guru tetap memegang kendali.

  Posisi produk: alat adaptasi bacaan yang transparan, bisa ditinjau guru, dan benar-benar
  menghasilkan lembar kerja siap cetak. AksaraInklusi tidak mendiagnosis siswa dan tidak
  mengklaim terbukti meningkatkan kemampuan membaca. MVP menyediakan pengaturan
  akses baca; efektivitasnya pada siswa sasaran masih perlu diuji.


  2. Masalah dan Peluang
  Guru menerima materi yang sama untuk seluruh kelas, tetapi tidak punya waktu dan alat
  untuk menyiapkan versi yang lebih mudah dibaca siswa dengan kebutuhan berbeda.




                                                                                     Page 1 of 21
PRD AksaraInklusi




     Masalah                              Dampak                         Respons produk

     Paragraf panjang, huruf rapat,       Siswa disleksia cepat lelah    Teks dipecah menjadi kartu
     kalimat majemuk berbelit             mengeja; siswa ADHD            pendek; kalimat panjang
                                          kehilangan fokus               ditandai

     Guru tidak sempat mendesain          Siswa dengan kebutuhan         Alur semi-otomatis: hasil
     ulang materi secara manual           khusus tetap memakai           usulan dalam hitungan
                                          materi standar                 menit, guru hanya meninjau

     Banyak kelas tanpa komputer          Aplikasi murni digital tidak   Keluaran PDF A4 hitam-
     atau melarang ponsel                 bisa dipakai                   putih yang tetap terbaca
                                                                         setelah difotokopi

     Penyederhanaan otomatis              Siswa menerima informasi       Jejak sumber per kartu,
     dapat mengubah makna                 keliru                         pemeriksaan risiko, dan
     (syarat, negasi, sebab-akibat)                                      persetujuan guru


  Peluang: banyak alat hanya mengganti tampilan (font, warna). AksaraInklusi berbeda
  karena menggabungkan analisis struktur teks, adaptasi konservatif yang dapat diaudit,
  dan lembar kerja cetak yang langsung bisa dipakai.


  3. Tujuan, Non-Tujuan, dan Prinsip Produk
  MVP dianggap berhasil jika satu alur utuh berjalan, hasilnya bisa diperiksa, dan keluaran
  cetaknya layak dipakai di kelas.


  Tujuan

     ID         Tujuan                                 Cara mengukur

     G1         Mengurangi waktu persiapan guru        Bandingkan waktu manual vs memakai
                                                       aplikasi pada materi sebanding (hipotesis
                                                       awal: lebih cepat; angka ditentukan dari uji,
                                                       bukan diasumsikan)

     G2         Setiap perubahan dapat ditelusuri      100% kartu hasil memiliki tautan ke kalimat
                                                       sumber dan aturan yang dipakai




                                                                                                   Page 2 of 21
PRD AksaraInklusi




     ID         Tujuan                                 Cara mengukur

     G3         Perubahan berisiko tidak lolos diam-   100% kalimat dengan negasi, syarat, angka,
                diam                                   atau satuan diperiksa dan ditandai bila
                                                       berubah

     G4         PDF layak pakai di kelas               Lolos uji cetak dan fotokopi nyata: tidak ada
                                                       teks terpotong, ruang jawaban cukup, terbaca

     G5         Alur demo selesai ujung ke ujung       Tempel teks → tinjau → kartu → unduh PDF
                                                       tanpa galat pada materi uji



  Non-tujuan
       Tidak menentukan tingkat kelas (mis. "kelas 10 menjadi kelas 4"); yang ditampilkan
       adalah indikator struktur teks.
       Tidak mendiagnosis disleksia atau ADHD, dan tidak mengklaim efektivitas klinis.
       Tidak menjamin kesetaraan makna secara otomatis; guru yang memutuskan.
       Tidak membuat akun, basis data siswa, dasbor sekolah, atau analitik siswa.
       Tidak mendukung OCR, impor buku penuh, atau katalog bab buku pada MVP.
       Tidak melatih model sendiri dan tidak memakai AI generatif untuk mengarang isi.


  Prinsip produk
   1. Konservatif: bila ragu, pertahankan kalimat asli dan tandai untuk ditinjau.
   2. Transparan: setiap hasil bisa ditelusuri ke sumber, aturan, dan peringatannya.
   3. Guru memegang kendali: tidak ada perubahan bahasa yang final tanpa persetujuan
      guru.
   4. Satu sumber data: tampilan digital dan PDF dirender dari struktur data yang sama.
   5. Akses, bukan tekanan: tanpa hitung mundur wajib atau perpindahan kartu otomatis.


  4. Pengguna dan Persona
  Pengguna utama adalah guru yang mengadaptasi materi; siswa adalah pembaca akhir
  hasilnya. Persona di bawah ini adalah asumsi kerja untuk desain dan perlu dikonfirmasi
  lewat wawancara guru.




                                                                                                Page 3 of 21
PRD AksaraInklusi




     Persona            Konteks                    Kebutuhan utama          Yang dipakai

     Bu Rina, guru      Kelas besar, sebagian      Menyiapkan versi         Input teks,
     kelas 4 SD         siswa kesulitan            bacaan mudah dalam       tinjauan, PDF A4
     (utama)            membaca, tanpa             waktu singkat, yakin     dan kunci guru
                        proyektor atau             maknanya tidak
                        komputer siswa;            berubah
                        mengandalkan fotokopi

     Pak Dedi, GPK      Mendampingi siswa          Mengatur ukuran          Mode Bacaan
     sekolah inklusi    secara individual;         huruf, jarak, dan        Nyaman dan
                        menyesuaikan tampilan      panjang blok per siswa   Fokus Bertahap
                        per anak

     Siswa pembaca      Membaca di layar atau      Blok teks pendek, tata   Kartu baca atau
     (sekunder)         kertas, mudah lelah atau   letak lapang, progres    lembar kerja cetak
                        teralihkan                 yang terlihat tanpa
                                                   tekanan



  Kebutuhan pengguna (user stories)
       Sebagai guru, saya ingin menempel teks dan langsung melihat bagian yang terlalu
       panjang agar tahu apa yang perlu diadaptasi.
       Sebagai guru, saya ingin melihat kalimat asal di balik setiap kartu agar yakin maknanya
       tidak bergeser.
       Sebagai guru, saya ingin menerima, mengedit, atau menolak setiap usulan perubahan
       agar kendali tetap pada saya.
       Sebagai guru, saya ingin mengunduh lembar kerja A4 hitam-putih beserta kunci
       jawaban agar bisa langsung difotokopi.
       Sebagai GPK, saya ingin menyesuaikan ukuran huruf dan jarak per siswa agar tampilan
       sesuai kebutuhan anak.
       Sebagai siswa, saya ingin membaca satu kartu pendek dalam satu waktu tanpa dikejar
       waktu.


  5. Alur Pengguna Utama
  Alur inti terdiri dari tujuh langkah dan harus selesai tanpa akun atau login.




                                                                                           Page 4 of 21
PRD AksaraInklusi




   1. Input: guru menempel teks (sekitar 300–800 kata), memberi judul, lalu memilih opsi
      dasar.
   2. Analisis: sistem memecah teks menjadi paragraf dan kalimat, lalu menghitung metrik
       struktur "sebelum".
   3. Usulan: sistem membuat kartu, usulan adaptasi bahasa (maksimal 3 pola), dan
       peringatan risiko.
   4. Tinjauan: guru menerima, mengedit, atau menolak tiap usulan; kalimat berisiko tetap
      utuh dan ditandai.
   5. Lembar kerja: guru memilih kata kunci; sistem membuat soal isian dari kalimat sumber;
      guru meninjau soal.
   6. Pratinjau: guru melihat kartu baca (layar) dan halaman cetak, serta metrik "sesudah".
   7. Keluaran: guru mengunduh PDF A4 (lembar siswa dan kunci guru) atau membuka
      mode baca di layar.


  Kasus tepi yang harus ditangani

     Kasus                                    Perilaku yang diharapkan

     Teks kosong atau terlalu pendek          Pesan galat jelas; tombol proses nonaktif

     Teks lebih dari batas kata               Peringatan, lalu proses dibatasi atau guru
                                              memotong teks

     Kalimat bersyarat, bernegasi, atau       Tidak diubah otomatis; ditandai "perlu ditinjau
     berangka                                 guru"

     Singkatan (dst., dll., Dr.) dan angka    Tidak salah dipecah sebagai akhir kalimat
     desimal

     Teks mengandung HTML atau skrip          Di-escape; tidak dieksekusi

     Kartu terlalu panjang                    Ditandai; tidak dipotong diam-diam

     Guru menolak semua usulan                Kartu tetap dibuat dari kalimat asli (adaptasi
                                              tampilan saja)




  6. Lingkup MVP
  Satu alur yang selesai lebih berharga daripada banyak fitur setengah jadi; lingkup dikunci
  pada jam ke-6 dan dibekukan pada jam ke-66.


                                                                                               Page 5 of 21
PRD AksaraInklusi




     Kategori                      Fitur

     Wajib (Must)                  Input teks tempel 300–800 kata; segmentasi dan
                                   metrik struktur; kartu baca dan pengaturan
                                   tampilan; usulan adaptasi dengan jejak sumber dan
                                   tinjauan guru; soal isian dari kalimat sumber; unduh
                                   PDF A4 beserta kunci guru

     Sebaiknya (Should)            Contoh materi bawaan untuk demo; simpan draf di
                                   browser; ringkasan tinjauan (jumlah usulan
                                   diterima, diedit, ditolak)

     Opsional (Could)              Bionic Reading sebagai opsi eksperimen yang mati
                                   secara bawaan; analisis tambahan dengan Stanza
                                   bila lolos uji awal

     Ditunda (Won't, MVP)          OCR; impor buku penuh dan katalog bab; akun dan
                                   login; chatbot; pelatihan model; analitik siswa;
                                   pemenggalan suku kata otomatis; penentuan
                                   tingkat kelas; hitung mundur atau perpindahan
                                   kartu otomatis


  Aturan pemangkasan: jika parser atau aturan adaptasi belum stabil pada jam ke-24,
  prioritaskan segmentasi, transparansi, dan tinjauan manual. Alur selesai tidak boleh
  dikorbankan demi NLP yang rapuh.



  7. Kebutuhan Fungsional
  Tiap kebutuhan punya ID dan kriteria penerimaan yang bisa diuji. Prioritas: M = Wajib, S =
  Sebaiknya, C = Opsional.


     ID             Kebutuhan                        Kriteria penerimaan                      P

     FR-            Input teks tempel                Menerima teks 300–800 kata; di luar      M
     01                                              rentang tampil peringatan; batas keras
                                                     1.500 kata

     FR-            Pengamanan input                 Semua teks di-escape sebelum dirender    M
     02                                              HTML; skrip tidak berjalan




                                                                                              Page 6 of 21
PRD AksaraInklusi




     ID             Kebutuhan                      Kriteria penerimaan                           P

     FR-            Segmentasi paragraf dan        Singkatan umum dan angka desimal tidak        M
     03             kalimat                        dipecah salah pada set uji

     FR-            Metrik struktur sebelum dan    Menampilkan rata-rata kata per kalimat,       M
     04             sesudah                        jumlah kalimat di atas ambang (bawaan 20
                                                   kata, dapat diubah), dan kata per blok
                                                   baca

     FR-            Penjelasan metrik              Setiap metrik berlabel "indikator struktur    M
     05                                            teks, bukan penentuan tingkat kelas"

     FR-            Penandaan istilah sulit        Guru dapat menandai istilah yang perlu        M
     06                                            penjelasan; tanda tampil di kartu dan PDF

     FR-            Adaptasi tampilan              Kalimat utuh dibagi ke kartu tanpa            M
     07                                            mengubah isi kalimat

     FR-            Usulan adaptasi bahasa         Maksimal 3 aturan teruji; setiap usulan       M
     08                                            berstatus pending sampai guru
                                                   memutuskan

     FR-            Pemeriksaan risiko             Negasi, kata syarat, kata sebab-akibat,       M
     09                                            angka, satuan, dan istilah penting
                                                   diperiksa; selisih memicu peringatan

     FR-            Penolakan otomatis yang aman   Kalimat berisiko dipertahankan dan            M
     10                                            berlabel "Kalimat ini perlu ditinjau guru"

     FR-11          Editor tinjauan                Per usulan: terima, edit, atau tolak;         M
                                                   perubahan status langsung memperbarui
                                                   kartu dan metrik

     FR-12          Lihat sumber                   Setiap kartu punya tombol yang                M
                                                   menampilkan kalimat asal, aturan, dan
                                                   peringatan

     FR-13          Ringkasan tinjauan             Menampilkan jumlah usulan diterima,           S
                                                   diedit, ditolak, dan kalimat dibiarkan

     FR-            Mode Bacaan Nyaman             Ukuran huruf, jarak huruf, kata, dan baris,   M
     14                                            serta lebar kolom dapat diatur




                                                                                                 Page 7 of 21
PRD AksaraInklusi




     ID             Kebutuhan                Kriteria penerimaan                            P

     FR-15          Mode Fokus Bertahap      Satu kartu per layar; maksimal 2 kalimat       M
                                             dengan sasaran 30–50 kata; kartu lebih
                                             panjang ditandai; tombol maju, mundur,
                                             dan centang manual

     FR-16          Estimasi waktu baca      Ditampilkan sebagai perkiraan; tanpa           S
                                             hitung mundur dan tanpa perpindahan
                                             otomatis

     FR-17          Bionic Reading           Tombol opsional, mati secara bawaan,           C
                                             diberi label eksperimental

     FR-18          Soal isian dari sumber   Guru memilih kata kunci; kandidat hanya        M
                                             kata isi, bukan negasi, angka, atau satuan

     FR-19          Kunci jawaban            Diambil dari kata yang dihilangkan; ditinjau   M
                                             guru sebelum ekspor

     FR-            Unduh PDF A4             Memuat judul, identitas siswa, bacaan          M
     20                                      bertahap, 3 soal isian, dan ruang jawaban

     FR-21          Kunci guru terpisah      Disajikan sebagai berkas atau bagian           M
                                             terpisah dari lembar siswa

     FR-            Profil Cetak Kelas       Hitam-putih, kontras tinggi, tanpa blok        M
     22                                      warna latar, kartu tidak terpotong
                                             antarhalaman

     FR-            Simpan draf di browser   Draf dipulihkan setelah muat ulang tanpa       S
     23                                      akun

     FR-            Contoh materi bawaan     Minimal 3 contoh (mis. IPA, IPS, Bahasa        S
     24                                      Indonesia) berlisensi aman untuk demo




  8. Kebutuhan Non-Fungsional
  Angka di bawah adalah target awal untuk hackathon dan akan disesuaikan setelah uji pada
  materi nyata.




                                                                                            Page 8 of 21
PRD AksaraInklusi




     Aspek            Kebutuhan                                Target awal

     Kinerja          Waktu proses analisis dan usulan         Di bawah 5 detik; PDF di bawah 15
                      untuk teks 800 kata                      detik

     Privasi          Tanpa akun; teks guru tidak              Server stateless; draf hanya di
                      disimpan permanen di server dan          browser
                      tidak dicatat di log

     Keamanan         Escape input, batas ukuran               Tidak ada eksekusi skrip dari teks
                      permintaan, pembatasan laju              input

     Aksesibilitas    Antarmuka aplikasi sendiri harus         Kontras memadai, navigasi papan
     UI               mudah diakses                            ketik, label jelas, tata letak lapang

     Konsistensi      Pratinjau dan PDF dirender dari data     Isi kartu di layar dan PDF identik
                      dan templat yang sama

     Keandalan        Font tertanam; pemisahan halaman         Tidak ada kartu atau soal
     PDF              terkendali                               terpotong pada set uji

     Hemat tinta      Tanpa blok warna latar, bingkai tipis,   Diverifikasi lewat cetak dan
                      penebalan terbatas                       fotokopi nyata

     Kompatibilitas   Peramban modern dan layar ponsel         Chrome, Edge, Firefox terbaru;
                                                               lebar minimum 360 px

     Bahasa           Antarmuka dan pesan galat                Bahasa Indonesia

     Deployment       Mengurangi titik kegagalan               Satu container backend yang juga
                                                               menyajikan aset frontend

     Observabilitas   Mendiagnosis galat saat demo             Log teknis tanpa isi teks guru




  9. Spesifikasi NLP dan Aturan Adaptasi
  NLP di AksaraInklusi bersifat konservatif dan dapat diaudit: sistem mengusulkan,
  memeriksa risiko, dan menolak perubahan yang tidak aman, sedangkan keputusan akhir
  ada pada guru.




                                                                                                 Page 9 of 21
PRD AksaraInklusi




  Alur pemrosesan
   1. Segmentasi: teks dipecah menjadi paragraf dan kalimat, masing-masing diberi ID (mis.
      s1, s2).
   2. Metrik sebelum: rata-rata kata per kalimat, jumlah kalimat di atas ambang, kata per
      blok.
   3. Usulan adaptasi: aturan terbatas menghasilkan usulan yang tertaut ke ID kalimat
       sumber.
   4. Pemeriksaan risiko: perbandingan token penting antara sumber dan hasil.
   5. Tinjauan guru: usulan berstatus pending, accepted, edited, atau rejected.
   6. Penyusunan kartu dan soal isian: hanya dari kalimat final yang sudah ditinjau.
   7. Metrik sesudah: dihitung ulang dari hasil final.


  Dua lapisan transformasi

     Lapisan            Perilaku                               Perlakuan

     Adaptasi           Mengatur spasi, ukuran huruf, dan      Tidak mengubah isi kalimat; tidak
     tampilan           membagi kalimat utuh ke kartu          perlu persetujuan per kalimat

     Usulan adaptasi    Memecah struktur atau                  Selalu berupa usulan yang ditinjau
     bahasa             mengganti ungkapan tertentu            guru



  Aturan adaptasi bahasa (maksimal 3 untuk MVP)

     rule_id                       Pola                   Contoh                 Ditolak jika

     split_independent_clauses     Dua klausa             "Daun menyerap         Ada negasi,
                                   mandiri dengan         cahaya dan akar        syarat, angka,
                                   subjek masing-         menyerap air." → dua   atau satuan
                                   masing,                kalimat                lintas klausa;
                                   dihubungkan                                   subjek tidak
                                   "dan", "serta", atau                          jelas
                                   "namun"

     list_to_bullets               Kalimat enumerasi      Satu kalimat →         Ada klausa
                                   (mis. "meliputi A,     pengantar + butir      bersarang di
                                   B, dan C")                                    dalam butir




                                                                                                Page 10 of 21
PRD AksaraInklusi




     rule_id                       Pola                    Contoh                   Ditolak jika

     glossary_swap                 Ungkapan dalam          "mengakibatkan" →        Pasangan tidak
                                   kamus kecil             "menyebabkan"            ada di kamus;
                                   terkurasi guru                                   istilah
                                                                                    termasuk
                                                                                    daftar istilah
                                                                                    penting


  Aturan pertama bergantung pada kualitas deteksi subjek. Bila uji awal Stanza untuk
  bahasa Indonesia tidak memadai pada jam ke-24, aturan ini diturunkan menjadi saran
  manual yang ditandai, bukan perubahan otomatis.


  Pemeriksaan risiko (alarm awal, bukan bukti kesetaraan makna)

     Kategori           Contoh yang diperiksa                   Tindakan bila terdampak

     Negasi             tidak, bukan, belum, tak, tanpa,        Blokir usulan atau beri peringatan
                        jangan

     Syarat             jika, apabila, bila, kecuali            Blokir pemecahan; tandai untuk
                                                                guru

     Sebab-akibat       karena, sebab, sehingga, akibatnya      Tandai untuk guru

     Angka dan          25%, 3 km, 1945                         Pastikan semua muncul di hasil
     satuan

     Istilah penting    Daftar dari guru dan nama diri          Pastikan tidak diganti atau hilang



  Soal isian
       Kandidat kata hanya kata isi (nomina, verba, adjektiva), bukan negasi, kata syarat,
       angka, atau satuan.
       Guru memilih kata kunci; sistem melubangi kata itu pada kalimat sumber.
       Kunci jawaban otomatis memuat kata yang dihilangkan.
       Tidak ada pembuatan pertanyaan bebas pada MVP.




                                                                                                   Page 11 of 21
PRD AksaraInklusi




  Larangan teknis
         Jangan menghapus stopword dari bacaan siswa; kata seperti "tidak", "jika", dan
         "karena" membawa makna.
         Jangan melakukan stemming (mis. dengan Sastrawi) pada teks yang dibaca siswa.
         Jangan menyebut penebalan huruf awal sebagai pemenggalan suku kata.
         Jangan menyatakan hasil adaptasi "bebas halusinasi" atau "setara maknanya"; cukup
         jelaskan bahwa sumber, aturan, dan peringatan ditampilkan.
         Estimasi waktu baca memakai kecepatan baca yang dapat diatur; nilai bawaan perlu
         dikalibrasi dan diberi label "perkiraan".


  10. Model Data
  Satu struktur data hasil adaptasi dipakai untuk tampilan digital dan PDF, sehingga isinya
  selalu konsisten. Server tidak menyimpannya; klien yang memegang draf.

     {
         "document": {
           "title": "Fotosintesis",
             "sentences": [
               { "id": "s3", "text": "Jika tumbuhan tidak memperoleh cahaya yang
     cukup, pertumbuhannya dapat terganggu.", "word_count": 11 }
         ],
         "metrics_before": { "avg_words_per_sentence": 24,
     "sentences_over_threshold": 7, "threshold": 20 },
         "metrics_after": { "avg_words_per_sentence": 13,
     "sentences_over_threshold": 2, "threshold": 20 }
         },
         "cards": [
             {
                    "id": "c3",
                    "source_sentence_ids": ["s3"],
                    "adapted_text": "Jika tumbuhan tidak memperoleh cahaya yang cukup,
     pertumbuhannya dapat terganggu.",
           "rule_id": null,
                    "review_status": "flagged",
                    "warnings": ["kondisional", "negasi"],
                    "flagged_terms": []
           }
         ],
         "exercises": [



                                                                                          Page 12 of 21
PRD AksaraInklusi




             { "id": "e1", "source_sentence_id": "s3", "answer": "cahaya",
     "blank_text": "Jika tumbuhan tidak memperoleh ______ yang cukup,
     pertumbuhannya dapat terganggu." }
         ]
     }



     Entitas        Bidang utama                             Catatan

     Sentence       id, text, word_count, paragraph_id       Hasil segmentasi; tidak pernah
                                                             diubah

     Card           id, source_sentence_ids, adapted_text,   review_status: pending, accepted,
                    rule_id, review_status, warnings         edited, rejected, flagged

     Exercise       id, source_sentence_id, answer,          Jawaban selalu kata asli dari
                    blank_text                               sumber

     Metrics        avg_words_per_sentence,                  Dihitung ulang setelah setiap
                    sentences_over_threshold,                keputusan guru
                    words_per_block




  11. Arsitektur dan Tech Stack
  Rekomendasi: React + FastAPI + NLP berbasis aturan + Playwright untuk PDF, bila tim
  nyaman dengan Python dan JavaScript. Kenyamanan tim lebih penting daripada stack
  yang terlihat canggih.




  arsitektur dan alur data · 2 lapisan, 4 endpoint




                                                                                              Page 13 of 21
PRD AksaraInklusi




  Peramban (React) memegang draf dan tinjauan; server (FastAPI) hanya memproses
  permintaan tanpa menyimpan teks. Hasil tinjauan guru menjadi satu-satunya sumber
  untuk kartu layar dan PDF.


     Komponen       Pilihan                           Tujuan

     Frontend       React, Vite, TypeScript           Editor, perbandingan teks, kartu
                                                      baca, tinjauan

     Styling        CSS atau Tailwind                 Tampilan responsif dan profil cetak

     Backend        FastAPI + Pydantic                Validasi input dan respons
                                                      terstruktur

     NLP inti       Tokenisasi, aturan konservatif,   Analisis dan transformasi yang bisa
                    kamus kecil terkurasi             dijelaskan

     NLP opsional   Stanza (model bahasa Indonesia)   POS dan dependency parsing, hanya
                                                      bila lolos uji awal

     PDF            Playwright Chromium + HTML/CSS    PDF dari templat yang sama dengan
                    cetak                             pratinjau

     Penyimpanan    State peramban; localStorage      Draf tanpa akun
                    opsional

     Deployment     Satu container backend dengan     Mengurangi titik kegagalan
                    aset frontend




                                                                                         Page 14 of 21
PRD AksaraInklusi




  Rancangan API (stateless)

     Endpoint               Masukan                  Keluaran

     POST /api/analyze      Teks, judul, opsi        Kalimat, metrik sebelum, kartu, usulan,
                                                     peringatan

     POST                   Hasil tinjauan guru      Kartu final dan metrik sesudah
     /api/recompute

     POST                   Kata kunci pilihan       Soal isian dan kunci jawaban
     /api/worksheet         guru

     POST /api/pdf          Struktur data final      Berkas PDF A4 (lembar siswa dan kunci
                                                     guru)


  Playwright membuat PDF lewat page.pdf() dengan CSS media cetak; uji font, pemisahan
  halaman, dan kartu panjang sejak awal. Stanza membantu analisis, bukan otomatis
  menyederhanakan kalimat; Sastrawi adalah stemmer dan tidak dipakai pada teks bacaan.
  Jangan melatih model sendiri dalam 72 jam.


  12. Desain UX, Mode Baca, dan Profil Cetak
  Antarmuka dibagi menurut kebutuhan baca, bukan menurut diagnosis: tidak ada tombol
  "Mode Disleksia" atau "Mode ADHD", karena satu preset tidak cocok untuk semua siswa.


  Tata letak layar guru

     Panel                         Isi

     Kiri: Teks asli               Teks tempel dengan kalimat panjang ditandai dan
                                   ID kalimat

     Tengah: Hasil dan tinjauan    Kartu hasil, usulan, peringatan, tombol terima / edit
                                   / tolak, tombol "Lihat sumber"

     Kanan: Pratinjau dan metrik   Pratinjau kartu atau halaman cetak, metrik sebelum
                                   dan sesudah, tombol unduh PDF


  Di ponsel, panel disusun menjadi tab: Teks, Tinjau, Pratinjau.




                                                                                               Page 15 of 21
PRD AksaraInklusi




  Mode baca

     Mode             Perilaku                                 Pengaturan

     Bacaan           Teks utuh dengan tata letak lapang       Ukuran huruf, jarak huruf, kata, dan
     Nyaman                                                    baris, lebar kolom, kontras

     Fokus            Satu kartu pada satu waktu;              Maju dan mundur manual, centang
     Bertahap         maksimal 2 kalimat, sasaran 30–50        progres, estimasi waktu sebagai
                      kata                                     perkiraan

     Cetak Kelas      Pratinjau halaman A4 hitam-putih         Jumlah soal isian, tampilkan kunci
                      dengan ruang jawaban                     guru


  Bionic Reading hanya tersedia sebagai opsi eksperimen yang mati secara bawaan, dengan
  label bahwa manfaatnya belum terbukti untuk semua pembaca. Pilihan font berupa sans-
  serif yang jelas (mis. Atkinson Hyperlegible atau Lexend, berlisensi terbuka) tanpa klaim
  efektivitas.


  Profil Cetak Kelas (PDF A4)
       Hitam-putih, kontras tinggi, tanpa blok warna latar, bingkai tipis.
       Kartu dan soal tidak terpotong antarhalaman; ruang jawaban berupa garis yang cukup
       besar untuk tulisan tangan anak.
       Bagian lembar siswa: judul, kolom nama dan kelas, bacaan bertahap, 3 soal isian.
       Kunci jawaban dan daftar perubahan yang disetujui guru berada di berkas atau
       halaman terpisah.
       Penebalan huruf awal tidak aktif di PDF bawaan, karena menambah pemakaian tinta.
       Diuji dengan cetak printer nyata dan fotokopi, bukan hanya pratinjau peramban.


  Teks kepercayaan di antarmuka
       Di bawah metrik: "Indikator struktur teks; bukan penentuan tingkat kelas."
       Di kartu berisiko: "Kalimat ini perlu ditinjau guru."
       Di ekspor: "Disusun dari materi sumber dan ditinjau guru; periksa kembali sebelum
       dipakai."




                                                                                                Page 16 of 21
PRD AksaraInklusi




  13. Metrik Keberhasilan dan Rencana Validasi
  Laporkan kualitas dan cakupan bersama-sama: sistem yang benar mengubah satu dari 100
  kalimat belum tentu berguna. Semua hasil uji awal disebut "uji awal penggunaan", bukan
  bukti efektivitas untuk disleksia atau ADHD, dan angka peningkatan tidak boleh dikarang.


     Metrik             Cara mengukur                            Dilaporkan sebagai

     Waktu persiapan    Guru menyiapkan materi sebanding         Selisih waktu rata-rata dan
     guru               secara manual vs dengan aplikasi,        sebaran
                        urutan tugas bergantian

     Kualitas           Guru menilai akurasi makna,              Persentase usulan dinilai
     perubahan          kejelasan, dan kelayakan pakai tiap      layak
                        usulan

     Tingkat koreksi    (Usulan diedit + ditolak) ÷ total        Persentase
                        usulan

     Cakupan            Kalimat yang berhasil diadaptasi ÷       Persentase, dilaporkan
     otomatisasi        total kalimat                            bersama kualitas

     Perubahan          Rata-rata kata per kalimat, kalimat di   Tabel sebelum–sesudah
     struktur           atas ambang, kata per blok: sebelum
                        dan sesudah

     Kinerja            Waktu proses pada teks 300, 500,         Detik
                        dan 800 kata

     Kualitas cetak     Pemotongan teks, ruang jawaban,          Daftar periksa lulus atau gagal
                        jumlah halaman, keterbacaan
                        fotokopi



  Rencana uji
   1. Set uji teks: 5–10 materi dari mata pelajaran berbeda (IPA, IPS, Bahasa Indonesia),
      dengan lisensi yang aman dipakai. Sertakan kasus sulit: kalimat bersyarat, bernegasi,
      berangka, singkatan, dan daftar.
   2. Contoh hasil ideal: tim menulis hasil adaptasi "ideal" untuk 2–3 materi pada jam 0–6
      sebagai acuan.
   3. Uji unit: segmentasi, pemeriksaan risiko, dan pembuatan soal isian diuji otomatis.
   4. Uji awal dengan 3–5 guru bila ada akses, pada materi sebanding.



                                                                                             Page 17 of 21
PRD AksaraInklusi




   5. Uji cetak: cetak dan fotokopi nyata, lalu periksa dengan daftar periksa kualitas cetak.


  Definisi selesai (Definition of Done) untuk demo
       Alur tempel teks sampai unduh PDF berjalan tanpa galat pada 3 materi contoh.
       Setiap kartu menampilkan sumber, aturan, dan peringatan.
       Minimal satu kasus yang ditolak sistem dapat ditunjukkan langsung.
       PDF sudah dicetak dan difotokopi, hasilnya dibawa ke demo.


  14. Risiko dan Mitigasi
  Risiko terbesar bukan teknis semata, melainkan klaim yang melampaui bukti dan
  perubahan makna yang tidak terdeteksi.


     Risiko                 Dampak          Tingkat   Mitigasi               Fallback

     Klaim tingkat kelas    Juri menilai    Sangat    Tampilkan metrik       Hanya metrik
     tanpa kalibrasi        klaim tidak     tinggi    struktur transparan    dasar
                            berdasar                  dengan label
                                                      "bukan tingkat
                                                      kelas"

     Pemecahan kalimat      Siswa           Sangat    Aturan terbatas,       Pertahankan
     mengubah makna         menerima        tinggi    pemeriksaan risiko,    kalimat dan
     (syarat, negasi,       informasi                 jejak sumber,          tandai
     subjek)                keliru                    persetujuan guru

     Klaim "bebas           Klaim tidak     Sangat    Jangan dipakai;        Tidak ada
     halusinasi" atau       dapat           tinggi    jelaskan mekanisme
     "makna pasti sama"     dibuktikan                sumber, aturan, dan
                                                      peringatan

     Bionic Reading         Bukti manfaat   Tinggi    Opsi eksperimen,       Hapus dari demo
     dijadikan klaim        tidak                     mati bawaan, bukan
     manfaat                konsisten                 pusat klaim

     Fitur "lembar kerja"   Tidak terasa    Tinggi    Soal isian dari        Soal isian manual
     hanya berupa           sebagai                   kalimat sumber         oleh guru
     bacaan cetak           lembar kerja              dengan kunci guru




                                                                                         Page 18 of 21
PRD AksaraInklusi




     Risiko                 Dampak              Tingkat         Mitigasi               Fallback

     Parser bahasa          Aturan              Tinggi          Uji awal pada materi   Aturan
     Indonesia (mis.        adaptasi rapuh                      sasaran sebelum        sederhana atau
     Stanza) kurang                                             jadi dependensi        saran manual
     akurat

     PDF terpotong          Demo gagal di       Sedang          Satu templat           Templat lebih
     atau berbeda dari      hasil cetak                         HTML/CSS cetak;        sederhana
     pratinjau                                                  uji font dan
                                                                pemisahan halaman

     Batas dua kalimat      Beban baca          Sedang          Batas kalimat          Pisahkan manual
     per kartu tetap        tinggi                              sekaligus kata;
     berisi terlalu                                             kartu panjang
     banyak kata                                                ditandai

     Estimasi waktu         Siswa cemas         Sedang          Hanya perkiraan;       Hapus estimasi
     menjadi tekanan                                            tanpa hitung
                                                                mundur

     Cakupan melebar        Alur utama          Tinggi          Lingkup dibekukan      Pangkas fitur
     (OCR, katalog          tidak selesai                       pada jam ke-66;        Should dan
     buku)                                                      daftar "Ditunda"       Could
                                                                tegas

     Masalah                Demo gagal          Sedang          Satu container;        Demo lokal dan
     deployment saat                                            deploy awal            rekaman
     demo                                                       sebelum jam ke-24      cadangan




  15. Rencana 72 Jam
  Jam ke-24 adalah gerbang keputusan: bila parser atau aturan adaptasi belum stabil, tim
  beralih ke segmentasi, transparansi, dan tinjauan manual.


     Waktu             Target                                        Keluaran

     Jam 0–6           Kunci lingkup, pilih materi uji, tulis        Dokumen lingkup, 3–5 materi uji,
                       contoh hasil ideal                            contoh ideal

     Jam 6–24          Input, segmentasi, metrik, kartu              Alur tempel teks → kartu berjalan
                       baca; deploy awal                             di URL publik




                                                                                                   Page 19 of 21
PRD AksaraInklusi




     Waktu          Target                                 Keluaran

     Jam 24         Evaluasi parser dan aturan adaptasi    Putuskan: lanjut aturan otomatis
     (gerbang)                                             atau saran manual

     Jam 24–42      Aturan adaptasi, pemeriksaan risiko,   Usulan dapat diterima, diedit,
                    jejak sumber, editor tinjauan          ditolak, dengan tombol "Lihat
                                                           sumber"

     Jam 42–56      Soal isian, kunci guru, templat PDF    PDF A4 siswa dan kunci guru dapat
                                                           diunduh

     Jam 56–66      Uji kasus sulit, uji guru, cetak dan   Daftar bug, hasil uji awal, contoh
                    fotokopi nyata                         fotokopi

     Jam 66         Pembekuan fitur                        Tidak ada fitur baru setelah ini

     Jam 66–72      Perbaikan, latihan demo, rekaman       Demo 4 menit yang sudah dilatih
                    cadangan




  16. Strategi Demo dan Pitch
  Sudut pitch terbaik: satu materi, beberapa cara mengaksesnya, dengan guru tetap
  memegang kendali. Penilaian juri di bawah ini bersifat simulasi, bukan rubrik resmi.

  Kalimat pembuka: "Guru memiliki materi yang sama untuk seluruh kelas, tetapi
  kebutuhan membaca siswa berbeda. AksaraInklusi membantu menyiapkan bacaan
  bertahap dan lembar kerja cetak dari materi tersebut, dengan setiap perubahan dapat
  ditinjau."


  Demo sekitar 4 menit
   1. Tampilkan materi asli yang padat; jelaskan pekerjaan manual guru.
   2. Proses teks secara langsung; tunjukkan metrik sebelum dan sesudah.
   3. Buka satu jejak perubahan: sumber, aturan, hasil.
   4. Tunjukkan satu kasus yang ditolak sistem (mis. kalimat bersyarat).
   5. Pindah ke kartu baca; tunjukkan pengaturan jarak dan progres.
   6. Unduh PDF dan tunjukkan hasil fotokopinya sebagai penutup.




                                                                                              Page 20 of 21
PRD AksaraInklusi




  Jawaban untuk pertanyaan sulit

     Pertanyaan juri                         Jawaban yang kuat

     Apa bedanya dengan ChatGPT?             Kami menyediakan alur terstruktur: jejak sumber,
                                             pemeriksaan risiko, tinjauan guru, dan lembar
                                             kerja siap cetak.

     Mana bukti membantu disleksia?          MVP menawarkan pengaturan akses baca;
                                             efektivitas pada siswa sasaran masih perlu diuji.

     Kenapa tidak menentukan tingkat         Kami belum punya kalibrasi yang cukup, jadi kami
     kelas?                                  menampilkan indikator struktur yang transparan.

     Apakah maknanya pasti sama?             Tidak kami jamin otomatis. Perubahan berisiko
                                             ditandai dan guru meninjau hasilnya.

     Apa aspek NLP-nya?                      Segmentasi, analisis struktur, aturan transformasi
                                             terbatas, pemetaan ke sumber, dan pemeriksaan
                                             perubahan.




  17. Asumsi dan Pertanyaan Terbuka
  Beberapa hal di PRD ini adalah asumsi kerja dan perlu dikonfirmasi sebelum jam ke-6.

       Berapa anggota tim dan siapa memegang frontend, backend/NLP, serta PDF dan uji?
       PRD ini mengasumsikan 3–4 orang.
       Apakah ada rubrik resmi hackathon? Penilaian di PRD ini masih simulasi.
       Jenjang sasaran: SD saja atau SD–SMP? Ini memengaruhi pilihan materi uji dan ukuran
       huruf bawaan.
       Dari mana materi uji diambil, dan apakah lisensinya aman untuk ditampilkan saat
       demo?
       Apakah ada akses ke 3–5 guru atau GPK untuk uji awal?
       Apakah Stanza untuk bahasa Indonesia cukup baik pada materi uji? Putuskan pada jam
       ke-24.
       Kecepatan baca bawaan untuk estimasi waktu: nilainya perlu dikalibrasi, bukan
       ditebak.
       Tempat deployment dan cadangan demo bila jaringan venue tidak stabil.




                                                                                           Page 21 of 21
