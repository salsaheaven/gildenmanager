// ============================================================
// HELDENKLASSEN
// Jede Klasse hat eine Rolle, eine Reihe (vorne/hinten), Grundwerte und Wachstum pro Level.
//
// id            = interner Name
// name          = Anzeigename
// role          = 'tank', 'healer', 'damage' oder 'support'
// row           = 'front' (vorne) oder 'back' (hinten)
// color         = Farbe der Kleidung im Pixelbild
// sprite        = welches Pixelbild aus sprites.js benutzt wird
// weapons       = welche Waffen und Nebenhand-Items die Klasse tragen darf (Item-Vorlagen-ids).
//                 Rüstung, Helm, Stiefel und Ringe darf jeder tragen.
// baseStats     = Werte auf Level 1
// growth        = so viel kommt pro Level dazu
// abilities     = Skills der Klasse (Details in abilities.js)
// ============================================================

export const HERO_CLASSES = [
  {
    id: 'warrior',
    name: 'Krieger',
    role: 'tank',
    row: 'front',
    color: '#b03a2e',
    sprite: 'heroWarrior',
    weapons: ['sword', 'shield'],
    baseStats: { health: 120, mana: 0, attack: 10, magic: 0, defense: 12 },
    growth: { health: 12, mana: 0, attack: 2, magic: 0, defense: 2 },
    abilities: ['bulwarkStrike', 'challengingShout', 'ironWatch'],
  },
  {
    id: 'priest',
    name: 'Priester',
    role: 'healer',
    row: 'back',
    color: '#8fa8ff',
    sprite: 'heroPriest',
    weapons: ['staff'],
    baseStats: { health: 70, mana: 100, attack: 2, magic: 12, defense: 4 },
    growth: { health: 7, mana: 10, attack: 0, magic: 2.5, defense: 1 },
    abilities: ['streamOfLife', 'sparkOfGrace', 'silentDevotion'],
  },
  {
    id: 'runeweaver',
    name: 'Runenwirker',
    role: 'healer',
    row: 'back',
    color: '#2fb5a8',
    sprite: 'heroRuneweaver',
    weapons: ['staff', 'shield'],
    baseStats: { health: 80, mana: 90, attack: 3, magic: 10, defense: 6 },
    growth: { health: 8, mana: 9, attack: 0, magic: 2, defense: 1 },
    abilities: ['runeArmor', 'glyphCircle', 'releasingRune'],
  },
  {
    id: 'mage',
    name: 'Magier',
    role: 'damage',
    row: 'back',
    color: '#4b5bd6',
    sprite: 'heroMage',
    weapons: ['staff'],
    baseStats: { health: 60, mana: 110, attack: 2, magic: 15, defense: 3 },
    growth: { health: 6, mana: 11, attack: 0, magic: 3, defense: 0.5 },
    abilities: ['emberLance', 'ashRain', 'iceWreath'],
  },
  {
    id: 'rogue',
    name: 'Schurke',
    role: 'damage',
    row: 'front',
    color: '#3a3a48',
    sprite: 'heroRogue',
    weapons: ['sword'],
    baseStats: { health: 85, mana: 0, attack: 14, magic: 0, defense: 6 },
    growth: { health: 8, mana: 0, attack: 3, magic: 0, defense: 1 },
    abilities: ['shadowStab', 'silencingBlow', 'viperBite'],
  },
];

// Anzeigenamen der Rollen
export const ROLE_NAMES = {
  tank: 'Tank',
  healer: 'Heiler',
  damage: 'Schaden',
  support: 'Unterstützer',
};

// Anzeigenamen der Reihen
export const ROW_NAMES = {
  front: 'vorne',
  back: 'hinten',
};

// Hilfsfunktion: Klasse anhand der id finden
export function getHeroClass(classId) {
  for (const heroClass of HERO_CLASSES) {
    if (heroClass.id === classId) {
      return heroClass;
    }
  }
  throw new Error('Unbekannte Klasse: ' + classId);
}
