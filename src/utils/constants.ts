// Display
export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;

// Arena
export const ARENA_WIDTH = 3200;
export const ARENA_HEIGHT = 1800;

// Spatial grid
export const GRID_CELL_SIZE = 64;

// Pool sizes
export const MAX_ENEMIES = 500;
export const MAX_PROJECTILES = 300;
export const MAX_XP_GEMS = 200;
export const MAX_GOLD_COINS = 200;

// Player defaults
export const PLAYER_SPEED = 160;
export const PLAYER_MAX_HP = 100;
export const PLAYER_PICKUP_RANGE = 80;
export const PLAYER_INVINCIBILITY_TIME = 500; // ms

// XP thresholds per level (cumulative) – 20 level, 5 dalga × 60s için ayarlandı
// Hedef: Wave1→L5, Wave2→L8, Wave3→L11-12, Wave4→L15, Wave5→L18-19 (maks L20)
export const XP_THRESHOLDS = [
  0,   12,   28,   50,   76,  108,  146,  190,  240,  298,   // L1-10
370,  452,  546,  654,  776,  916, 1074, 1254, 1458, 1690   // L11-20
];

// Wave
export const WAVE_DURATION = 60_000; // 60s default (overridden by WaveManager per wave)
export const WAVE_SPAWN_INTERVAL = 1500; // ms between spawns (base, overridden by WaveManager)
export const WAVE_COUNT = 5;

// Shop
export const SHOP_REROLL_COST = 10;

// Combat
export const DAMAGE_FLASH_DURATION = 100; // ms
export const KNOCKBACK_FORCE = 50;

// Colors
export const COLOR_HP_BAR = 0xff3333;
export const COLOR_HP_BG = 0x333333;
export const COLOR_XP_BAR = 0x33ccff;
export const COLOR_GOLD = 0xffcc00;
