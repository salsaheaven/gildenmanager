// ============================================================
// KAMPFREGELN – allgemeine Zahlen für jeden Kampf
// ============================================================

export const COMBAT_RULES = {
  // Nach so vielen Runden ist der Kampf verloren (die Gruppe ist erschöpft)
  maxRounds: 60,

  // Grundchance auf kritische Treffer und deren Stärke (1.5 = 150 %)
  baseCritChance: 0.05,
  critMultiplier: 1.5,

  // Rüstung verringert Schaden: Anteil = Rüstung / (Rüstung + defenseConstant).
  // Bei 60: 30 Rüstung = −33 % Schaden, 60 Rüstung = −50 %.
  defenseConstant: 60,

  // So viel Mana (Anteil vom Maximum) kommt jede Runde zurück
  manaRegenPerRound: 0.04,

  // Schaden und Heilung der Helden schwanken zufällig um ±10 %
  variation: 0.1,

  // Gegner sind unberechenbarer: ±25 % Schwankung und 10 % Chance auf kritische Treffer.
  // Das macht Kämpfe spannender (nicht nur "immer gewonnen" oder "immer verloren").
  enemyVariation: 0.25,
  enemyCritChance: 0.1,

  // Aggro durch Heilung und Schilde (Anteil der Menge)
  healThreat: 0.4,
  shieldThreat: 0.3,

  // Herausforderungsruf: Aggro wird auf das Höchste × diesen Faktor gesetzt
  tauntThreatFactor: 1.3,

  // So viele Kämpfe simuliert das Spiel, um die Siegchance zu berechnen
  simulationCount: 200,
};
