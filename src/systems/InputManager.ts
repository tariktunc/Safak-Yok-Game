import Phaser from 'phaser';
import { TouchControls } from './TouchControls';
import { IS_MOBILE } from '../utils/constants';

export class InputManager {
  private scene: Phaser.Scene;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys | null = null;
  private wasd: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  } | null = null;
  private escKey:   Phaser.Input.Keyboard.Key | null = null;
  private spaceKey: Phaser.Input.Keyboard.Key | null = null;

  private touchControls: TouchControls | null = null;

  public moveX = 0;
  public moveY = 0;
  public pausePressed  = false;
  public dashPressed   = false;
  public mouseWorldX   = 0;
  public mouseWorldY   = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    // Klavye (masaüstü)
    if (scene.input.keyboard) {
      this.cursors = scene.input.keyboard.createCursorKeys();
      this.wasd = {
        W: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        A: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        S: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        D: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
      };
      this.escKey   = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
      this.spaceKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }

    // Dokunmatik (mobil)
    if (IS_MOBILE) {
      this.touchControls = new TouchControls(scene);
    }
  }

  update(): void {
    // ── Klavye girişi ──────────────────────────────────────────────────────
    let kbX = 0, kbY = 0;
    let kbPause = false, kbDash = false;

    if (this.cursors && this.wasd) {
      if (this.cursors.left.isDown  || this.wasd.A.isDown) kbX = -1;
      if (this.cursors.right.isDown || this.wasd.D.isDown) kbX =  1;
      if (this.cursors.up.isDown    || this.wasd.W.isDown) kbY = -1;
      if (this.cursors.down.isDown  || this.wasd.S.isDown) kbY =  1;

      // Köşegen normalizasyonu
      if (kbX !== 0 && kbY !== 0) {
        kbX /= Math.SQRT2;
        kbY /= Math.SQRT2;
      }

      if (this.escKey)   kbPause = Phaser.Input.Keyboard.JustDown(this.escKey);
      if (this.spaceKey) kbDash  = Phaser.Input.Keyboard.JustDown(this.spaceKey);
    }

    // ── Dokunmatik girişi ─────────────────────────────────────────────────
    let tcX = 0, tcY = 0;
    let tcPause = false, tcDash = false;

    if (this.touchControls) {
      this.touchControls.update();
      const t = this.touchControls.state;
      tcX     = t.moveX;
      tcY     = t.moveY;
      tcPause = t.pausePressed;
      tcDash  = t.dashPressed;
    }

    // ── Birleştir (klavye öncelikli, yoksa dokunmatik) ────────────────────
    this.moveX        = kbX     || tcX;
    this.moveY        = kbY     || tcY;
    this.pausePressed = kbPause || tcPause;
    this.dashPressed  = kbDash  || tcDash;

    // Mouse / pointer dünya konumu
    const pointer = this.scene.input.activePointer;
    this.mouseWorldX = pointer.worldX;
    this.mouseWorldY = pointer.worldY;
  }

  destroyTouchControls(): void {
    this.touchControls?.destroy();
    this.touchControls = null;
  }
}
