// ============================================================
// DUNGEONS
// Ein Dungeon ist eine Folge von Begegnungen: immer mindestens eine Trash-Gruppe und ein Boss.
//
// id, name, description = Anzeige
// recommendedGearScore  = empfohlener Ø-Ausrüstungswert der Gruppe (Hinweis für den Spieler)
// level                 = Stufe des Dungeons: So stark sind die Gegner (siehe scaling.js),
//                         und Items aus seiner Boss-Kiste haben dieses Item-Level.
//                         Eine Gruppe auf diesem Heldenlevel passt zum Dungeon.
// unlockAfter           = dieser Dungeon wird freigeschaltet, wenn jener einmal geschafft ist (null = von Anfang an)
// encounters            = Begegnungen in Reihenfolge:
//                         { type: 'trash', name, enemies: [Gegner-ids aus MINIONS in enemies.js] }
//                         { type: 'boss', bossId }
// rewards               = gold: Gold bei Erfolg, chest: Boss-Kiste (aus lootBoxes.js),
//                         trashGold: Gold pro besiegter Trash-Gruppe (gibt es auch, wenn der Run danach scheitert)
// ============================================================

import { getBoss, MINIONS } from './enemies.js';

export const DUNGEONS = [
  {
    id: 'bearCave',
    name: 'Die Bärenhöhle',
    description: 'Ein Rudel Höhlenwölfe bewacht den Bau des gewaltigen Grimmzahn.',
    recommendedGearScore: 0,
    level: 1,
    unlockAfter: null,
    encounters: [
      { type: 'trash', name: 'Wolfsrudel', enemies: ['caveWolf', 'caveWolf', 'caveWolf'] },
      { type: 'boss', bossId: 'grimfang' },
    ],
    rewards: { gold: 40, chest: 'chestGrimfang', trashGold: 8 },
  },
  {
    id: 'ruinedChapel',
    name: 'Die verfallene Kapelle',
    description: 'Kultisten und Ghule dienen Schwester Morva bei ihren finsteren Ritualen.',
    recommendedGearScore: 12,
    level: 3,
    unlockAfter: 'bearCave',
    encounters: [
      { type: 'trash', name: 'Kultisten am Tor', enemies: ['cultist', 'cultist', 'ghoul'] },
      { type: 'boss', bossId: 'morva' },
    ],
    rewards: { gold: 70, chest: 'chestMorva', trashGold: 12 },
  },
  {
    id: 'broodNests',
    name: 'Die Brutnester',
    description: 'Tief unter der Erde wimmelt es von Käfern. In der Mitte lauert die Brutmutter Skarrix.',
    recommendedGearScore: 34,
    level: 5,
    unlockAfter: 'ruinedChapel',
    encounters: [
      { type: 'trash', name: 'Brutkammer', enemies: ['broodling', 'broodling', 'broodling', 'broodling'] },
      { type: 'trash', name: 'Panzerwache', enemies: ['armoredBeetle', 'armoredBeetle'] },
      { type: 'boss', bossId: 'skarrix' },
    ],
    rewards: { gold: 110, chest: 'chestSkarrix', trashGold: 15 },
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

// Auf welcher Stufe kämpft dieser Boss? (Stufe des Dungeons, in dem er wohnt, sonst 1)
export function getBossLevel(bossId) {
  for (const dungeon of DUNGEONS) {
    for (const encounter of dungeon.encounters) {
      if (encounter.type === 'boss' && encounter.bossId === bossId) {
        return dungeon.level;
      }
    }
  }
  return 1;
}

// Welche Schadensarten (außer körperlich) kommen in diesem Dungeon vor? Ergebnis z.B. ['shadow']
// Wird für Hinweise und den Test-Bot gebraucht: Gegen diese Arten lohnen sich Resistenzen.
export function getDungeonDamageTypes(dungeonId) {
  const types = new Set();
  for (const encounter of getDungeon(dungeonId).encounters) {
    if (encounter.type === 'boss') {
      const boss = getBoss(encounter.bossId);
      types.add(boss.attackDamageType);
      for (const mechanic of boss.mechanics) {
        types.add(mechanic.damageType);
        if (mechanic.minion) {
          types.add(MINIONS[mechanic.minion].attackDamageType);
        }
      }
    } else {
      for (const minionId of encounter.enemies) {
        types.add(MINIONS[minionId].attackDamageType);
      }
    }
  }
  return [...types].filter((damageTypeId) => damageTypeId && damageTypeId !== 'physical');
}
