import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../utils/constants';

export interface TouchState {
  moveX: number;
  moveY: number;
  dashPressed: boolean;
  pausePressed: boolean;
}

export class TouchControls {
  private scene: Phaser.Scene;
  private gfx: Phaser.GameObjects.Graphics;

  // ── Joystick ──────────────────────────────────────────────────────────────
  private joystickActive    = false;
  private joystickOriginX   = 0;
  private joystickOriginY   = 0;
  private joystickCurrentX  = 0;
  private joystickCurrentY  = 0;
  private joystickPointerId = -1;
  private readonly JOYSTICK_RADIUS  = 65;
  private readonly JOYSTICK_DEAD    = 10;
  private readonly LEFT_ZONE_W      = GAME_WIDTH * 0.48; // sol %48 → joystick alanı

  // ── Dash butonu ───────────────────────────────────────────────────────────
  private dashPointerId    = -1;
  private dashHeld         = false;
  private dashJustPressed  = false;
  private readonly DASH_X  = GAME_WIDTH  - 88;
  private readonly DASH_Y  = GAME_HEIGHT - 75;
  private readonly DASH_R  = 48;

  // ── Pause butonu ──────────────────────────────────────────────────────────
  private pauseJustPressed     = false;
  private readonly PAUSE_X     = GAME_WIDTH  - 32;
  private readonly PAUSE_Y     = 32;
  private readonly PAUSE_R     = 24;

  public state: TouchState = { moveX: 0, moveY: 0, dashPressed: false, pausePressed: false };

  private dashLabel: Phaser.GameObjects.Text | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.gfx = scene.add.graphics().setDepth(200).setScrollFactor(0);

    // DASH etiketi — sabit, tek seferlik
    this.dashLabel = scene.add.text(
      this.DASH_X, this.DASH_Y + 30, 'DASH',
      { fontSize: '11px', color: '#44aaff', fontFamily: 'monospace' }
    ).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(201).setAlpha(0.85);

    scene.input.on('pointerdown',   this.onDown,   this);
    scene.input.on('pointermove',   this.onMove,   this);
    scene.input.on('pointerup',     this.onUp,     this);
    scene.input.on('pointercancel', this.onUp,     this);
  }

  // ── Pointer handlers ─────────────────────────────────────────────────────

  private onDown(pointer: Phaser.Input.Pointer): void {
    const x = pointer.x;
    const y = pointer.y;

    // Pause
    if (this.dist2(x, y, this.PAUSE_X, this.PAUSE_Y) <= this.PAUSE_R * this.PAUSE_R) {
      this.pauseJustPressed = true;
      return;
    }

    // Dash (sağ alt)
    if (this.dist2(x, y, this.DASH_X, this.DASH_Y) <= this.DASH_R * this.DASH_R) {
      this.dashPointerId   = pointer.id;
      this.dashJustPressed = true;
      this.dashHeld        = true;
      return;
    }

    // Joystick (sol yarı, herhangi bir yere)
    if (x < this.LEFT_ZONE_W && !this.joystickActive) {
      this.joystickActive    = true;
      this.joystickPointerId = pointer.id;
      this.joystickOriginX   = x;
      this.joystickOriginY   = y;
      this.joystickCurrentX  = x;
      this.joystickCurrentY  = y;
    }
  }

  private onMove(pointer: Phaser.Input.Pointer): void {
    if (this.joystickActive && pointer.id === this.joystickPointerId) {
      this.joystickCurrentX = pointer.x;
      this.joystickCurrentY = pointer.y;
    }
  }

  private onUp(pointer: Phaser.Input.Pointer): void {
    if (pointer.id === this.joystickPointerId) {
      this.joystickActive    = false;
      this.joystickPointerId = -1;
    }
    if (pointer.id === this.dashPointerId) {
      this.dashPointerId = -1;
      this.dashHeld      = false;
    }
  }

  // ── Güncelleme ve çizim ───────────────────────────────────────────────────

  update(): void {
    // Joystick → moveX / moveY
    if (this.joystickActive) {
      const dx = this.joystickCurrentX - this.joystickOriginX;
      const dy = this.joystickCurrentY - this.joystickOriginY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > this.JOYSTICK_DEAD) {
        const clamped = Math.min(dist, this.JOYSTICK_RADIUS);
        this.state.moveX = (dx / dist) * (clamped / this.JOYSTICK_RADIUS);
        this.state.moveY = (dy / dist) * (clamped / this.JOYSTICK_RADIUS);
      } else {
        this.state.moveX = 0;
        this.state.moveY = 0;
      }
    } else {
      this.state.moveX = 0;
      this.state.moveY = 0;
    }

    this.state.dashPressed  = this.dashJustPressed;
    this.state.pausePressed = this.pauseJustPressed;
    this.dashJustPressed  = false;
    this.pauseJustPressed = false;

    this.draw();
  }

  // ── Görsel ────────────────────────────────────────────────────────────────

  private draw(): void {
    this.gfx.clear();

    this.drawPauseBtn();
    this.drawDashBtn();
    this.drawJoystick();
  }

  private drawPauseBtn(): void {
    this.gfx.fillStyle(0x222222, 0.55);
    this.gfx.fillCircle(this.PAUSE_X, this.PAUSE_Y, this.PAUSE_R);
    this.gfx.lineStyle(1.5, 0x888888, 0.7);
    this.gfx.strokeCircle(this.PAUSE_X, this.PAUSE_Y, this.PAUSE_R);
    // II sembolü
    this.gfx.fillStyle(0xcccccc, 0.9);
    this.gfx.fillRect(this.PAUSE_X - 8, this.PAUSE_Y - 9, 5, 18);
    this.gfx.fillRect(this.PAUSE_X + 3, this.PAUSE_Y - 9, 5, 18);
  }

  private drawDashBtn(): void {
    const active = this.dashHeld;
    this.gfx.fillStyle(active ? 0x224488 : 0x112233, active ? 0.75 : 0.5);
    this.gfx.fillCircle(this.DASH_X, this.DASH_Y, this.DASH_R);
    this.gfx.lineStyle(2.5, active ? 0xffffff : 0x44aaff, active ? 1 : 0.75);
    this.gfx.strokeCircle(this.DASH_X, this.DASH_Y, this.DASH_R);

    // Şimşek sembolü
    this.gfx.lineStyle(3, 0x44aaff, 0.95);
    this.gfx.beginPath();
    this.gfx.moveTo(this.DASH_X + 9,  this.DASH_Y - 22);
    this.gfx.lineTo(this.DASH_X - 5,  this.DASH_Y -  6);
    this.gfx.lineTo(this.DASH_X + 5,  this.DASH_Y -  6);
    this.gfx.lineTo(this.DASH_X - 9,  this.DASH_Y + 10);
    this.gfx.strokePath();
  }

  private drawJoystick(): void {
    if (this.joystickActive) {
      // Dış halka
      this.gfx.lineStyle(2, 0xffffff, 0.30);
      this.gfx.strokeCircle(this.joystickOriginX, this.joystickOriginY, this.JOYSTICK_RADIUS);
      this.gfx.fillStyle(0xffffff, 0.05);
      this.gfx.fillCircle(this.joystickOriginX, this.joystickOriginY, this.JOYSTICK_RADIUS);

      // Başparmak noktası (radius ile sınırlandırılmış)
      const dx = this.joystickCurrentX - this.joystickOriginX;
      const dy = this.joystickCurrentY - this.joystickOriginY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const clampedDist = Math.min(dist, this.JOYSTICK_RADIUS);
      const nx = dist > 0 ? dx / dist : 0;
      const ny = dist > 0 ? dy / dist : 0;
      const tx = this.joystickOriginX + nx * clampedDist;
      const ty = this.joystickOriginY + ny * clampedDist;

      this.gfx.fillStyle(0xffffff, 0.65);
      this.gfx.fillCircle(tx, ty, 24);
      this.gfx.lineStyle(2, 0xffffff, 0.85);
      this.gfx.strokeCircle(tx, ty, 24);
    } else {
      // İpucu: sol alt köşede soluk çember + ok yönleri
      const hx = 100;
      const hy = GAME_HEIGHT - 95;
      this.gfx.lineStyle(1, 0xffffff, 0.12);
      this.gfx.strokeCircle(hx, hy, this.JOYSTICK_RADIUS);

      const a = 0.13;
      // yukarı
      this.gfx.fillStyle(0xffffff, a);
      this.gfx.fillTriangle(hx, hy - 52, hx - 9, hy - 38, hx + 9, hy - 38);
      // aşağı
      this.gfx.fillTriangle(hx, hy + 52, hx - 9, hy + 38, hx + 9, hy + 38);
      // sol
      this.gfx.fillTriangle(hx - 52, hy, hx - 38, hy - 9, hx - 38, hy + 9);
      // sağ
      this.gfx.fillTriangle(hx + 52, hy, hx + 38, hy - 9, hx + 38, hy + 9);
    }
  }

  // ── Yardımcılar ──────────────────────────────────────────────────────────

  private dist2(ax: number, ay: number, bx: number, by: number): number {
    const dx = ax - bx;
    const dy = ay - by;
    return dx * dx + dy * dy;
  }

  destroy(): void {
    this.scene.input.off('pointerdown',   this.onDown, this);
    this.scene.input.off('pointermove',   this.onMove, this);
    this.scene.input.off('pointerup',     this.onUp,   this);
    this.scene.input.off('pointercancel', this.onUp,   this);
    this.gfx.destroy();
    this.dashLabel?.destroy();
    this.dashLabel = null;
  }
}
