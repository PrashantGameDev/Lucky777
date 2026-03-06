import * as PIXI from 'pixi.js';
import {
  N_REELS, SYMBOLS,
  REEL_STOP_DELAYS, REEL_STOP_JITTER,
  ANTICIPATION_SPEED_CAP, ANTICIPATION_STOP_DELAY, ANTICIPATION_STOP_JITTER,
} from '../constants';
import type { Reel }                  from './Reel';
import type { UIManager }             from './UIManager';
import type { WinAnimator }           from './WinAnimator';
import type { AnticipationAnimator }  from './AnticipationAnimator';
import type { EventEmitter }          from './EventEmitter';
import type { ForcedResult, SpinResult } from '../types';

export class SpinController {
  private spinning       = false;
  private reelStopTimes: number[] = [];
  forcedResult: ForcedResult = null;

  constructor(
    private readonly app:           PIXI.Application,
    private readonly reels:         Reel[],
    private readonly ui:            UIManager,
    private readonly winAnimator:   WinAnimator,
    private readonly anticipation:  AnticipationAnimator,
    private readonly emitter:       EventEmitter,
  ) {
    this.emitter.on('spinStart', (payload: unknown) => {
      if (payload === 'auto') {
        this.ui.setAutoSpin(!this.ui.autoSpinning);
        if (this.ui.autoSpinning && !this.spinning) this.spin();
      } else {
        this.spin();
      }
    });

    this.emitter.on('betChanged', (direction: unknown) => {
      this.ui.changeBet(direction as 1 | -1, this.spinning);
    });
  }

  get isSpinning(): boolean { return this.spinning; }

  spin(free = false): void {
    if (this.spinning) return;

    if (!free && !this.ui.canAffordBet()) {
      if (this.ui.autoSpinning) this.ui.setAutoSpin(false);
      return;
    }
    if (!free) this.ui.deductBet();

    this.spinning = true;
    this.ui.hideForSpin();
    this.winAnimator.clear(this.reels);
    this.anticipation.stop();

    const now           = Date.now();
    this.reelStopTimes  = REEL_STOP_DELAYS.map(d => now + d + Math.random() * REEL_STOP_JITTER);

    const forcedStops   = this.resolveForcedStops();
    this.forcedResult   = null;

    this.reels.forEach((reel, i) => {
      reel.startSpin(22 + Math.random() * 4, forcedStops?.[i] ?? null);
    });
  }

  /** Called every frame from the main ticker. */
  update(delta: number): void {
    if (!this.spinning) return;

    const now          = Date.now();
    let   stoppedCount = 0;

    for (let i = 0; i < this.reels.length; i++) {
      const reel = this.reels[i];
      if (!reel.spinning) { stoppedCount++; continue; }

      if (!reel.stopping && now >= this.reelStopTimes[i]) reel.beginStopping();

      const justStopped = reel.update(delta);
      if (justStopped) {
        stoppedCount++;
        this.onReelStopped(i);
      }
    }

    if (stoppedCount === N_REELS && this.spinning) {
      this.spinning = false;
      setTimeout(() => this.onAllReelsStopped(), 250);
    }
  }

  // ── Private ──────────────────────────────────

  private onReelStopped(index: number): void {
    // Trigger anticipation after reel 1 stops if it matches reel 0
    if (
      index === 1 &&
      this.reels[0].stoppedSid >= 0 &&
      this.reels[0].stoppedSid === this.reels[1].stoppedSid
    ) {
      this.anticipation.start();
      const r2 = this.reels[2];
      r2.speed = Math.min(r2.speed, ANTICIPATION_SPEED_CAP);
      this.reelStopTimes[2] =
        Date.now() +
        ANTICIPATION_STOP_DELAY +
        ANTICIPATION_STOP_JITTER[0] +
        Math.random() * (ANTICIPATION_STOP_JITTER[1] - ANTICIPATION_STOP_JITTER[0]);
      this.emitter.emit('anticipate');
    }
  }

  private onAllReelsStopped(): void {
    const result = this.evaluateResult();

    if (result.isWin) {
      this.ui.addCredits(result.prize);
      const sym = SYMBOLS[result.ids[0]];
      this.ui.showWin(
        `${sym.char}${sym.char}${sym.char}  WIN +${result.prize}  ${sym.char}${sym.char}${sym.char}`,
      );
      this.winAnimator.start(sym, this.reels);
      this.winAnimator.spawnConfetti(this.app, result.prize >= 500 ? 40 : 18);
      this.emitter.emit('win', result);
    } else {
      this.ui.showLineWinLabel(true);
      this.emitter.emit('noWin', result);
    }

    this.emitter.emit('spinComplete', result);

    // Auto-spin scheduling
    if (this.ui.autoSpinning) {
      if (!this.ui.canAffordBet()) {
        this.ui.setAutoSpin(false);
      } else {
        setTimeout(() => this.spin(), result.isWin ? 1800 : 600);
      }
    }
  }

  private evaluateResult(): SpinResult {
    const ids = this.reels.map(r => r.stoppedSid) as [number, number, number];
    const valid = ids.every(id => id >= 0 && id < SYMBOLS.length);
    const isWin = valid && ids[0] === ids[1] && ids[1] === ids[2];
    const sym   = isWin ? SYMBOLS[ids[0]] : null;
    return {
      ids,
      isWin,
      prize: sym ? sym.payout * this.ui.bet : 0,
    };
  }

  private resolveForcedStops(): [number, number, number] | null {
    if (this.forcedResult === null) return null;
    if (this.forcedResult === 'nowin') return [0, 1, 2];
    if (Array.isArray(this.forcedResult)) return this.forcedResult;
    return [this.forcedResult, this.forcedResult, this.forcedResult];
  }
}
