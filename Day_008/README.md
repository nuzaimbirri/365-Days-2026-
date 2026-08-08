# Day 008 - Synthwave Beat Hero: Neon Rhythm

## 🎮 Deskripsi Proyek
**Synthwave Beat Hero** adalah sebuah game musik/ritme (*Rhythm Game*) bernuansa **Cyberpunk & Synthwave Retro 80s** yang dibuat menggunakan **HTML5 Canvas**, **Vanilla JavaScript**, dan **Web Audio API**.

Game ini menghadirkan trek nada futuristik (*Perspective 3D Highway*) di mana pemain harus menekan tombol keyboard (`D`, `F`, `J`, `K` atau sentuhan layar) tepat saat nada neon menyentuh garis target.

Proyek ini dibangun sebagai bagian dari tantangan koding **365 Days of Code** (Day 008).

---

## ✨ Fitur Utama
1. **Engine Sintesis Suara & Musik Procedural (Web Audio API)**:
   - Generator musik Synthwave otomatis dengan kick 4-on-the-floor, snare noise, dan arpeggio bassline sintetis tanpa membutuhkan dependensi file eksternal.
   - Pilihan 3 lagu bawaan:
     - ⚡ **Cyber Pulse 1984** (120 BPM - Normal)
     - 🏎️ **Neon Highway Rush** (138 BPM - Hard)
     - 🔥 **Darksynth Fury** (155 BPM - Expert)
   - **Upload File Audio MP3 Sendiri**: Fitur analisis deteksi nada puncak (*Peak Detection Algorithm*) otomatis untuk mengubah file lagu `.mp3` pilihan Anda menjadi *playable rhythm chart*!

2. **Trek Highway Perspektif 3D Canvas**:
   - Visualisasi jalan ritme futuristik (*3D perspective highway grid*) dengan efek *neon glow*, *pulse waves*, dan partikel ledakan saat nada berhasil dipukul (*Perfect Hit Sparkles*).

3. **Sistem Penilaian (Judgment System)**:
   - Tingkat akurasi nada: **PERFECT** (±55ms), **GREAT** (±95ms), **GOOD** (±135ms), dan **MISS**.
   - Penilaian peringkat akhir: **SSS, SS, S, A, B, C**.
   - Multiplier Combo berantai (1x, 2x, 3x, 4x Ultra Combo).

4. **Kustomisasi & Performa**:
   - Layout Tombol Kustom (`D-F-J-K`, `A-S-K-L`, atau `1-2-3-4`).
   - Kontrol Kecepatan Note (1.0x, 1.25x, 1.5x, 2.0x).
   - Tombol Sentuh On-Screen untuk perangkat seluler/layar sentuh.
   - Persistence Skor Tertinggi (*High Score*) via `localStorage`.

---

## 🕹️ Kontrol Game
- **Default Keybinds**: `D` | `F` | `J` | `K` (Track 1 s/d Track 4)
- **Alternate Keybinds**: `A` `S` `K` `L` atau `1` `2` `3` `4`
- **ESC / P**: Menjeda (Pause) permainan.
- **Mouse / Touch Screen**: Klik pada tombol track neon di bagian bawah layar.

---

## 🚀 Cara Menjalankan
1. Buka file `index.html` langsung di browser Anda (misalnya klik ganda `index.html` atau buka via Laragon / Live Server).
2. Pilih lagu atau unggah file MP3 Anda.
3. Tekan **▶ MULAI MAIN** dan nikmati ritme synthwave!