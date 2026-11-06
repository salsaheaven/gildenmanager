// ============================================================
// SAVEMANAGER – speichert und lädt den Spielstand im Browser (localStorage)
// ============================================================

const SAVE_KEY = 'gildenmanager-save';

// Wenn sich der Aufbau des Spielstands ändert, wird diese Zahl erhöht.
// Alte Spielstände mit anderer Version werden dann nicht geladen.
const SAVE_VERSION = 27; // 3 = Resistenzen auf Items, 4 = neue Anweisungen (Haltung + Eigenheit), 5 = Sammelbuch, 6 = Vorräte und Händler, 7 = Tagesaufgaben und Sold, 8 = KI-Gilden und Ticker, 9 = Talente, 10 = Zerlegen und Verbessern, 11 = Starttruppe und Aufträge, 12 = Gildenhalle und unbezahlter Sold, 13 = Schmieden, Kräuter und Rohstoffe, 14 = Markierung neuer Ausrüstung, 15 = Dungeonwissen durch Erkunden, 16 = stehende Gruppen, 17 = schrittweises Freischalten, 18 = Klassen-Sets, 19 = Konter-Talente in Reihe 1, 20 = gesperrte Items, 21 = Set-Dungeons mit 2 Bossen, 22 = Raid-Aufstellung, 23 = Raid-Beute (Aschenessenz, Raid-Pity), 24 = Raid 2 und Sperre pro Raid, 25 = Raid-Rennen und Endauswertung, 26 = neue Konter-Talente, 27 = automatische Schrott-Verwertung

export class SaveManager {
  // storage = wo gespeichert wird. Normalerweise localStorage des Browsers,
  // in Tests ein Ersatz-Speicher.
  constructor(storage) {
    this.storage = storage;
  }

  save(game) {
    const data = {
      version: SAVE_VERSION,
      savedAt: Date.now(),
      game: game.toSaveData(),
    };
    try {
      this.storage.setItem(SAVE_KEY, JSON.stringify(data));
      return true;
    } catch (error) {
      console.warn('Speichern fehlgeschlagen:', error);
      return false;
    }
  }

  // Gibt die gespeicherten Spieldaten zurück, oder null, wenn es keinen gültigen Spielstand gibt
  load() {
    try {
      const text = this.storage.getItem(SAVE_KEY);
      if (!text) {
        return null;
      }
      const data = JSON.parse(text);
      if (data.version !== SAVE_VERSION) {
        console.warn('Spielstand hat eine alte Version und wird ignoriert.');
        return null;
      }
      return data.game;
    } catch (error) {
      console.warn('Laden fehlgeschlagen:', error);
      return null;
    }
  }

  deleteSave() {
    try {
      this.storage.removeItem(SAVE_KEY);
    } catch (error) {
      console.warn('Löschen fehlgeschlagen:', error);
    }
  }
}
