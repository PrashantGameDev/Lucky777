import * as PIXI from 'pixi.js';
import { REELS_X, REELS_Y, TOTAL_W, REEL_H, REEL_W, PAYLINE_Y } from '../constants';
import type { SymbolDef } from '../types';
import type { Reel } from './Reel';

export class WinAnimator {
  private active = false;
  private time = 0;
  private winSprites: Array<PIXI.Sprite & { _flash?: PIXI.Graphics }> = [];

  private readonly glowLayer: PIXI.Container;
  private glow: PIXI.Graphics | null = null;
  private glowCol = 0xffd700;

  constructor(stage: PIXI.Container) {
    this.glowLayer = new PIXI.Container();
    stage.addChild(this.glowLayer); // eslint-disable-line
  }

  start(winSym: SymbolDef, reels: Reel[]): void {
    this.clear(reels);
    this.active = true;
    this.time = 0;
    this.glowCol = parseInt(winSym.fill[0].replace('#', ''), 16);

    // Collect payline sprite from each reel; dim others
    for (const reel of reels) {
      const sprites = reel.getSprites();
      const best = sprites.reduce((b, sp) =>
        Math.abs(sp._wy - PAYLINE_Y) < Math.abs(b._wy - PAYLINE_Y) ? sp : b,
      );
      this.winSprites.push(best);
      sprites.forEach(sp => { if (sp !== best) sp.alpha = 0.22; });
    }

    // Glow ring
    this.glow = new PIXI.Graphics();
    this.glowLayer.addChild(this.glow);

    // Per-symbol flash overlays
    this.winSprites.forEach((sp, i) => {
      const flash = new PIXI.Graphics();
      flash.beginFill(0xffffff, 0);
      flash.drawRect(-REEL_W / 2, -REEL_H / 2, REEL_W, REEL_H);
      flash.endFill();
      flash.x = reels[i].rx + REEL_W / 2;
      flash.y = PAYLINE_Y;
      this.glowLayer.addChild(flash);
      sp._flash = flash;
    });
  }

  clear(reels: Reel[]): void {
    this.active = false;
    this.winSprites = [];
    this.glow = null;
    this.glowLayer.removeChildren();
    reels.forEach(r => r.resetSprites());
  }

  tick(delta: number): void {
    if (!this.active) return;
    this.time += delta * 0.06;

    // Pulse scale
    const scale = 1 + Math.sin(this.time * 3.5) * 0.08;
    this.winSprites.forEach(sp => sp.scale.set(scale));

    // Flash overlay
    const flashAlpha = Math.max(0, Math.sin(this.time * 5) * 0.18);
    this.winSprites.forEach(sp => {
      if (sp._flash) sp._flash.alpha = flashAlpha;
    });

    // Glow ring
    if (this.glow) {
      const ga = Math.max(0, Math.sin(this.time * 2.5) * 0.8);
      this.glow.clear();
      this.glow.lineStyle(8, this.glowCol, ga);
      this.glow.drawRoundedRect(REELS_X - 20, REELS_Y - 20, TOTAL_W + 40, REEL_H + 40, 20);
      this.glow.lineStyle(16, this.glowCol, ga * 0.25);
      this.glow.drawRoundedRect(REELS_X - 20, REELS_Y - 20, TOTAL_W + 40, REEL_H + 40, 20);
    }
  }

  spawnConfetti(app: PIXI.Application, count: number): void {
    const cols = [0xffd700, 0xff4400, 0x00bfff, 0x44ff44, 0xff44aa];
    const W = app.screen.width;

    for (let i = 0; i < count; i++) {
      const g = new PIXI.Graphics();
      g.beginFill(cols[Math.floor(Math.random() * cols.length)], 0.9);
      g.drawRect(-4, -4, 8, 8);
      g.endFill();
      g.x = 80 + Math.random() * (W - 160);
      g.y = 90 + Math.random() * 170;
      const vx = (Math.random() - 0.5) * 4;
      const vy = -6 + Math.random() * 4;
      let vy_ = vy;
      app.stage.addChild(g);

      const t0 = Date.now();
      const tick = (): void => {
        const age = (Date.now() - t0) / 1000;
        if (age > 1.4) {
          try { app.stage.removeChild(g); } catch (_) { /* already removed */ }
          app.ticker.remove(tick);
          return;
        }
        g.x += vx;
        g.y += vy_;
        vy_ += 0.2;
        g.alpha = 1 - age / 1.4;
        g.rotation += 0.12;
      };
      app.ticker.add(tick);
    }
  }
}
