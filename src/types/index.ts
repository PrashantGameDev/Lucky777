import type * as PIXI from 'pixi.js';

// ── Symbol definition ────────────────────────
export interface SymbolDef {
  id: number;
  char: string;
  fill: [string, string];
  stroke: string;
  payout: number;
}

// ── Reel sprite — PIXI.Sprite extended with game-specific properties ──
export type ReelSprite = PIXI.Sprite & {
  _wy: number;   // world-Y centre position
  _sid: number;   // symbol id currently displayed
  _flash?: PIXI.Graphics; // win flash overlay reference
};

// ── Forced spin result ───────────────────────
// null = random | 'nowin' = guaranteed no match | number = all reels same | number[] = per-reel
export type ForcedResult = null | 'nowin' | number | [number, number, number];

// ── Spin result passed to callbacks ──────────
export interface SpinResult {
  ids: [number, number, number];
  isWin: boolean;
  prize: number;
}

// ── Event names used by EventEmitter ─────────
export type GameEvent =
  | 'spinStart'
  | 'spinComplete'
  | 'win'
  | 'noWin'
  | 'anticipate'
  | 'creditsChanged'
  | 'betChanged';
