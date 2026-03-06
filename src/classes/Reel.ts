import * as PIXI from 'pixi.js';
import {
  CELL, REEL_W, REEL_H, REELS_Y, PAYLINE_Y, POOL,
} from '../constants';
import type { ReelSprite } from '../types';
import type { SymbolFactory } from './SymbolFactory';

export class Reel {
  // Public position (read by AnticipationAnimator)
  readonly rx: number;

  // Spin state
  spinning = false;
  stopping = false;
  snapping = false;
  speed = 0;
  stoppedSid = -1;
  snapTarget: ReelSprite | null = null;
  forcedSid: number | null = null;

  private readonly strip: PIXI.Container;
  private readonly sprites: ReelSprite[] = [];

  constructor(
    private readonly stage: PIXI.Container,
    private readonly factory: SymbolFactory,
    index: number,
    reelsX: number,
  ) {
    this.rx = reelsX + index * (REEL_W + 10 /* REEL_GAP */);
    this.strip = new PIXI.Container();
    this.buildReel();
  }

  // ── Public API ──────────────────────────────

  /** Randomise all sprites and reset state for a new spin. */
  startSpin(speed: number, forcedSid: number | null): void {
    this.spinning = true;
    this.stopping = false;
    this.snapping = false;
    this.stoppedSid = -1;
    this.speed = speed;
    this.forcedSid = forcedSid;

    for (const sp of this.sprites) {
      const sid = this.randomSid();
      sp.texture = this.factory.getTexture(sid);
      sp._sid = sid;
    }
  }

  /** Begin deceleration phase. */
  beginStopping(): void {
    this.stopping = true;
  }

  /** Returns true when the reel has fully stopped. */
  update(delta: number): boolean {
    if (!this.spinning) return true;

    if (this.stopping && !this.snapping) {
      this.speed *= 0.90;

      if (this.speed < 3) {
        this.snapping = true;
        this.snapTarget = this.nearestToPayline();

        // Apply forced symbol to the landing sprite
        if (this.forcedSid !== null) {
          this.snapTarget.texture = this.factory.getTexture(this.forcedSid);
          this.snapTarget._sid = this.forcedSid;
          this.forcedSid = null;
        }
      }
    }

    if (this.snapping && this.snapTarget) {
      const remaining = PAYLINE_Y - this.snapTarget._wy;
      const step = remaining * 0.25;

      for (const sp of this.sprites) {
        sp._wy += step;
        sp.y = sp._wy;
      }

      if (Math.abs(remaining) < 0.5) {
        const fix = PAYLINE_Y - this.snapTarget._wy;
        for (const sp of this.sprites) {
          sp._wy += fix;
          sp.y = sp._wy;
        }
        this.speed = 0;
        this.spinning = false;
        this.snapping = false;
        this.stoppedSid = this.snapTarget._sid;
        return true; // just stopped
      }
      return false;
    }

    // Normal scroll
    for (const sp of this.sprites) {
      sp._wy += this.speed * delta;

      // Recycle sprite when it scrolls below the window
      if (sp._wy > REELS_Y + REEL_H + CELL / 2) {
        const minWy = Math.min(...this.sprites.filter(s => s !== sp).map(s => s._wy));
        sp._wy = minWy - CELL;
        const sid = this.randomSid();
        sp.texture = this.factory.getTexture(sid);
        sp._sid = sid;
      }

      sp.y = sp._wy;
    }

    return false;
  }

  /** Reset all sprite x positions (used after anticipation shake). */
  resetSpriteX(): void {
    for (const sp of this.sprites) sp.x = this.rx + REEL_W / 2;
  }

  /** Get all sprites (read by WinAnimator). */
  getSprites(): ReelSprite[] {
    return [...this.sprites];
  }

  /** Force all sprites to default alpha/scale (called on spin start). */
  resetSprites(): void {
    for (const sp of this.sprites) {
      sp.alpha = 1;
      sp.scale.set(1);
    }
  }

  // ── Private ─────────────────────────────────

  private buildReel(): void {
    const { rx } = this;

    // Background
    const bg = new PIXI.Graphics();
    bg.beginFill(0x080400);
    bg.drawRect(rx, REELS_Y, REEL_W, REEL_H);
    bg.endFill();
    this.stage.addChild(bg);

    // Mask
    const mask = new PIXI.Graphics();
    mask.beginFill(0xffffff);
    mask.drawRect(rx, REELS_Y, REEL_W, REEL_H);
    mask.endFill();
    this.stage.addChild(mask);

    this.strip.mask = mask;
    this.stage.addChild(this.strip);

    // Sprites
    const visibleSlots = Math.ceil(REEL_H / CELL) + 2;
    for (let s = 0; s < visibleSlots; s++) {
      const sid = this.randomSid();
      const sp = new PIXI.Sprite(this.factory.getTexture(sid)) as ReelSprite;
      sp.anchor.set(0.5, 0.5);
      sp.x = rx + REEL_W / 2;
      sp._wy = REELS_Y - CELL + s * CELL;
      sp.y = sp._wy;
      sp._sid = sid;
      this.strip.addChild(sp);
      this.sprites.push(sp);
    }

    // Shine overlay
    const shine = new PIXI.Graphics();
    shine.beginFill(0xffffff, 0.03);
    shine.drawRect(rx, REELS_Y, REEL_W / 2, REEL_H);
    shine.endFill();
    this.stage.addChild(shine);

    // Border
    const border = new PIXI.Graphics();
    border.lineStyle(1.5, 0x3a2800, 0.9);
    border.drawRect(rx, REELS_Y, REEL_W, REEL_H);
    this.stage.addChild(border);
  }

  private nearestToPayline(): ReelSprite {
    return this.sprites.reduce((best, sp) =>
      Math.abs(sp._wy - PAYLINE_Y) < Math.abs(best._wy - PAYLINE_Y) ? sp : best,
    );
  }

  private randomSid(): number {
    return POOL[Math.floor(Math.random() * POOL.length)];
  }
}
