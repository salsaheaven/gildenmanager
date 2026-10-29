// ============================================================
// HEROTASKSYSTEM – erledigt bei "Tag beenden" die Aufgaben der Helden, die nicht kämpfen,
// und bezahlt den Sold aller Helden.
//   Training        = EP ohne Risiko, kostet Gold (fehlt das Gold, fällt es aus)
//   Kräuter sammeln = mit etwas Glück ein Trank für die Vorratskammer
//   Aufträge        = sicheres Gold, abhängig vom Level (Gierig bringt mehr)
//   Erkunden        = der gewählte Dungeon ist für die nächsten Runs dort vorbereitet
//   Ausruhen        = nichts
// Die Zahlen stehen in data/heroTasks.js (TASK_RULES) und data/heroRarities.js (Sold).
// ============================================================

import { TASK_RULES, JOB_TEXTS } from '../data/heroTasks.js';
import { getGroupGoldBonus } from './TraitEffects.js';
import { EXPERIENCE } from '../data/experience.js';
import { HERO_RARITIES } from '../data/heroRarities.js';

// Gold für einen Tag Aufträge, ohne Zufall und ohne Gierig (für die Anzeige "etwa X Gold")
export function getJobGold(hero) {
  return TASK_RULES.jobGoldBase + TASK_RULES.jobGoldPerLevel * hero.level;
}

// EP für einen Tag Training: ein Anteil der EP eines Bosskampfs auf dem Level des Helden
export function getTrainingXp(hero) {
  const levelFactor = 1 + (hero.level - 1) * EXPERIENCE.xpGrowthPerDungeonLevel;
  return Math.round(EXPERIENCE.encounterXp.boss * levelFactor * TASK_RULES.trainingXpShareOfBoss);
}

// Erledigt die Aufgaben. entries = [{ hero, taskId }] (nur Helden, die heute nicht kämpfen und nicht verletzt sind)
// random = Zufall des Spiels. Gibt pro Held ein Ergebnis zurück:
//   { heroId, name, taskId, xp, levelsGained, newLevel, foundSupply, scoutedDungeonId, gold, jobText, greedyGold, skipped }
//   gold = verdientes Gold bei Aufträgen (greedyGold = davon durch "Gierig"), jobText = was er getan hat
//   skipped = Grund, warum die Aufgabe ausfiel (z.B. 'noGold'), sonst null
export function resolveHeroTasks(guild, entries, random) {
  const results = [];
  for (const entry of entries) {
    const hero = entry.hero;
    const result = {
      heroId: hero.id, name: hero.name, taskId: entry.taskId,
      xp: 0, levelsGained: 0, newLevel: hero.level, foundSupply: null, scoutedDungeonId: null,
      gold: 0, jobText: null, greedyGold: 0, skipped: null,
    };

    if (entry.taskId === 'training') {
      if (guild.spendGold(TASK_RULES.trainingCost)) {
        result.xp = getTrainingXp(hero);
        result.levelsGained = hero.addXp(result.xp);
        result.newLevel = hero.level;
      } else {
        result.skipped = 'noGold';
      }
    } else if (entry.taskId === 'herbs') {
      if (random.next() < TASK_RULES.herbFindChance) {
        result.foundSupply = random.pickWeighted(TASK_RULES.herbFinds);
        guild.addSupply(result.foundSupply);
      }
    } else if (entry.taskId === 'jobs') {
      // Zufall: zwischen (1 − spread) und (1 + spread) des normalen Lohns
      const spreadFactor = 1 - TASK_RULES.jobGoldSpread + random.next() * 2 * TASK_RULES.jobGoldSpread;
      const baseGold = Math.round(getJobGold(hero) * spreadFactor);
      result.greedyGold = Math.round(baseGold * getGroupGoldBonus([hero]).bonus);
      result.gold = baseGold + result.greedyGold;
      result.jobText = random.pick(JOB_TEXTS);
      guild.addGold(result.gold);
    } else if (entry.taskId === 'scouting') {
      const dungeonId = hero.task.dungeonId;
      if (dungeonId) {
        guild.scoutedDungeons[dungeonId] = true;
        result.scoutedDungeonId = dungeonId;
      } else {
        result.skipped = 'noDungeon';
      }
    }
    results.push(result);
  }
  return results;
}

// Sold aller Helden für einen Tag
export function getDailyWages(guild) {
  return guild.heroes.reduce((sum, hero) => sum + HERO_RARITIES[hero.rarityId].dailyWage, 0);
}

// Bezahlt den Sold. Reicht das Gold nicht, wird bezahlt, was da ist.
// Gibt { total, paid } zurück.
export function payWages(guild) {
  const total = getDailyWages(guild);
  const paid = Math.min(total, guild.gold);
  guild.spendGold(paid);
  return { total, paid };
}
