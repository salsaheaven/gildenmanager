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

// Mechaniken eines noch nicht erkundeten Bosses bleiben vage (siehe systems/DungeonKnowledge.js)
export const UNKNOWN_CAUSE = {
  name: 'Etwas Unbekanntes',
  tip: 'Etwas hat eure Gruppe überrascht. Erkunden hilft.',
  missedInterrupt: 'Ein unbekannter Zauber wurde {count}× nicht unterbrochen.',
};

// Zusätzliche Hinweise unter den Ursachen. {name} und {count} werden ersetzt.
export const CAUSE_NOTES = {
  missedInterrupt: '{name} wurde {count}× nicht unterbrochen.',
  outOfMana: '{name} ging das Mana aus.',
  uncountered: '{name} wurde {count}× nicht gekontert ({counter}).',
};

// Konkrete Klassen-Tipps zur größten Ursache ("Helfen würde: …"), siehe systems/ClassTips.js.
// Schlüssel: Art der Ursache (minion, enrage, attack) oder Art der Mechanik (frontWave, groupCast, groupStrike, summon).
// Mechaniken mit Konter (Unterbrechen, Fluch lösen, Abfangen, Panzer brechen, Wutanfall dämpfen) nennen
// automatisch die Klassen aus data/counters.js. classIds: 'aoe' = alle Klassen mit Flächenschaden (aus den Skills).
export const CLASS_TIPS = {
  minion: { text: 'Flächenschaden gegen die Diener', classIds: 'aoe' },
  summon: { text: 'Flächenschaden gegen die Diener', classIds: 'aoe' },
  enrage: { text: 'mehr Schaden', classIds: ['warlock', 'mage', 'rogue', 'barbarian'] },
  attack: { text: 'mehr Heilung oder Schutz für den Tank', classIds: ['priest', 'druid', 'runeweaver', 'paladin'] },
  frontWave: { text: 'Fernkämpfer statt Nahkämpfer', classIds: ['mage', 'hunter', 'warlock'] },
  groupCast: { text: 'Gruppenheilung und Schutz', classIds: ['druid', 'shaman', 'runeweaver'] },
  groupStrike: { text: 'Gruppenheilung und Schutz', classIds: ['druid', 'shaman', 'runeweaver'] },
};
