import Phaser from 'phaser';
import { WeaponBase } from '../WeaponBase';
import { Player } from '../../entities/Player';
import { Enemy } from '../../entities/Enemy';

export class Garlic extends WeaponBase {
  private enemies: Enemy[];
  private gfx: Phaser.GameObjects.Graphics;
  private orbitAngle: number = 0;
  private hitCooldowns: Map<Enemy, number> = new Map();
  private readonly HIT_COOLDOWN = 600; // aynı düşmana tekrar vurma süresi (ms)

  constructor(scene: Phaser.Scene, owner: Player, enemies: Enemy[]) {
    super(scene, owner, {
      id: 'garlic',
      name: 'Dönen Bıçaklar',
      damage: 10,
      cooldown: 9999999, // attack() kullanılmıyor
      projectileSpeed: 0,
      projectileCount: 0,
      pierce: 0,
      range: 100,
      type: 'aura'
    });
    this.enemies = enemies;
    this.gfx = scene.add.graphics().setDepth(9);
  }

  /** Seviyeye göre bıçak sayısı: 3→4→5→6 */
  private get knifeCount(): number {
    return Math.min(3 + Math.floor(this.level / 2), 8);
  }

  update(delta: number): void {
    // super.update() çağrılmıyor — attack() döngüsü kullanmıyoruz
    this.orbitAngle += delta * 0.0028;

    // Per-enemy cooldown güncelle
    for (const [enemy, cd] of this.hitCooldowns) {
      const remaining = cd - delta;
      if (remaining <= 0) {
        this.hitCooldowns.delete(enemy);
      } else {
        this.hitCooldowns.set(enemy, remaining);
      }
    }

    this.checkKnifeHits();
    this.drawKnives();
  }

  attack(): void {
    // Orbital silahta kullanılmıyor
  }

  private checkKnifeHits(): void {
    const radius = this.data.range;
    const damage = this.effectiveDamage;
    const count = this.knifeCount;
    const HIT_R = 16 * 16; // bıçak çarpışma yarıçapı karesi

    for (let k = 0; k < count; k++) {
      const angle = this.orbitAngle + (k / count) * Math.PI * 2;
      const kx = this.owner.x + Math.cos(angle) * radius;
      const ky = this.owner.y + Math.sin(angle) * radius;

      for (const enemy of this.enemies) {
        if (!enemy.active || this.hitCooldowns.has(enemy)) continue;
        const dx = enemy.x - kx;
        const dy = enemy.y - ky;
        if (dx * dx + dy * dy <= HIT_R) {
          const killed = enemy.takeDamage(damage);
          this.onMeleeHit?.(enemy, damage);
          this.hitCooldowns.set(enemy, this.HIT_COOLDOWN);
          if (killed) this.onEnemyKilled?.(enemy);
        }
      }
    }
  }

  private drawKnives(): void {
    this.gfx.clear();
    const radius = this.data.range;
    const count = this.knifeCount;
    const isSoulEater = this.data.id === 'soul_eater';

    // Yörünge çemberi (hafif)
    this.gfx.lineStyle(1, isSoulEater ? 0xaa44ff : 0x4488ff, 0.18);
    this.gfx.strokeCircle(this.owner.x, this.owner.y, radius);

    for (let k = 0; k < count; k++) {
      const angle = this.orbitAngle + (k / count) * Math.PI * 2;
      const kx = this.owner.x + Math.cos(angle) * radius;
      const ky = this.owner.y + Math.sin(angle) * radius;

      // Glow
      const glowColor = isSoulEater ? 0xaa44ff : 0x4488ff;
      this.gfx.fillStyle(glowColor, 0.28);
      this.gfx.fillCircle(kx, ky, 12);

      // Bıçak gövdesi — yörüngeye dik yönde
      const knifeAngle = angle + Math.PI / 2;
      const cos = Math.cos(knifeAngle);
      const sin = Math.sin(knifeAngle);
      const len = 14;

      // Dış kenar (daha koyu)
      this.gfx.lineStyle(4, isSoulEater ? 0xcc66ff : 0x88ccff, 0.55);
      this.gfx.beginPath();
      this.gfx.moveTo(kx + cos * len, ky + sin * len);
      this.gfx.lineTo(kx - cos * len, ky - sin * len);
      this.gfx.strokePath();

      // İç kenar (parlak)
      this.gfx.lineStyle(2, isSoulEater ? 0xee88ff : 0xddeeff, 1);
      this.gfx.beginPath();
      this.gfx.moveTo(kx + cos * len, ky + sin * len);
      this.gfx.lineTo(kx - cos * len, ky - sin * len);
      this.gfx.strokePath();

      // Merkez parıltı noktası
      this.gfx.fillStyle(isSoulEater ? 0xffccff : 0xffffff, 0.9);
      this.gfx.fillCircle(kx, ky, 2.5);
    }
  }

  protected applyLevelUpBonus(): void {
    super.applyLevelUpBonus();
    this.data.range += 8;
  }
}
