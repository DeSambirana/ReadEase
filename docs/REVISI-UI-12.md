# Revisi 12: hanya avatar unggahan pengguna

Enam gambar asli dari Desain tanpa judul.zip menjadi seluruh pilihan avatar.
Gambar login memakai pilihan-1.png, tanpa sprite avatar buatan sebelumnya.
ID avatar lama dipetakan saat ditampilkan; data murid tidak dihapus.
Editor profil menandai avatar pengganti yang sesuai. Avatar baru bawaan Karakter 1.

Jalankan ulang scripts/run_local.py --build agar backend menyajikan aset terbaru.
Simpan backend/data saat memindahkan proyek. Dependensi tidak berubah.

Validasi: 143 pytest lulus; Ruff backend, build, ESLint dan typecheck lulus.
Uji browser 1440/360 px lulus: tepat enam pilihan, gambar login termuat,
registrasi, profil, kode murid, soal, PDF, berbagi dan pengiriman hasil.
