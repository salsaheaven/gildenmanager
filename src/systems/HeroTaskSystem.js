// ============================================================
// HEROTASKSYSTEM – erledigt bei "Tag beenden" die Aufgaben der Helden, die nicht kämpfen,
// und bezahlt den Sold aller Helden.
//   Training        = EP ohne Risiko, kostet Gold (fehlt das Gold, fällt es aus)
//   Kräuter sammeln = Kräuter fürs Alchemielabor
//   Rohstoffe sammeln = Rohstoffe für die Schmiede
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

// EP für einen Tag Training: ein Anteil der EP eines Bosskampfs auf dem Level des Helden.
// guild = freiwillig, dann zählt die Trainingshalle mit
export function getTrainingXp(hero, guild = null) {
  const levelFactor = 1 + (hero.level - 1) * EXPERIENCE.xpGrowthPerDungeonLevel;
  const hallBonus = guild ? guild.hall.getEffect('trainingXpBonus', 0) : 0;
  return Math.round(EXPERIENCE.encounterXp.boss * levelFactor * TASK_RULES.trainingXpShareOfBoss * (1 + hallBonus));
}

// Was kostet ein Tag Training? (die Trainingshalle macht es billiger)
export function getTrainingCost(guild) {
  return Math.round(TASK_RULES.trainingCost * guild.hall.getEffect('trainingCostFactor', 1));
}

// Erledigt die Aufgaben. entries = [{ hero, taskId }] (nur Helden, die heute nicht kämpfen und nicht verletzt sind)
// random = Zufall des Spiels. Gibt pro Held ein Ergebnis zurück:
//   { heroId, name, taskId, xp, levelsGained, newLevel, gathered, scoutedDungeonId, gold, jobText, greedyGold, skipped }
//   gathered = gesammeltes Material, z.B. { herbs: 2 } (sonst null)
//   gold = verdientes Gold bei Aufträgen (greedyGold = davon durch "Gierig"), jobText = was er getan hat
//   skipped = Grund, warum die Aufgabe ausfiel (z.B. 'noGold'), sonst null
export function resolveHeroTasks(guild, entries, random) {
  const results = [];
  for (const entry of entries) {
    const hero = entry.hero;
    const result = {
      heroId: hero.id, name: hero.name, taskId: entry.taskId,
      xp: 0, levelsGained: 0, newLevel: hero.level, gathered: null, scoutedDungeonId: null,
      gold: 0, jobText: null, greedyGold: 0, skipped: null,
    };

    if (entry.taskId === 'training') {
      if (guild.spendGold(getTrainingCost(guild))) {
        result.xp = getTrainingXp(hero, guild);
        result.levelsGained = hero.addXp(result.xp);
        result.newLevel = hero.level;
      } else {
        result.skipped = 'noGold';
      }
    } else if (entry.taskId === 'herbs') {
      result.gathered = { herbs: random.integer(TASK_RULES.herbYield.min, TASK_RULES.herbYield.max) };
      guild.addMaterials(result.gathered);
    } else if (entry.taskId === 'gatherRaw') {
      result.gathered = { raw: random.integer(TASK_RULES.rawYield.min, TASK_RULES.rawYield.max) };
      guild.addMaterials(result.gathered);
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
        // Ohne Kartenraum hält die Erkundung 1 Kampftag, mit Kartenraum länger
        guild.scoutedDungeons[dungeonId] = guild.hall.getEffect('scoutingRunDays', 1);
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

// Bezahlt den Sold, Held für Held in der Reihenfolge der Heldenliste.
// Wer nichts bekommt, ist unzufrieden (unpaidDays steigt); wer bezahlt wird, ist wieder zufrieden.
// Niemand verlässt deshalb die Gilde. Gibt { total, paid, unpaidNames } zurück.
export function payWages(guild) {
  const total = getDailyWages(guild);
  let paid = 0;
  const unpaidNames = [];
  for (const hero of guild.heroes) {
    const wage = HERO_RARITIES[hero.rarityId].dailyWage;
    if (guild.spendGold(wage)) {
      paid += wage;
      hero.unpaidDays = 0;
    } else {
      hero.unpaidDays++;
      unpaidNames.push(hero.name);
    }
  }
  return { total, paid, unpaidNames };
}
