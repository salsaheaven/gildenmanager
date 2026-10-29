// ============================================================
// AUFGABEN – was ein Held an einem Tag tun kann (1 Aufgabe pro Held und Tag)
//
// name        = Anzeige im Tagesplan
// description = kurze Erklärung
// color       = Farbe des Aufgaben-Schilds
// choosable   = true: Der Spieler kann sie einem freien Helden geben (im Tagesplan).
//               'dungeon' und 'injured' ergeben sich von selbst (eingeplant bzw. verletzt).
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
    description: 'Findet mit etwas Glück einen Trank für die Vorratskammer',
    color: '#9be15d',
    choosable: true,
  },
  jobs: {
    name: 'Aufträge erledigen',
    description: 'Verdient sicheres Gold in der Stadt, bekommt dafür keine EP',
    color: '#ffb347',
    choosable: true,
  },
  scouting: {
    name: 'Erkunden',
    description: 'Erkundet einen Dungeon: Die nächsten Runs dort (alle Gruppen eines Tages) sind vorbereitet',
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

  // Kräuter sammeln: Chance auf einen Fund, und welcher Trank es wird (Gewichte, zusammen beliebig)
  herbFindChance: 0.5,
  herbFinds: { healingPotions: 45, manaPotions: 45, shadowWard: 2, acidWard: 2, frostWard: 2, fireWard: 2, lightWard: 2 },

  // Aufträge erledigen: Gold = jobGoldBase + jobGoldPerLevel × Level, zufällig ± jobGoldSpread (0.25 = ±25 %).
  // "Gierig" bringt hier denselben Bonus wie im Dungeon.
  jobGoldBase: 8,
  jobGoldPerLevel: 2,
  jobGoldSpread: 0.25,

  // Erkunden: Wirkung auf die Runs im erkundeten Dungeon am nächsten Tag, an dem dort jemand kämpft
  // (gilt für alle Gruppen dieses Tages, danach ist die Erkundung verbraucht)
  scoutingDamageBonus: 0.05,
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
