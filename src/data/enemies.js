// ============================================================
// GEGNER – Bosse und ihre Diener
//
// Boss:
//   name, title  = Anzeige
//   stats        = health (Leben), attack (Angriff), defense (Rüstung)
//   enrageRound  = ab dieser Runde rast der Boss (doppelter Schaden). null = nie.
//   isDummy      = Übungspuppe: greift nicht an, nur zum Schaden-Messen
//   mechanics    = besondere Fähigkeiten (siehe unten)
//
// Mechanik:
//   type          = 'tankBuster' (riesiger Schlag auf den, den er angreift)
//                   'groupCast'  (Schaden an der ganzen Gruppe)
//                   'frontWave'  (Schaden an der vorderen Reihe)
//                   'summon'     (ruft Diener)
//                   'curse'      (Fluch: Schaden über Zeit auf einen zufälligen Helden)
//   name          = Anzeigename
//   firstAt       = in welcher Runde zum ersten Mal
//   every         = danach alle so viele Runden
//   power         = Faktor auf den Angriff des Bosses
//   castTime      = 1: wird eine Runde vorher angekündigt ("bereitet vor"), 0: sofort
//   interruptible = kann ein Schurke den Zauber unterbrechen?
//   duration      = Dauer des Fluchs in Runden
//   minion, count = welche und wie viele Diener
//   hint          = Tipp für den Spieler, wie man die Mechanik kontert
// ============================================================

export const BOSSES = [
  {
    id: 'trainingDummy',
    name: 'Übungspuppe',
    title: 'Schaden messen',
    stats: { health: 100000, attack: 0, defense: 10 },
    enrageRound: null,
    isDummy: true,
    dummyRounds: 20,
    mechanics: [],
  },
  {
    id: 'grimfang',
    name: 'Grimmzahn',
    title: 'Der Höhlenbär',
    stats: { health: 1250, attack: 27, defense: 10 },
    enrageRound: 25,
    mechanics: [
      {
        type: 'tankBuster', name: 'Zermalmender Prankenhieb',
        firstAt: 4, every: 5, power: 3.5, castTime: 1, interruptible: false,
        hint: 'Schilde (Runenwirker) oder Eiserne Wacht (Krieger) fangen den Hieb ab.',
      },
    ],
  },
  {
    id: 'morva',
    name: 'Schwester Morva',
    title: 'Die Schattenruferin',
    stats: { health: 1250, attack: 25, defense: 5 },
    enrageRound: 30,
    mechanics: [
      {
        type: 'groupCast', name: 'Schattenwoge',
        firstAt: 3, every: 4, power: 2.3, castTime: 1, interruptible: true,
        hint: 'Ein Schurke kann die Woge mit Stummschlag unterbrechen.',
      },
      {
        type: 'curse', name: 'Fluch der Fäulnis',
        firstAt: 5, every: 6, power: 0.5, duration: 6, castTime: 0,
        hint: 'Der Runenwirker entfernt Flüche mit der Lösungsrune.',
      },
    ],
  },
  {
    id: 'skarrix',
    name: 'Skarrix',
    title: 'Die Brutmutter',
    stats: { health: 1500, attack: 26, defense: 8 },
    enrageRound: 30,
    mechanics: [
      {
        type: 'summon', name: 'Brut schlüpft',
        firstAt: 2, every: 6, minion: 'broodling', count: 2, castTime: 0,
        hint: 'Flächenschaden (Aschenregen des Magiers) räumt die Brut schnell weg.',
      },
      {
        type: 'frontWave', name: 'Säureschwall',
        firstAt: 6, every: 7, power: 2.1, castTime: 1, interruptible: false,
        hint: 'Trifft nur die vordere Reihe: weniger Nahkämpfer mitnehmen.',
      },
    ],
  },
];

// Diener, die Bosse herbeirufen können
export const MINIONS = {
  broodling: {
    name: 'Brutling',
    stats: { health: 65, attack: 13, defense: 0 },
  },
};

export function getBoss(bossId) {
  for (const boss of BOSSES) {
    if (boss.id === bossId) {
      return boss;
    }
  }
  throw new Error('Unbekannter Boss: ' + bossId);
}
