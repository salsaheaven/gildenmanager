// Tests für die Sprachauswahl: Texte nachschlagen, Rückfall auf Deutsch, beide Sprachen vollständig.

import { describe, it, expect, afterEach } from 'vitest';
import { t, setLanguage, getLanguage, getLanguageForBrowser } from '../src/core/Language.js';
import { TEXTS_DE } from '../src/data/texts/de.js';
import { TEXTS_EN } from '../src/data/texts/en.js';

// Alle Text-Namen eines verschachtelten Objekts, z.B. ['topBar.endDay', 'todo.boxes', …]
function collectKeys(texts, prefix = '') {
  const keys = [];
  for (const name in texts) {
    const value = texts[name];
    if (typeof value === 'object' && value !== null) {
      keys.push(...collectKeys(value, prefix + name + '.'));
    } else {
      keys.push(prefix + name);
    }
  }
  return keys;
}

describe('Sprache', () => {
  afterEach(() => setLanguage('de'));

  it('schlägt Texte nach, auch mit Werten', () => {
    setLanguage('de');
    expect(t('topBar.endDay')).toBe('Tag beenden ▶');
    expect(t('todo.boxes', { count: 3 })).toBe('3 Kisten warten aufs Öffnen');
    setLanguage('en');
    expect(getLanguage()).toBe('en');
    expect(t('todo.boxes', { count: 1 })).toBe('1 chest waiting to be opened');
    expect(t('gibt.es.nicht')).toBe('gibt.es.nicht');
  });

  it('Browser-Sprache: Deutsch nur bei de…, sonst Englisch', () => {
    expect(getLanguageForBrowser('de-DE')).toBe('de');
    expect(getLanguageForBrowser('en-US')).toBe('en');
    expect(getLanguageForBrowser('fr')).toBe('en');
    expect(getLanguageForBrowser(undefined)).toBe('en');
  });

  it('Deutsch und Englisch haben dieselben Text-Namen', () => {
    const german = collectKeys(TEXTS_DE).sort();
    const english = collectKeys(TEXTS_EN).sort();
    expect(english.filter((key) => !german.includes(key)), 'nur auf Englisch').toEqual([]);
    expect(german.filter((key) => !english.includes(key)), 'fehlt auf Englisch').toEqual([]);
  });
});
