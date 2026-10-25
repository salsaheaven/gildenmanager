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
// armorType     = welche Rüstungsart die Klasse trägt: 'plate', 'leather' oder 'cloth' (siehe items.js)
// usefulStats   = welche Item-Werte der Klasse etwas bringen. Nur sie zählen für Upgrade-Pfeile,
//                 "Bestes anlegen" und den Ausrüstungswert (AW). Beispiel: Magie hilft dem Krieger nicht.
//                 Rüstung, Helm, Stiefel und Ringe darf jeder tragen.
// baseStats     = Werte auf Level 1
// growth        = so viel kommt pro Level dazu
// abilities     = Skills der Klasse (Details in abilities.js)
// basicAttack   = normaler Angriff, wenn gerade kein Skill passt (scaling: 'attack' oder 'magic', fx = Animation)
// passive       = freiwillig: Fähigkeit, die immer wirkt (Anzeige: name, description). Mögliche Werte:
//                 dodgeChance           = Anteil normaler Angriffe, denen er ausweicht (nicht großen Schlägen und Zaubern)
//                 rageFromMissingHealth = Bonus-Schaden je fehlendem Leben (1.0 = bei fast 0 Leben doppelter Schaden)
// pet           = freiwillig: Begleiter, der in jedem Kampf mitkämpft (nur Jäger).
//                 Seine Werte sind ein Anteil der Werte seines Helden (healthFactor, attackFactor).
//                 Er stellt sich einem Diener oder Trash-Gegner entgegen, der dann nur noch ihn angreift.
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
    armorType: 'plate',
    usefulStats: ['attack', 'defense', 'health'],
    baseStats: { health: 120, mana: 0, attack: 10, magic: 0, defense: 12 },
    growth: { health: 12, mana: 0, attack: 2, magic: 0, defense: 2 },
    abilities: ['bulwarkStrike', 'challengingShout', 'ironWatch'],
    basicAttack: { name: 'Hieb', scaling: 'attack', power: 1.0, threat: 3, fx: 'slash' },
  },
  {
    id: 'priest',
    name: 'Priester',
    role: 'healer',
    row: 'back',
    color: '#8fa8ff',
    sprite: 'heroPriest',
    weapons: ['staff'],
    armorType: 'cloth',
    usefulStats: ['magic', 'mana', 'defense', 'health'],
    baseStats: { health: 70, mana: 100, attack: 2, magic: 12, defense: 4 },
    growth: { health: 7, mana: 10, attack: 0, magic: 2.5, defense: 1 },
    abilities: ['streamOfLife', 'sparkOfGrace', 'silentDevotion'],
    basicAttack: { name: 'Stabschlag', scaling: 'magic', power: 0.5, fx: 'holyBolt' },
  },
  {
    id: 'runeweaver',
    name: 'Runenwirker',
    role: 'healer',
    row: 'back',
    color: '#2fb5a8',
    sprite: 'heroRuneweaver',
    weapons: ['staff', 'shield'],
    armorType: 'cloth',
    usefulStats: ['magic', 'mana', 'defense', 'health'],
    baseStats: { health: 80, mana: 90, attack: 3, magic: 10, defense: 6 },
    growth: { health: 8, mana: 9, attack: 0, magic: 2, defense: 1 },
    abilities: ['runeArmor', 'glyphCircle', 'releasingRune'],
    basicAttack: { name: 'Runenstoß', scaling: 'magic', power: 0.6, fx: 'runeBolt' },
  },
  {
    id: 'mage',
    name: 'Magier',
    role: 'damage',
    row: 'back',
    color: '#4b5bd6',
    sprite: 'heroMage',
    weapons: ['staff'],
    armorType: 'cloth',
    usefulStats: ['magic', 'mana', 'defense', 'health'],
    baseStats: { health: 60, mana: 110, attack: 2, magic: 15, defense: 3 },
    growth: { health: 6, mana: 11, attack: 0, magic: 3, defense: 0.5 },
    abilities: ['emberLance', 'ashRain', 'iceWreath'],
    basicAttack: { name: 'Funkenwurf', scaling: 'magic', power: 0.7, fx: 'spark' },
  },
  {
    id: 'rogue',
    name: 'Schurke',
    role: 'damage',
    row: 'front',
    color: '#3a3a48',
    sprite: 'heroRogue',
    weapons: ['sword'],
    armorType: 'leather',
    usefulStats: ['attack', 'defense', 'health'],
    baseStats: { health: 85, mana: 0, attack: 14, magic: 0, defense: 6 },
    growth: { health: 8, mana: 0, attack: 3, magic: 0, defense: 1 },
    abilities: ['shadowStab', 'silencingBlow', 'viperBite'],
    basicAttack: { name: 'Dolchhieb', scaling: 'attack', power: 1.0, fx: 'slash' },
  },
  {
    id: 'paladin',
    name: 'Paladin',
    role: 'tank',
    row: 'front',
    color: '#e0b84a',
    sprite: 'heroPaladin',
    weapons: ['mace', 'shield'],
    armorType: 'plate',
    usefulStats: ['magic', 'mana', 'defense', 'health'],
    baseStats: { health: 115, mana: 80, attack: 4, magic: 9, defense: 11 },
    growth: { health: 11, mana: 8, attack: 0, magic: 2, defense: 2 },
    abilities: ['lightbreaker', 'vowOfRecovery', 'oathOfSteadfastness', 'divineShield'],
    basicAttack: { name: 'Hammerschlag', scaling: 'magic', power: 0.8, threat: 6, fx: 'shieldBash' },
  },
  {
    id: 'monk',
    name: 'Mönch',
    role: 'tank',
    row: 'front',
    color: '#e07a2a',
    sprite: 'heroMonk',
    weapons: ['fistWeapon'],
    armorType: 'leather',
    usefulStats: ['attack', 'defense', 'health'],
    baseStats: { health: 105, mana: 0, attack: 11, magic: 0, defense: 7 },
    growth: { health: 10, mana: 0, attack: 2.5, magic: 0, defense: 1.2 },
    abilities: ['whirlKick', 'palmStrike', 'flowingGuard'],
    basicAttack: { name: 'Faustschlag', scaling: 'attack', power: 1.0, threat: 3, fx: 'shieldBash' },
    passive: {
      name: 'Ausweichen',
      description: 'Weicht 30 % der normalen Angriffe aus. Großen Schlägen und Zaubern kann er nicht ausweichen.',
      dodgeChance: 0.3,
    },
  },
  {
    id: 'druid',
    name: 'Druide',
    role: 'healer',
    row: 'back',
    color: '#5a9a3a',
    sprite: 'heroDruid',
    weapons: ['staff'],
    armorType: 'leather',
    usefulStats: ['magic', 'mana', 'defense', 'health'],
    baseStats: { health: 75, mana: 100, attack: 3, magic: 11, defense: 5 },
    growth: { health: 7, mana: 10, attack: 0, magic: 2.3, defense: 1 },
    abilities: ['mossMantle', 'groveBlessing', 'callOfRoots'],
    basicAttack: { name: 'Dornenwurf', scaling: 'magic', power: 0.5, fx: 'spark' },
  },
  {
    id: 'samurai',
    name: 'Samurai',
    role: 'damage',
    row: 'front',
    color: '#c0303a',
    sprite: 'heroSamurai',
    weapons: ['katana'],
    armorType: 'plate',
    usefulStats: ['attack', 'defense', 'health'],
    baseStats: { health: 95, mana: 0, attack: 13, magic: 0, defense: 9 },
    growth: { health: 9, mana: 0, attack: 3, magic: 0, defense: 1.5 },
    abilities: ['iaiStrike', 'execution', 'crescentCut'],
    basicAttack: { name: 'Klingenhieb', scaling: 'attack', power: 1.0, fx: 'slash' },
  },
  {
    id: 'barbarian',
    name: 'Barbar',
    role: 'damage',
    row: 'front',
    color: '#8a5a2a',
    sprite: 'heroBarbarian',
    weapons: ['axe'],
    armorType: 'leather',
    usefulStats: ['attack', 'defense', 'health'],
    baseStats: { health: 110, mana: 0, attack: 13, magic: 0, defense: 4 },
    growth: { health: 11, mana: 0, attack: 3, magic: 0, defense: 0.8 },
    abilities: ['scytheCircle', 'recklessBlow', 'bloodFrenzy'],
    basicAttack: { name: 'Axthieb', scaling: 'attack', power: 1.0, fx: 'slash' },
    passive: {
      name: 'Wundenzorn',
      description: 'Macht mehr Schaden, je weniger Leben er hat (bis zu doppelt so viel).',
      rageFromMissingHealth: 1.0,
    },
  },
  {
    id: 'hunter',
    name: 'Jäger',
    role: 'damage',
    row: 'back',
    color: '#4a7a3a',
    sprite: 'heroHunter',
    weapons: ['bow'],
    armorType: 'leather',
    usefulStats: ['attack', 'defense', 'health'],
    baseStats: { health: 75, mana: 0, attack: 12, magic: 0, defense: 4 },
    growth: { health: 7, mana: 0, attack: 2.6, magic: 0, defense: 0.8 },
    abilities: ['hawkEye', 'arrowFan', 'snareNet'],
    basicAttack: { name: 'Pfeilschuss', scaling: 'attack', power: 1.0, fx: 'arrow' },
    passive: {
      name: 'Begleiter',
      description: 'Ein Wolf kämpft mit. Er stellt sich einem Diener oder Trash-Gegner entgegen, der dann nur noch ihn angreift.',
    },
    pet: {
      name: 'Wolf',
      sprite: 'trashWolf',
      colors: { B: '#9a7a52' },
      healthFactor: 0.8,
      attackFactor: 0.5,
      basicAttack: { name: 'Biss', scaling: 'attack', power: 1.0, fx: 'bite' },
    },
  },
  {
    id: 'warlock',
    name: 'Hexenmeister',
    role: 'damage',
    row: 'back',
    color: '#6a2a7a',
    sprite: 'heroWarlock',
    weapons: ['staff'],
    armorType: 'cloth',
    usefulStats: ['magic', 'mana', 'defense', 'health'],
    baseStats: { health: 65, mana: 100, attack: 2, magic: 13, defense: 3 },
    growth: { health: 6, mana: 10, attack: 0, magic: 2.8, defense: 0.5 },
    abilities: ['corruption', 'soulfire', 'shadowBolt'],
    basicAttack: { name: 'Schattenfunke', scaling: 'magic', power: 0.6, fx: 'shadowBolt' },
  },
  {
    id: 'bard',
    name: 'Barde',
    role: 'support',
    row: 'back',
    color: '#d0508a',
    sprite: 'heroBard',
    weapons: ['lute'],
    armorType: 'cloth',
    usefulStats: ['magic', 'mana', 'defense', 'health'],
    baseStats: { health: 70, mana: 90, attack: 3, magic: 10, defense: 4 },
    growth: { health: 7, mana: 9, attack: 0, magic: 2, defense: 1 },
    abilities: ['songOfBlades', 'slumberTune', 'balladOfHope'],
    basicAttack: { name: 'Misston', scaling: 'magic', power: 0.6, fx: 'spark' },
  },
  {
    id: 'shaman',
    name: 'Schamane',
    role: 'support',
    row: 'back',
    color: '#2a6ab0',
    sprite: 'heroShaman',
    weapons: ['mace', 'shield'],
    armorType: 'plate',
    usefulStats: ['magic', 'mana', 'defense', 'health'],
    baseStats: { health: 85, mana: 90, attack: 4, magic: 11, defense: 7 },
    growth: { health: 8, mana: 9, attack: 0, magic: 2.2, defense: 1.2 },
    abilities: ['bloodlust', 'chainLightning', 'stoneTotem'],
    basicAttack: { name: 'Blitzschlag', scaling: 'magic', power: 0.6, fx: 'lightning' },
  },
  {
    id: 'chronomancer',
    name: 'Chronomant',
    role: 'support',
    row: 'back',
    color: '#c8a838',
    sprite: 'heroChronomancer',
    weapons: ['staff'],
    armorType: 'cloth',
    usefulStats: ['magic', 'mana', 'defense', 'health'],
    baseStats: { health: 65, mana: 100, attack: 2, magic: 11, defense: 3 },
    growth: { health: 6, mana: 10, attack: 0, magic: 2.2, defense: 0.5 },
    abilities: ['timeLeap', 'haste', 'timeStop'],
    basicAttack: { name: 'Sandstoß', scaling: 'magic', power: 0.6, fx: 'spark' },
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

// Welche Klassen können ein Item dieser Vorlage gebrauchen? (für die Anzeige "Für: …")
// Waffen: wer sie tragen darf. Rüstung: wer diese Rüstungsart trägt.
// Ringe: alle, deren normaler Angriff mit dem Wert des Rings arbeitet (Angriff oder Magie).
export function getSuitableClasses(template) {
  return HERO_CLASSES.filter((heroClass) => {
    if (template.slot === 'weapon' || template.slot === 'offhand') {
      return heroClass.weapons.includes(template.id);
    }
    if (template.armorType) {
      // Gleiche Rüstungsart, und Angriff oder Magie auf dem Teil müssen der Klasse nützen
      // (Plattenteile mit Magie sind für Paladin und Schamane, nicht für den Krieger)
      if (heroClass.armorType !== template.armorType) {
        return false;
      }
      for (const statName of ['attack', 'magic']) {
        if (template.stats[statName] && !heroClass.usefulStats.includes(statName)) {
          return false;
        }
      }
      return true;
    }
    if (template.forScaling) {
      return heroClass.basicAttack.scaling === template.forScaling;
    }
    return true;
  });
}
