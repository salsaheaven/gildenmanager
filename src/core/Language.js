// ============================================================
// LANGUAGE – die Spielsprache (Deutsch oder Englisch) und das Nachschlagen von Texten
//
// Alle Texte der Oberfläche stehen in src/data/texts/de.js und src/data/texts/en.js,
// sortiert nach Bildschirm, z.B. TEXTS.topBar.endDay.
//   t('topBar.endDay')                → "Tag beenden ▶" bzw. "End day ▶"
//   t('todo.boxes', { count: 3 })     → Ein Text kann eine Funktion sein, die die Werte bekommt
// Fehlt ein Text auf Englisch, wird der deutsche genommen (so bleibt nichts leer).
//
// Gespeichert wird die Sprache nicht hier (die Logik kennt keinen Browser),
// sondern in main.js (localStorage). Beim Umschalten lädt die Seite neu.
// ============================================================

import { TEXTS_DE } from '../data/texts/de.js';
import { TEXTS_EN } from '../data/texts/en.js';

// Die Sprachen, die es gibt (Kürzel → Anzeige auf dem Umschalter)
export const LANGUAGES = { de: 'DE', en: 'EN' };

const TEXTS = { de: TEXTS_DE, en: TEXTS_EN };

let currentLanguage = 'de';

// Aktuelle Sprache: 'de' oder 'en'
export function getLanguage() {
  return currentLanguage;
}

// Sprache setzen (unbekannte Kürzel werden ignoriert)
export function setLanguage(language) {
  if (TEXTS[language]) {
    currentLanguage = language;
  }
}

// Passende Sprache zu einer Browser-Einstellung wie "de-DE" oder "en-US": Deutsch nur bei "de…", sonst Englisch
export function getLanguageForBrowser(browserLanguage) {
  return (browserLanguage || '').toLowerCase().startsWith('de') ? 'de' : 'en';
}

// Einen Text nachschlagen. key = "bildschirm.name", params = Werte für Texte, die Funktionen sind
export function t(key, params = {}) {
  const text = findText(TEXTS[currentLanguage], key) ?? findText(TEXTS.de, key);
  if (text === undefined) {
    return key; // fehlt ganz: den Schlüssel zeigen, damit man es beim Testen sieht
  }
  return typeof text === 'function' ? text(params) : text;
}

// Sucht "a.b.c" in einem verschachtelten Objekt
function findText(texts, key) {
  let current = texts;
  for (const part of key.split('.')) {
    if (current === undefined || current === null) {
      return undefined;
    }
    current = current[part];
  }
  return current;
}
