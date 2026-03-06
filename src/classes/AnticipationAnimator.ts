import * as PIXI from 'pixi.js';
import { REEL_W, REEL_H, REELS_Y } from '../constants';
import type { Reel } from './Reel';

export class AnticipationAnimator {
  private active      = false;
  private time        = 0;
  private readonly gfx: PIXI.Graphics;

  constructor(stage: PIXI.Container) {
    this.gfx = new PIXI.Graphics();
    stage.addChild(this.gfx);
  }

  start(): void {
    this.active = true;
    this.time   = 0;
  }

  stop(): void {
    this.active = false;
    this.gfx.clear();
  }

  get isActive(): boolean {
    return this.active;
  }

  tick(delta: number, thirdReel: Reel): void {
    if (!this.active) return;

    this.time += delta * 0.025;

    const { rx } = thirdReel;

    // Horizontal shake — slows as time increases
    const shake = Math.sin(this.time * 22) * (3.5 * Math.max(0, 1 - this.time / 6));
    for (const sp of thirdReel.getSprites()) {
      sp.x = rx + REEL_W / 2 + shake;
    }

    // Pulsing amber glow around reel 3
    const glowAlpha = 0.5 + Math.sin(this.time * 4) * 0.45;
    this.gfx.clear();
    this.gfx.lineStyle(6, 0xffaa00, glowAlpha);
    this.gfx.drawRoundedRect(rx - 4, REELS_Y - 4, REEL_W + 8, REEL_H + 8, 10);
    this.gfx.lineStyle(14, 0xffaa00, glowAlpha * 0.25);
    this.gfx.drawRoundedRect(rx - 4, REELS_Y - 4, REEL_W + 8, REEL_H + 8, 10);

    // Auto-stop once reel finishes
    if (!thirdReel.spinning) {
      thirdReel.resetSpriteX();
      this.stop();
    }
  }
}
