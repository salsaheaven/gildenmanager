// ============================================================
// RAID-BOSSE – Gegner für den Raid (20 Helden in 4 Gruppen à 5)
// Ein Raid-Boss hat alles, was ein normaler Boss hat (siehe enemies.js), und zusätzlich:
//   isRaidBoss  = true (taucht nicht in den normalen Boss-Listen auf)
//   tankStacks  = Tank-Stapel: Jeder normale Angriff gibt dem Getroffenen einen Stapel.
//                 name                = Anzeigename der Stapel (z.B. "Zermalmt")
//                 damageTakenPerStack = so viel mehr Schaden nimmt der Held pro Stapel (0.1 = +10 %)
//                 swapAt              = ab so vielen Stapeln übernimmt automatisch ein anderer Tank.
//                 Wer nicht getroffen wird, verliert pro Angriff des Bosses einen Stapel.
//   phases      = weitere Phasen nach der ersten (die erste Phase nutzt die normalen mechanics):
//                 belowHpPercent = die Phase beginnt, wenn das Leben des Bosses darunter fällt (0.5 = 50 %)
//                 name, text     = Ankündigung im Kampf
//                 mechanics      = die Mechaniken dieser Phase (firstAt zählt ab Beginn der Phase;
//                                  firstAt: 0 = gleich beim Phasenwechsel)
// Neue Mechanik-Art nur für Raids:
//   'groupStrike' = trifft alle Helden einer zufälligen Raid-Gruppe (wird beim Ankündigen ausgewählt)
//
// Die Zahlen sind grob gesetzt (Testballon, kein Balancing).
// ============================================================

export const RAID_BOSSES = [
  {
    id: 'raidTestColossus',
    name: 'Steinkoloss',
    title: 'Raid-Testboss',
    sprite: 'bossGolem',
    attackFx: 'bigImpact',
    isRaidBoss: true,
    stats: { health: 9000, attack: 34, defense: 10 },
    enrageRound: 40,
    tankStacks: { name: 'Zermalmt', damageTakenPerStack: 0.12, swapAt: 4 },
    mechanics: [
      {
        type: 'groupStrike', name: 'Erdstoß',
        firstAt: 3, every: 4, power: 1.8, castTime: 1, interruptible: false, fx: 'bigImpact',
        hint: 'Trifft eine ganze Gruppe: Der Heiler der Gruppe muss bereit sein.',
      },
    ],
    phases: [
      {
        belowHpPercent: 0.5,
        name: 'Phase 2',
        text: 'Der Koloss bricht auf und ruft Steinwächter herbei!',
        mechanics: [
          {
            type: 'summon', name: 'Steinwächter erwachen',
            firstAt: 0, every: 8, minion: 'templeConstruct', count: 3, castTime: 0, fx: 'summon',
            hint: 'Flächenschaden räumt die Wächter weg, bevor sie die Heiler erreichen.',
          },
          {
            type: 'groupStrike', name: 'Erdstoß',
            firstAt: 2, every: 3, power: 2.0, castTime: 1, interruptible: false, fx: 'bigImpact',
            hint: 'Trifft eine ganze Gruppe: Der Heiler der Gruppe muss bereit sein.',
          },
        ],
      },
    ],
  },
];
