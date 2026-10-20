// ============================================================
// ERFAHRUNG & VERLETZUNGEN – Zahlen für den Fortschritt der Helden
// (Die Logik dazu steht in systems/ExperienceSystem.js)
//
// Erfahrung (EP) gibt es pro gewonnener Begegnung. Scheitert ein Run am Boss,
// bekommen die Helden trotzdem die EP für die Trash-Gruppen, die sie geschafft haben.
// ============================================================

export const EXPERIENCE = {
  // EP pro gewonnener Begegnung auf Stufe 1
  encounterXp: { trash: 20, boss: 50 },

  // So viel mehr EP gibt es pro Dungeon-Stufe über 1 (0.4 = +40 % pro Stufe)
  xpGrowthPerDungeonLevel: 0.4,

  // EP für das nächste Level = xpBase × Level ^ xpExponent
  // Level 1 → 2: 60 EP, Level 5 → 6: ~790 EP, Level 29 → 30: ~13 000 EP
  xpBase: 60,
  xpExponent: 1.6,

  // Zu leichte Dungeons: Bis overLevelGrace Level über der Stufe gibt es noch volle EP.
  // Danach pro weiterem Level 30 % weniger, aber mindestens 10 %.
  // Damit lohnt es sich nicht, ewig die Bärenhöhle zu wiederholen.
  overLevelGrace: 1,
  overLevelPenaltyPerLevel: 0.3,
  minOverLevelFactor: 0.1,

  // Aufhol-Erfahrung: Wer mindestens catchUpLevelGap Level unter dem Durchschnitt
  // der catchUpTopHeroes stärksten Helden der Gilde liegt, bekommt catchUpMultiplier-fache EP.
  // So ist Ersatz für Gefallene schnell einsatzbereit.
  catchUpTopHeroes: 5,
  catchUpLevelGap: 2,
  catchUpMultiplier: 2,
};

export const INJURIES = {
  // Wer in einem Run fällt (0 Leben), ist danach so viele Tage verletzt
  // und kann nicht in Dungeons. 1 = er fällt den nächsten Tag aus und ist am Tag danach wieder fit.
  injuryDays: 1,
};

// EP, die ein Held auf diesem Level für das nächste Level braucht
export function getXpForNextLevel(level) {
  return Math.round(EXPERIENCE.xpBase * Math.pow(level, EXPERIENCE.xpExponent));
}
