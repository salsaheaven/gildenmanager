// Prüft, ob die Inhalte in src/data gültig sind.
// Wenn du dort etwas änderst und einen Fehler machst, schlägt hier ein Test an.

import { describe, it, expect } from 'vitest';
import { LOOT_BOXES } from '../src/data/lootBoxes.js';
import { RARITIES } from '../src/data/rarities.js';
import { ITEM_TEMPLATES, SLOT_NAMES, STAT_NAMES } from '../src/data/items.js';
import { SPRITES, PALETTE } from '../src/data/sprites.js';
import { BALANCING } from '../src/data/balancing.js';

describe('Kisten-Daten', () => {
  for (const box of LOOT_BOXES) {
    it(`${box.name}: Chancen ergeben zusammen 100 %`, () => {
      let sum = 0;
      for (const rarityId in box.chances) {
        sum += box.chances[rarityId];
      }
      expect(sum).toBeCloseTo(100, 5);
    });

    it(`${box.name}: nur bekannte Seltenheiten`, () => {
      const knownIds = RARITIES.map((rarity) => rarity.id);
      for (const rarityId in box.chances) {
        expect(knownIds).toContain(rarityId);
      }
    });
  }
});

describe('Item-Vorlagen', () => {
  for (const template of ITEM_TEMPLATES) {
    it(`${template.name}: Slot, Werte und Bild existieren`, () => {
      expect(SLOT_NAMES[template.slot]).toBeDefined();
      expect(SPRITES[template.sprite]).toBeDefined();
      for (const statName in template.stats) {
        expect(STAT_NAMES[statName]).toBeDefined();
      }
    });
  }
});

describe('Pixel-Art', () => {
  for (const spriteName in SPRITES) {
    it(`${spriteName}: alle Zeilen gleich lang und nur bekannte Farben`, () => {
      const rows = SPRITES[spriteName];
      for (const row of rows) {
        expect(row.length).toBe(rows[0].length);
        for (const character of row) {
          if (character !== '.') {
            expect(PALETTE[character], `Zeichen "${character}"`).toBeDefined();
          }
        }
      }
    });
  }
});

describe('Pity-Hinweise', () => {
  it('beginnen bei 0 und sind aufsteigend sortiert', () => {
    const hints = BALANCING.pityHints;
    expect(hints[0].fromProgress).toBe(0);
    for (let i = 1; i < hints.length; i++) {
      expect(hints[i].fromProgress).toBeGreaterThan(hints[i - 1].fromProgress);
    }
  });
});
