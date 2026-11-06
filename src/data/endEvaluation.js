// ============================================================
// ENDAUSWERTUNG – Rang nach dem Sieg über den Endboss (siehe systems/EndEvaluation.js)
// Bewertet wird, nach wie vielen Spieltagen der Endboss fiel (Ziel laut Konzept: etwa 90 Tage).
// RANKS: von gut nach schlecht. Ein Lauf bekommt den ersten Rang, dessen maxDays er schafft.
//   rank = Buchstabe, name = Anzeige, color = Farbe, maxDays = höchstens so viele Tage (null = immer)
// BEST_LIST_SIZE = so viele Läufe merkt sich die Bestenliste im Browser (wenigste Tage zuerst)
// Zahlen grob gesetzt, eingestellt wird beim Endbalancing.
// ============================================================

export const RANKS = [
  { rank: 'S', name: 'Legende des Servers', color: '#ff8000', maxDays: 70 },
  { rank: 'A', name: 'Heldengilde', color: '#a335ee', maxDays: 85 },
  { rank: 'B', name: 'Starke Gilde', color: '#0070dd', maxDays: 100 },
  { rank: 'C', name: 'Solide Gilde', color: '#1eff00', maxDays: 120 },
  { rank: 'D', name: 'Spätzünder', color: '#ffffff', maxDays: null },
];

export const BEST_LIST_SIZE = 10;
