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

// XP thresholds per level (cumulative) – 30 levels, yavaş ilerleme
export const XP_THRESHOLDS = [
  0,    8,   20,   38,   62,   92,  130,  176,  230,  294,   // 1-10: yavaşlatılmış başlangıç
  370, 460,  565,  686,  825,  984, 1164, 1368, 1598, 1858,  // 11-20: mid game
 2150, 2478, 2846, 3258, 3718, 4230, 4798, 5426, 6118, 6880  // 21-30: geç oyun
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
