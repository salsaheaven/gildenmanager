// ============================================================
// LOOTBOX-ARTEN
// Jede Kiste hat Chancen in Prozent für jede Seltenheit.
// Die Chancen einer Kiste müssen zusammen genau 100 ergeben (ein Test prüft das).
//
// id          = interner Name
// name        = Anzeigename
// price       = Kaufpreis in Gold (null = nicht kaufbar, z.B. Boss-Kisten)
// itemCount   = wie viele Items darin sind
// mainColor   = Hauptfarbe der Kiste (Pixelbild)
// darkColor   = dunkle Farbe für Schatten und Beschläge
// shakeTime   = wie lange die Kiste vor dem Öffnen wackelt (Sekunden), mehr = spannender
// chances     = Prozent-Chance pro Seltenheit
// bossLoot    = nur Boss-Kisten: besondere Items des Bosses. Eines davon ist garantiert in der Kiste,
//               mindestens in der Seltenheit minRarity. { templateId, name, minRarity }
// bossResistance = nur Boss-Kisten: Resistenz, die alle Boss-Items tragen (Schadensart des Bosses,
//               siehe damageTypes.js). Fehlt sie, haben die Boss-Items keine feste Resistenz.
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

  // ---------- Boss-Kisten (nur aus Dungeons, nicht kaufbar) ----------
  {
    id: 'chestGrimfang',
    name: 'Grimmzahns Beute',
    price: null,
    itemCount: 3,
    mainColor: '#8b5a2b',
    darkColor: '#4a2a10',
    shakeTime: 1.3,
    chances: { poor: 10, common: 30, uncommon: 35, rare: 19, epic: 5, legendary: 1 },
    bossLoot: [
      { templateId: 'attackRing', name: 'Grimmzahns Fangzahn', minRarity: 'rare' },
      { templateId: 'leatherArmor', name: 'Bärenfell-Harnisch', minRarity: 'rare' },
      { templateId: 'plateHelmet', name: 'Prankenhelm', minRarity: 'rare' },
    ],
  },
  {
    id: 'chestMorva',
    bossResistance: 'shadow',
    name: 'Morvas Reliquien',
    price: null,
    itemCount: 3,
    mainColor: '#5a2a8a',
    darkColor: '#2a1040',
    shakeTime: 1.5,
    chances: { poor: 5, common: 25, uncommon: 35, rare: 25, epic: 8, legendary: 2 },
    bossLoot: [
      { templateId: 'staff', name: 'Stab der Schattenruferin', minRarity: 'rare' },
      { templateId: 'clothHelmet', name: 'Kapuze der Schwester', minRarity: 'rare' },
      { templateId: 'magicRing', name: 'Gebetsring der Kapelle', minRarity: 'rare' },
    ],
  },
  {
    id: 'chestSkarrix',
    bossResistance: 'acid',
    name: 'Skarrix’ Brutschatz',
    price: null,
    itemCount: 4,
    mainColor: '#3f8a3a',
    darkColor: '#1d4a1a',
    shakeTime: 1.7,
    chances: { poor: 0, common: 20, uncommon: 35, rare: 30, epic: 12, legendary: 3 },
    bossLoot: [
      { templateId: 'shield', name: 'Chitinschild', minRarity: 'rare' },
      { templateId: 'sword', name: 'Brutklinge', minRarity: 'rare' },
      { templateId: 'leatherBoots', name: 'Säurestiefel', minRarity: 'rare' },
    ],
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
