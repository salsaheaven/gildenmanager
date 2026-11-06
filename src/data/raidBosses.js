// ============================================================
// RAID-BOSSE – Gegner für den Raid (20 Helden in 4 Gruppen à 5)
// Ein Raid-Boss hat alles, was ein normaler Boss hat (siehe enemies.js), und zusätzlich:
//   isRaidBoss  = true (taucht nicht in den normalen Boss-Listen auf)
//   level       = Stufe, auf der der Boss kämpft (Raids sind Endgame: Stufe 30)
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
  // ---------- Raid 1: Die Aschenhallen (siehe data/raids.js) ----------
  {
    id: 'stoneColossus',
    name: 'Steinkoloss',
    title: 'Torwächter der Aschenhallen',
    sprite: 'bossGolem',
    attackFx: 'bigImpact',
    isRaidBoss: true,
    level: 30,
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
  {
    id: 'plagueMaw',
    name: 'Morgul',
    title: 'Der Seuchenschlund',
    sprite: 'bossBroodmother',
    colors: { v: '#b8c43a', V: '#5a6a1a' },
    attackFx: 'claw',
    attackDamageType: 'acid',
    isRaidBoss: true,
    level: 30,
    stats: { health: 9500, attack: 32, defense: 8 },
    enrageRound: 40,
    tankStacks: { name: 'Zersetzt', damageTakenPerStack: 0.1, swapAt: 5 },
    mechanics: [
      {
        type: 'curse', name: 'Seuchenbiss', damageType: 'acid',
        firstAt: 2, every: 3, power: 0.6, duration: 6, castTime: 0, fx: 'curse',
        hint: 'Ein Fluch nach dem anderen: Mehrere Helden, die Flüche lösen, verteilt auf die Gruppen.',
      },
      {
        type: 'groupStrike', name: 'Säureschwall', damageType: 'acid',
        firstAt: 4, every: 5, power: 1.8, castTime: 1, interruptible: false, fx: 'acidWave',
        hint: 'Trifft eine ganze Gruppe. Säureresistenz hilft.',
      },
      {
        type: 'summon', name: 'Ghule erheben sich',
        firstAt: 8, every: 10, minion: 'ghoul', count: 3, castTime: 0, fx: 'summon',
        hint: 'Flächenschaden räumt die Ghule weg.',
      },
    ],
  },
  {
    id: 'pyra',
    name: 'Pyra',
    title: 'Die Flammenzunge',
    sprite: 'bossSunPriest',
    colors: { o: '#ff6b3a', g: '#ff3b1a', G: '#8a1a0a' },
    attackFx: 'fireBolt',
    attackDamageType: 'fire',
    isRaidBoss: true,
    level: 30,
    stats: { health: 10000, attack: 33, defense: 6 },
    enrageRound: 40,
    mechanics: [
      {
        type: 'groupCast', name: 'Flammenmeer', damageType: 'fire',
        firstAt: 3, every: 4, power: 1.6, castTime: 1, interruptible: true, fx: 'fireRain',
        hint: 'Trifft den ganzen Raid: Unterbrechen (Schurke, Jäger/Magier mit Konter-Talent). Feuerresistenz hilft.',
      },
      {
        type: 'groupStrike', name: 'Feuersäule', damageType: 'fire',
        firstAt: 5, every: 6, power: 2.0, castTime: 1, interruptible: false, fx: 'fireRain',
        hint: 'Trifft eine ganze Gruppe: Der Heiler der Gruppe muss bereit sein.',
      },
    ],
    phases: [
      {
        belowHpPercent: 0.4,
        name: 'Phase 2',
        text: 'Pyra lodert auf und ruft Glutwichte aus den Flammen!',
        mechanics: [
          {
            type: 'summon', name: 'Glutwichte',
            firstAt: 0, every: 6, minion: 'emberImp', count: 4, castTime: 0, fx: 'summon',
            hint: 'Die Glutwichte greifen zufällig an: Flächenschaden räumt sie weg.',
          },
          {
            type: 'groupCast', name: 'Flammenmeer', damageType: 'fire',
            firstAt: 2, every: 4, power: 1.8, castTime: 1, interruptible: true, fx: 'fireRain',
            hint: 'Trifft den ganzen Raid: unbedingt unterbrechen.',
          },
        ],
      },
    ],
  },
  {
    id: 'ashKing',
    name: 'Der Aschenkönig',
    title: 'Herr der Aschenhallen',
    sprite: 'bossForgeLord',
    colors: { o: '#ff8a3a', O: '#3a1a1a', S: '#4a4a52' },
    attackFx: 'bigImpact',
    attackDamageType: 'fire',
    isRaidBoss: true,
    level: 30,
    stats: { health: 12000, attack: 35, defense: 14 },
    enrageRound: 45,
    tankStacks: { name: 'Ascheglut', damageTakenPerStack: 0.12, swapAt: 4 },
    mechanics: [
      {
        type: 'tankBuster', name: 'Aschenhammer', damageType: 'fire',
        firstAt: 3, every: 5, power: 3.0, castTime: 1, interruptible: false, fx: 'bigImpact',
        hint: 'Schilde (Runenwirker) oder Eiserne Wacht (Krieger) fangen den Hammer ab.',
      },
      {
        type: 'groupStrike', name: 'Aschewelle', damageType: 'fire',
        firstAt: 5, every: 5, power: 1.8, castTime: 1, interruptible: false, fx: 'fireRain',
        hint: 'Trifft eine ganze Gruppe: Der Heiler der Gruppe muss bereit sein.',
      },
    ],
    phases: [
      {
        belowHpPercent: 0.6,
        name: 'Phase 2',
        text: 'Der Aschenkönig ruft seine Drachenbrut!',
        mechanics: [
          {
            type: 'summon', name: 'Drachenbrut',
            firstAt: 0, every: 8, minion: 'drakeling', count: 3, castTime: 0, fx: 'summon',
            hint: 'Die Jungdrachen greifen zufällig an: Flächenschaden räumt sie weg.',
          },
          {
            type: 'tankBuster', name: 'Aschenhammer', damageType: 'fire',
            firstAt: 2, every: 5, power: 3.0, castTime: 1, interruptible: false, fx: 'bigImpact',
            hint: 'Schilde (Runenwirker) oder Eiserne Wacht (Krieger) fangen den Hammer ab.',
          },
        ],
      },
      {
        belowHpPercent: 0.25,
        name: 'Letzte Phase',
        text: 'Der Aschenkönig brennt lichterloh! Die ganze Halle steht in Flammen!',
        mechanics: [
          {
            type: 'groupCast', name: 'Weltenbrand', damageType: 'fire',
            firstAt: 1, every: 3, power: 1.4, castTime: 1, interruptible: false, fx: 'fireRain',
            hint: 'Trifft den ganzen Raid immer wieder: jetzt zählt nur noch Schaden und Heilung.',
          },
        ],
      },
    ],
  },
];
