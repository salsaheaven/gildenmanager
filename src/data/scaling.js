// ============================================================
// SKALIERUNG – wie Helden, Items und Gegner mit dem Fortschritt wachsen
// Alle Wachstums-Formeln stehen hier an einem Ort (siehe KONZEPT.md, Abschnitt "Skalierung").
//
// Helden:  Werte = Grundwerte + Wachstum pro Level (Zahlen pro Klasse in heroClasses.js)
// Items:   Jedes Item hat ein Item-Level (= Stufe des Dungeons, aus dem es stammt).
//          Werte = Vorlage (items.js) × Seltenheit (rarities.js) × Item-Level-Faktor
// Gegner:  Jeder Dungeon hat eine Stufe. Werte = Grundwerte (enemies.js) × Gegner-Faktor der Stufe
// Rüstung: Schadensminderung = Rüstung / (Rüstung + Rüstungs-Konstante).
//          Die Konstante wächst mit der Gegnerstufe, sonst wäre Rüstung auf hohem Level fast unverwundbar.
// ============================================================

export const SCALING = {
  // Höchstes Heldenlevel (erste Version)
  maxLevel: 30,

  // Items: Anteil der Vorlagen-Werte auf Item-Level 1 und Zuwachs pro weiterem Item-Level.
  // Beispiel Schwert (Vorlage +6 Angriff), grün (×1,3):
  //   Item-Level 1  → 6 × 1,3 × 0,38                    ≈ +3 Angriff
  //   Item-Level 30 → 6 × 1,3 × 0,38 × (1 + 29 × 0,44)  ≈ +41 Angriff
  // Items wachsen schneller als die Helden. Dadurch steigt der Anteil der Ausrüstung
  // von etwa einem Drittel (Level 1) auf etwa die Hälfte (Level 30).
  itemBaseFactor: 0.38,
  itemGrowthPerLevel: 0.44,

  // Gegner: Zuwachs pro Stufe über 1 (0.5 = +50 % der Grundwerte pro Stufe).
  // Per Simulation so gewählt, dass eine Gruppe auf der Stufe des Dungeons
  // mit grüner Ausrüstung dieser Stufe auf jedem Level ähnlich gut abschneidet.
  enemyHealthPerLevel: 0.5,
  enemyAttackPerLevel: 0.25,
  enemyDefensePerLevel: 0.1,

  // Rüstungs-Konstante: auf Stufe 1 und Zuwachs pro Stufe
  defenseConstant: 60,
  defenseConstantPerLevel: 0.15,
};

// Faktor für die Werte eines Items mit diesem Item-Level
export function getItemLevelFactor(itemLevel) {
  return SCALING.itemBaseFactor * (1 + (itemLevel - 1) * SCALING.itemGrowthPerLevel);
}

// Faktoren für die Gegnerwerte auf dieser Stufe
export function getEnemyLevelFactors(level) {
  const levelsAbove1 = level - 1;
  return {
    health: 1 + levelsAbove1 * SCALING.enemyHealthPerLevel,
    attack: 1 + levelsAbove1 * SCALING.enemyAttackPerLevel,
    defense: 1 + levelsAbove1 * SCALING.enemyDefensePerLevel,
  };
}

// Rüstungs-Konstante in einem Kampf dieser Stufe
export function getDefenseConstant(level) {
  return SCALING.defenseConstant * (1 + (level - 1) * SCALING.defenseConstantPerLevel);
}
