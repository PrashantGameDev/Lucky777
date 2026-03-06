import * as PIXI from 'pixi.js';
import { CELL, SYMBOLS } from '../constants';
import type { SymbolDef } from '../types';

export class SymbolFactory {
  private readonly textures: PIXI.Texture[];

  constructor(private readonly renderer: PIXI.Renderer) {
    this.textures = SYMBOLS.map(s => this.render(s));
  }

  getTexture(symbolId: number): PIXI.Texture {
    const tex = this.textures[symbolId];
    if (!tex) throw new Error(`No texture for symbol id ${symbolId}`);
    return tex;
  }

  get count(): number {
    return this.textures.length;
  }

  private render(sym: SymbolDef): PIXI.Texture {
    const container = new PIXI.Container();

    // Drop shadow
    const shadow = new PIXI.Text(sym.char, {
      fontFamily: 'Georgia, serif',
      fontSize: 72,
      fontWeight: 'bold',
      fill: '#000000',
    });
    shadow.anchor.set(0.5);
    shadow.x = CELL / 2 + 3;
    shadow.y = CELL / 2 + 3;
    container.addChild(shadow);

    // Main glyph
    const glyph = new PIXI.Text(sym.char, {
      fontFamily: 'Georgia, serif',
      fontSize: 72,
      fontWeight: 'bold',
      fill: sym.fill,
      fillGradientType: PIXI.TEXT_GRADIENT.LINEAR_VERTICAL,
      stroke: sym.stroke,
      strokeThickness: 3,
      dropShadow: true,
      dropShadowColor: sym.fill[1],
      dropShadowBlur: 14,
      dropShadowDistance: 0,
    });
    glyph.anchor.set(0.5);
    glyph.x = CELL / 2;
    glyph.y = CELL / 2;
    container.addChild(glyph);

    return this.renderer.generateTexture(
      container,
      {
        scaleMode: PIXI.SCALE_MODES.LINEAR,
        resolution: 1,
        region: new PIXI.Rectangle(0, 0, CELL, CELL),
      }
    );
  }
}

// PIXI.SCALE_MODES.LINEAR,
//       1,
//       new PIXI.Rectangle(0, 0, CELL, CELL),