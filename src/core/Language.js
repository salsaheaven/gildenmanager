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
// Schon nachgeschlagene Texte (Schlüssel → Text oder Funktion), damit oft gebrauchte Texte
// (z.B. im Kampfprotokoll bei 200 Probekämpfen) nicht jedes Mal neu gesucht werden
let cache = new Map();

// Aktuelle Sprache: 'de' oder 'en'
export function getLanguage() {
  return currentLanguage;
}

// Sprache setzen (unbekannte Kürzel werden ignoriert)
export function setLanguage(language) {
  if (TEXTS[language]) {
    currentLanguage = language;
    cache = new Map();
  }
}

// Passende Sprache zu einer Browser-Einstellung wie "de-DE" oder "en-US": Deutsch nur bei "de…", sonst Englisch
export function getLanguageForBrowser(browserLanguage) {
  return (browserLanguage || '').toLowerCase().startsWith('de') ? 'de' : 'en';
}

// Einen Text nachschlagen. key = "bildschirm.name", params = Werte für Texte, die Funktionen sind
export function t(key, params = {}) {
  let text = cache.get(key);
  if (text === undefined) {
    text = findText(TEXTS[currentLanguage], key) ?? findText(TEXTS.de, key);
    cache.set(key, text);
  }
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
