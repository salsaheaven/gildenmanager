// ============================================================
// HEROICMODE – die heroische Stufe eines Dungeons (Zahlen in data/heroic.js)
//
// getRunDungeon liefert die Dungeon-Daten so, wie ein Run sie braucht:
// normal = genau die Daten aus data/dungeons.js,
// heroisch = eine Kopie mit höherer Stufe und mehr Gold.
// Weil Kampf, EP und Kiste alle die Stufe des Dungeons benutzen, wirkt die höhere Stufe so überall von selbst.
// ============================================================

import { getDungeon } from '../data/dungeons.js';
import { HEROIC } from '../data/heroic.js';

// Die Dungeon-Daten für einen Run. heroic = true → heroische Kopie
export function getRunDungeon(dungeonId, heroic) {
  const dungeon = getDungeon(dungeonId);
  if (!heroic) {
    return dungeon;
  }
  return {
    ...dungeon,
    heroic: true,
    level: dungeon.level + HEROIC.levelBonus,
    rewards: {
      ...dungeon.rewards,
      gold: Math.round(dungeon.rewards.gold * HEROIC.goldFactor),
      trashGold: Math.round((dungeon.rewards.trashGold || 0) * HEROIC.goldFactor),
    },
  };
}

// Darf dieser Dungeon auf Heroisch gestellt werden? Erst, wenn er einmal (normal) geschafft ist.
export function isHeroicAvailable(guild, dungeonId) {
  return guild.getClears(dungeonId) > 0;
}

// Ist dieser Dungeon gerade auf Heroisch gestellt?
export function isDungeonHeroic(guild, dungeonId) {
  return guild.heroicDungeons.includes(dungeonId) && isHeroicAvailable(guild, dungeonId);
}
