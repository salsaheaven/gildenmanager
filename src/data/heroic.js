// ============================================================
// HEROISCH – die schwere Stufe eines schon geschafften Dungeons
// Wer einen Dungeon einmal geschafft hat, kann ihn auf "Heroisch" stellen.
// Dann gilt das für alle Gruppen dort, bis man wieder auf "Normal" stellt.
// Heroisch = stärkere Gegner, aber Beute auf höherer Stufe, mehr Gold und EP.
// So lohnt sich das Wiederholen, und die bessere Beute schließt die Lücke zum nächsten Dungeon.
// (Die Logik steht in systems/HeroicMode.js. Zahlen grob gesetzt.)
// ============================================================

export const HEROIC = {
  // So viele Stufen stärker sind die Gegner. Items aus der Kiste haben ebenfalls diese höhere Stufe,
  // die Helden bekommen EP wie in einem Dungeon dieser Stufe.
  levelBonus: 3,

  // Gold bei Erfolg und Gold pro Trash-Gruppe werden damit malgenommen
  goldFactor: 1.5,

  // So viele Items liegen zusätzlich in der Boss-Kiste
  extraChestItems: 1,
};
