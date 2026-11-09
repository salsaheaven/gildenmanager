// Tests für die englischen Inhalte: Jede Übersetzung passt zu einem deutschen Eintrag,
// und das Anwenden ändert nur Texte, nie Zahlen.
// Angewendet wird auf Kopien der Daten, damit andere Tests deutsch bleiben.

import { describe, it, expect } from 'vitest';
import { DATA_TRANSLATIONS_EN } from '../src/data/en/index.js';
import { applyTexts } from '../src/core/DataLanguage.js';

// Alle Text-Pfade einer Übersetzung, z.B. ['warrior.name', 'warrior.passive.description']
function collectPaths(texts, prefix = '') {
  const paths = [];
  for (const key in texts) {
    if (typeof texts[key] === 'string') {
      paths.push(prefix + key);
    } else {
      paths.push(...collectPaths(texts[key], prefix + key + '.'));
    }
  }
  return paths;
}

describe('Englische Inhalte', () => {
  for (const entry of DATA_TRANSLATIONS_EN) {
    it(entry.name + ': jede Übersetzung hat einen deutschen Text', () => {
      const copy = JSON.parse(JSON.stringify(entry.target));
      expect(() => applyTexts(copy, entry.texts, entry.name)).not.toThrow();
      // Nur Texte ersetzen: Wo ein englischer Text steht, war vorher auch ein Text
      for (const path of collectPaths(entry.texts)) {
        let original = entry.target;
        for (const part of path.split('.')) {
          original = Array.isArray(original)
            ? (original.find((element) => element && element.id === part) ?? original[Number(part)])
            : original[part];
        }
        expect(typeof original, entry.name + '.' + path).toBe('string');
      }
    });
  }
});
