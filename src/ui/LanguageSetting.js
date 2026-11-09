// ============================================================
// LANGUAGESETTING – merkt sich die gewählte Sprache im Browser (localStorage)
// Beim ersten Start gilt die Sprache des Browsers (Deutsch bei "de…", sonst Englisch).
// Die Sprache gehört nicht zum Spielstand: Sie bleibt auch nach "Neu" erhalten.
// ============================================================

import { setLanguage, getLanguageForBrowser } from '../core/Language.js';

const STORAGE_KEY = 'gildenmanager-sprache';

// Gemerkte Sprache laden (oder die des Browsers) und setzen. Muss vor dem Aufbau der Oberfläche laufen.
export function loadLanguage() {
  let language = null;
  try {
    language = localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    language = null; // z.B. privates Fenster ohne Speicher
  }
  if (!language) {
    language = getLanguageForBrowser(navigator.language);
  }
  setLanguage(language);
  document.documentElement.lang = language;
}

// Andere Sprache wählen: merken und die Seite neu laden (dann sind alle Texte in der neuen Sprache)
export function changeLanguage(language, beforeReload) {
  try {
    localStorage.setItem(STORAGE_KEY, language);
  } catch (error) {
    // ohne Speicher gilt die Wahl nur bis zum Neuladen; dann eben gar nicht
  }
  beforeReload();
  location.reload();
}
