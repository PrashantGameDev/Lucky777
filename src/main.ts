import * as PIXI from 'pixi.js';
import { CANVAS_W, CANVAS_H, N_REELS, REELS_X } from './constants';

import { EventEmitter }         from './classes/EventEmitter';
import { SymbolFactory }        from './classes/SymbolFactory';
import { Reel }                 from './classes/Reel';
import { UIManager }            from './classes/UIManager';
import { WinAnimator }          from './classes/WinAnimator';
import { AnticipationAnimator } from './classes/AnticipationAnimator';
import { SpinController }       from './classes/SpinController';
import { TestPanel }            from './classes/TestPanel';

// ── PixiJS Application ───────────────────────
const app = new PIXI.Application({
  view:            document.getElementById('game-canvas') as HTMLCanvasElement,
  width:           CANVAS_W,
  height:          CANVAS_H,
  backgroundColor: 0x0a0500,
  antialias:       true,
  resolution:      window.devicePixelRatio || 1,
  autoDensity:     true,
});

// ── Core services ────────────────────────────
const emitter       = new EventEmitter();
const symbolFactory = new SymbolFactory(app.renderer as PIXI.Renderer);

// ── 1. UI background (cabinet, dust, title, reel frame, payline) ──
const ui = new UIManager(app.stage, emitter);
ui.buildBackground();

// ── 2. Reels — added after background, before foreground UI ──────
const reels: Reel[] = Array.from({ length: N_REELS }, (_, i) =>
  new Reel(app.stage, symbolFactory, i, REELS_X),
);

// ── 3. UI foreground (win row, panels, buttons, paytable, footer) ─
ui.buildForeground();

// ── 4. Animators (on top of everything) ─────────────────────────
const winAnimator  = new WinAnimator(app.stage);
const anticipation = new AnticipationAnimator(app.stage);

// ── 5. Controllers ───────────────────────────────────────────────
const spinCtrl = new SpinController(app, reels, ui, winAnimator, anticipation, emitter);
new TestPanel(spinCtrl, ui);

// ── Main ticker ──────────────────────────────
app.ticker.add((delta: number) => {
  ui.tick(delta);
  anticipation.tick(delta, reels[2]);
  winAnimator.tick(delta);
  spinCtrl.update(delta);
});
