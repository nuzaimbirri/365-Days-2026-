# Day 006 - Cyber Strike: Neon Survivor ⚔️🤖

## 🎮 Deskripsi Proyek
**Cyber Strike: Neon Survivor** adalah sebuah game action rogue-lite *arena survivor* bernuansa **Cyberpunk Neon** yang dikembangkan menggunakan **HTML5 Canvas**, **Vanilla JavaScript**, dan **Web Audio API** sintetis tanpa memerlukan dependensi library eksternal.

Proyek ini dibangun sebagai bagian dari tantangan koding **365 Days** (Day 006).

---

## ✨ Fitur Utama
1. **Sistem Senjata & Kombinasi Skill (Upgrade Tree)**:
   - 🔫 **Plasma Cannon**: Tembakan laser berkecepatan tinggi dengan multi-beam pada level lanjut.
   - 🛸 **Orbital Laser Drones**: Drone yang mengorbit pesawat dan menembak musuh terdekat secara otomatis.
   - ⚡ **Tesla Chain Lightning**: Sambaran petir berantai yang melompati musuh dalam radius area.
   - 💣 **EMP Nova Bomb**: Gelombang kejutan elektromagnetik yang melenyapkan musuh di sekitar.
   - 🗡️ **Cyber Blade Ring**: Pedang energi yang mengitari pesawat dan mencincang musuh jarak dekat.
2. **Sistem Upgrade Modul Overclock (Level Up Modal)**:
   - Setiap kenaikan level (XP dari musuh), waktu permainan dijeda dan menampilkan 3 pilihan kartu modul acak (*Common, Rare, Epic, Legendary*) dengan efek suara & visual glassmorphism.
3. **Variasi Musuh & Boss Battle**:
   - **Cyber Bug**: Swarm musuh cepat berukuran kecil.
   - **Neon Assassin**: Pembunuh cepat berdaya rusak tinggi.
   - **Sniper Drone**: Drone musuh yang menembakkan proyektil laser dari jarak jauh.
   - **Iron Mech**: Tank tangguh pembawa armor tebal.
   - ⚠️ **CYBER DREADNOUGHT (BOSS)**: Mega boss yang muncul di wave khusus dengan pola serangan peluru melingkar (bullet-hell) dan bar darah HUD khusus!
4. **Sintesis Suara Prosedural (Web Audio API)**:
   - Menggunakan `AudioContext` untuk efek suara tembakan laser, petir Tesla, ledakan EMP, pickup gem, dash pulse, dan fan-fare level up tanpa file audio eksternal.
5. **Kontrol & Auto-Aim Support**:
   - Mendukung **Manual Mouse Aim** maupun **Auto-Aim** (tekan `T` untuk berpindah mode).
   - Fitur **Cyber Dash** (`SHIFT` / `SPACE`) memberikan *invulnerability frames* dan efek shockwave.
6. **High Score & Stats Tracking**:
   - Rekor skor tertinggi tersimpan di `localStorage`.
   - Ringkasan statistik akhir (skor, waktu bertahan, total kills, level akhir, wave).

---

## 🕹️ Kontrol Game
- **WASD / Tombol Panah**: Mengendalikan Arah Gerak Pesawat.
- **SHIFT / SPACE**: Menjalankan *Cyber Dash* (Menghindar & Kebal Sementara).
- **MOUSE**: Mengarahkan Tembakan Senjata (Mode Manual).
- **T**: Mengaktifkan / Mematikan Mode *Auto-Aim Target*.
- **P / ESC**: Menjeda (Pause) & Mengatur Opsi Game.

---

## 🚀 Cara Menjalankan
1. Buka file `index.html` langsung di browser web favorit Anda (Google Chrome, MS Edge, Firefox, Brave, dsb.) atau gunakan extension Live Server.
2. Klik **MULAI MISI SURVIVAL**.