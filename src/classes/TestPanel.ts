import type { SpinController } from './SpinController';
import type { UIManager }      from './UIManager';

interface SymEntry { id: number; char: string; }

const SYMS: SymEntry[] = [
  { id: 0, char: '7' },
  { id: 1, char: '★' },
  { id: 2, char: '♦' },
  { id: 3, char: '♣' },
  { id: 4, char: '♥' },
];

export class TestPanel {
  private selectedSym: number | null = null;
  private readonly log: HTMLElement;

  constructor(
    private readonly ctrl: SpinController,
    private readonly ui:   UIManager,
  ) {
    const logEl = document.getElementById('test-log');
    if (!logEl) throw new Error('Missing #test-log element');
    this.log = logEl;

    this.buildSymbolButtons();
    this.bindPresets();
    this.bindAnticipation();
    this.bindUtils();
    this.bindCollapse();
  }

  // ── Private ──────────────────────────────────

  private setLog(msg: string): void {
    this.log.textContent = msg;
  }

  private clearSymHighlights(): void {
    document.querySelectorAll('.sym-btn').forEach(el => el.classList.remove('sel'));
  }

  private buildSymbolButtons(): void {
    const container = document.getElementById('sym-btns');
    if (!container) return;

    SYMS.forEach(s => {
      const btn = document.createElement('button');
      btn.className   = 'sym-btn';
      btn.textContent = s.char;
      btn.title       = `Force ${s.char}×3`;

      btn.addEventListener('click', () => {
        this.clearSymHighlights();
        if (this.selectedSym === s.id) {
          this.selectedSym          = null;
          this.ctrl.forcedResult    = null;
          this.setLog('cleared');
        } else {
          btn.classList.add('sel');
          this.selectedSym          = s.id;
          this.ctrl.forcedResult    = s.id;
          this.setLog(`Next spin → ${s.char}×3`);
        }
      });

      container.appendChild(btn);
    });
  }

  private bindPresets(): void {
    const presets: Array<[string, number, string]> = [
      ['btn-win7',      0, '7×3 win'],
      ['btn-win-star',  1, '★×3 win'],
      ['btn-win-dia',   2, '♦×3 win'],
      ['btn-win-club',  3, '♣×3 win'],
      ['btn-win-heart', 4, '♥×3 win'],
    ];

    presets.forEach(([id, sid, label]) => {
      this.on(id, () => {
        this.ctrl.forcedResult = sid;
        this.clearSymHighlights();
        (document.querySelectorAll('.sym-btn')[sid] as HTMLElement)?.classList.add('sel');
        this.selectedSym = sid;
        this.setLog(`Next spin → ${label}`);
        this.ctrl.spin();
      });
    });

    this.on('btn-no-win', () => {
      this.ctrl.forcedResult = 'nowin';
      this.clearSymHighlights();
      this.selectedSym = null;
      this.setLog('Next spin → no match');
      this.ctrl.spin();
    });
  }

  private bindAnticipation(): void {
    this.on('btn-ant-win', () => {
      this.ctrl.forcedResult = [1, 1, 1]; // ★ ★ ★ — anticipation then WIN
      this.clearSymHighlights();
      (document.querySelectorAll('.sym-btn')[1] as HTMLElement)?.classList.add('sel');
      this.selectedSym = 1;
      this.setLog('Anticipate → WIN ★×3');
      this.ctrl.spin();
    });

    this.on('btn-ant-miss', () => {
      this.ctrl.forcedResult = [1, 1, 4]; // ★ ★ ♥ — anticipation then MISS
      this.clearSymHighlights();
      this.selectedSym = null;
      this.setLog('Anticipate → MISS (★ ★ ♥)');
      this.ctrl.spin();
    });
  }

  private bindUtils(): void {
    this.on('btn-add-credits', () => {
      this.ui.addCredits(200);
      this.setLog('+200 credits added');
    });

    this.on('btn-free-spin', () => {
      if (this.ctrl.isSpinning) return;
      this.setLog('free spin!');
      this.ctrl.spin(true /* free */);
    });
  }

  private bindCollapse(): void {
    let collapsed = false;
    const body   = document.getElementById('tp-body');
    const toggle = document.getElementById('tp-toggle');
    if (!body || !toggle) return;

    toggle.addEventListener('click', () => {
      collapsed        = !collapsed;
      body.style.display   = collapsed ? 'none' : 'block';
      toggle.textContent   = collapsed ? '▼' : '▲';
    });
  }

  /** Helper: bind click on an element by id. */
  private on(id: string, handler: () => void): void {
    const el = document.getElementById(id);
    if (!el) { console.warn(`TestPanel: missing element #${id}`); return; }
    el.addEventListener('click', handler);
  }
}
