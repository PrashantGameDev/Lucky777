import * as PIXI from 'pixi.js';
import {
  CANVAS_W, CANVAS_H,
  REELS_X, REELS_Y, TOTAL_W, REEL_H, PAYLINE_Y,
  WIN_ROW_Y,
  PANEL_Y, PANEL_W, PANEL_H,
  BTN_Y, PAY_Y, FOOTER_Y,
  BET_STEPS, STARTING_CREDITS,
} from '../constants';
import type { EventEmitter } from './EventEmitter';

const LS: Partial<PIXI.ITextStyle> = {
  fontFamily: 'Georgia, serif', fontSize: 11,
  fill: 0xb8860b as unknown as string, letterSpacing: 3,
};
const VS: Partial<PIXI.ITextStyle> = {
  fontFamily: 'Georgia, serif', fontSize: 28, fontWeight: 'bold',
  fill: ['#FFD700', '#FF8C00'],
  fillGradientType: PIXI.TEXT_GRADIENT.LINEAR_VERTICAL,
};

export class UIManager {
  // ── Readable state ──────────────────────────
  credits = STARTING_CREDITS;
  betIdx = 1;
  get bet(): number { return BET_STEPS[this.betIdx]; }

  // ── Dynamic text nodes ──────────────────────
  private creditText!: PIXI.Text;
  private betText!: PIXI.Text;
  private winText!: PIXI.Text;
  private lineWinLabel!: PIXI.Text;
  private winCont!: PIXI.Container;
  private winFlash = 0;

  // ── Dust particles ──────────────────────────
  private dust: Array<PIXI.Graphics & { _vx: number; _vy: number }> = [];

  // ── Title beat ──────────────────────────────
  private titleBeat = 0;
  private titleGfx!: PIXI.Text;

  // ── Payline ─────────────────────────────────
  private paylineGfx!: PIXI.Graphics;

  // ── Auto-spin state ─────────────────────────
  autoSpinning = false;
  private autoGfx!: PIXI.Graphics;
  private autoLbl!: PIXI.Text;
  private autoCont!: PIXI.Container;

  constructor(
    private readonly stage: PIXI.Container,
    private readonly emitter: EventEmitter,
  ) {
    // Call buildBackground() before adding reels, buildForeground() after.
  }

  // ── Public update ────────────────────────────
  tick(delta: number): void {
    const now = Date.now();

    // Dust
    for (const p of this.dust) {
      p.x += p._vx * delta;
      p.y += p._vy * delta;
      if (p.y < -5) p.y = CANVAS_H + 5;
      if (p.x < 0) p.x = CANVAS_W;
      if (p.x > CANVAS_W) p.x = 0;
    }

    // Title breathe
    this.titleBeat += delta * 0.035;
    this.titleGfx.scale.set(1 + Math.sin(this.titleBeat) * 0.01);

    // Payline pulse
    this.drawPayline(0.45 + Math.sin(now * 0.004) * 0.35);

    // Win message pulse
    if (this.winCont.visible) {
      this.winFlash += delta * 0.07;
      this.winCont.scale.set(1 + Math.sin(this.winFlash) * 0.03);
      this.winText.alpha = 0.75 + Math.sin(this.winFlash * 2.5) * 0.25;
    }
  }

  // ── Credits / bet ────────────────────────────
  addCredits(amount: number): void {
    this.credits += amount;
    this.creditText.text = `${this.credits}`;
    this.emitter.emit('creditsChanged', this.credits);
  }

  deductBet(): void {
    this.credits -= this.bet;
    this.creditText.text = `${this.credits}`;
    this.emitter.emit('creditsChanged', this.credits);
  }

  canAffordBet(): boolean {
    return this.credits >= this.bet;
  }

  // ── Win display ──────────────────────────────
  showWin(label: string): void {
    this.winText.text = label;
    this.winCont.visible = true;
    this.winFlash = 0;
    this.lineWinLabel.visible = false;
  }

  hideWin(): void {
    this.winCont.visible = false;
  }

  showLineWinLabel(visible: boolean): void {
    this.lineWinLabel.visible = visible;
  }

  hideForSpin(): void {
    this.winCont.visible = false;
    this.lineWinLabel.visible = false;
  }

  // ── Auto-spin toggle ─────────────────────────
  setAutoSpin(active: boolean): void {
    this.autoSpinning = active;
    this.drawAutoBtn();
  }

  // ── Bet arrows ──────────────────────────────
  changeBet(direction: 1 | -1, isSpinning: boolean): void {
    if (isSpinning) return;
    this.betIdx = Math.max(0, Math.min(BET_STEPS.length - 1, this.betIdx + direction));
    this.betText.text = `${this.bet}`;
    this.emitter.emit('betChanged', this.bet);
  }

  // ── Build all UI ────────────────────────────
  /** Draw background layers — must be called BEFORE reels are added to stage. */
  buildBackground(): void {
    this.buildCabinet();
    this.buildDust();
    this.buildTitle();
    this.buildReelFrame();
    this.buildPayline();
  }

  /** Draw foreground layers — must be called AFTER reels are added to stage. */
  buildForeground(): void {
    this.buildWinRow();
    this.buildPanels();
    this.buildButtons();
    this.buildPaytable();
    this.buildFooter();
  }

  private buildCabinet(): void {
    const shadow = new PIXI.Graphics();
    shadow.beginFill(0x000000, 0.45);
    shadow.drawRoundedRect(36, 28, CANVAS_W - 52, CANVAS_H - 36, 32);
    shadow.endFill();
    this.stage.addChild(shadow);

    const cab = new PIXI.Graphics();
    cab.beginFill(0x160c04);
    cab.drawRoundedRect(28, 18, CANVAS_W - 56, CANVAS_H - 36, 28);
    cab.endFill();
    cab.lineStyle(3, 0xffd700, 0.9);
    cab.drawRoundedRect(28, 18, CANVAS_W - 56, CANVAS_H - 36, 28);
    cab.lineStyle(1.5, 0xffaa00, 0.35);
    cab.drawRoundedRect(34, 24, CANVAS_W - 68, CANVAS_H - 48, 24);
    this.stage.addChild(cab);
  }

  private buildDust(): void {
    const layer = new PIXI.Container();
    this.stage.addChild(layer);
    for (let i = 0; i < 35; i++) {
      const g = new PIXI.Graphics() as PIXI.Graphics & { _vx: number; _vy: number };
      g.beginFill(0xffd700, 0.08 + Math.random() * 0.14);
      g.drawCircle(0, 0, 1 + Math.random() * 1.5);
      g.endFill();
      g.x = Math.random() * CANVAS_W;
      g.y = Math.random() * CANVAS_H;
      g._vx = (Math.random() - 0.5) * 0.3;
      g._vy = -(0.35 + Math.random() * 0.3);
      layer.addChild(g);
      this.dust.push(g);
    }
  }

  private buildTitle(): void {
    this.titleGfx = new PIXI.Text('LUCKY 777', {
      fontFamily: 'Georgia, serif', fontSize: 38, fontWeight: 'bold',
      fill: ['#FFD700', '#FF8C00'],
      fillGradientType: PIXI.TEXT_GRADIENT.LINEAR_VERTICAL,
      dropShadow: true, dropShadowColor: '#FF2200',
      dropShadowBlur: 14, dropShadowDistance: 2,
      letterSpacing: 8,
    });
    this.titleGfx.anchor.set(0.5, 0);
    this.titleGfx.x = CANVAS_W / 2;
    this.titleGfx.y = 34;
    this.stage.addChild(this.titleGfx);

    const line = new PIXI.Graphics();
    line.lineStyle(2, 0xffd700, 0.5);
    line.moveTo(80, 86);
    line.lineTo(CANVAS_W - 80, 86);
    this.stage.addChild(line);
  }

  private buildReelFrame(): void {
    const f = new PIXI.Graphics();
    f.beginFill(0x060300);
    f.drawRoundedRect(REELS_X - 18, REELS_Y - 18, TOTAL_W + 36, REEL_H + 36, 18);
    f.endFill();
    f.lineStyle(3.5, 0xb8860b, 1);
    f.drawRoundedRect(REELS_X - 18, REELS_Y - 18, TOTAL_W + 36, REEL_H + 36, 18);
    f.lineStyle(1.5, 0xffd700, 0.45);
    f.drawRoundedRect(REELS_X - 12, REELS_Y - 12, TOTAL_W + 24, REEL_H + 24, 14);
    this.stage.addChild(f);
  }

  private buildPayline(): void {
    this.paylineGfx = new PIXI.Graphics();
    this.stage.addChild(this.paylineGfx);
    this.drawPayline(0.85);
  }

  private drawPayline(alpha: number): void {
    this.paylineGfx.clear();
    this.paylineGfx.lineStyle(2.5, 0xff2200, alpha);
    this.paylineGfx.moveTo(REELS_X - 16, PAYLINE_Y);
    this.paylineGfx.lineTo(REELS_X + TOTAL_W + 16, PAYLINE_Y);
  }

  private buildWinRow(): void {
    this.winCont = new PIXI.Container();
    this.winCont.visible = false;
    this.winCont.x = CANVAS_W / 2;
    this.winCont.y = WIN_ROW_Y + 38;
    this.stage.addChild(this.winCont);

    const bg = new PIXI.Graphics();
    bg.beginFill(0x000000, 0.75);
    bg.drawRoundedRect(-130, -22, 260, 44, 12);
    bg.endFill();
    bg.lineStyle(2, 0xffd700, 1);
    bg.drawRoundedRect(-130, -22, 260, 44, 12);
    this.winCont.addChild(bg);

    this.winText = new PIXI.Text('', {
      fontFamily: 'Georgia, serif', fontSize: 19, fontWeight: 'bold',
      fill: ['#FFD700', '#FF4400'],
      fillGradientType: PIXI.TEXT_GRADIENT.LINEAR_VERTICAL,
      dropShadow: true, dropShadowColor: '#FF0000',
      dropShadowBlur: 16, dropShadowDistance: 0,
    });
    this.winText.anchor.set(0.5);
    this.winCont.addChild(this.winText);

    this.lineWinLabel = new PIXI.Text('LINE WINS', {
      fontFamily: 'Georgia, serif', fontSize: 11,
      fill: 0x4a3800 as unknown as string, letterSpacing: 4,
    });
    this.lineWinLabel.anchor.set(0.5, 0);
    this.lineWinLabel.x = CANVAS_W / 2;
    this.lineWinLabel.y = WIN_ROW_Y + 32;
    this.stage.addChild(this.lineWinLabel);
  }

  private buildPanels(): void {
    const addPanel = (x: number): void => {
      const g = new PIXI.Graphics();
      g.beginFill(0x060300);
      g.drawRoundedRect(x, PANEL_Y, PANEL_W, PANEL_H, 10);
      g.endFill();
      g.lineStyle(2, 0xb8860b, 0.8);
      g.drawRoundedRect(x, PANEL_Y, PANEL_W, PANEL_H, 10);
      this.stage.addChild(g);
    };
    const addTxt = (
      s: string, x: number, y: number,
      style: Partial<PIXI.ITextStyle>,
    ): PIXI.Text => {
      const t = new PIXI.Text(s, style);
      t.anchor.set(0.5, 0);
      t.x = x; t.y = y;
      this.stage.addChild(t);
      return t;
    };

    // Credits panel
    const cx = 58 + PANEL_W / 2;
    addPanel(58);
    addTxt('CREDITS', cx, PANEL_Y + 7, LS);
    this.creditText = addTxt(`${this.credits}`, cx, PANEL_Y + 24, VS);

    // Bet panel
    const bx = CANVAS_W - 58 - PANEL_W;
    addPanel(bx);
    addTxt('BET', bx + PANEL_W / 2, PANEL_Y + 7, LS);
    this.betText = addTxt(`${this.bet}`, bx + PANEL_W / 2, PANEL_Y + 24, VS);

    // Bet arrows
    this.makeBetArrow('−', bx + 14, PANEL_Y + PANEL_H / 2 + 2, () => this.emitter.emit('betChanged', -1 as unknown as number));
    this.makeBetArrow('+', bx + PANEL_W - 14, PANEL_Y + PANEL_H / 2 + 2, () => this.emitter.emit('betChanged', 1 as unknown as number));
  }

  private makeBetArrow(label: string, x: number, y: number, onClick: () => void): void {
    const c = new PIXI.Container();
    c.x = x; c.y = y;
    c.interactive = true; c.cursor = 'pointer';
    const bg = new PIXI.Graphics();
    bg.beginFill(0x1e0e02);
    bg.drawRoundedRect(-13, -13, 26, 26, 6);
    bg.endFill();
    bg.lineStyle(1.5, 0xb8860b, 0.8);
    bg.drawRoundedRect(-13, -13, 26, 26, 6);
    const t = new PIXI.Text(label, {
      fontFamily: 'Georgia, serif', fontSize: 16,
      fontWeight: 'bold', fill: '#ffd700',
    });
    t.anchor.set(0.5);
    c.addChild(bg, t);
    this.stage.addChild(c);
    c.on('pointerdown', () => { bg.tint = 0xffaa00; onClick(); });
    c.on('pointerup', () => { bg.tint = 0xffffff; });
    c.on('pointerupoutside', () => { bg.tint = 0xffffff; });
  }

  private buildButtons(): void {
    // SPIN button
    const spinCont = new PIXI.Container();
    spinCont.x = CANVAS_W / 2 - 58;
    spinCont.y = BTN_Y;
    spinCont.interactive = true;
    spinCont.cursor = 'pointer';
    this.stage.addChild(spinCont);

    const spinGfx = new PIXI.Graphics();
    let btnDown = false;
    const drawSpin = (): void => {
      spinGfx.clear();
      const yo = btnDown ? 4 : 0;
      spinGfx.beginFill(0x700000); spinGfx.drawEllipse(0, 22 + yo, 78, 26); spinGfx.endFill();
      spinGfx.beginFill(0xbb0000); spinGfx.drawEllipse(0, 18 + yo, 78, 26); spinGfx.endFill();
      spinGfx.beginFill(0xff1a00); spinGfx.drawEllipse(0, 14 + yo, 72, 22); spinGfx.endFill();
      spinGfx.beginFill(0xffffff, 0.17); spinGfx.drawEllipse(-10, 4 + yo, 44, 11); spinGfx.endFill();
    };
    drawSpin();
    spinCont.addChild(spinGfx);

    const spinLbl = new PIXI.Text('SPIN', {
      fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 'bold',
      fill: ['#ffffff', '#FFD700'],
      fillGradientType: PIXI.TEXT_GRADIENT.LINEAR_VERTICAL,
      letterSpacing: 4, dropShadow: true,
      dropShadowColor: '#000', dropShadowBlur: 4, dropShadowDistance: 1,
    });
    spinLbl.anchor.set(0.5); spinLbl.y = 14;
    spinCont.addChild(spinLbl);

    spinCont.on('pointerdown', () => { btnDown = true; drawSpin(); spinLbl.y = 18; this.emitter.emit('spinStart'); });
    spinCont.on('pointerup', () => { btnDown = false; drawSpin(); spinLbl.y = 14; });
    spinCont.on('pointerupoutside', () => { btnDown = false; drawSpin(); spinLbl.y = 14; });

    // AUTO button
    this.autoCont = new PIXI.Container();
    this.autoCont.x = CANVAS_W / 2 + 58;
    this.autoCont.y = BTN_Y;
    this.autoCont.interactive = true;
    this.autoCont.cursor = 'pointer';
    this.stage.addChild(this.autoCont);

    this.autoGfx = new PIXI.Graphics();
    this.autoLbl = new PIXI.Text('AUTO', {
      fontFamily: 'Georgia, serif', fontSize: 14, fontWeight: 'bold',
      fill: ['#ffffff', '#aaaaaa'],
      fillGradientType: PIXI.TEXT_GRADIENT.LINEAR_VERTICAL,
      letterSpacing: 2, dropShadow: true,
      dropShadowColor: '#000', dropShadowBlur: 3, dropShadowDistance: 1,
    });
    this.autoLbl.anchor.set(0.5); this.autoLbl.y = 14;
    this.drawAutoBtn();
    this.autoCont.addChild(this.autoGfx, this.autoLbl);

    this.autoCont.on('pointerdown', () => this.emitter.emit('spinStart', 'auto' as unknown as undefined));

    // Keyboard
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' || e.code === 'Enter') this.emitter.emit('spinStart');
      if (e.code === 'KeyA') this.emitter.emit('spinStart', 'auto' as unknown as undefined);
    });
  }

  private drawAutoBtn(): void {
    const on = this.autoSpinning;
    this.autoGfx.clear();
    this.autoGfx.beginFill(on ? 0xcc8800 : 0x1a3a00); this.autoGfx.drawEllipse(0, 22, 62, 22); this.autoGfx.endFill();
    this.autoGfx.beginFill(on ? 0xffaa00 : 0x2a6000); this.autoGfx.drawEllipse(0, 18, 62, 22); this.autoGfx.endFill();
    this.autoGfx.beginFill(on ? 0xffcc44 : 0x44aa00); this.autoGfx.drawEllipse(0, 14, 56, 18); this.autoGfx.endFill();
    this.autoGfx.beginFill(0xffffff, 0.15); this.autoGfx.drawEllipse(-8, 5, 32, 9); this.autoGfx.endFill();
  }

  private buildPaytable(): void {
    const payTW = TOTAL_W + 36;
    const bg = new PIXI.Graphics();
    bg.beginFill(0x060300);
    bg.drawRoundedRect(REELS_X - 18, PAY_Y, payTW, 58, 12);
    bg.endFill();
    bg.lineStyle(1.5, 0x4a3800, 0.7);
    bg.drawRoundedRect(REELS_X - 18, PAY_Y, payTW, 58, 12);
    this.stage.addChild(bg);

    const title = new PIXI.Text('PAYTABLE', {
      fontFamily: 'Georgia, serif', fontSize: 9,
      fill: 0x6a5820 as unknown as string, letterSpacing: 4,
    });
    title.anchor.set(0.5, 0); title.x = CANVAS_W / 2; title.y = PAY_Y + 4;
    this.stage.addChild(title);

    const entries = [
      { label: '7×3', val: '×100', col: '#FF4400' },
      { label: '★×3', val: '×50', col: '#FFD700' },
      { label: '♦×3', val: '×30', col: '#00CFFF' },
      { label: '♣×3', val: '×20', col: '#44FF44' },
      { label: '♥×3', val: '×10', col: '#FF55BB' },
    ];
    const colW = payTW / entries.length;
    entries.forEach((e, i) => {
      const ex = REELS_X - 18 + i * colW + colW / 2;
      const st = new PIXI.Text(e.label, {
        fontFamily: 'Georgia, serif', fontSize: 11, fill: e.col, letterSpacing: 1,
      });
      st.anchor.set(0.5, 0); st.x = ex; st.y = PAY_Y + 16;
      this.stage.addChild(st);
      const vt = new PIXI.Text(e.val, {
        fontFamily: 'Georgia, serif', fontSize: 13, fontWeight: 'bold', fill: '#FFD700',
      });
      vt.anchor.set(0.5, 0); vt.x = ex; vt.y = PAY_Y + 33;
      this.stage.addChild(vt);
    });
  }

  private buildFooter(): void {
    const line = new PIXI.Graphics();
    line.lineStyle(1, 0x4a3800, 0.4);
    line.moveTo(80, FOOTER_Y); line.lineTo(CANVAS_W - 80, FOOTER_Y);
    this.stage.addChild(line);

    const t = new PIXI.Text('© LUCKY 777 CASINO  •  SPACE / ENTER to spin  •  A = auto', {
      fontFamily: 'Georgia, serif', fontSize: 10,
      fill: 0x4a3800 as unknown as string, letterSpacing: 2,
    });
    t.anchor.set(0.5, 0); t.x = CANVAS_W / 2; t.y = FOOTER_Y + 7;
    this.stage.addChild(t);
  }
}
