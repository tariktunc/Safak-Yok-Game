import Phaser from 'phaser';
import { Enemy } from '../entities/Enemy';
import { ObjectPool } from './ObjectPool';
import { EnemyData } from '../utils/types';
import { WAVE_COUNT, ARENA_WIDTH, ARENA_HEIGHT, GAME_WIDTH, GAME_HEIGHT } from '../utils/constants';
import { getSpawnPositionOutsideCamera, getSpawnPositionNearPlayer } from '../utils/math';

const ENEMY_DATA: Record<string, EnemyData> = {
  skeleton: {
    id: 'skeleton',
    name: 'İskelet',
    hp: 15,
    speed: 65,
    damage: 5,
    xpValue: 1,
    goldValue: 3,
    spriteKey: 'enemies',
    isBoss: false
  },
  bat: {
    id: 'bat',
    name: 'Yarasa',
    hp: 8,
    speed: 95,
    damage: 3,
    xpValue: 1,
    goldValue: 3,
    spriteKey: 'enemies',
    isBoss: false
  },
  vampire: {
    id: 'vampire',
    name: 'Vampir',
    hp: 40,
    speed: 70,
    damage: 10,
    xpValue: 3,
    goldValue: 7,
    spriteKey: 'enemies',
    isBoss: false
  },
  ghost: {
    id: 'ghost',
    name: 'Hayalet',
    hp: 20,
    speed: 55,
    damage: 7,
    xpValue: 2,
    goldValue: 4,
    spriteKey: 'enemies',
    isBoss: false
  },
  archer: {
    id: 'archer',
    name: 'Karanlık Okçu',
    hp: 12,
    speed: 45,
    damage: 8,
    xpValue: 2,
    goldValue: 5,
    spriteKey: 'enemies',
    isBoss: false
  }
};

// ─── Boss Sezer per-wave stats ───────────────────────────────────────────────
// Denge: 30s boss fight, 75% verimli oyuncu (tahmini DPS × 0.75 × 30s = boss HP)
// Wave 1: ~18 DPS → 405 HP | Wave 2: ~32 DPS → 720 HP | Wave 3: ~50 DPS → 1125 HP
// Wave 4: ~70 DPS → 1575 HP | Wave 5: ~95 DPS → 2137 HP
const BOSS_SEZER_PER_WAVE: Record<number, { hp: number; speed: number; damage: number; xpValue: number; goldValue: number }> = {
  1: { hp: 420,  speed: 52, damage: 8,  xpValue: 35,  goldValue: 45  },
  2: { hp: 720,  speed: 58, damage: 12, xpValue: 55,  goldValue: 65  },
  3: { hp: 1100, speed: 64, damage: 16, xpValue: 75,  goldValue: 85  },
  4: { hp: 1550, speed: 70, damage: 20, xpValue: 95,  goldValue: 110 },
  5: { hp: 2100, speed: 77, damage: 25, xpValue: 120, goldValue: 150 },
};

export class WaveManager {
  private scene: Phaser.Scene;
  private enemyPool: ObjectPool<Enemy>;
  private currentWave: number = 1;
  private difficultyHpMult: number;
  private difficultyDamageMult: number;
  private waveTimer: number = 0;
  private spawnTimer: number = 0;
  private waveActive: boolean = false;
  private playerX: number = 0;
  private playerY: number = 0;
  private cameraX: number = 0;
  private cameraY: number = 0;
  public onWaveComplete?: () => void;
  public onWaveFail?: () => void;
  public onBossSezerSpawn?: () => void;
  private bossSpawned: boolean = false;
  private activeBoss: Enemy | null = null;
  private bossFightMode: boolean = false;

  /** Callback for spawn preview warnings – called 1s before enemies actually spawn */
  public onSpawnPreview?: (positions: { x: number; y: number }[]) => void;
  private pendingSpawn: { positions: { x: number; y: number }[]; count: number; timer: number } | null = null;

  constructor(scene: Phaser.Scene, enemyPool: ObjectPool<Enemy>, difficultyHpMult = 1, difficultyDamageMult = 1) {
    this.scene = scene;
    this.enemyPool = enemyPool;
    this.difficultyHpMult = difficultyHpMult;
    this.difficultyDamageMult = difficultyDamageMult;
  }

  startWave(waveNumber: number): void {
    this.currentWave = waveNumber;
    this.waveTimer = 0;
    this.spawnTimer = 0;
    this.waveActive = true;
    this.pendingSpawn = null;
    this.bossSpawned = false;
    this.activeBoss = null;
    this.bossFightMode = false;
  }

  getWaveDuration(): number {
    return 60_000; // Her bölüm 1 dakika
  }

  /** Düşman spawn aralığı — ilk 30s'de aktif, boss gelince durur */
  private getCurrentSpawnInterval(): number {
    const wave = this.currentWave;
    const elapsed = this.waveTimer;
    const duration = this.getWaveDuration();
    const progress = elapsed / duration;

    // Dalga ilerledikçe daha hızlı spawn
    let baseInterval: number;
    if (wave === 1) {
      baseInterval = 2400;
    } else if (wave === 2) {
      baseInterval = 1900;
    } else if (wave === 3) {
      baseInterval = 1500;
    } else if (wave === 4) {
      baseInterval = 1200;
    } else {
      baseInterval = 900;
    }

    // İlk yarıda hafif ramp
    if (progress > 0.33) {
      return Math.max(400, baseInterval * 0.8);
    }
    return baseInterval;
  }

  private getSpawnGroupCount(): number {
    const wave = this.currentWave;
    const elapsed = this.waveTimer;
    const duration = this.getWaveDuration();
    const progress = elapsed / duration;

    let baseMin: number;
    let baseRange: number;
    if (wave === 1) { baseMin = 1; baseRange = 2; }
    else if (wave === 2) { baseMin = 2; baseRange = 2; }
    else if (wave === 3) { baseMin = 2; baseRange = 3; }
    else if (wave === 4) { baseMin = 3; baseRange = 3; }
    else { baseMin = 3; baseRange = 4; }

    if (progress > 0.33) {
      baseMin += 1;
      baseRange += 1;
    }

    return baseMin + Math.floor(Math.random() * baseRange);
  }

  update(delta: number, playerX: number, playerY: number, cameraX: number, cameraY: number): void {
    if (!this.waveActive) return;

    this.playerX = playerX;
    this.playerY = playerY;
    this.cameraX = cameraX;
    this.cameraY = cameraY;

    this.waveTimer += delta;
    this.spawnTimer += delta;

    // Pending spawn (spawn preview delay)
    if (this.pendingSpawn) {
      this.pendingSpawn.timer -= delta;
      if (this.pendingSpawn.timer <= 0) {
        this.spawnEnemiesAtPositions(this.pendingSpawn.positions);
        this.pendingSpawn = null;
      }
    }

    // Boss ölümünü kontrol et → wave tamamlandı
    if (this.activeBoss && !this.activeBoss.active) {
      this.activeBoss = null;
      this.bossFightMode = false;
      this.waveActive = false;
      this.pendingSpawn = null;
      this.onWaveComplete?.();
      return;
    }

    // Normal spawn — boss gelmediyse ve boss savaşı yoksa
    if (!this.bossFightMode) {
      const spawnInterval = this.getCurrentSpawnInterval();
      if (this.spawnTimer >= spawnInterval && !this.pendingSpawn) {
        this.spawnTimer = 0;
        this.prepareSpawn();
      }
    }
    // bossFightMode = true olduğunda spawn tamamen durur (sadece boss vs player)

    // Son 30 saniyede Boss Sezer spawn
    const waveDuration = this.getWaveDuration();
    if (!this.bossSpawned && this.waveTimer >= waveDuration - 30000) {
      this.bossSpawned = true;
      this.bossFightMode = true;
      this.pendingSpawn = null; // Bekleyen spawn'ı iptal et
      this.activeBoss = this.spawnBossForWave();
      this.onBossSezerSpawn?.();
    }

    // Süre doldu
    if (this.waveTimer >= waveDuration) {
      this.waveActive = false;
      this.pendingSpawn = null;
      // Boss hâlâ hayattaysa → dalga başarısız
      if (this.activeBoss && this.activeBoss.active) {
        this.activeBoss = null;
        this.bossFightMode = false;
        this.onWaveFail?.();
      } else {
        this.onWaveComplete?.();
      }
    }
  }

  /** Mevcut dalga için Boss Sezer verisi — dalga sayısına göre ölçeklenmiş */
  private getBossForWave(): EnemyData {
    const wave = Math.min(this.currentWave, 5);
    const cfg = BOSS_SEZER_PER_WAVE[wave];
    return {
      id: 'boss_sezer',
      name: 'Sezer',
      hp: cfg.hp,
      speed: cfg.speed,
      damage: cfg.damage,
      xpValue: cfg.xpValue,
      goldValue: cfg.goldValue,
      spriteKey: 'enemies',
      frame: 6,
      isBoss: true
    };
  }

  private spawnBossForWave(): Enemy | null {
    const boss = this.enemyPool.get();
    if (!boss) return null;
    const pos = getSpawnPositionOutsideCamera(
      this.cameraX, this.cameraY,
      GAME_WIDTH, GAME_HEIGHT,
      ARENA_WIDTH, ARENA_HEIGHT
    );
    const bossData = this.getBossForWave();
    // Boss HP difficulty ile scale edilir ama damage sadece dalga bazlı
    const hpMult = this.difficultyHpMult;
    const dmgMult = this.difficultyDamageMult;
    boss.spawn(pos.x, pos.y, bossData, hpMult, dmgMult, 1.0);
    return boss;
  }

  /** Pre-generate spawn positions, emit preview, then spawn after 1s delay */
  private prepareSpawn(): void {
    const count = this.getSpawnGroupCount();
    const positions: { x: number; y: number }[] = [];

    for (let i = 0; i < count; i++) {
      positions.push(getSpawnPositionNearPlayer(
        this.playerX, this.playerY,
        180, 300,
        ARENA_WIDTH, ARENA_HEIGHT
      ));
    }

    this.onSpawnPreview?.(positions);
    this.pendingSpawn = { positions, count, timer: 1000 };
  }

  /** C3: HP scaling multiplier based on wave tier + difficulty */
  private getWaveMultiplier(): number {
    const wave = this.currentWave;
    let base: number;
    if (wave <= 2)  { base = 1.0 + (wave - 1) * 0.15; }
    else if (wave <= 4) { base = 1.3 + (wave - 3) * 0.25; }
    else { base = 1.8; }
    return base * this.difficultyHpMult;
  }

  private getDamageMultiplier(): number {
    return (1 + (this.currentWave - 1) * 0.08) * this.difficultyDamageMult;
  }

  private getGoldMultiplier(): number {
    return Math.min(1 + (this.currentWave - 1) * 0.20, 3.0);
  }

  private spawnEnemiesAtPositions(positions: { x: number; y: number }[]): void {
    const waveMultiplier = this.getWaveMultiplier();
    const damageMultiplier = this.getDamageMultiplier();
    const goldMultiplier = this.getGoldMultiplier();

    for (let i = 0; i < positions.length; i++) {
      const enemy = this.enemyPool.get();
      if (!enemy) break;
      const enemyType = this.getRandomEnemyType();
      enemy.spawn(positions[i].x, positions[i].y, ENEMY_DATA[enemyType], waveMultiplier, damageMultiplier, goldMultiplier);
    }
  }

  private getRandomEnemyType(): string {
    const wave = this.currentWave;
    if (wave === 1) return 'skeleton';
    if (wave === 2) {
      const types = ['skeleton', 'skeleton', 'bat', 'ghost'];
      return types[Math.floor(Math.random() * types.length)];
    }
    if (wave === 3) {
      const types = ['skeleton', 'bat', 'ghost', 'vampire', 'archer'];
      return types[Math.floor(Math.random() * types.length)];
    }
    if (wave === 4) {
      const types = ['bat', 'ghost', 'vampire', 'vampire', 'archer', 'archer'];
      return types[Math.floor(Math.random() * types.length)];
    }
    // Wave 5
    const types = ['ghost', 'vampire', 'vampire', 'archer', 'archer', 'vampire'];
    return types[Math.floor(Math.random() * types.length)];
  }

  get wave(): number { return this.currentWave; }
  get isWaveActive(): boolean { return this.waveActive; }
  get waveProgress(): number { return Math.min(this.waveTimer / this.getWaveDuration(), 1); }
  get waveTimeRemaining(): number { return Math.max(0, this.getWaveDuration() - this.waveTimer); }
  get totalWaves(): number { return WAVE_COUNT; }
  get isLastWave(): boolean { return this.currentWave >= WAVE_COUNT; }
  get isBossFightActive(): boolean { return this.bossFightMode; }
}
