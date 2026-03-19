<div align="center">

```
███████╗ █████╗ ███████╗ █████╗ ██╗  ██╗    ██╗   ██╗ ██████╗ ██╗  ██╗
██╔════╝██╔══██╗██╔════╝██╔══██╗██║ ██╔╝    ╚██╗ ██╔╝██╔═══██╗██║ ██╔╝
███████╗███████║█████╗  ███████║█████╔╝      ╚████╔╝ ██║   ██║█████╔╝
╚════██║██╔══██║██╔══╝  ██╔══██║██╔═██╗       ╚██╔╝  ██║   ██║██╔═██╗
███████║██║  ██║██║     ██║  ██║██║  ██╗       ██║   ╚██████╔╝██║  ██╗
╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝       ╚═╝    ╚═════╝ ╚═╝  ╚═╝
```

**Şafak sökmeden hepsini yen.**

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Phaser](https://img.shields.io/badge/Phaser_3-8B0000?style=flat-square&logo=javascript&logoColor=white)
![Electron](https://img.shields.io/badge/Electron-47848F?style=flat-square&logo=electron&logoColor=white)
![Platform](https://img.shields.io/badge/Platform-Windows_%7C_Web_%7C_Mobil-222?style=flat-square)
![License](https://img.shields.io/badge/Lisans-MIT-green?style=flat-square)

</div>

---

## Hakkında

**Şafak Yok**, Vampire Survivors'tan ilham alan hızlı tempolu bir hayatta kalma oyunudur. Gece boyunca giderek güçlenen düşman dalgalarına karşı savaş. Altın topla, silah geliştir, boss'ları yen — ama dikkat: **şafak sökerse kaybedersin.**

> Blakfy Studio tarafından geliştirildi · TypeScript + Phaser 3 + Electron

---

## Oyna

### Masaüstü (Windows .exe)

1. Sayfanın üstündeki yeşil **`< > Code`** butonuna tıkla → **Download ZIP**
2. ZIP'i çıkart → **`EXE DOSYASI`** klasörüne gir
3. **`SafakYok.exe`** dosyasına çift tıkla

> **Windows Defender uyarısı** çıkarsa → "Daha fazla bilgi" → "Yine de çalıştır"
> *(İmzasız uygulama olduğu için normaldir.)*

### Tarayıcı / Mobil

```
npm run web:dev   →  http://localhost:3001
```

Telefonda aç, **yatay tut** — joystick ve DASH butonu otomatik çıkar.

---

## Karakterler

| | Karakter | Can | Hız | Hasar | Pasif Yetenek |
|---|---|---|---|---|---|
| ⚔️ | **Tarık** | 95 | 240 | ×1.25 | **Kan Öfkesi** — HP %50 altında +%40 hasar, +30 hız |
| 🏹 | **Mumin** | 75 | 265 | ×1.10 | **Tetik Parmaklı** — her öldürmede %25 şansla ekstra ok |
| 🛡️ | **Kahraman** | 130 | 195 | ×0.90 | **Demir Cilt** — hasar alınca %30 şansla +1 zırh (maks 6) |

---

## Silahlar

| Silah | Açıklama |
|-------|----------|
| 🗡️ **Bıçak** | Hedefe hızlı tek atış |
| 🌀 **Kamçı** | Geniş yay hasarı |
| 🧄 **Sarımsak** | Etraf alanı hasarı |
| 💧 **Kutsal Su** | Zemine bomba bırakır |
| ✝️ **Çapraz Bumerang** | Gidip gelen alan hasarı |
| ⚔️ **Kılıç** | Yakın mesafe güçlü vuruş |

> Silahları level atlayarak geliştir, **6 özel evrimi** aç.

---

## Oyun Döngüsü

```
Karakter Seç  →  Dalga Başlar  →  Düşmanları Öldür  →  XP & Altın Topla
      ↑                                                          ↓
  Devam Kaydet                                           Dükkan Aç
      ↑                                                          ↓
  Boss Savaşı  ←  Dalga Sonu  ←  Level Atla  ←  Pasif/Silah Al
```

- **5 Dalga** giderek zorlaşır — her dalga ~60 saniye
- Dalga ortasında **Sezer** (mini boss) belirir
- Her dalga sonunda **rakip karakter** boss olarak gelir
- Dalgalar arası **dükkan** — altınla güçlü pasifler al
- 5. dalgayı tamamla → **Zafer**

---

## Zorluk Seviyeleri

| Zorluk | Düşman Hasar | Düşman Can | Oyuncu Hasar |
|--------|:---:|:---:|:---:|
| 🟢 Kolay | ×0.5 | ×0.7 | ×1.5 |
| 🟡 Normal | ×1.0 | ×1.0 | ×1.0 |
| 🔴 Zor | ×1.5 | ×1.5 | ×0.8 |

---

## Kontroller

### Masaüstü

| Tuş | Aksiyon |
|-----|---------|
| `W A S D` / Ok Tuşları | Hareket |
| `Space` | Dash |
| `ESC` | Duraklat |

### Mobil

| Kontrol | Aksiyon |
|---------|---------|
| Sol yarı — joystick | Hareket |
| Sağ alt — **DASH** butonu | Dash |
| Sağ üst — **❙❙** butonu | Duraklat |

---

## Geliştirici Kurulumu

### Gereksinimler

- Node.js v18+
- npm v9+

### Çalıştır

```bash
git clone git@github.com:tariktunc/Safak-Yok-Game.git
cd Safak-Yok-Game
npm install

npm run dev          # Electron (masaüstü)
npm run web:dev      # Tarayıcı  →  localhost:3001
```

### Build

```bash
npm run build        # Electron build
npm run web:build    # Web build  →  dist-web/
npm run dist         # Windows .exe
```

---

## Teknolojiler

| | Teknoloji | Kullanım |
|---|---|---|
| 🎮 | **Phaser 3** | Oyun motoru, renderer, fizik |
| 🖥️ | **Electron** | Masaüstü uygulama paketi |
| 🔷 | **TypeScript** | Tip güvenli geliştirme |
| ⚡ | **Vite** | Build ve hot reload |
| 🔊 | **Web Audio API** | Prosedürel müzik & ses efektleri |

---

<div align="center">

MIT © 2024 **Blakfy Studio**

*Şafak sökmesin.*

</div>
