// ============================================================
// KAMPFREGELN – allgemeine Zahlen für jeden Kampf
// ============================================================

export const COMBAT_RULES = {
  // Nach so vielen Runden ist der Kampf verloren (die Gruppe ist erschöpft)
  maxRounds: 60,

  // Grundchance auf kritische Treffer und deren Stärke (1.5 = 150 %)
  baseCritChance: 0.05,
  critMultiplier: 1.5,

  // Wie stark Rüstung wirkt, steht in scaling.js (wächst mit der Gegnerstufe)

  // So viel Mana (Anteil vom Maximum) kommt jede Runde zurück
  manaRegenPerRound: 0.04,

  // Schaden und Heilung der Helden schwanken zufällig um ±10 %
  variation: 0.1,

  // Gegner sind unberechenbarer: ±25 % Schwankung und 10 % Chance auf kritische Treffer.
  // Das macht Kämpfe spannender (nicht nur "immer gewonnen" oder "immer verloren").
  enemyVariation: 0.25,
  enemyCritChance: 0.1,

  // Unter diesem Mana-Anteil warnt der Kampfbericht "hat kaum noch Mana!"
  lowManaWarning: 0.12,

  // Aggro durch Heilung und Schilde (Anteil der Menge)
  healThreat: 0.4,
  shieldThreat: 0.3,

  // Herausforderungsruf: Aggro wird auf das Höchste × diesen Faktor gesetzt
  tauntThreatFactor: 1.3,

  // Rückzug: so viele Runden kämpft sich die Gruppe zum Ausgang (der Gegner greift weiter an)
  retreatRounds: 2,

  // Zwischen zwei Begegnungen im Dungeon erholt sich die Gruppe ein wenig
  // (Anteil vom Maximum). Gefallene bleiben bis zum Ende des Runs gefallen.
  restHealthRegain: 0.4,
  restManaRegain: 0.6,

  // Tempo der Kampfszene in Spielsekunden. Bestimmt auch, wie lange ein Dungeon-Run dauert.
  pacing: {
    startDelay: 0.4,   // kurze Pause vor dem ersten Ereignis
    actionLead: 0.14,  // Zeit zwischen Aktion (Animation startet) und Wirkung (Zahl ploppt auf)
    effectTime: 0.08,  // Abstand nach einer Wirkung (Treffer, Heilung …)
    infoTime: 0.05,    // Abstand nach reinen Textzeilen
    roundPause: 0.3,   // Pause zwischen zwei Runden
    endDelay: 0.6,     // Pause am Ende eines Kampfes
  },

  // So viele Kämpfe simuliert das Spiel, um die Siegchance zu berechnen
  simulationCount: 200,
};
