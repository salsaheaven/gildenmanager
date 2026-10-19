// ============================================================
// DUNGEONS
// Ein Dungeon ist eine Folge von Begegnungen: immer mindestens eine Trash-Gruppe und ein Boss.
//
// id, name, description = Anzeige
// recommendedGearScore  = empfohlener Ø-Ausrüstungswert der Gruppe (Hinweis für den Spieler)
// enemyStrength         = Faktor auf Leben und Angriff aller Gegner im Dungeon (1.2 = 20 % stärker).
//                         Damit lassen sich dieselben Gegner für schwerere Dungeons wiederverwenden.
// unlockAfter           = dieser Dungeon wird freigeschaltet, wenn jener einmal geschafft ist (null = von Anfang an)
// encounters            = Begegnungen in Reihenfolge:
//                         { type: 'trash', name, enemies: [Gegner-ids aus MINIONS in enemies.js] }
//                         { type: 'boss', bossId }
// rewards               = gold: Gold bei Erfolg, chest: Boss-Kiste (aus lootBoxes.js)
// ============================================================

export const DUNGEONS = [
  {
    id: 'bearCave',
    name: 'Die Bärenhöhle',
    description: 'Ein Rudel Höhlenwölfe bewacht den Bau des gewaltigen Grimmzahn.',
    recommendedGearScore: 0,
    enemyStrength: 1.0,
    unlockAfter: null,
    encounters: [
      { type: 'trash', name: 'Wolfsrudel', enemies: ['caveWolf', 'caveWolf', 'caveWolf'] },
      { type: 'boss', bossId: 'grimfang' },
    ],
    rewards: { gold: 40, chest: 'chestGrimfang' },
  },
  {
    id: 'ruinedChapel',
    name: 'Die verfallene Kapelle',
    description: 'Kultisten und Ghule dienen Schwester Morva bei ihren finsteren Ritualen.',
    recommendedGearScore: 25,
    enemyStrength: 1.5,
    unlockAfter: 'bearCave',
    encounters: [
      { type: 'trash', name: 'Kultisten am Tor', enemies: ['cultist', 'cultist', 'ghoul'] },
      { type: 'boss', bossId: 'morva' },
    ],
    rewards: { gold: 70, chest: 'chestMorva' },
  },
  {
    id: 'broodNests',
    name: 'Die Brutnester',
    description: 'Tief unter der Erde wimmelt es von Käfern. In der Mitte lauert die Brutmutter Skarrix.',
    recommendedGearScore: 45,
    enemyStrength: 2.0,
    unlockAfter: 'ruinedChapel',
    encounters: [
      { type: 'trash', name: 'Brutkammer', enemies: ['broodling', 'broodling', 'broodling', 'broodling'] },
      { type: 'trash', name: 'Panzerwache', enemies: ['armoredBeetle', 'armoredBeetle'] },
      { type: 'boss', bossId: 'skarrix' },
    ],
    rewards: { gold: 110, chest: 'chestSkarrix' },
  },
];

export function getDungeon(dungeonId) {
  for (const dungeon of DUNGEONS) {
    if (dungeon.id === dungeonId) {
      return dungeon;
    }
  }
  throw new Error('Unbekannter Dungeon: ' + dungeonId);
}
