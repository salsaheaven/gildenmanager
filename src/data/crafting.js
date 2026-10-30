// ============================================================
// MATERIAL, ZERLEGEN, VERBESSERN, SCHMIEDEN – Zahlen für alles, was mit Material zu tun hat
// Die Logik steht in systems/CraftingSystem.js (Zerlegen, Verbessern) und systems/ForgeSystem.js (Schmieden, Umschmieden).
// Brau-Rezepte stehen in data/alchemy.js.
//
// Material: Arkanstaub (aus jedem Item), Kristalle (nur aus blauen und besseren Items, nötig ab +6),
// Rohstoffe (aus zerlegten Items und von der Aufgabe "Rohstoffe sammeln", fürs Schmieden)
// und Kräuter (von der Aufgabe "Kräuter sammeln", zum Brauen im Alchemielabor).
// Eine Verbesserung steckt im Item: Wer es zerlegt oder verkauft, bekommt nur den Grundwert.
// Zahlen grob gesetzt, gebalanced wird am Ende.
// ============================================================

export const MATERIALS = {
  dust: { name: 'Arkanstaub', icon: '✧', color: '#c9b8ff' },
  crystal: { name: 'Kristall', icon: '◆', color: '#5aa9ff' },
  raw: { name: 'Rohstoffe', icon: '▲', color: '#c08a52' },
  herbs: { name: 'Kräuter', icon: '❀', color: '#9be15d' },
};

// So viel Material gibt ein zerlegtes Item, je nach Seltenheit
export const SALVAGE_YIELD = {
  poor: { dust: 1, crystal: 0, raw: 1 },
  common: { dust: 2, crystal: 0, raw: 1 },
  uncommon: { dust: 4, crystal: 0, raw: 2 },
  rare: { dust: 6, crystal: 1, raw: 2 },
  epic: { dust: 10, crystal: 2, raw: 3 },
  legendary: { dust: 15, crystal: 4, raw: 4 },
};

export const UPGRADE_RULES = {
  maxLevel: 10,
  // Jede Stufe erhöht alle Werte um diesen Anteil der Grundwerte (0.06 = +6 %, bei +10 also +60 %)
  statBonusPerLevel: 0.06,
  // Kosten für die Stufe n: dustPerLevel × n Staub und goldPerLevel × n Gold
  dustPerLevel: 3,
  goldPerLevel: 10,
  // Ab dieser Stufe kostet es zusätzlich Kristalle: (n − crystalsFromLevel + 1) Stück
  crystalsFromLevel: 6,
  // Erfolgschance für die Zielstufe (fehlt eine Stufe, klappt es immer).
  // Fehlschlag: Material und Gold sind weg, das Item bleibt auf seiner Stufe.
  successChance: { 6: 0.8, 7: 0.65, 8: 0.5, 9: 0.35, 10: 0.25 },
};

// Schmieden (ab Schmiede Stufe 1): Man wählt eine Item-Vorlage (also Platz und Rüstungsart),
// heraus kommt immer ein weißes Item. Es gleicht Pech bei der Beute aus, ersetzt sie aber nicht.
// Kein Gold, nur Material. Bewusst langsamer als Dungeon-Runs: Ein Sammler bringt nur wenige Rohstoffe pro Tag.
export const FORGE_RULES = {
  rarityId: 'common',
  cost: { raw: 10, dust: 4 },
  // Item-Level: Stufe des höchsten Dungeons, den die Gilde schon geschafft hat (sonst 1)
};

// Umschmieden (ab Schmiede Stufe 2): Ein Rüstungsteil aus dem Inventar bekommt eine andere Rüstungsart
// (gleicher Platz, gleiche Seltenheit, gleiches Item-Level, Verbesserung und Resistenzen bleiben).
// Muss teurer sein, als das Teil im Dungeon zu farmen: Die Kosten wachsen mit der Seltenheit.
export const REFORGE_RULES = {
  baseCost: { raw: 20, dust: 10, crystal: 2 },
  // Faktor auf die Kosten je Seltenheit
  rarityFactor: { poor: 1, common: 1, uncommon: 1.5, rare: 2, epic: 3, legendary: 4 },
};
