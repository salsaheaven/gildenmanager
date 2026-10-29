// ============================================================
// DEFEATCAUSES – Texte für "Woran es lag" nach einer Niederlage oder einem Run mit Gefallenen
// Die Rechnung steht in systems/combat/DefeatAnalysis.js.
// ============================================================

export const DEFEAT_ANALYSIS = {
  topCount: 3, // so viele Ursachen werden gezeigt
};

// Tipps je Art der Ursache. Boss-Mechaniken mit eigenem Tipp ("hint" in enemies.js) benutzen ihren eigenen.
export const CAUSE_TIPS = {
  mechanic: 'Diese Mechanik lässt sich kontern: Schau in die Dungeon-Übersicht, welche Klasse oder Resistenz hilft.',
  attack: 'Der Tank hält zu wenig aus: bessere Rüstung, ein zweiter Heiler oder die Haltung „Bollwerk“ helfen.',
  minion: 'Die Diener machen zu viel Schaden: Flächenschaden räumt sie schneller weg, „Alles an mich“ hält sie beim Tank.',
  enrage: 'Der Kampf dauert zu lange, der Boss gerät in Raserei: mehr Schaden mitnehmen, z.B. Haltung „Überladen“ oder einen Schadensmacher mehr.',
};

// Zusätzliche Hinweise unter den Ursachen. {name} und {count} werden ersetzt.
export const CAUSE_NOTES = {
  missedInterrupt: '{name} wurde {count}× nicht unterbrochen.',
  outOfMana: '{name} ging das Mana aus.',
};
