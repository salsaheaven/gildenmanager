// ============================================================
// AUTORAID – "Auto-Raid": stellt aus den einsatzbereiten Helden einen Raid zusammen
//   1. Wer mitgeht (höchstens 20): erst die nötigen Tanks und Heiler, dann die Stärksten
//      (höheres Level, bei Gleichstand der höhere Ausrüstungswert)
//   2. Wer in welche Gruppe kommt: Tanks in verschiedene Gruppen, Heiler möglichst gleichmäßig
//      (jede Gruppe braucht eigene Heilung, siehe KONZEPT.md), der Rest in die kleinste Gruppe
// Verletzte bleiben draußen. Danach kann der Spieler Helden von Hand zwischen den Gruppen tauschen.
// Die Regeln stehen in data/raids.js.
// ============================================================

import { RAID_RULES } from '../data/raids.js';

// Bessere Helden zuerst
function compareHeroes(a, b) {
  if (b.level !== a.level) {
    return b.level - a.level;
  }
  return b.getGearScore() - a.getGearScore();
}

function getRole(hero) {
  return hero.getClass().role;
}

// Vorschlag: 4 Gruppen mit Helden-ids, z.B. [[3, 7, 1], [5, 2], …]
export function suggestAutoRaid(guild) {
  const maxHeroes = RAID_RULES.groupCount * RAID_RULES.groupSize;
  const pool = guild.heroes.filter((hero) => !hero.isInjured());
  pool.sort(compareHeroes);

  // 1. Wer mitgeht
  const chosen = [];
  const takeBest = (condition, count) => {
    for (const hero of pool) {
      if (count <= 0 || chosen.length >= maxHeroes) {
        return;
      }
      if (!chosen.includes(hero) && condition(hero)) {
        chosen.push(hero);
        count--;
      }
    }
  };
  takeBest((hero) => getRole(hero) === 'tank', RAID_RULES.minTanks);
  takeBest((hero) => getRole(hero) === 'healer', RAID_RULES.minHealers);
  takeBest(() => true, maxHeroes);

  // 2. Auf die Gruppen verteilen: Tanks, dann Heiler, dann der Rest
  const groups = [];
  for (let i = 0; i < RAID_RULES.groupCount; i++) {
    groups.push([]);
  }
  const countRole = (group, role) => group.filter((hero) => getRole(hero) === role).length;
  // Die Gruppe mit den wenigsten Helden dieser Rolle (bei Gleichstand die kleinere, dann die vordere)
  const pickGroup = (role) => {
    let best = null;
    for (const group of groups) {
      if (group.length >= RAID_RULES.groupSize) {
        continue;
      }
      if (best === null) {
        best = group;
        continue;
      }
      const fewerOfRole = role !== null && countRole(group, role) < countRole(best, role);
      const sameOfRole = role === null || countRole(group, role) === countRole(best, role);
      if (fewerOfRole || (sameOfRole && group.length < best.length)) {
        best = group;
      }
    }
    return best;
  };
  for (const role of ['tank', 'healer']) {
    for (const hero of chosen.filter((entry) => getRole(entry) === role)) {
      pickGroup(role).push(hero);
    }
  }
  for (const hero of chosen.filter((entry) => getRole(entry) !== 'tank' && getRole(entry) !== 'healer')) {
    pickGroup(null).push(hero);
  }
  return groups.map((group) => group.map((hero) => hero.id));
}
