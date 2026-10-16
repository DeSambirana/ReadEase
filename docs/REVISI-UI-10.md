# Revisi UI 10 — 15 Oktober 2026

Perubahan sesuai permintaan pengguna, melanjutkan versi akun guru/murid.

- Enam PNG dari ZIP pengguna ditambahkan sebagai Karakter 1–6. Empat avatar lama
  tetap tersedia dan ID profil lama tetap cocok. Gambar digunakan apa adanya;
  berkas asli unggahan tidak diubah. Avatar konsisten di kartu, modal dan profil.
- Grid avatar tiga kolom dengan minmax(0,1fr), nama membungkus, ukuran tombol
  dibatasi panel. Avatar panjang tidak mendorong kolom kanan. Pilihan memiliki
  aria-pressed dan dapat dioperasikan dengan keyboard.
- Tombol Pilihan lainnya memakai teks navy, latar terang dan border yang jelas.
  Ini tombol untuk membuka profil/preferensi/PDF, bukan kotak ketik. Input dan
  textarea pada form memiliki teks gelap, caret jelas dan placeholder terpisah;
  kontrol disabled tetap dibedakan dari kontrol yang aktif.
- Tema utama teal #42b1ab dan navy #2a436b. Teks pada teal memakai navy gelap agar
  jelas. Warna peringatan/galat dan aksen kartu tetap bermakna; PDF tetap hitam-putih.
- Ruang guru dibagi Teks → Tinjauan → Soal → Cetak & Bagikan. Langkah setelah teks
  tersedia setelah analisis; analisis sukses membuka Tinjauan. Pengaturan tambahan
  dan pratinjau kartu dapat dibuka sesuai kebutuhan. Saran tinjauan dapat dilipat,
  saran pertama terbuka. Data dan edit tetap ada saat berpindah langkah.
- Jalur PDF cepat membuka langkah Cetak. Tidak melewati tinjauan soal/kunci,
  persetujuan berbagi atau pemeriksaan PDF. Login, peran dan penyimpanan tidak berubah.
- Label privasi diperjelas: draf per tab, pemrosesan memakai backend. Label metrik
  dikembalikan menjadi “Indikator struktur teks; bukan penentuan tingkat kelas.”

## Uji
143 pytest lulus; build, ESLint, TypeScript typecheck, Ruff check/format lulus.
Browser Chromium 1440 px dan 360 px lulus: 10 pilihan avatar, pilihan tersimpan di
kartu, semua tombol di dalam panel, warna tombol aktif, form dapat diketik,
navigasi empat langkah, tiga soal ditinjau, PDF, berbagi, kode murid, pengerjaan,
hasil guru, reload dan logout. Tinjauan tanpa overflow horizontal. Screenshot
hanya digunakan untuk pemeriksaan internal. Windows dan cetak fisik belum diuji.

## Menjalankan / memperbarui
ZIP berisi sumber lengkap dan aset foto asli. Hasil build tidak dibundel untuk
menghindari tiga salinan gambar berukuran besar. Jalankan --setup pada instalasi
baru, atau --build bila dependensi versi 9 sudah terpasang. Skrip membangun frontend
serta menyalinnya ke backend/static. Untuk Vite: restart server dev dan reload.
Jangan menimpa/menghapus backend/data milik instalasi lama; di situlah akun dan tugas
tersimpan. Backup database dengan server berhenti sebelum mengganti folder aplikasi.
Tidak mengubah dependency, skema API, atau struktur database.
