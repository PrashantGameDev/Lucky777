# 🎰 Lucky 777 — PixiJS + TypeScript Slot Machine

A fully-featured slot machine game built with **PixiJS v7** and **TypeScript**, bundled with **Vite**.

---

## 🚀 Getting Started

```bash
npm install
npm run dev      # Start dev server at http://localhost:5173
npm run build    # Production build → dist/
npm run preview  # Preview production build
```

---

## 📁 Project Structure

```
lucky777/
├── index.html                  # HTML entry point + test panel markup
├── package.json
├── tsconfig.json
├── vite.config.ts
└── src/
    ├── main.ts                 # App entry — wires all classes together
    ├── constants.ts            # All layout constants, symbol defs, timing
    ├── types/
    │   └── index.ts            # Shared TypeScript interfaces & types
    ├── styles/
    │   └── main.css            # Global styles + test panel CSS
    └── classes/
        ├── EventEmitter.ts     # Typed pub/sub event bus
        ├── SymbolFactory.ts    # Pre-renders PixiJS symbol textures
        ├── Reel.ts             # Single reel: sprites, scrolling, snap logic
        ├── AnticipationAnimator.ts  # Reel 3 shake + glow when reels 1&2 match
        ├── WinAnimator.ts      # Win pulse, glow ring, flash overlays, confetti
        ├── UIManager.ts        # All PixiJS UI: cabinet, panels, buttons, payline
        ├── SpinController.ts   # Spin orchestration, win detection, auto-spin
        └── TestPanel.ts        # HTML test panel — force wins, anticipation, etc.
```

---

## 🏛️ Architecture

The game follows a clean **separation of concerns**:

| Class | Responsibility |
|---|---|
| `EventEmitter` | Decoupled communication between classes via typed events |
| `SymbolFactory` | One-time texture generation; cached and shared across all reels |
| `Reel` | Owns its sprites, handles scrolling physics, deceleration and snap |
| `AnticipationAnimator` | Triggered by `SpinController` when reels 0+1 match; animates reel 2 |
| `WinAnimator` | Triggered on win; pulses symbols, dims non-winners, spawns confetti |
| `UIManager` | Builds and updates all PixiJS display objects; owns credits/bet state |
| `SpinController` | Drives the spin loop each tick; detects wins; schedules auto-spin |
| `TestPanel` | Pure DOM layer; reads/writes `SpinController.forcedResult` only |

**Event flow:**
```
HTML button click
  → TestPanel sets ctrl.forcedResult
  → TestPanel calls ctrl.spin()
  → SpinController drives reels each tick
  → onAllReelsStopped() evaluates result
  → emitter.emit('win' | 'noWin')
  → UIManager.showWin() / WinAnimator.start()
```

---

## 🎮 Controls

| Input | Action |
|---|---|
| `Space` / `Enter` | Spin |
| `A` | Toggle auto-spin |
| Click `SPIN` button | Spin |
| Click `AUTO` button | Toggle auto-spin |
| `−` / `+` arrows | Decrease / increase bet |

---

## 🧪 Test Panel

The floating test panel (top-right) lets you:

- **Force any symbol** — select a symbol to force all 3 reels to land it next spin
- **Win: X×3** — instantly spin with a guaranteed 3-of-a-kind win
- **Force No-Win** — guaranteed no match (lands 7, ★, ♦)
- **Anticipate → WIN** — forces ★ ★ ★, triggering the full anticipation animation then a win
- **Anticipate → MISS** — forces ★ ★ ♥, anticipation then near-miss
- **+200 Credits** — top up credits
- **Free Spin** — spin without deducting bet

---

## 🎰 Symbol Payouts (× bet)

| Symbol | Payout |
|---|---|
| 7 | ×100 |
| ★ | ×50 |
| ♦ | ×30 |
| ♣ | ×20 |
| ♥ | ×10 |
