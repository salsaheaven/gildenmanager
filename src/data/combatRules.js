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

  // Heiler heilen, wenn jemand unter diesen Anteil Leben fällt
  // (die Anweisung "Heilen ab" beim Priester kann das ändern, siehe heroOrders.js)
  healThreshold: 0.6,

  // Der Tank benutzt seine Verteidigung, wenn er unter diesen Anteil Leben fällt
  selfDefenseThreshold: 0.45,

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

  // Tempo der Kampfszene in Sekunden (bei 1x). Langsam genug, um Skill-Namen zu lesen:
  // etwa 4 Sekunden pro Runde, ein Kampf dauert bei 1x rund eine Minute.
  pacing: {
    startDelay: 0.8,   // kurze Pause vor dem ersten Ereignis
    actionLead: 0.4,   // Zeit zwischen Aktion (Skill-Name, Animation startet) und Wirkung (Zahl ploppt auf)
    effectTime: 0.18,  // Abstand nach einer Wirkung (Treffer, Heilung …)
    infoTime: 0.1,     // Abstand nach reinen Textzeilen
    roundPause: 0.6,   // Pause zwischen zwei Runden
    endDelay: 1.2,     // Pause am Ende eines Kampfes
    // Zeitraffer: So viel schneller als das gewählte Tempo laufen ...
    trashSpeed: 4,      // ... Trash-Begegnungen (außer Runden, in denen ein Held fällt)
    quietRoundSpeed: 3, // ... ruhige Runden im Bosskampf (keine Ankündigung, keine Mechanik, niemand fällt)
  },

  // Wählbare Geschwindigkeiten der Kampfszene (Knöpfe über der Szene)
  sceneSpeeds: [1, 2, 4],

  // Wie viel langsamer Effekte und aufploppende Zahlen bei 1x laufen als in main.css angegeben
  // (0.6 = sie dauern 1/0.6 ≈ 1,7-mal so lange). Bei 2x und 4x werden sie entsprechend schneller.
  sceneAnimationRate: 0.6,

  // So viele Kämpfe simuliert das Spiel, um die Siegchance zu berechnen
  simulationCount: 200,
};
