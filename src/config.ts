import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from './utils/constants';

import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { MainMenuScene } from './scenes/MainMenuScene';
import { GameScene } from './scenes/GameScene';
import { ShopScene } from './scenes/ShopScene';
import { LevelUpScene } from './scenes/LevelUpScene';
import { PauseScene } from './scenes/PauseScene';
import { CharacterSelectScene } from './scenes/CharacterSelectScene';
import { GameOverScene } from './scenes/GameOverScene';
import { SettingsScene } from './scenes/SettingsScene';

export const gameConfig: Phaser.Types.Core.GameConfig = {
  // AUTO: WebGL varsa kullan, yoksa Canvas'a düş (eski/uyumsuz telefonlar için)
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  pixelArt: true,
  roundPixels: true,
  antialias: false,
  backgroundColor: '#1a0a2e',
  disableContextMenu: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    parent: 'game-container',
    // Pencere boyutu değişince (adres çubuğu vs) otomatik yeniden ölçekle
    expandParent: true
  },
  input: {
    mouse: { preventDefaultWheel: true },
    touch: { capture: true },
    activePointers: 4 // joystick + dash + pause + ekstra parmak
  },
  scene: [
    BootScene,
    PreloadScene,
    MainMenuScene,
    CharacterSelectScene,
    GameScene,
    ShopScene,
    LevelUpScene,
    PauseScene,
    GameOverScene,
    SettingsScene
  ],
  fps: {
    target: 60,
    forceSetTimeOut: false,
    smoothStep: true   // frame zamanı yumuşatma — mobilde titreme azaltır
  },
  render: {
    batchSize: 4096,
    powerPreference: 'high-performance' // GPU tercih: yüksek performans modu
  }
};
