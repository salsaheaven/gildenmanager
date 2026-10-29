// ============================================================
// ZERLEGEN & VERBESSERN – Zahlen für das Material und die Verbesserungsstufen (+1 bis +10)
// Die Logik steht in systems/CraftingSystem.js.
//
// Material: Arkanstaub (aus jedem Item) und Kristalle (nur aus blauen und besseren Items, nötig ab +6).
// Eine Verbesserung steckt im Item: Wer es zerlegt oder verkauft, bekommt nur den Grundwert.
// Zahlen grob gesetzt, gebalanced wird am Ende.
// ============================================================

export const MATERIALS = {
  dust: { name: 'Arkanstaub', icon: '✧', color: '#c9b8ff' },
  crystal: { name: 'Kristall', icon: '◆', color: '#5aa9ff' },
};

// So viel Material gibt ein zerlegtes Item, je nach Seltenheit
export const SALVAGE_YIELD = {
  poor: { dust: 1, crystal: 0 },
  common: { dust: 2, crystal: 0 },
  uncommon: { dust: 4, crystal: 0 },
  rare: { dust: 6, crystal: 1 },
  epic: { dust: 10, crystal: 2 },
  legendary: { dust: 15, crystal: 4 },
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
