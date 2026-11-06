// ============================================================
// AUFGABEN – was ein Held an einem Tag tun kann (1 Aufgabe pro Held und Tag)
//
// name        = Anzeige im Tagesplan
// description = kurze Erklärung
// color       = Farbe des Aufgaben-Schilds
// choosable   = true: Der Spieler kann sie einem freien Helden geben (im Tagesplan).
// unlock      = freiwillig: erst wählbar, wenn dieser Teil des Spiels freigeschaltet ist (siehe data/unlocks.js)
//               'dungeon', 'raid' und 'injured' ergeben sich von selbst (eingeplant, im Raid bzw. verletzt).
//
// Gewählte Aufgaben bleiben stehen, bis man sie ändert (wer heute trainiert, trainiert morgen weiter).
// Erledigt werden sie bei "Tag beenden" (systems/HeroTaskSystem.js).
// ============================================================

export const HERO_TASKS = {
  dungeon: {
    name: 'Dungeon',
    description: 'Kämpft heute mit seiner Gruppe im Dungeon',
    color: '#ffd23f',
    choosable: false,
  },
  raid: {
    name: 'Raid',
    description: 'Kämpft heute im Raid',
    color: '#ff8000',
    choosable: false,
  },
  injured: {
    name: 'Kuriert sich aus',
    description: 'Ist verletzt und kann heute nicht kämpfen',
    color: '#ff6b6b',
    choosable: false,
  },
  rest: {
    name: 'Ruht sich aus',
    description: 'Hat heute keine Aufgabe',
    color: '#8f86a3',
    choosable: true,
  },
  training: {
    name: 'Training',
    description: 'Sammelt Erfahrung ohne Risiko, der Trainer kostet Gold',
    color: '#5aa9ff',
    choosable: true,
  },
  herbs: {
    name: 'Kräuter sammeln',
    description: 'Sammelt Kräuter, aus denen das Alchemielabor Tränke braut',
    color: '#9be15d',
    choosable: true,
    unlock: 'guildHall',
  },
  gatherRaw: {
    name: 'Rohstoffe sammeln',
    description: 'Sammelt Erz, Leder und Stoff, aus denen die Schmiede Ausrüstung herstellt',
    color: '#c08a52',
    choosable: true,
    unlock: 'guildHall',
  },
  jobs: {
    name: 'Aufträge erledigen',
    description: 'Verdient sicheres Gold in der Stadt, bekommt dafür keine EP',
    color: '#ffb347',
    choosable: true,
  },
  scouting: {
    name: 'Erkunden',
    description: 'Erkundet einen Dungeon: deckt den nächsten Boss auf und bereitet die nächsten Runs dort vor',
    color: '#c77dff',
    choosable: true,
  },
};

// Zahlen für die Aufgaben (grob gesetzt, gebalanced wird am Ende)
export const TASK_RULES = {
  // Training: kostet so viel Gold pro Tag und bringt diesen Anteil der EP eines Bosskampfs auf dem eigenen Level.
  // Fehlt das Gold, fällt das Training aus (der Held ruht sich aus).
  trainingCost: 15,
  trainingXpShareOfBoss: 0.33,

  // Kräuter sammeln / Rohstoffe sammeln: zufällig zwischen min und max Stück pro Tag
  herbYield: { min: 1, max: 3 },
  rawYield: { min: 1, max: 3 },

  // Aufträge erledigen: Gold = jobGoldBase + jobGoldPerLevel × Level, zufällig ± jobGoldSpread (0.25 = ±25 %).
  // "Gierig" bringt hier denselben Bonus wie im Dungeon.
  jobGoldBase: 8,
  jobGoldPerLevel: 2,
  jobGoldSpread: 0.25,

  // Erkunden: Jede Erkundung deckt einen weiteren Teil des Dungeons auf (einen Boss samt den Gegnern davor,
  // siehe systems/DungeonKnowledge.js) und bereitet den nächsten Kampftag dort vor
  // (gilt für alle Gruppen dieses Tages, danach ist die Erkundung verbraucht).
  // Der Kampfvorteil wächst mit dem Wissen: teilweise erkundet (partial) oder vollständig (full).
  // Wirkungen wie bei den Vorräten: damageDone = Schaden (+0.05 = +5 %), damageTaken = erlittener Schaden (−0.05 = −5 %)
  scoutingBonus: {
    partial: { damageDone: 0.05 },
    full: { damageDone: 0.05, damageTaken: -0.05 },
  },
};

// Was ein Held bei "Aufträge erledigen" tut (eine Zeile wird zufällig gewählt, nur für die Anzeige)
export const JOB_TEXTS = [
  'begleitet eine Karawane',
  'hält Wache am Stadttor',
  'vertreibt Wölfe von einem Bauernhof',
  'treibt Schulden für einen Händler ein',
  'räumt einen Rattenkeller aus',
  'beschützt einen reisenden Magier',
  'hilft beim Bau der Stadtmauer',
  'jagt einen Taschendieb',
];
