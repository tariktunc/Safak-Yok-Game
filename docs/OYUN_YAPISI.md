# ŞAFAK YOK — Oyun Yapısı & Geliştirme Takibi

> Phaser 3.90 · TypeScript 5 · Vite 8 · Electron 41
> Tür: Bullet-Heaven Survivor (Vampire Survivors / Brotato hibrit)
> Çözünürlük: 960×540 · Arena: 3200×1800

---

## İçindekiler

1. [Oyun Döngüsü](#oyun-döngüsü)
2. [Karakterler](#karakterler)
3. [Silahlar](#silahlar)
4. [Düşmanlar & Boss](#düşmanlar--boss)
5. [Dalga Sistemi](#dalga-sistemi)
6. [Pasif İtemler & Seviye Sistemi](#pasif-itemler--seviye-sistemi)
7. [Shop Sistemi](#shop-sistemi)
8. [Sistemler](#sistemler)
9. [UI & HUD](#ui--hud)
10. [Ses Sistemi](#ses-sistemi)
11. [Kayıt Sistemi](#kayıt-sistemi)
12. [Dosya Yapısı](#dosya-yapısı)
13. [✅ Yapılanlar](#-yapılanlar)
14. [🔴 Kritik Eksikler](#-kritik-eksikler)
15. [🟠 Eksik Özellikler](#-eksik-özellikler)
16. [🟡 İçerik Eksikliği](#-içerik-eksikliği)
17. [🟢 İyileştirme Fırsatları](#-iyileştirme-fırsatları)
18. [Denge Notları](#denge-notları)

---

## Oyun Döngüsü

```
MainMenuScene
    │
    ├─► CharacterSelectScene  (3 karakter, altın ile kilit açma)
    │
    └─► GameScene  ──────────────────────────────┐
              │  (60s dalga, düşman spawn)        │
              │                                   │
              ├─ LevelUpScene (seviye atlama)      │
              │    └─ 3 seçenek: silah/pasif       │
              │                                   │
              ├─ ShopScene (dalga arası)           │
              │    └─ 3 ürün + reroll              │
              │                                   │
              ├─ PauseScene (ESC)                  │
              │                                   │
              └─► GameOverScene ◄──────────────────┘
                   (zafer / yenilgi / dalga başarısız)
```

**Özel akışlar:**
- Son 30 saniyede Boss Sezer spawn → müzik değişir → tüm normal düşmanlar temizlenir
- Boss 30s içinde kesilmezse → `onWaveFail` → "DALGA BAŞARISIZ!" ekranı
- 5. dalga tamamlanırsa → Zafer (Victory)
- Oyuncu ölürse → Game Over (yenilgi)
- Dalga arası: kazanılan altın otomatik bankaya eklenir

---

## Karakterler

| ID | Ad | HP | Hız | Hasar | Atk Hızı | Zırh | Pickup | Şans | Başlama Silahı | Pasif Yetenek | Kilit |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `tarik` | Tarık | 100 | 230 | ×1.1 | ×1.0 | 0 | 80 | ×1.1 | Knife | Her 20 öldürmede +5 can | Ücretsiz |
| `mumin` | Mumin | 80 | 260 | ×1.2 | ×1.1 | 0 | 100 | ×1.2 | Garlic | %25 şansla öldürmede +2 can | 50 altın |
| `orjinal` | Kahraman | 120 | 200 | ×1.0 | ×0.9 | 2 | 70 | ×1.0 | Whip | Hasar alınca %30 şansla +1 zırh (maks 5) | 100 altın |

> **Not:** Sezer artık oynanabilir karakter değil, **Boss** olarak her dalganın son 30 saniyesinde gelir.

---

## Silahlar

### Mevcut Silahlar (5 adet)

| ID | Ad | Hasar | Cooldown | Tür | Max Lv | Evolution | Özellik |
|---|---|---|---|---|---|---|---|
| `knife` | Fırlatma Bıçağı | 10 | 1000ms | projectile | 8 | ✅ Thousand Edge | En yakın düşmanı hedefler |
| `garlic` | Sarımsak | 5 | 500ms | aura | 8 | ✅ Soul Eater | 50px çevresine sürekli hasar |
| `whip` | Kırbaç | 15 | 1200ms | melee | 8 | ✅ Bloody Tear | 80px yay, 3 pierce |
| `holy_water` | Kutsal Su | 8 | 2000ms | area | 8 | ❌ | Yerde hasar gölcüğü |
| `cross_boomerang` | Haç Bumerangi | 12 | 1500ms | projectile | 8 | ❌ | Geri döner, 5 pierce |

### Silah Evrim Sistemi

| Silah | Gerekli Pasif | Sonuç | Durum |
|---|---|---|---|
| Knife (Maks) + Bracer | `bracer` shop itemi | Thousand Edge | ⚠️ Sadece isim/hasar değişiyor |
| Whip (Maks) + Hollow Heart | `hollow_heart` shop itemi | Bloody Tear | ⚠️ Sadece isim/hasar değişiyor |
| Garlic (Maks) + Pummarola | `pummarola` shop itemi | Soul Eater | ⚠️ Sadece isim/hasar değişiyor |

> **Sorun:** Evrim gerçekleşince sadece `data.damage *= 2` ve `data.name` değişiyor.
> Silahın davranışı (ateş deseni, efektler, özellikleri) değişmiyor.

### Level-up Bonusu (Her Seviyede)
- +15% hasar
- −5% cooldown
- Lv 3/5/7: +1 ekstra merci

---

## Düşmanlar & Boss

### Normal Düşmanlar

| ID | Ad | HP | Hız | Hasar | XP | Altın | İlk Dalga | Özel Davranış |
|---|---|---|---|---|---|---|---|---|
| `skeleton` | İskelet | 15 | 65 | 5 | 1 | 3 | 1 | — |
| `bat` | Yarasa | 8 | 95 | 3 | 1 | 3 | 2 | Zigzag |
| `ghost` | Hayalet | 20 | 55 | 7 | 2 | 4 | 2 | Faz geçişi |
| `vampire` | Vampir | 40 | 70 | 10 | 3 | 7 | 3 | Şarj + iyileşme |
| `archer` | Karanlık Okçu | 12 | 45 | 8 | 2 | 5 | 3 | Uzaktan ok atar |

### HP/Hasar Ölçeği (Dalga × Zorluk)

| Dalga | HP Çarpanı | Hasar Çarpanı |
|---|---|---|
| 1 | ×1.00 | ×1.00 |
| 2 | ×1.15 | ×1.08 |
| 3 | ×1.30 | ×1.16 |
| 4 | ×1.55 | ×1.24 |
| 5 | ×1.80 | ×1.32 |

### Boss Sezer (Her Dalganın Son 30 Saniyesi)

| Dalga | HP | Hız | Hasar | XP | Altın | Hedef DPS @ 75% |
|---|---|---|---|---|---|---|
| 1 | 420 | 52 | 8 | 35 | 45 | ~14 |
| 2 | 720 | 58 | 12 | 55 | 65 | ~24 |
| 3 | 1100 | 64 | 16 | 75 | 85 | ~37 |
| 4 | 1550 | 70 | 20 | 95 | 110 | ~52 |
| 5 | 2100 | 77 | 25 | 120 | 150 | ~70 |

**Boss davranışları:**
- Spawn olunca tüm normal düşmanlar temizlenir
- BGM durur, Sezer teması başlar (0'dan yükselir)
- HP azaldıkça müzik sesi düşer (`0.25 + hpRatio × 0.75`)
- Boss öldürülünce müzik fade-out, BGM geri döner
- 30s içinde öldürülemezse → Dalga Başarısız

---

## Dalga Sistemi

**Toplam:** 5 Dalga · Her biri 60 saniye

### Spawn Oranı

| Dalga | Interval | Grup Boyutu | Düşman Türleri |
|---|---|---|---|
| 1 | 2400ms | 1–3 | Sadece iskelet |
| 2 | 1900ms | 2–4 | İskelet, Yarasa, Hayalet |
| 3 | 1500ms | 2–5 | + Vampir, Okçu |
| 4 | 1200ms | 3–6 | Zor mix (Vampir ağırlıklı) |
| 5 | 900ms | 3–7 | Tüm tipler, Vampir/Okçu ağırlıklı |

**Spawn Preview Sistemi:** 1 saniye öncesinde kırmızı uyarı halkası görünür

**Dalga sonu:**
- Boss ölümü → Anında dalga tamamlandı
- Süre doldu + boss sağ → Dalga başarısız
- Tüm düşmanlar temizlenir, %10 HP iyileşme
- Dalga istatistikleri gösterilir (öldürme, hasar, altın, rating A-S)
- Kazanılan altın otomatik bankaya aktarılır

---

## Pasif İtemler & Seviye Sistemi

### XP Eşikleri (Kümülatif)

```
L1:0  L2:12  L3:28  L4:50  L5:76  L6:108  L7:146  L8:190  L9:240  L10:298
L11:370  L12:452  L13:546  L14:654  L15:776  L16:916  L17:1074  L18:1254  L19:1458  L20:1690
```

### LevelUp Pasif Havuzu

**Temel (Her Seviyede):**

| ID | Ad | Etki | Maks Stack |
|---|---|---|---|
| `hp_up` | +25 Maks Can | `maxHp += 25, currentHp += 25` | 3 |
| `speed_up` | +15 Hız | `speed += 15` | 3 |
| `damage_up` | +10% Hasar | `damage *= 1.10` | 3 |
| `pickup_up` | +20 Toplama | `pickupRange += 20` | 3 |

**Orta (L3+):**

| ID | Ad | Etki | Maks Stack |
|---|---|---|---|
| `armor_up` | +1 Zırh | `armor += 1` | 3 |
| `attack_speed_up` | +8% Saldırı Hızı | `attackSpeed *= 1.08` | 3 |
| `hp_regen` | Can Yenileme | Her 5s `+1 can` (stacklenince +1 daha) | 3 |

**İleri (L6+):**

| ID | Ad | Etki | Maks Stack |
|---|---|---|---|
| `luck_up` | +15% Şans | `luck *= 1.15` | 3 |
| `crit_up` | +5% Kritik | `critChance += 0.05` (maks %40) | 3 |
| `dash_up` | Hızlı Kaçış | `DASH_COOLDOWN *= 0.80` | 3 |

### Kombo Sistemi

| Kombo | XP Çarpanı | Süre |
|---|---|---|
| 5–9 | ×1.25 | 2 saniye pencere |
| 10–19 | ×1.50 | |
| 20+ | ×2.00 | |

---

## Shop Sistemi

**Tetikleme:** Her dalga arası
**Ürün sayısı:** 3 (öncelikle 1 silah + 2 pasif)
**Reroll:** 10 altın başlar, her kullanımda +5 artar
**Fiyat artışı:** Dalga başına tüm ürünler +5 altın

### Pasif İtemler (13 Adet)

| ID | Ad | Etki | Temel Fiyat | Maks | Nadir |
|---|---|---|---|---|---|
| `bracer` | Bilek Koruması | +10% Atk Hızı | 15 | 5 | Common |
| `hollow_heart` | Boş Kalp | +20 Maks Can | 10 | 5 | Common |
| `spinach` | Ispanak | +10% Hasar | 15 | 5 | Common |
| `wings` | Kanatlar | +10 Hız | 10 | 5 | Common |
| `magnet` | Mıknatıs | +20 Pickup | 10 | 3 | Common |
| `armor` | Zırh | +1 Zırh | 20 | 5 | Uncommon |
| `clover` | Yonca | +10% Şans | 15 | 3 | Uncommon |
| `pummarola` | Pummarola | +5 HP +5 Hız | 20 | 3 | Uncommon |
| `silver_ring` | Gümüş Yüzük | +15 Hız +10% Şans | 25 | 3 | Uncommon |
| `spellbinder` | Büyü Bağı | +20% Atk Hızı | 20 | 4 | Uncommon |
| `hp_potion` | Can İksiri | +40 Can (anlık) | 25 | 99 | Common |
| `stone_mask` | Taş Maske | +15% Atk Hızı +2 Zırh | 35 | 2 | Rare |
| `skull_omaniac` | Kafatası | +20% Hasar +0.3 Şans | 40 | 3 | Rare |

### Silah İtemler (5 Adet)
`knife` · `garlic` · `whip` · `holy_water` · `cross_boomerang`

---

## Sistemler

### WaveManager
- Spawn interval dinamik (wave + progress bazlı)
- `bossFightMode`: Boss gelince spawn tamamen durur
- `onBossSezerSpawn` / `onWaveComplete` / `onWaveFail` callbacks
- `onSpawnPreview`: 1s öncesinde uyarı halkası

### CollisionSystem
- Spatial Grid (64px hücre) — O(1) yakın düşman sorgusu
- Çarpışma türleri: mermi↔düşman, düşman↔oyuncu, projectile↔oyuncu, xp/gold pickup
- `onEnemyHit` / `onEnemyKilled` / `onPlayerHit` callbacks

### ObjectPool
- Tüm dinamik nesneler için: Enemy (500), Projectile (300), XPGem (200), GoldCoin (200)
- Afterimage pool (20 adet)

### InputManager
| Tuş | Eylem |
|---|---|
| WASD / Yön Tuşları | Hareket |
| SPACE | Dash (1500ms cooldown, 120px) |
| ESC | Pause |
| Mouse | Dünya koordinatı takibi |

### XPSystem
- Level 1–20 (maks 20)
- Seviye atlayınca `onLevelUp` → LevelUpScene açılır

### SaveManager
- **Kalıcı kayıt:** `safak_yok_save` (localStorage)
- **Run kaydı:** `safak_yok_run` (devam sistemi)
- Kaydedilenler: altın, karakterler, silahlar, skor, zorluk, ses ayarları, UI ayarları

### AudioManager
- **BGM:** Prosedürel Web Audio API, 128–140 BPM, 4 yoğunluk seviyesi
- **SFX:** Ayrı `sfxGain` zinciri (musicVolume'dan bağımsız)
- `stopBGM()` SFX'i susturmaz

---

## UI & HUD

### HUD Elemanları

| Konum | İçerik |
|---|---|
| Sol üst | HP bar (renk kodlu) · XP bar · Seviye · DASH cooldown bar |
| Orta üst | Dalga numarası · Geri sayım (dk:sn) · Dalga progress bar |
| Sağ üst | Öldürme sayısı · Altın · Aktif düşman sayısı · Kombo · Skor |
| Alt merkez | Boss HP bar (yoksa gizli) · off-screen boss oku |
| Sol alt | Silah slotları (32×32px, renk kodlu, cooldown overlay) · FPS sayacı |
| Overlay | Low HP yanıp sönmesi (≤%25 HP) |

### Weapon Slot Renk Kodu
- `projectile` → Mavi `#3399ff`
- `melee` → Turuncu `#ff8833`
- `aura` → Yeşil `#33cc33`
- `area` → Cyan `#33cccc`

### MinimapUI
- Sağ alt köşe, 160×90px
- Oyuncu (beyaz), düşmanlar (kırmızı nokta)

---

## Ses Sistemi

### BGM
| Seviye | BPM | İçerik |
|---|---|---|
| 0 | 128 | Kick + Snare + Hihat + Bass + Melody (geç başlar) |
| 1 | 132 | + Erken Melody |
| 2 | 136 | + Ekstra Kick + Snare + Bass Harmony |
| 3 | 140 | + 16th Hihat + Synth Pad |

**Sezer Boss Müziği:** `sezer-theme.m4a` — HP bazlı volume (`0.25 + hpRatio × 0.75`)

### SFX (13 Adet)
`playShoot` · `playHit` · `playKill` · `playXPPickup` · `playGoldPickup`
`playLevelUp` · `playBossKill` · `playVictory` · `playDash` · `playTimerWarning`
`playPlayerHit` · `playPurchase` · `playReroll`

---

## Kayıt Sistemi

### SaveData (Kalıcı)
```typescript
gold: number                    // Banka altını
unlockedCharacters: string[]    // Açık karakterler
unlockedWeapons: string[]       // Açık silahlar
highScore: number
totalKills: number
totalRuns: number
difficulty: 'easy' | 'normal' | 'hard'
musicVolume: number             // 0.0 – 1.0
sfxVolume: number               // 0.0 – 1.0
showFps: boolean
showDamageNumbers: boolean
cameraShake: boolean
```

### RunSaveData (Devam Kaydı)
```typescript
characterId, wave, playerLevel, playerHp, playerStats
passiveItems[], weaponIds[], weaponLevels{}, gold, kills
```

---

## Dosya Yapısı

```
src/
├── scenes/
│   ├── PreloadScene.ts       ← Varlık yükleme, sprite oluşturma
│   ├── MainMenuScene.ts      ← Ana menü, devam butonu
│   ├── CharacterSelectScene.ts ← Karakter seçimi, kilit açma
│   ├── GameScene.ts          ← Ana oyun (800+ satır)
│   ├── LevelUpScene.ts       ← Seviye atla, 3 seçenek
│   ├── ShopScene.ts          ← Dalga arası mağaza
│   ├── PauseScene.ts         ← Duraklama ekranı
│   ├── SettingsScene.ts      ← Ayarlar (ses, ekran, zorluk)
│   └── GameOverScene.ts      ← Oyun sonu ekranı
├── systems/
│   ├── WaveManager.ts        ← Spawn + dalga + boss sistemi
│   ├── XPSystem.ts           ← Seviye hesaplama
│   ├── SaveManager.ts        ← LocalStorage kalıcı kayıt
│   ├── ShopManager.ts        ← Ürün üretimi + fiyatlandırma
│   ├── AudioManager.ts       ← Web Audio BGM + SFX
│   ├── InputManager.ts       ← Klavye + mouse
│   ├── CollisionSystem.ts    ← Spatial grid çarpışma
│   ├── ObjectPool.ts         ← Genel nesne havuzu
│   └── SpatialGrid.ts        ← O(1) yakın nesne sorgusu
├── weapons/
│   ├── WeaponBase.ts         ← Temel silah sınıfı
│   ├── WeaponEvolution.ts    ← Evrim reçeteleri
│   └── weapons/
│       ├── Knife.ts
│       ├── Garlic.ts
│       ├── Whip.ts
│       ├── HolyWater.ts
│       └── CrossBoomerang.ts
├── entities/
│   ├── Player.ts             ← Hareket, dash, stat, pasif uygulama
│   ├── Enemy.ts              ← Davranış, projectile, vampir heal
│   ├── Projectile.ts         ← Mermi fizik + pierce
│   ├── XPGem.ts              ← XP kristali
│   ├── GoldCoin.ts           ← Altın parası
│   └── DamageNumber.ts       ← Hasar sayısı animasyonu
├── ui/
│   ├── HUD.ts                ← Tüm HUD elemanları
│   └── MinimapUI.ts          ← Mini harita
├── data/
│   ├── characters.json       ← 3 karakter tanımı
│   ├── weapons.json          ← 5 silah tanımı
│   └── shop-items.json       ← 13 pasif + 5 silah
└── utils/
    ├── constants.ts          ← Tüm oyun sabitleri
    ├── types.ts              ← TypeScript interface'leri
    └── math.ts               ← Yardımcı matematik fonksiyonları
```

---

## ✅ Yapılanlar

### Temel Oyun
- [x] Phaser 3 + TypeScript + Vite + Electron kurulumu
- [x] 960×540 çözünürlük, 3200×1800 arena
- [x] WASD/Yön tuşu hareket, 8 yön sprite flip
- [x] Dash (SPACE) — 120px, 1500ms cooldown, kısa süre dokunulmazlık
- [x] Kamera takip (lerp 0.1), arena sınır kilidi
- [x] Object pool: Enemy (500), Projectile (300), XPGem, GoldCoin
- [x] Spatial grid tabanlı çarpışma sistemi
- [x] Dokunulmazlık sistemi (500ms hasar sonrası)

### Karakterler
- [x] 3 oynanabilir karakter (Tarık, Mumin, Kahraman)
- [x] Karakter bazlı başlangıç statsları
- [x] Karakter pasif yetenekleri (Savaşçı Ruhu, Kan Emici, Demir Cilt)
- [x] Altın ile karakter kilit açma (50 / 100)
- [x] Karakter seçim ekranı — responsive kart layout
- [x] Klavye kısayolları (1/2/3)

### Silahlar
- [x] 5 silah: Knife, Garlic, Whip, Holy Water, Cross Boomerang
- [x] Silah level sistemi (1–8), level başına +15% hasar / −5% cooldown
- [x] Lv3/5/7'de ekstra merci
- [x] Silah evrim sistemi (recipe kontrolü)
- [x] Level-up ekranında yeni silah seçimi
- [x] Maks 6 silah limiti
- [x] Shop'tan silah satın alma

### Düşmanlar
- [x] 5 düşman tipi (İskelet, Yarasa, Hayalet, Vampir, Okçu)
- [x] Vampire heal sistemi (1500ms cooldown ile)
- [x] Archer uzaktan projectile
- [x] Düşman HP/hasar dalga ölçeği
- [x] Düşman ölüm animasyonu (shrink + fade)
- [x] Ölüm parçacık efektleri (renk kodlu)

### Boss Sistemi
- [x] Boss Sezer her dalganın son 30 saniyesinde spawn
- [x] Spawn anında tüm normal düşmanlar temizlenir
- [x] Boss gelince BGM durur, Sezer teması başlar
- [x] HP azaldıkça müzik sesi düşer
- [x] Boss öldürülünce müzik fade-out, BGM geri döner
- [x] 30s içinde kesilmezse Dalga Başarısız ekranı
- [x] Boss HP per-wave dengesi (75% verimli oyuncu hedefi)
- [x] HUD boss HP bar (renk kodlu, off-screen ok)
- [x] "S E Z E R" duyuru ekranı

### Dalga Sistemi
- [x] 5 dalga × 60 saniye
- [x] Spawn preview (1s öncesi kırmızı halka uyarısı) ✨ YENİ
- [x] Dalga sonu: %10 HP iyileşme
- [x] Dalga sonu istatistik overlay (öldürme, hasar, altın, A–S rating)
- [x] "DALGA X TAMAM!" / "DALGA X BAŞLIYOR!" duyuruları
- [x] 10s kala uyarı sesi + kırmızı ekran darbesi

### Seviye & Pasif
- [x] 20 seviye, kümülatif XP eşikleri
- [x] 3 pasif kategori (temel / orta L3+ / ileri L6+)
- [x] 10 pasif ID, max 3 kez alınabilir
- [x] Pasif uygulaması tek noktada (`Player.applyPassive`)
- [x] Devam kaydında pasif restore
- [x] hp_regen timer sistemi
- [x] crit_up kritik vuruş sistemi (%15 başlangıç, %40 maks)
- [x] dash_up cooldown azaltma

### Shop
- [x] 13 pasif item + 5 silah
- [x] Dinamik fiyatlandırma (dalga başına +5)
- [x] Reroll (10 → artan)
- [x] HP potion anlık iyileşme
- [x] Shop SFX (satın alma, reroll) ✨ YENİ

### UI / HUD
- [x] HP bar (renk: yeşil→sarı→kırmızı)
- [x] XP bar, seviye göstergesi
- [x] Dalga sayacı, geri sayım, progress bar
- [x] Öldürme, altın, düşman sayısı, kombo, skor
- [x] Silah slotları (cooldown overlay, renk kodlu)
- [x] Boss HP bar (tüm boss'lar için `isBoss === true`)
- [x] Off-screen boss oku (yanıp sönen)
- [x] Low HP kırmızı overlay
- [x] FPS sayacı (ayardan açılıp kapanabilir) ✨ YENİ
- [x] Minimap (oyuncu + düşmanlar)

### Ses
- [x] Prosedürel BGM (4 yoğunluk seviyesi)
- [x] 13 SFX efekti
- [x] BGM ve SFX ayrı gain zinciri (birbirini etkilemez) ✨ YENİ
- [x] sfxVolume ayarı çalışır ✨ YENİ
- [x] Sezer boss teması (HP bazlı volume)

### Ayarlar & Kayıt
- [x] Ses seviyesi (müzik + efekt, 5 adım)
- [x] Zorluk seçimi (kolay/normal/zor)
- [x] FPS göster toggle — HUD'a bağlı ✨ YENİ
- [x] Hasar sayıları toggle — GameScene'e bağlı ✨ YENİ
- [x] Kamera sarsıntısı toggle — `shake()` helper ✨ YENİ
- [x] localStorage kalıcı kayıt
- [x] Devam (run save) sistemi
- [x] Dalga altınları otomatik bankaya aktarma

### Görsel Efektler
- [x] Kritik vuruş flaşı
- [x] Hasar sayısı animasyonu
- [x] Seviye atlama halkaları + parçacıklar
- [x] Mermi iz efekti
- [x] Çarpma kıvılcımı
- [x] Ölüm parçacıkları (düşmana göre renk)
- [x] Dash afterimage (nesne pool)
- [x] Pasif tetiklenme bildirimi (yükselen metin)
- [x] Oyuncu ölüm animasyonu

---

## ✅ (Çözümlendi) Kritik Eksikler

### 1. ✅ Silah Evrimi Mekanik Değişimi (YENİ)
**Durum:** TAMAMLANDI.
- **Thousand Edge (Knife):** 8 yöne eşit aralıklı bıçak yağmuru (mor parıltı)
- **Bloody Tear (Whip):** Vuruş başına %30 hasar kadar can çalma (kırmızı görsel)
- **Soul Eater (Garlic):** +100 menzil (2x büyük aura), mor/koyu görsel
- **İlahi Zemin (Holy Water):** 2x büyük havuz, 2x uzun süre, altın/kutsal renk
- **Çapraz Fırtına (Cross Boomerang):** 4 kardinal yöne eşzamanlı ateş, turuncu görsel
**Pasif gereksinimleri:** bracer→knife, hollow_heart→whip, pummarola→garlic, spellbinder→holy_water, spinach→cross_boomerang

### 2. ✅ BGM Menüye Çıkışta Çakışma (YENİ)
**Durum:** TAMAMLANDI. PauseScene'de `audioManager.stopBGM()` çağrısı mevcut.

---

## 🟠 Eksik Özellikler

### 3. (artık tamamlandı — yukarıya taşındı) Holy Water & Cross Boomerang Evrim Yok
**Durum:** ✅ TAMAMLANDI. 5 silahın 5'inde de evrim mevcut.

### 4. Achievement / Milestone Sistemi
**Durum:** Hiç yok.
**Önerilen başarımlar:**
- 100 öldürme, 1000 öldürme
- İlk boss öldürme
- Tüm dalgaları tamamla
- Hiç hasar almadan dalga bitir
- 3 silah sahibi ol

### 5. 4. Karakter Eksik
**Durum:** Sezer boss'a dönüştürüldü, yerine 4. oynanabilir karakter gelmedi.
**Öneri:** Farklı pasif/silahla yeni karakter (ör. Korku: maks 3 silah ama güçlü başlangıç)

### 6. Yeni Silahlar
**Durum:** 5 silah var; çeşitlilik yetersiz 3. dalgadan itibaren tekrar ediyor.
**Önerilen:**
- **Freeze Ray** — yavaşlatan ışın
- **Lightning** — zincir yıldırım
- **Bounce Ball** — seken top
- **Bible** — çevreden dönen kitap
- **Fire Wand** — alev mermisi

### 7. Minimap İyileştirmesi
**Durum:** Sadece oyuncu + kırmızı düşman noktası.
**Eksik:** Boss oku, XP/altın konumları, yüksek hasar düşmanı vurgusu

---

## 🟡 İçerik Eksikliği

### 8. Boss Sprite'ları Placeholder
**Sorun:** Boss'lar için özel sprite yok; `enemies` spritesheet frame'leri kullanılıyor.
**Etkilenen:** Tüm boss karşılaşmalarında görsel tutarsızlık

### 9. Archer Ok Grafiği
**Sorun:** `arrow` texture yükleniyor ama çalışmıyor; `Graphics` ile basit çizgi kullanılıyor.

### 10. Weapon Sprite'ları Yok
**Sorun:** Silah slot'ları için sprite yok, kısaltma metni (`BÇK`, `SRM`) kullanılıyor.

### 11. Victory / Game Over Jingle Eksik
**Durum:** `playVictory()` prosedürel SFX çalıyor ama kısa bir "zafer müziği" yok.

---

## 🟢 İyileştirme Fırsatları

### 12. GameScene Bölünmesi
**Durum:** 800+ satır tek dosya. Zor okunabilir.
**Öneri:** Effect'ler, callbacks, UI ayrı sınıflara taşınabilir.

### 13. Boss Fight Modu Göstergesi
**Durum:** Boss geldiğinde wave progress bar rengi değişmiyor.
**Öneri:** Boss fight süresince bar kırmızı yanıp sönsün, kalanı göstersin.

### 14. Dalga 1–2 Arası Denge Testi
**Durum:** Wave 1–2 çok kolay, wave 4–5 çok zor olabilir.
**Öneri:** Playtest sonrası HP/spawn oranı tweaks.

### 15. Renk Körü Desteği
**Durum:** HUD tamamen renge dayanıyor (HP bar, XP bar, boss bar).
**Öneri:** Şekil/işaret alternatifi eklenmeli.

### 16. Kombo Sistemi Genişletmesi
**Durum:** Kombo sadece XP'yi artırıyor.
**Öneri:** Yüksek komboda hasar bonusu veya görsel efekt.

### 17. Boss Fight Ekstra Gerilim
**Durun:** Boss gelince sadece müzik değişiyor.
**Öneri:** Kalan süre sayacı daha belirgin, zemin rengi değişimi, acil uyarı flaşı.

---

## Denge Notları

### Zorluk Çarpanları
| Zorluk | Düşman HP | Düşman Hasar | Oyuncu Hasar |
|---|---|---|---|
| Kolay | ×0.7 | ×0.5 | ×1.5 |
| Normal | ×1.0 | ×1.0 | ×1.0 |
| Zor | ×1.5 | ×1.5 | ×0.8 |

### Hedef Oyuncu İlerlemesi (Normal Zorluk)
| Dalga Sonu | Beklenen Seviye | Beklenen DPS |
|---|---|---|
| Wave 1 | L3–4 | ~18 |
| Wave 2 | L5–7 | ~32 |
| Wave 3 | L8–10 | ~50 |
| Wave 4 | L11–14 | ~70 |
| Wave 5 | L15–18 | ~95 |

### Altın Ekonomisi
- Dalga başına ortalama gelir: 25–45 altın
- Shop en ucuz ürün: 10 altın
- Karakter kilit açma: 50 / 100 altın
- Reroll başlangıç: 10 altın

---

*Son güncelleme: 2026-03-19*
*Branch: master*
