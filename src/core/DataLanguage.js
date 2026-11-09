// ============================================================
// DATALANGUAGE – Inhalte aus src/data auf Englisch umstellen
//
// Die Daten (Klassen, Skills, Bosse, Items …) stehen auf Deutsch in src/data.
// Die englischen Namen und Texte stehen in src/data/en/, sortiert nach denselben ids, z.B.
//   HERO_CLASSES_EN = { warrior: { name: 'Warrior', description: '…' } }
// applyDataLanguage('en') schreibt diese Texte beim Start in die Daten. Zahlen und Regeln bleiben unberührt.
// Weil die Sprache nur beim Laden der Seite wechselt, passiert das genau einmal (Umschalten lädt neu).
// ============================================================

import { DATA_TRANSLATIONS_EN } from '../data/en/index.js';

// Englisch: alle Übersetzungen anwenden. Deutsch: nichts tun (die Daten sind schon deutsch).
export function applyDataLanguage(language) {
  if (language !== 'en') {
    return;
  }
  for (const entry of DATA_TRANSLATIONS_EN) {
    applyTexts(entry.target, entry.texts, entry.name);
  }
}

// Schreibt die Texte aus "texts" in "target".
//   - target ist eine Liste: Der Eintrag mit passender id (oder Nummer) wird gesucht
//   - ein Text (String) ersetzt den deutschen Text
//   - ein Objekt geht eine Ebene tiefer (z.B. passive: { name, description })
// path = wo wir gerade sind (nur für die Fehlermeldung, wenn eine id nicht passt)
export function applyTexts(target, texts, path) {
  for (const key in texts) {
    const child = findChild(target, key);
    if (child === undefined) {
      throw new Error('Übersetzung ohne deutschen Eintrag: ' + path + '.' + key);
    }
    const value = texts[key];
    if (typeof value === 'string') {
      setChild(target, key, value);
    } else {
      applyTexts(child, value, path + '.' + key);
    }
  }
}

// Ein Eintrag in einem Objekt (nach Name) oder in einer Liste (nach id, sonst nach Nummer)
function findChild(target, key) {
  if (Array.isArray(target)) {
    const byId = target.find((element) => element && element.id === key);
    return byId !== undefined ? byId : target[Number(key)];
  }
  return target[key];
}

function setChild(target, key, value) {
  if (Array.isArray(target)) {
    const index = target.findIndex((element) => element && element.id === key);
    target[index >= 0 ? index : Number(key)] = value;
    return;
  }
  target[key] = value;
}
