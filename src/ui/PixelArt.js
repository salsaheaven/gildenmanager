// ============================================================
// PIXELART – zeichnet ein Bild aus data/sprites.js auf eine Leinwand (canvas)
// ============================================================

import { SPRITES, PALETTE } from '../data/sprites.js';

// spriteName  = Name des Bildes, z.B. 'sword'
// scale       = wie groß ein Pixel gezeichnet wird (4 = jeder Pixel wird 4x4 groß)
// extraColors = Farben, die die Palette ersetzen, z.B. { R: '#a335ee' }
export function createSpriteCanvas(spriteName, scale, extraColors = {}) {
  const rows = SPRITES[spriteName];
  const colors = { ...PALETTE, ...extraColors };

  const canvas = document.createElement('canvas');
  canvas.width = rows[0].length * scale;
  canvas.height = rows.length * scale;
  canvas.className = 'sprite';

  const context = canvas.getContext('2d');
  for (let y = 0; y < rows.length; y++) {
    for (let x = 0; x < rows[y].length; x++) {
      const character = rows[y][x];
      if (character === '.') {
        continue; // durchsichtig
      }
      context.fillStyle = colors[character];
      context.fillRect(x * scale, y * scale, scale, scale);
    }
  }
  return canvas;
}

// Bild eines Items: Die Stellen mit "R" bekommen die Seltenheitsfarbe,
// dazu die Farben der Rüstungsart (Platte grau, Leder braun, Stoff violett)
export function createItemCanvas(item, scale) {
  return createSpriteCanvas(item.getSprite(), scale, { ...item.getSpriteColors(), R: item.getRarity().color });
}

// Bild einer Kiste in ihren Farben (geschlossen oder offen mit Leuchtfarbe)
export function createChestCanvas(boxType, scale, isOpen = false, glowColor = '#ffffff') {
  const spriteName = isOpen ? 'chestOpen' : 'chestClosed';
  return createSpriteCanvas(spriteName, scale, {
    R: boxType.mainColor,
    D: boxType.darkColor,
    L: glowColor,
  });
}

// Bild eines Helden: Kleidung in Klassenfarbe, dazu seine Haut- und Haarfarbe
export function createHeroCanvas(hero, scale) {
  const heroClass = hero.getClass();
  return createSpriteCanvas(heroClass.sprite, scale, {
    C: heroClass.color,
    h: hero.looks.skin,
    H: hero.looks.hair,
  });
}
