import Phaser from 'phaser';
import { WeaponBase } from '../WeaponBase';
import { Player } from '../../entities/Player';
import { Enemy } from '../../entities/Enemy';
import { ARENA_WIDTH, ARENA_HEIGHT } from '../../utils/constants';
import { clamp } from '../../utils/math';

export class Sword extends WeaponBase {
  private enemies: Enemy[];
  private gfx: Phaser.GameObjects.Graphics;
  private showTimer: number = 0;

  constructor(scene: Phaser.Scene, owner: Player, enemies: Enemy[]) {
    super(scene, owner, {
      id: 'sword',
      name: 'Kılıç',
      damage: 35,
      cooldown: 900,
      projectileSpeed: 0,
      projectileCount: 1,
      pierce: 99,
      range: 120,
      type: 'melee'
    });
    this.enemies = enemies;
    this.gfx = scene.add.graphics().setDepth(9);
  }

  update(delta: number): void {
    super.update(delta);
    if (this.showTimer > 0) {
      this.showTimer -= delta;
      if (this.showTimer <= 0) this.gfx.clear();
    }
  }

  attack(): void {
    // En yakın düşmana bak — yoksa çıkış
    let facingRad = this.owner.facingAngle * (Math.PI / 180);
    let nearestDistSq = Infinity;

    for (const enemy of this.enemies) {
      if (!enemy.active) continue;
      const dx = enemy.x - this.owner.x;
      const dy = enemy.y - this.owner.y;
      const dSq = dx * dx + dy * dy;
      if (dSq < nearestDistSq) {
        nearestDistSq = dSq;
        facingRad = Math.atan2(dy, dx);
      }
    }
    if (nearestDistSq === Infinity) return;

    // ±108° = 216° toplam yay (kırbaçtan çok daha geniş)
    const arcSpread = Math.PI * 0.6;
    const range = this.data.range;
    const damage = this.effectiveDamage;

    for (const enemy of this.enemies) {
      if (!enemy.active) continue;
      const dx = enemy.x - this.owner.x;
      const dy = enemy.y - this.owner.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > range) continue;

      let diff = Math.atan2(dy, dx) - facingRad;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      if (Math.abs(diff) > arcSpread) continue;

      const killed = enemy.takeDamage(damage);
      this.onMeleeHit?.(enemy, damage);

      // KANLI YIRTIK evrimi: vuruş başına %30 can çal
      if (this.data.id === 'bloody_tear' && dist > 0) {
        const heal = Math.ceil(damage * 0.30);
        this.owner.currentHp = Math.min(this.owner.currentHp + heal, this.owner.stats.maxHp);
      }

      // Güçlü geri tepme
      if (dist > 0) {
        enemy.x = clamp(enemy.x + (dx / dist) * 45, 8, ARENA_WIDTH - 8);
        enemy.y = clamp(enemy.y + (dy / dist) * 45, 8, ARENA_HEIGHT - 8);
      }

      if (killed) this.onEnemyKilled?.(enemy);
    }

    this.drawSlash(range, facingRad, arcSpread);
  }

  private drawSlash(range: number, facingRad: number, arcSpread: number): void {
    this.gfx.clear();
    const isBloodyTear = this.data.id === 'bloody_tear';
    const mainColor  = isBloodyTear ? 0xff1144 : 0xddeeff;
    const innerColor = isBloodyTear ? 0xff6688 : 0x9999ff;
    const startAngle = facingRad - arcSpread;
    const endAngle   = facingRad + arcSpread;

    // Dış parlaklık halkası
    this.gfx.lineStyle(9, mainColor, 0.15);
    this.gfx.beginPath();
    this.gfx.arc(this.owner.x, this.owner.y, range * 1.08, startAngle, endAngle, false);
    this.gfx.strokePath();

    // Ana yay
    this.gfx.lineStyle(4, mainColor, 0.88);
    this.gfx.beginPath();
    this.gfx.arc(this.owner.x, this.owner.y, range, startAngle, endAngle, false);
    this.gfx.strokePath();

    // Kılıç bıçağı — merkez yönde düz çizgi
    const cos = Math.cos(facingRad);
    const sin = Math.sin(facingRad);
    this.gfx.lineStyle(3, 0xffffff, 0.92);
    this.gfx.beginPath();
    this.gfx.moveTo(this.owner.x + cos * 12, this.owner.y + sin * 12);
    this.gfx.lineTo(this.owner.x + cos * range * 0.95, this.owner.y + sin * range * 0.95);
    this.gfx.strokePath();

    // İç yay
    this.gfx.lineStyle(2, innerColor, 0.5);
    this.gfx.beginPath();
    this.gfx.arc(this.owner.x, this.owner.y, range * 0.6, startAngle, endAngle, false);
    this.gfx.strokePath();

    this.showTimer = 140;
  }

  protected applyLevelUpBonus(): void {
    super.applyLevelUpBonus();
    this.data.range += 12;
  }
}
