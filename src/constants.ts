import type { SymbolDef } from './types';

// ── Canvas ───────────────────────────────────
export const CANVAS_W = 540;
export const CANVAS_H = 760;

// ── Reel layout ──────────────────────────────
export const REEL_W   = 120;
export const REEL_H   = 140;
export const REEL_GAP = 10;
export const N_REELS  = 3;
export const TOTAL_W  = N_REELS * REEL_W + (N_REELS - 1) * REEL_GAP;
export const REELS_X  = (CANVAS_W - TOTAL_W) / 2;
export const REELS_Y  = 108;
export const PAYLINE_Y = REELS_Y + REEL_H / 2;

// ── Symbol cell ──────────────────────────────
export const CELL = 120;

// ── Layout zones (derived from reel bottom) ──
export const REEL_BOTTOM = REELS_Y + REEL_H;
export const WIN_ROW_Y   = REEL_BOTTOM + 14;
export const WIN_ROW_H   = 80;
export const PANEL_Y     = WIN_ROW_Y + WIN_ROW_H;
export const PANEL_W     = 150;
export const PANEL_H     = 54;
export const BTN_Y       = PANEL_Y + 68;
export const PAY_Y       = BTN_Y + 62;
export const FOOTER_Y    = PAY_Y + 72;

// ── Bet steps ────────────────────────────────
export const BET_STEPS: ReadonlyArray<number> = [5, 10, 25, 50, 100];
export const DEFAULT_BET_IDX = 1; // 10

// ── Starting credits ─────────────────────────
export const STARTING_CREDITS = 200;

// ── Spin timing (ms) ─────────────────────────
export const REEL_STOP_DELAYS: [number, number, number] = [900, 1350, 1800];
export const REEL_STOP_JITTER = 150;

// ── Anticipation ─────────────────────────────
export const ANTICIPATION_SPEED_CAP  = 1.8;
export const ANTICIPATION_STOP_DELAY = 3200;
export const ANTICIPATION_STOP_JITTER: [number, number] = [400, 700];

// ── Symbol definitions ───────────────────────
export const SYMBOLS: ReadonlyArray<SymbolDef> = [
  { id: 0, char: '7',  fill: ['#FF2200', '#FF6600'], stroke: '#FFD700', payout: 100 },
  { id: 1, char: '★',  fill: ['#FFD700', '#FF8C00'], stroke: '#FFFFFF', payout: 50  },
  { id: 2, char: '♦',  fill: ['#00CFFF', '#0044FF'], stroke: '#FFFFFF', payout: 30  },
  { id: 3, char: '♣',  fill: ['#44FF44', '#008800'], stroke: '#FFFFFF', payout: 20  },
  { id: 4, char: '♥',  fill: ['#FF55BB', '#CC0066'], stroke: '#FFFFFF', payout: 10  },
  { id: 5, char: '777',  fill: ['#f1b14f', '#f1a32e'], stroke: '#FFFFFF', payout: 500  },
  { id: 6, char: 'BAR',  fill: ['#e73939', '#f01010'], stroke: '#FFFFFF', payout: 1000  },
  { id: 7, char: 'BELL', fill: ['#28c079', '#13975a'], stroke: '#FFFFFF', payout: 250  },
];

// Weighted pool — 7 is rare, hearts common
export const POOL: ReadonlyArray<number> = [4,3,2,4,1,3,4,2,3,1,4,3,2,4,0,3,4,1,2,4];
