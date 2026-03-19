import Phaser from 'phaser';
import { gameConfig } from './config';

// Sağ tıklama menüsünü engelle (mobil uzun basış)
document.addEventListener('contextmenu', e => e.preventDefault());

// Sayfa yüklenince oyunu başlat
window.addEventListener('DOMContentLoaded', () => {
  new Phaser.Game(gameConfig);
});
