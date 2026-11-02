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
//                         (Die 3 Set-Dungeons öffnen alle nach der Glutfeste.)
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
    level: 5,
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
    level: 10,
    unlockAfter: 'ruinedChapel',
    encounters: [
      { type: 'trash', name: 'Brutkammer', enemies: ['broodling', 'broodling', 'broodling', 'broodling'] },
      { type: 'trash', name: 'Panzerwache', enemies: ['armoredBeetle', 'armoredBeetle'] },
      { type: 'boss', bossId: 'skarrix' },
    ],
    rewards: { gold: 110, chest: 'chestSkarrix', trashGold: 15 },
  },
  {
    id: 'frostPeak',
    name: 'Die Frostzinne',
    description: 'Kobolde schwärmen über den Gletscher. Oben wartet Hrimgar, dessen Vernichtungsschlag jeden Tank zerschmettert.',
    recommendedGearScore: 55,
    level: 15,
    unlockAfter: 'broodNests',
    encounters: [
      { type: 'trash', name: 'Koboldbande', enemies: ['iceKobold', 'iceKobold', 'iceKobold', 'iceKobold', 'iceKobold'] },
      { type: 'trash', name: 'Frostwölfe', enemies: ['frostWolf', 'frostWolf', 'frostWolf'] },
      { type: 'boss', bossId: 'hrimgar' },
    ],
    rewards: { gold: 150, chest: 'chestHrimgar', trashGold: 18 },
  },
  {
    id: 'witchMoor',
    name: 'Das Spukmoor',
    description: 'Irrlichter locken Wanderer in den Sumpf. Mutter Grezza verflucht jeden, der ihre Hütte erreicht.',
    recommendedGearScore: 80,
    level: 20,
    unlockAfter: 'frostPeak',
    encounters: [
      { type: 'trash', name: 'Moorleichen', enemies: ['bogCorpse', 'bogCorpse', 'bogCorpse'] },
      { type: 'trash', name: 'Irrlichter', enemies: ['wisp', 'wisp', 'wisp', 'wisp'] },
      { type: 'boss', bossId: 'grezza' },
    ],
    rewards: { gold: 200, chest: 'chestGrezza', trashGold: 22 },
  },
  {
    id: 'sunTemple',
    name: 'Der versunkene Sonnentempel',
    description: 'Ein Steinwächter hütet das Tor. Dahinter beschwört Hohepriester Azhur die letzte Sonne.',
    recommendedGearScore: 110,
    level: 24,
    unlockAfter: 'witchMoor',
    encounters: [
      { type: 'trash', name: 'Tempelwache', enemies: ['templeConstruct', 'templeConstruct', 'sunAcolyte', 'sunAcolyte'] },
      { type: 'boss', bossId: 'stoneGuardian' },
      { type: 'trash', name: 'Sonnenchor', enemies: ['sunAcolyte', 'sunAcolyte', 'sunAcolyte'] },
      { type: 'boss', bossId: 'azhur' },
    ],
    rewards: { gold: 280, chest: 'chestAzhur', trashGold: 26 },
  },
  {
    id: 'emberKeep',
    name: 'Die Glutfeste',
    description: 'In der Schmiede unter dem Vulkan hämmert Vorrak. Tiefer im Berg brütet Ignara, die Drachenmutter.',
    recommendedGearScore: 230,
    level: 28,
    unlockAfter: 'sunTemple',
    encounters: [
      { type: 'trash', name: 'Glutwichte', enemies: ['emberImp', 'emberImp', 'emberImp', 'emberImp'] },
      { type: 'boss', bossId: 'vorrak' },
      { type: 'trash', name: 'Drachenbrut', enemies: ['drakeling', 'drakeling', 'emberImp'] },
      { type: 'boss', bossId: 'ignara' },
    ],
    rewards: { gold: 420, chest: 'chestIgnara', trashGold: 36 },
  },
  // ---------- Set-Dungeons (Stufe 30, Endgame): Hier droppen die Klassen-Sets (siehe data/sets.js) ----------
  {
    id: 'ironCitadel',
    name: 'Die Eisenzitadelle',
    description: 'Set-Dungeon für Platte: Kommandant Ferron hütet die Rüstungen der Schlachtenführer.',
    recommendedGearScore: 260,
    level: 30,
    unlockAfter: 'emberKeep',
    encounters: [
      { type: 'trash', name: 'Torwache', enemies: ['ironGuard', 'ironGuard', 'ironGuard'] },
      { type: 'trash', name: 'Waffenkammer', enemies: ['ironGuard', 'ironGuard', 'emberImp', 'emberImp'] },
      { type: 'boss', bossId: 'ferron' },
    ],
    rewards: { gold: 450, chest: 'chestFerron', trashGold: 38 },
  },
  {
    id: 'wildGrove',
    name: 'Der Wilde Hain',
    description: 'Set-Dungeon für Leder: Die Urbestie Skaar wacht über die Gewänder der Jäger und Hüter.',
    recommendedGearScore: 260,
    level: 30,
    unlockAfter: 'emberKeep',
    encounters: [
      { type: 'trash', name: 'Wildwolf-Rudel', enemies: ['wildWolf', 'wildWolf', 'wildWolf', 'wildWolf'] },
      { type: 'trash', name: 'Dornendickicht', enemies: ['wildWolf', 'wildWolf', 'bogCorpse'] },
      { type: 'boss', bossId: 'skaar' },
    ],
    rewards: { gold: 450, chest: 'chestSkaar', trashGold: 38 },
  },
  {
    id: 'arcaneArchive',
    name: 'Das Arkane Archiv',
    description: 'Set-Dungeon für Stoff: Der Archivar Mythrel bewahrt die Roben der großen Zauberer.',
    recommendedGearScore: 260,
    level: 30,
    unlockAfter: 'emberKeep',
    encounters: [
      { type: 'trash', name: 'Fliegende Seiten', enemies: ['livingTome', 'livingTome', 'livingTome', 'livingTome'] },
      { type: 'trash', name: 'Lesesaal', enemies: ['livingTome', 'livingTome', 'cultist', 'cultist'] },
      { type: 'boss', bossId: 'mythrel' },
    ],
    rewards: { gold: 450, chest: 'chestMythrel', trashGold: 38 },
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
