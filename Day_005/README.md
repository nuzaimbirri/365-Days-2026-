# Day 005 - Neon Defender 365

## 🎮 Deskripsi Proyek
**Neon Defender** adalah sebuah game arcade *Space Shooter* bernuansa Cyberpunk Neon yang dibuat menggunakan **HTML5 Canvas**, **Vanilla JavaScript**, dan **Web Audio API** untuk efek suara sintetis tanpa dependensi eksternal.

Proyek ini dibangun sebagai bagian dari tantangan koding **365 Days**.

---

## ✨ Fitur Utama
1. **Sistem Tembakan & Ultimate Pulse**:
   - Tembakan standar, **Triple Shot 3 arah**, dan **Beam Laser**.
   - Skill **Ultimate Mega Pulse (SPACE)** ketika meter energi penuh untuk memusnahkan musuh di layar.
2. **Dynamic Enemy & Boss System**:
   - Musuh tipe **Scout** (pergerakan cepat & zig-zag).
   - Musuh tipe **Interceptor** (dapat menembak balik).
   - Musuh tipe **Heavy Destroyer** (tanky & menjatuhkan power-up).
   - **BOSS Mech Encounter** setiap kelipatan gelombang ke-5.
3. **Power-Up Items**:
   - ⚡ **Triple Shot**: Tembakan menyebar 3 arah.
   - 💥 **Beam Laser**: Laser cepat & berdaya hancur tinggi.
   - 🛡️ **Shield Boost**: Memulihkan daya tahan perisai pesawat.
   - ❄️ **Time Freeze**: Memperlambat pergerakan musuh selama 5 detik.
4. **Web Audio Sound Effects**:
   - Efek suara sintetis menggunakan `AudioContext` untuk tembakan laser, ledakan, power-up, dan ultimate.
5. **High Score Persistence**:
   - Skor tertinggi tersimpan secara otomatis menggunakan `localStorage`.
6. **Desain Glassmorphism & Cyberpunk Neon**:
   - Tampilan visual futuristik dengan Google Fonts (`Orbitron` & `Rajdhani`), efek *glow*, dan partikel ledakan.

---

## 🕹️ Kontrol Game
- **WASD / Tombol Panah**: Menggerakkan Pesawat.
- **Klik Kiri Mouse / Tahan**: Menembak Laser Cannon.
- **SPACE**: Mengaktifkan Ultimate Mega Pulse (saat meter penuh).
- **P / ESC**: Menjeda (Pause) Game.

---

## 🚀 Cara Menjalankan
1. Buka file `index.html` langsung di browser Anda (misalnya klik ganda `index.html` atau buka via Live Server / Laragon).
2. Tekan tombol **MULAI GAME**.