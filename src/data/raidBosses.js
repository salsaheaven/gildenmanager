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
// Die Zahlen sind grob gesetzt (Testballon, kein Balancing). Für Spieltests abgeschwächt (Leben halbiert, Angriff −20 %).
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
    stats: { health: 4500, attack: 27, defense: 10 },
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
    stats: { health: 4750, attack: 26, defense: 8 },
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
    stats: { health: 5000, attack: 26, defense: 6 },
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
    stats: { health: 6000, attack: 28, defense: 14 },
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
  // ---------- Raid 2: Der Nachtthron (der letzte Boss ist der Endboss des Spiels) ----------
  {
    id: 'hrimvald',
    name: 'Hrimvald',
    title: 'Wächter des Eistors',
    sprite: 'bossFrostGiant',
    colors: { i: '#dff4ff', I: '#2a5a9a' },
    attackFx: 'bigImpact',
    attackDamageType: 'ice',
    isRaidBoss: true,
    level: 30,
    stats: { health: 5500, attack: 28, defense: 14 },
    enrageRound: 40,
    tankStacks: { name: 'Erfroren', damageTakenPerStack: 0.12, swapAt: 4 },
    mechanics: [
      {
        type: 'groupStrike', name: 'Eislawine', damageType: 'ice',
        firstAt: 3, every: 4, power: 1.9, castTime: 1, interruptible: false, fx: 'frost',
        hint: 'Trifft eine ganze Gruppe. Eisresistenz hilft.',
      },
      {
        type: 'summon', name: 'Frostwölfe',
        firstAt: 6, every: 9, minion: 'frostWolf', count: 3, castTime: 0, fx: 'summon',
        hint: 'Flächenschaden räumt die Wölfe weg.',
      },
      {
        type: 'shell', name: 'Eispanzer',
        firstAt: 5, every: 8, duration: 4, damageReduction: 0.75, breakPoints: 2, castTime: 0, fx: 'aura',
        hint: 'Samurai, Barbar oder Mönch brechen den Panzer.',
      },
    ],
  },
  {
    id: 'zyra',
    name: 'Zyra',
    title: 'Die Sturmhexe',
    sprite: 'bossWitch',
    colors: { P: '#1a3a6a', V: '#4a8cff', v: '#bfe8ff' },
    attackFx: 'spark',
    attackDamageType: 'water',
    isRaidBoss: true,
    level: 30,
    stats: { health: 5800, attack: 28, defense: 6 },
    enrageRound: 40,
    mechanics: [
      {
        type: 'groupCast', name: 'Sturmflut', damageType: 'water',
        firstAt: 3, every: 4, power: 1.6, castTime: 1, interruptible: true, fx: 'acidWave',
        hint: 'Trifft den ganzen Raid: unterbrechen (Schurke, Jäger/Magier mit Konter-Talent). Wasserresistenz hilft.',
      },
      {
        type: 'curse', name: 'Blitzmal', damageType: 'water',
        firstAt: 2, every: 3, power: 0.6, duration: 5, castTime: 0, fx: 'curse',
        hint: 'Viele Flüche: Helden, die Flüche lösen, auf die Gruppen verteilen.',
      },
    ],
    phases: [
      {
        belowHpPercent: 0.5,
        name: 'Phase 2',
        text: 'Zyra entfesselt den Sturm! Irrlichter tanzen durch die Halle.',
        mechanics: [
          {
            type: 'summon', name: 'Irrlichter',
            firstAt: 0, every: 6, minion: 'wisp', count: 4, castTime: 0, fx: 'summon',
            hint: 'Die Irrlichter greifen zufällig an: Flächenschaden räumt sie weg.',
          },
          {
            type: 'groupStrike', name: 'Kettenblitz', damageType: 'water',
            firstAt: 2, every: 4, power: 2.0, castTime: 1, interruptible: false, fx: 'acidWave',
            hint: 'Trifft eine ganze Gruppe: Der Heiler der Gruppe muss bereit sein.',
          },
        ],
      },
    ],
  },
  {
    id: 'morvath',
    name: 'Morvath',
    title: 'Der Knochendrache',
    sprite: 'bossDragon',
    colors: { o: '#d8dee9', O: '#4a4a52' },
    attackFx: 'claw',
    attackDamageType: 'shadow',
    isRaidBoss: true,
    level: 30,
    stats: { health: 6200, attack: 29, defense: 10 },
    enrageRound: 40,
    tankStacks: { name: 'Verwest', damageTakenPerStack: 0.1, swapAt: 5 },
    mechanics: [
      {
        type: 'groupCast', name: 'Todesatem', damageType: 'shadow',
        firstAt: 4, every: 5, power: 1.5, castTime: 1, interruptible: false, fx: 'shadowWave',
        hint: 'Trifft den ganzen Raid: Schattenresistenz und starke Heiler helfen.',
      },
      {
        type: 'summon', name: 'Ghule erheben sich',
        firstAt: 6, every: 9, minion: 'ghoul', count: 3, castTime: 0, fx: 'summon',
        hint: 'Flächenschaden räumt die Ghule weg.',
      },
      {
        type: 'frenzy', name: 'Knochenwut',
        firstAt: 3, every: 8, duration: 3, damageBonus: 0.8, breakPoints: 2, castTime: 0, fx: 'aura',
        hint: 'Barde, Chronomant oder Hexenmeister dämpfen die Wut.',
      },
    ],
  },
  {
    id: 'umbral',
    name: 'Fürst Umbral',
    title: 'Herr der Schatten',
    sprite: 'bossCultist',
    colors: { P: '#1a0a2a', p: '#7a3ac8' },
    attackFx: 'shadowBolt',
    attackDamageType: 'shadow',
    isRaidBoss: true,
    level: 30,
    stats: { health: 6500, attack: 29, defense: 8 },
    enrageRound: 40,
    tankStacks: { name: 'Umschattet', damageTakenPerStack: 0.12, swapAt: 4 },
    mechanics: [
      {
        type: 'curse', name: 'Schattenfessel', damageType: 'shadow',
        firstAt: 2, every: 3, power: 0.6, duration: 6, castTime: 0, fx: 'curse',
        hint: 'Viele Flüche: Helden, die Flüche lösen, auf die Gruppen verteilen.',
      },
      {
        type: 'groupStrike', name: 'Schattenschlag', damageType: 'shadow',
        firstAt: 4, every: 4, power: 1.9, castTime: 1, interruptible: false, fx: 'shadowWave',
        hint: 'Trifft eine ganze Gruppe: Der Heiler der Gruppe muss bereit sein.',
      },
    ],
    phases: [
      {
        belowHpPercent: 0.4,
        name: 'Phase 2',
        text: 'Fürst Umbral ruft seine Kultisten aus der Finsternis!',
        mechanics: [
          {
            type: 'summon', name: 'Kultisten',
            firstAt: 0, every: 7, minion: 'cultist', count: 4, castTime: 0, fx: 'summon',
            hint: 'Die Kultisten greifen zufällig an: Flächenschaden räumt sie weg.',
          },
          {
            type: 'curse', name: 'Schattenfessel', damageType: 'shadow',
            firstAt: 1, every: 2, power: 0.6, duration: 6, castTime: 0, fx: 'curse',
            hint: 'Jetzt jede zweite Runde ein Fluch.',
          },
        ],
      },
    ],
  },
  {
    id: 'vaelor',
    name: 'Vaelor',
    title: 'Der Weltenverschlinger',
    isFinalBoss: true,
    sprite: 'bossDragon',
    colors: { o: '#c07cff', O: '#2a0a4a', w: '#ffd23f' },
    attackFx: 'claw',
    attackDamageType: 'shadow',
    isRaidBoss: true,
    level: 30,
    stats: { health: 8000, attack: 30, defense: 14 },
    enrageRound: 50,
    tankStacks: { name: 'Verschlungen', damageTakenPerStack: 0.12, swapAt: 4 },
    mechanics: [
      {
        type: 'tankBuster', name: 'Weltenbiss', damageType: 'shadow',
        firstAt: 3, every: 5, power: 3.0, castTime: 1, interruptible: false, fx: 'bigImpact',
        hint: 'Schilde (Runenwirker) oder Eiserne Wacht (Krieger) fangen den Biss ab.',
      },
      {
        type: 'groupStrike', name: 'Leerenwelle', damageType: 'shadow',
        firstAt: 5, every: 5, power: 1.8, castTime: 1, interruptible: false, fx: 'shadowWave',
        hint: 'Trifft eine ganze Gruppe: Der Heiler der Gruppe muss bereit sein.',
      },
    ],
    phases: [
      {
        belowHpPercent: 0.7,
        name: 'Phase 2',
        text: 'Vaelor reißt die Welt auf! Aus den Rissen kriechen Jungdrachen.',
        mechanics: [
          {
            type: 'summon', name: 'Brut der Leere',
            firstAt: 0, every: 8, minion: 'drakeling', count: 4, castTime: 0, fx: 'summon',
            hint: 'Die Jungdrachen greifen zufällig an: Flächenschaden räumt sie weg.',
          },
          {
            type: 'groupCast', name: 'Sternenfall', damageType: 'fire',
            firstAt: 3, every: 5, power: 1.6, castTime: 1, interruptible: true, fx: 'fireRain',
            hint: 'Trifft den ganzen Raid: unbedingt unterbrechen.',
          },
        ],
      },
      {
        belowHpPercent: 0.4,
        name: 'Phase 3',
        text: 'Vaelor verschlingt das Licht! Flüche legen sich auf den Raid.',
        mechanics: [
          {
            type: 'curse', name: 'Verschlingende Leere', damageType: 'shadow',
            firstAt: 1, every: 2, power: 0.6, duration: 5, castTime: 0, fx: 'curse',
            hint: 'Jede zweite Runde ein Fluch: alle Flüche-Löser werden gebraucht.',
          },
          {
            type: 'groupStrike', name: 'Leerenwelle', damageType: 'shadow',
            firstAt: 2, every: 4, power: 2.0, castTime: 1, interruptible: false, fx: 'shadowWave',
            hint: 'Trifft eine ganze Gruppe.',
          },
        ],
      },
      {
        belowHpPercent: 0.15,
        name: 'Letzte Phase',
        text: 'Das Ende aller Dinge! Vaelor zerreißt den Himmel!',
        mechanics: [
          {
            type: 'groupCast', name: 'Weltenende', damageType: 'shadow',
            firstAt: 1, every: 3, power: 1.4, castTime: 1, interruptible: false, fx: 'shadowWave',
            hint: 'Trifft den ganzen Raid immer wieder: jetzt zählt nur noch Schaden und Heilung.',
          },
        ],
      },
    ],
  },
];
