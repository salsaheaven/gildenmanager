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

  // Was die Schatzkammer zum Pity-Stand anzeigt. Bewusst ungenau: keine Zahlen, nur eine Stimmung.
  // fromProgress = ab welchem Anteil des Weges (0 = gerade Glück gehabt, 1 = gleich garantiert)
  // level        = wie stark die Anzeige leuchtet (0 bis 3)
  pityHints: [
    { fromProgress: 0,   level: 0, text: 'Das Glück schlummert noch.' },
    { fromProgress: 0.4, level: 1, text: 'Ein leises Kribbeln liegt in der Luft …' },
    { fromProgress: 0.7, level: 2, text: 'Etwas Großes kündigt sich an!' },
    { fromProgress: 0.9, level: 3, text: 'Das Glück ist dir ganz nah!' },
  ],

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

  // ---------- Dungeons ----------

  // So viele Spielsekunden braucht die Gruppe von einer Begegnung zur nächsten
  travelSeconds: 5,

  // Nach so vielen Erfolgen in einem Dungeon kann man laufende Runs sofort beenden (Schnellkampf)
  quickFinishAfterClears: 3,

  // So viele Berichte über abgeschlossene Runs werden aufgehoben
  keptReports: 10,
};
