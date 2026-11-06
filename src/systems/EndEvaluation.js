// ============================================================
// ENDEVALUATION – die Endauswertung nach dem ersten Sieg über den Endboss
//   - Rang nach Spieltagen (data/endEvaluation.js)
//   - Statistik: Tage, geschaffte Dungeon-Runs, Helden, legendäre Items, Kisten, volle Sammelbuch-Seiten,
//     besiegte Raid-Bosse
//   - Platz im Raid-Rennen: Wie viele KI-Gilden haben den Endboss früher besiegt?
// Rechnet nur, ändert nichts. Das Ergebnis wird in der Gilde gespeichert (guild.endEvaluation).
// ============================================================

import { RANKS } from '../data/endEvaluation.js';
import { RAIDS } from '../data/raids.js';
import { getAllRaidBossIds } from './RivalSystem.js';

// Der Rang für so viele Tage
export function getRank(days) {
  return RANKS.find((entry) => entry.maxDays === null || days <= entry.maxDays);
}

// Die Boss-id des Endbosses (letzter Boss des letzten Raids)
export function getFinalBossId() {
  const finalRaid = RAIDS.find((raid) => raid.isFinal);
  const bosses = finalRaid.encounters.filter((encounter) => encounter.type === 'boss');
  return bosses[bosses.length - 1].bossId;
}

// Die Auswertung für einen Sieg am Tag day
// Ergebnis: { day, rank, rankName, rankColor, place, guildCount, guildName, stats: { … } }
export function createEndEvaluation(guild, day) {
  const rank = getRank(day);
  const finalBossId = getFinalBossId();
  // Platz im Raid-Rennen: KI-Gilden, die den Endboss vorher (oder am selben Tag vor dir) besiegt haben
  const fasterRivals = guild.rivals.filter((rival) =>
    rival.raidKills[finalBossId] !== undefined && rival.raidKills[finalBossId] < day).length;
  let dungeonRuns = 0;
  for (const dungeonId in guild.dungeonClears) {
    dungeonRuns += guild.dungeonClears[dungeonId];
  }
  const raidBossIds = getAllRaidBossIds();
  return {
    day: day,
    rank: rank.rank,
    rankName: rank.name,
    rankColor: rank.color,
    place: fasterRivals + 1,
    guildCount: guild.rivals.length + 1,
    guildName: guild.name,
    stats: {
      dungeonRuns: dungeonRuns,
      heroes: guild.heroes.length,
      legendaries: guild.stats.legendariesFound,
      boxesOpened: guild.stats.boxesOpened,
      collectionPages: guild.collection.getUnlockedTitles().length,
      raidBosses: raidBossIds.filter((bossId) => guild.raidPlan.bossKillDays[bossId] !== undefined).length,
      raidBossTotal: raidBossIds.length,
    },
  };
}
