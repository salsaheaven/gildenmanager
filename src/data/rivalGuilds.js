// ============================================================
// KI-GILDEN – die Rivalen auf dem Server (Kulisse: Rangliste und Neuigkeiten-Ticker)
// Jede KI-Gilde arbeitet sich der Reihe nach durch die Dungeons. Jeden Abend:
//   1. Mit attemptChance versucht sie ihren nächsten Dungeon.
//   2. Mit successChance schafft sie ihn (schwerere Dungeons sind schwerer, siehe RIVAL_RULES).
// Wer langsamer ist als die Rivalen, verliert nichts. Wer zuerst ist, bekommt Ruhm (Server-First).
// Die Logik steht in systems/RivalSystem.js. Zahlen grob gesetzt, gebalanced wird am Ende.
//
// id           = interner Name
// name         = Anzeigename
// color        = Farbe in Rangliste und Ticker
// personality  = Beschreibung der Persönlichkeit (Anzeige)
// attemptChance = Chance pro Tag, dass sie es versucht
// successChance = Chance, dass ein Versuch klappt (im ersten Dungeon)
// ============================================================

export const RIVAL_GUILDS = [
  {
    id: 'ironFists', name: 'Die Eisenfäuste', color: '#ff6b3a',
    personality: 'Draufgänger: versuchen fast jeden Tag ihr Glück, scheitern aber oft',
    attemptChance: 0.9, successChance: 0.3,
  },
  {
    id: 'silverWolves', name: 'Orden der Silberwölfe', color: '#b8c4d6',
    personality: 'Gründlich: langsam, aber stetig',
    attemptChance: 0.45, successChance: 0.75,
  },
  {
    id: 'fortuneKnights', name: 'Glücksritter von Kragmoor', color: '#9be15d',
    personality: 'Wankelmütig: mal schnell, mal tagelang nichts',
    attemptChance: 0.3, successChance: 0.6,
  },
  {
    id: 'ashenCrown', name: 'Aschenkrone', color: '#c77dff',
    personality: 'Elite: die schnellste Gilde des Servers',
    attemptChance: 0.85, successChance: 0.55,
  },
];

export const RIVAL_RULES = {
  // Je Dungeon-Stufe über 1 sinkt die Erfolgschance auf diesen Anteil (0.9 = jeweils 10 % weniger)
  successFactorPerLevel: 0.9,
  // Nicht jeder Fehlschlag kommt in den Ticker (sonst wird er zu voll): Chance auf eine Meldung
  failNewsChance: 0.3,
  // So viele Meldungen merkt sich der Ticker
  keptNews: 30,
};

export function getRivalGuild(rivalId) {
  const rival = RIVAL_GUILDS.find((entry) => entry.id === rivalId);
  if (!rival) {
    throw new Error('Unbekannte KI-Gilde: ' + rivalId);
  }
  return rival;
}
