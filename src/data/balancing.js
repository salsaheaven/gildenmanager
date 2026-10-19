// ============================================================
// BALANCING
// Allgemeine Zahlen, an denen man drehen kann, damit sich das Spiel gut anfühlt.
// ============================================================

export const BALANCING = {
  // Gold zu Beginn eines neuen Spiels
  startGold: 150,

  // Kisten zu Beginn eines neuen Spiels (damit man sofort etwas öffnen kann)
  startBoxes: ['wood', 'wood', 'silver'],

  // Der Gildenkurier bringt regelmäßig eine Kiste.
  // Zeit in Spielsekunden. Bei 4x-Geschwindigkeit geht es also 4-mal so schnell.
  courierIntervalSeconds: 30,
  courierBoxType: 'wood',

  // Pity-System: Nach so vielen Items ohne Episch oder Legendär
  // ist das nächste Item garantiert mindestens episch.
  pityEpicAfterItems: 25,

  // So viele Spielminuten vergehen pro Spielsekunde (für die Uhr oben).
  gameMinutesPerSecond: 1,

  // Auswahl der Spielgeschwindigkeiten
  speeds: [1, 2, 4],

  // ---------- Helden & Taverne ----------

  // Wie viele Helden die Gilde höchstens haben kann (später erweiterbar durch die Kaserne)
  maxHeroes: 10,

  // Wie viele Bewerber gleichzeitig in der Taverne warten
  candidateCount: 4,

  // Alle so viele Spielsekunden kommen neue Bewerber
  candidateRefreshSeconds: 120,

  // Gold, um sofort neue Bewerber zu rufen
  candidateRerollCost: 20,
};
