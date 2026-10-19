// ============================================================
// SKILLS (Fähigkeiten)
// Im Moment nur Name und Beschreibung. Die genauen Werte für den Kampf
// (Schaden, Abklingzeit, Manakosten) kommen mit dem Kampf-Labor dazu.
// ============================================================

export const ABILITIES = {
  // Krieger
  bulwarkStrike:     { name: 'Bollwerkstoß',          description: 'Schaden und viel Aggro' },
  challengingShout:  { name: 'Herausforderungsruf',   description: 'Zwingt den Gegner, den Krieger anzugreifen' },
  ironWatch:         { name: 'Eiserne Wacht',         description: '−50 % erlittener Schaden für 3 Runden' },

  // Priester
  streamOfLife:      { name: 'Strom des Lebens',      description: 'Riesige Einzelheilung, kostet viel Mana' },
  sparkOfGrace:      { name: 'Funke der Gnade',       description: 'Schnelle, kleinere und günstige Heilung' },
  silentDevotion:    { name: 'Stille Andacht',        description: 'Stellt Mana wieder her' },

  // Runenwirker
  runeArmor:         { name: 'Runenpanzer',           description: 'Schild, der Schaden vorab abfängt' },
  glyphCircle:       { name: 'Glyphenkreis',          description: 'Kleine Schilde für die ganze Gruppe' },
  releasingRune:     { name: 'Lösungsrune',           description: 'Entfernt einen Fluch oder Debuff' },

  // Magier
  emberLance:        { name: 'Glutlanze',             description: 'Hoher Einzelschaden' },
  ashRain:           { name: 'Aschenregen',           description: 'Flächenschaden auf alle Gegner' },
  iceWreath:         { name: 'Eiskranz',              description: 'Friert alle Gegner 1 Runde ein' },

  // Schurke
  shadowStab:        { name: 'Schattenstich',         description: 'Schaden mit hoher Chance auf kritische Treffer' },
  silencingBlow:     { name: 'Stummschlag',           description: 'Unterbricht einen Boss-Zauber' },
  viperBite:         { name: 'Natternbiss',           description: 'Gift, das über mehrere Runden Schaden macht' },
};
