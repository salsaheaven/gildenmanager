// ============================================================
// ANWEISUNGEN – was man jedem Helden vor dem Kampf vorgeben kann
// Jede Klasse hat genau zwei Anweisungen:
//   1. "Haltung"  – passt zur Rolle (Tank, Heiler, Schadensmacher, Unterstützer)
//   2. Eigenheit  – baut die besondere Mechanik der Klasse um
// Jede Anweisung hat drei Optionen: "Ausgewogen" (Standard, ändert nichts) und zwei Extreme.
// Jedes Extrem hat einen Vorteil (pro) und einen Nachteil (contra). Beides wird im Spiel
// grün bzw. rot angezeigt. Eine Option ohne Nachteil wäre keine Wahl.
//
// effects einer Option (alle freiwillig, Zahlen sind Anteile: 0.3 = +30 %, -0.3 = −30 %):
//   damageDone    = Schaden, den der Held austeilt
//   damageTaken   = Schaden, den der Held erleidet
//   healingDone   = Heilung und Schilde, die der Held wirkt
//   manaCost      = Mana-Kosten seiner Skills
//   threat        = Aggro, die der Held erzeugt
//   dodge         = Ausweich-Chance (wird dazugezählt, 0.15 = 15 Prozentpunkte)
//   targetPriority = 'boss': Schaden zuerst auf den Boss statt auf Diener
//   abilityPower  = { skill-id: Anteil } macht einen Skill stärker oder schwächer
//   abilityWhen   = { skill-id: Bedingung } ersetzt die Bedingung eines Skills,
//                   z.B. 'never' = nie benutzen (Bedingungen siehe systems/combat/HeroAI.js)
//   abilityTarget = { skill-id: Ziel } ersetzt das Ziel eines Skills
//                   (Ziele siehe systems/combat/AbilityEffects.js)
// ============================================================

// Die Standard-Option jeder Anweisung
const BALANCED = { id: 'balanced', label: 'Ausgewogen', pro: null, contra: null, effects: {} };

export const HERO_ORDERS = {
  // ---------- Tanks ----------
  warrior: [
    {
      id: 'stance',
      name: 'Haltung',
      options: [
        BALANCED,
        { id: 'bulwark', label: 'Bollwerk', pro: '30 % weniger erlittener Schaden', contra: '30 % weniger Schaden',
          effects: { damageTaken: -0.3, damageDone: -0.3 } },
        { id: 'fury', label: 'Wut', pro: '30 % mehr Schaden', contra: '25 % mehr erlittener Schaden',
          effects: { damageDone: 0.3, damageTaken: 0.25 } },
      ],
    },
    {
      id: 'aggro',
      name: 'Aggro',
      options: [
        BALANCED,
        { id: 'allOnMe', label: 'Alles an mich', pro: '50 % mehr Aggro: die Gruppe bleibt verschont',
          contra: '15 % mehr erlittener Schaden',
          effects: { threat: 0.5, damageTaken: 0.15 } },
        { id: 'bossOnly', label: 'Nur der Boss', pro: 'schlägt immer den Boss',
          contra: '30 % weniger Aggro: Diener laufen eher frei herum',
          effects: { targetPriority: 'boss', threat: -0.3 } },
      ],
    },
  ],

  paladin: [
    {
      id: 'stance',
      name: 'Haltung',
      options: [
        BALANCED,
        { id: 'shieldWall', label: 'Schildwall', pro: '25 % weniger erlittener Schaden', contra: '30 % weniger Schaden',
          effects: { damageTaken: -0.25, damageDone: -0.3 } },
        { id: 'crusade', label: 'Kreuzzug', pro: '25 % mehr Schaden', contra: '25 % mehr erlittener Schaden',
          effects: { damageDone: 0.25, damageTaken: 0.25 } },
      ],
    },
    {
      id: 'vows',
      name: 'Gelübde',
      options: [
        BALANCED,
        { id: 'selfHeal', label: 'Selbstheilung', pro: 'Gelübde der Genesung heilt 50 % mehr',
          contra: 'kein Schwur der Standhaftigkeit für die Gruppe',
          effects: { abilityPower: { vowOfRecovery: 0.5 }, abilityWhen: { oathOfSteadfastness: 'never' } } },
        { id: 'protectAll', label: 'Schutz für alle', pro: 'Schwur der Standhaftigkeit schützt 50 % stärker',
          contra: 'kein Gelübde der Genesung für sich selbst',
          effects: { abilityPower: { oathOfSteadfastness: 0.5 }, abilityWhen: { vowOfRecovery: 'never' } } },
      ],
    },
  ],

  monk: [
    {
      id: 'stance',
      name: 'Haltung',
      options: [
        BALANCED,
        { id: 'crane', label: 'Kranich', pro: '15 % mehr Ausweichen', contra: '25 % weniger Schaden',
          effects: { dodge: 0.15, damageDone: -0.25 } },
        { id: 'tiger', label: 'Tiger', pro: '30 % mehr Schaden', contra: '10 % weniger Ausweichen',
          effects: { damageDone: 0.3, dodge: -0.1 } },
      ],
    },
    {
      id: 'fighting',
      name: 'Kampfstil',
      options: [
        BALANCED,
        { id: 'bindAll', label: 'Alle binden', pro: 'Wirbeltritt 50 % stärker: hält ganze Gruppen fest',
          contra: 'Handflächenstoß 30 % schwächer',
          effects: { abilityPower: { whirlKick: 0.5, palmStrike: -0.3 } } },
        { id: 'duel', label: 'Zweikampf', pro: 'schlägt immer den Boss',
          contra: 'kein Wirbeltritt: Diener laufen eher frei herum',
          effects: { targetPriority: 'boss', abilityWhen: { whirlKick: 'never' } } },
      ],
    },
  ],

  // ---------- Heiler ----------
  priest: [
    {
      id: 'stance',
      name: 'Haltung',
      options: [
        BALANCED,
        { id: 'fasting', label: 'Fasten', pro: '40 % weniger Mana-Kosten', contra: '25 % weniger Heilung',
          effects: { manaCost: -0.4, healingDone: -0.25 } },
        { id: 'offering', label: 'Opfergabe', pro: '30 % mehr Heilung', contra: '50 % mehr Mana-Kosten',
          effects: { healingDone: 0.3, manaCost: 0.5 } },
      ],
    },
    {
      id: 'prayers',
      name: 'Gebete',
      options: [
        BALANCED,
        { id: 'greatPrayers', label: 'Große Gebete', pro: 'Strom des Lebens heilt 40 % mehr',
          contra: 'kein Funke der Gnade: heilt seltener',
          effects: { abilityPower: { streamOfLife: 0.4 }, abilityWhen: { sparkOfGrace: 'never' } } },
        { id: 'quickSparks', label: 'Schnelle Funken', pro: 'Funke der Gnade heilt 40 % mehr',
          contra: 'kein Strom des Lebens für große Notfälle',
          effects: { abilityPower: { sparkOfGrace: 0.4 }, abilityWhen: { streamOfLife: 'never' } } },
      ],
    },
  ],

  runeweaver: [
    {
      id: 'stance',
      name: 'Haltung',
      options: [
        BALANCED,
        { id: 'fineRunes', label: 'Feine Runen', pro: '40 % weniger Mana-Kosten', contra: '25 % schwächere Schilde',
          effects: { manaCost: -0.4, healingDone: -0.25 } },
        { id: 'deepRunes', label: 'Tiefe Runen', pro: '30 % stärkere Schilde', contra: '50 % mehr Mana-Kosten',
          effects: { healingDone: 0.3, manaCost: 0.5 } },
      ],
    },
    {
      id: 'runes',
      name: 'Runen',
      options: [
        BALANCED,
        { id: 'thickArmor', label: 'Dicker Panzer', pro: 'Runenpanzer 50 % stärker',
          contra: 'kein Glyphenkreis für die Gruppe',
          effects: { abilityPower: { runeArmor: 0.5 }, abilityWhen: { glyphCircle: 'never' } } },
        { id: 'glyphsForAll', label: 'Glyphen für alle', pro: 'Glyphenkreis 50 % stärker',
          contra: 'Runenpanzer 50 % schwächer',
          effects: { abilityPower: { glyphCircle: 0.5, runeArmor: -0.5 } } },
      ],
    },
  ],

  druid: [
    {
      id: 'stance',
      name: 'Haltung',
      options: [
        BALANCED,
        { id: 'gentleRain', label: 'Sanfter Regen', pro: '40 % weniger Mana-Kosten', contra: '25 % weniger Heilung',
          effects: { manaCost: -0.4, healingDone: -0.25 } },
        { id: 'wildGrowth', label: 'Wildwuchs', pro: '30 % mehr Heilung', contra: '50 % mehr Mana-Kosten',
          effects: { healingDone: 0.3, manaCost: 0.5 } },
      ],
    },
    {
      id: 'grove',
      name: 'Pflege',
      options: [
        BALANCED,
        { id: 'tendOne', label: 'Einzeln pflegen', pro: 'Moosmantel heilt 40 % mehr',
          contra: 'kein Hainsegen für die Gruppe',
          effects: { abilityPower: { mossMantle: 0.4 }, abilityWhen: { groveBlessing: 'never' } } },
        { id: 'groveForAll', label: 'Hain für alle', pro: 'Hainsegen heilt 40 % mehr',
          contra: 'Moosmantel heilt 40 % weniger',
          effects: { abilityPower: { groveBlessing: 0.4, mossMantle: -0.4 } } },
      ],
    },
  ],

  // ---------- Schadensmacher ----------
  mage: [
    {
      id: 'stance',
      name: 'Haltung',
      options: [
        BALANCED,
        { id: 'overload', label: 'Überladen', pro: '35 % mehr Schaden',
          contra: '50 % mehr Mana-Kosten und 30 % mehr Aggro',
          effects: { damageDone: 0.35, manaCost: 0.5, threat: 0.3 } },
        { id: 'conserve', label: 'Haushalten', pro: '40 % weniger Mana-Kosten', contra: '20 % weniger Schaden',
          effects: { manaCost: -0.4, damageDone: -0.2 } },
      ],
    },
    {
      id: 'spells',
      name: 'Zauber',
      options: [
        BALANCED,
        { id: 'boss', label: 'Boss', pro: 'ganzer Schaden auf den Boss',
          contra: 'kein Aschenregen: Diener bleiben länger stehen',
          effects: { targetPriority: 'boss', abilityWhen: { ashRain: 'never' } } },
        { id: 'area', label: 'Flächen', pro: 'Aschenregen 40 % stärker',
          contra: 'Glutlanze 30 % schwächer: der Bosskampf dauert länger',
          effects: { abilityPower: { ashRain: 0.4, emberLance: -0.3 } } },
      ],
    },
  ],

  rogue: [
    {
      id: 'stance',
      name: 'Haltung',
      options: [
        BALANCED,
        { id: 'shadows', label: 'Aus dem Schatten', pro: '50 % weniger Aggro', contra: '15 % weniger Schaden',
          effects: { threat: -0.5, damageDone: -0.15 } },
        { id: 'openFight', label: 'Offener Kampf', pro: '30 % mehr Schaden', contra: '50 % mehr Aggro',
          effects: { damageDone: 0.3, threat: 0.5 } },
      ],
    },
    {
      id: 'weapon',
      name: 'Waffe',
      options: [
        BALANCED,
        { id: 'poison', label: 'Gift', pro: 'Natternbiss 60 % stärker (gut in langen Kämpfen)',
          contra: 'Schattenstich 30 % schwächer',
          effects: { abilityPower: { viperBite: 0.6, shadowStab: -0.3 } } },
        { id: 'blade', label: 'Klinge', pro: 'Schattenstich 25 % stärker',
          contra: 'kein Natternbiss',
          effects: { abilityPower: { shadowStab: 0.25 }, abilityWhen: { viperBite: 'never' } } },
      ],
    },
  ],

  samurai: [
    {
      id: 'stance',
      name: 'Haltung',
      options: [
        BALANCED,
        { id: 'patience', label: 'Geduld', pro: '20 % weniger erlittener Schaden', contra: '15 % weniger Schaden',
          effects: { damageTaken: -0.2, damageDone: -0.15 } },
        { id: 'deathless', label: 'Todesverachtung', pro: '30 % mehr Schaden', contra: '30 % mehr erlittener Schaden',
          effects: { damageDone: 0.3, damageTaken: 0.3 } },
      ],
    },
    {
      id: 'blade',
      name: 'Klinge',
      options: [
        BALANCED,
        { id: 'forBoss', label: 'Für den Boss', pro: 'Iaido-Erstschlag 30 % stärker, ganzer Schaden auf den Boss',
          contra: 'Iaido erst am Boss, Diener bleiben länger stehen',
          effects: { targetPriority: 'boss', abilityPower: { iaiStrike: 0.3 }, abilityWhen: { iaiStrike: 'onBoss' } } },
        { id: 'minionsFirst', label: 'Diener zuerst', pro: 'Hinrichtung 30 % stärker: räumt Diener schnell weg',
          contra: 'Iaido-Erstschlag 30 % schwächer',
          effects: { abilityPower: { execution: 0.3, iaiStrike: -0.3 } } },
      ],
    },
  ],

  barbarian: [
    {
      id: 'stance',
      name: 'Haltung',
      options: [
        BALANCED,
        { id: 'calm', label: 'Besonnen', pro: '20 % weniger erlittener Schaden', contra: '20 % weniger Schaden',
          effects: { damageTaken: -0.2, damageDone: -0.2 } },
        { id: 'frenzy', label: 'Raserei', pro: '35 % mehr Schaden', contra: '30 % mehr erlittener Schaden',
          effects: { damageDone: 0.35, damageTaken: 0.3 } },
      ],
    },
    {
      id: 'axe',
      name: 'Axt',
      options: [
        BALANCED,
        { id: 'scythes', label: 'Sensen', pro: 'Sensenkreis 40 % stärker',
          contra: 'Rücksichtsloser Hieb 30 % schwächer',
          effects: { abilityPower: { scytheCircle: 0.4, recklessBlow: -0.3 } } },
        { id: 'blood', label: 'Blut', pro: 'Blutrausch heilt 50 % mehr',
          contra: 'kein Sensenkreis gegen Gruppen',
          effects: { abilityPower: { bloodFrenzy: 0.5 }, abilityWhen: { scytheCircle: 'never' } } },
      ],
    },
  ],

  hunter: [
    {
      id: 'stance',
      name: 'Haltung',
      options: [
        BALANCED,
        { id: 'cover', label: 'Aus der Deckung', pro: '40 % weniger Aggro', contra: '15 % weniger Schaden',
          effects: { threat: -0.4, damageDone: -0.15 } },
        { id: 'huntFever', label: 'Jagdfieber', pro: '25 % mehr Schaden', contra: '40 % mehr Aggro',
          effects: { damageDone: 0.25, threat: 0.4 } },
      ],
    },
    {
      id: 'hunt',
      name: 'Jagd',
      options: [
        BALANCED,
        { id: 'drive', label: 'Treibjagd', pro: 'Pfeilfächer 40 % stärker',
          contra: 'Falkenauge 30 % schwächer',
          effects: { abilityPower: { arrowFan: 0.4, hawkEye: -0.3 } } },
        { id: 'bigGame', label: 'Großwild', pro: 'ganzer Schaden auf den Boss',
          contra: 'kein Fangnetz: Diener laufen frei herum',
          effects: { targetPriority: 'boss', abilityWhen: { snareNet: 'never' } } },
      ],
    },
  ],

  warlock: [
    {
      id: 'stance',
      name: 'Haltung',
      options: [
        BALANCED,
        { id: 'soulPact', label: 'Seelenpakt', pro: '35 % mehr Schaden', contra: '20 % mehr erlittener Schaden',
          effects: { damageDone: 0.35, damageTaken: 0.2 } },
        { id: 'coolHand', label: 'Kühle Hand', pro: '40 % weniger Mana-Kosten', contra: '20 % weniger Schaden',
          effects: { manaCost: -0.4, damageDone: -0.2 } },
      ],
    },
    {
      id: 'curses',
      name: 'Flüche',
      options: [
        BALANCED,
        { id: 'curses', label: 'Flüche', pro: 'beide Flüche 40 % stärker (gut in langen Kämpfen)',
          contra: 'Schattenblitz 40 % schwächer',
          effects: { abilityPower: { corruption: 0.4, soulfire: 0.4, shadowBolt: -0.4 } } },
        { id: 'direct', label: 'Direkt', pro: 'Schattenblitz 40 % stärker (gut gegen Diener)',
          contra: 'keine Flüche',
          effects: { abilityPower: { shadowBolt: 0.4 }, abilityWhen: { corruption: 'never', soulfire: 'never' } } },
      ],
    },
  ],

  // ---------- Unterstützer ----------
  bard: [
    {
      id: 'stance',
      name: 'Haltung',
      options: [
        BALANCED,
        { id: 'playAlong', label: 'Mitspielen', pro: '30 % mehr eigener Schaden', contra: 'Lieder 25 % schwächer',
          effects: { damageDone: 0.3, abilityPower: { songOfBlades: -0.25, balladOfHope: -0.25 } } },
        { id: 'accompany', label: 'Begleiten', pro: 'Lieder 25 % stärker', contra: '40 % weniger eigener Schaden',
          effects: { damageDone: -0.4, abilityPower: { songOfBlades: 0.25, balladOfHope: 0.25 } } },
      ],
    },
    {
      id: 'songs',
      name: 'Lieder',
      options: [
        BALANCED,
        { id: 'battleSong', label: 'Kampflied', pro: 'Lied der Klingen 40 % stärker',
          contra: 'keine Ballade der Zuversicht',
          effects: { abilityPower: { songOfBlades: 0.4 }, abilityWhen: { balladOfHope: 'never' } } },
        { id: 'healingTune', label: 'Heilweise', pro: 'Ballade der Zuversicht heilt 50 % mehr',
          contra: 'kein Lied der Klingen',
          effects: { abilityPower: { balladOfHope: 0.5 }, abilityWhen: { songOfBlades: 'never' } } },
      ],
    },
  ],

  shaman: [
    {
      id: 'stance',
      name: 'Haltung',
      options: [
        BALANCED,
        { id: 'storm', label: 'Sturm', pro: '30 % mehr eigener Schaden', contra: 'Felsenpfahl 30 % schwächer',
          effects: { damageDone: 0.3, abilityPower: { stoneTotem: -0.3 } } },
        { id: 'earth', label: 'Erde', pro: 'Felsenpfahl 40 % stärker', contra: '30 % weniger eigener Schaden',
          effects: { damageDone: -0.3, abilityPower: { stoneTotem: 0.4 } } },
      ],
    },
    {
      id: 'totems',
      name: 'Rituale',
      options: [
        BALANCED,
        { id: 'rage', label: 'Rausch', pro: 'Kampfrausch 50 % stärker',
          contra: 'kein Felsenpfahl gegen Gruppenschaden',
          effects: { abilityPower: { bloodlust: 0.5 }, abilityWhen: { stoneTotem: 'never' } } },
        { id: 'totemAlways', label: 'Pfahl ständig', pro: 'Felsenpfahl, sobald er bereit ist: öfter Schutz',
          contra: 'fehlt vielleicht beim großen Schlag, Kampfrausch 30 % schwächer',
          effects: { abilityWhen: { stoneTotem: 'ready' }, abilityPower: { bloodlust: -0.3 } } },
      ],
    },
  ],

  chronomancer: [
    {
      id: 'stance',
      name: 'Haltung',
      options: [
        BALANCED,
        { id: 'sandstorm', label: 'Sandsturm', pro: '40 % mehr eigener Schaden', contra: 'kein Zeitsprung',
          effects: { damageDone: 0.4, abilityWhen: { timeLeap: 'never' } } },
        { id: 'keeper', label: 'Hüter der Zeit', pro: 'Zeitsprung, sobald jemand wartet',
          contra: '50 % weniger eigener Schaden',
          effects: { damageDone: -0.5, abilityWhen: { timeLeap: 'allyWaiting' } } },
      ],
    },
    {
      id: 'haste',
      name: 'Beschleunigung',
      options: [
        BALANCED,
        { id: 'healer', label: 'Beschleunigt Heiler', pro: 'der Heiler handelt doppelt: mehr Heilung',
          contra: 'kein doppelter Schadensmacher',
          effects: { abilityTarget: { haste: 'healerAlly' } } },
        { id: 'tank', label: 'Beschleunigt Tank', pro: 'der Tank handelt doppelt: hält die Aggro sicherer',
          contra: 'kein doppelter Schadensmacher',
          effects: { abilityTarget: { haste: 'tankAlly' } } },
      ],
    },
  ],
};

// Anweisungen einer Klasse (leere Liste, wenn die Klasse noch keine hat)
export function getOrdersForClass(classId) {
  return HERO_ORDERS[classId] || [];
}
