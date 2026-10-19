// ============================================================
// LOOTBOX-ARTEN
// Jede Kiste hat Chancen in Prozent für jede Seltenheit.
// Die Chancen einer Kiste müssen zusammen genau 100 ergeben (ein Test prüft das).
//
// id          = interner Name
// name        = Anzeigename
// price       = Kaufpreis in Gold
// itemCount   = wie viele Items darin sind
// mainColor   = Hauptfarbe der Kiste (Pixelbild)
// darkColor   = dunkle Farbe für Schatten und Beschläge
// shakeTime   = wie lange die Kiste vor dem Öffnen wackelt (Sekunden), mehr = spannender
// chances     = Prozent-Chance pro Seltenheit
// ============================================================

export const LOOT_BOXES = [
  {
    id: 'wood',
    name: 'Holzkiste',
    price: 25,
    itemCount: 2,
    mainColor: '#a0652d',
    darkColor: '#6b3f17',
    shakeTime: 0.8,
    chances: { poor: 40, common: 35, uncommon: 18, rare: 6, epic: 0.9, legendary: 0.1 },
  },
  {
    id: 'silver',
    name: 'Silberkiste',
    price: 90,
    itemCount: 3,
    mainColor: '#b8c4d6',
    darkColor: '#6d7a8f',
    shakeTime: 1.1,
    chances: { poor: 15, common: 35, uncommon: 30, rare: 15, epic: 4.5, legendary: 0.5 },
  },
  {
    id: 'gold',
    name: 'Goldkiste',
    price: 300,
    itemCount: 3,
    mainColor: '#f2c14e',
    darkColor: '#a87b16',
    shakeTime: 1.4,
    chances: { poor: 0, common: 15, uncommon: 35, rare: 32, epic: 15, legendary: 3 },
  },
  {
    id: 'epic',
    name: 'Epische Kiste',
    price: 1000,
    itemCount: 4,
    mainColor: '#9b4dff',
    darkColor: '#5a1fa8',
    shakeTime: 1.8,
    chances: { poor: 0, common: 0, uncommon: 20, rare: 45, epic: 28, legendary: 7 },
  },
];

// Hilfsfunktion: Kistenart anhand der id finden
export function getLootBoxType(boxTypeId) {
  for (const boxType of LOOT_BOXES) {
    if (boxType.id === boxTypeId) {
      return boxType;
    }
  }
  throw new Error('Unbekannte Kistenart: ' + boxTypeId);
}
