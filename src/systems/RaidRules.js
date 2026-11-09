// ============================================================
// RAIDRULES – Regeln rund um den Raid (rechnet nur nach, ändert nichts am Spielstand)
//   - Wochentag und Woche eines Tages, ist heute Raid-Tag?
//   - Ist der Raid offen? (ein Held hat das nötige Level)
//   - Wer kämpft wirklich mit? (Verletzte fehlen) Reicht das? (Mindestgröße, Tanks, Heiler)
//   - Wo geht es weiter? (Wochen-Sperre: nach dem letzten besiegten Boss)
// Die Zahlen stehen in data/raids.js.
// ============================================================

import { t } from '../core/Language.js';
import { RAID_RULES } from '../data/raids.js';

// Wochentag: 1 bis 7 (Tag 1 ist der erste Tag der ersten Woche)
export function getWeekday(day) {
  return ((day - 1) % RAID_RULES.daysPerWeek) + 1;
}

// Woche: 1, 2, 3 … (für die Wochen-Sperre)
export function getWeek(day) {
  return Math.floor((day - 1) / RAID_RULES.daysPerWeek) + 1;
}

export function isRaidDay(day) {
  return RAID_RULES.raidDays.includes(getWeekday(day));
}

// Ist ein Raid offen? Ein Held hat das nötige Level, und (falls angegeben) der vorige Raid wurde einmal ganz geschafft
export function isRaidUnlocked(guild, raid) {
  if (!guild.heroes.some((hero) => hero.level >= raid.unlockLevel)) {
    return false;
  }
  return !raid.unlockAfterRaid || guild.raidPlan.getClears(raid.unlockAfterRaid) > 0;
}

// Die Gruppen mit den Helden, die heute kämpfen können (entlassene und verletzte fehlen)
// Ergebnis: [[Hero, …], …] (immer 4 Gruppen, manche evtl. leer)
export function getFightingGroups(guild, plan) {
  return plan.groups.map((group) => group
    .map((heroId) => guild.findHero(heroId))
    .filter((hero) => hero && !hero.isInjured()));
}

// Reicht die Aufstellung für den Raid?
// Ergebnis: { ok, heroCount, tanks, healers, problems: [Text, …] }
export function checkRaid(guild, plan) {
  const heroes = getFightingGroups(guild, plan).flat();
  const tanks = heroes.filter((hero) => hero.getClass().role === 'tank').length;
  const healers = heroes.filter((hero) => hero.getClass().role === 'healer').length;
  const problems = [];
  if (heroes.length < RAID_RULES.minHeroes) {
    problems.push(t('logic.raidMinHeroes', { need: RAID_RULES.minHeroes, ready: heroes.length }));
  }
  if (tanks < RAID_RULES.minTanks) {
    problems.push(t('logic.raidMinTanks', { need: RAID_RULES.minTanks, ready: tanks }));
  }
  if (healers < RAID_RULES.minHealers) {
    problems.push(t('logic.raidMinHealers', { need: RAID_RULES.minHealers, ready: healers }));
  }
  return { ok: problems.length === 0, heroCount: heroes.length, tanks: tanks, healers: healers, problems: problems };
}

// Ab welcher Begegnung geht es diese Woche weiter? Direkt nach dem letzten besiegten Boss
// (mit dem Trash davor). null = alle Bosse dieser Woche sind besiegt.
export function getNextEncounterIndex(raid, defeatedBossIds) {
  let start = 0;
  raid.encounters.forEach((encounter, index) => {
    if (encounter.type === 'boss' && defeatedBossIds.includes(encounter.bossId)) {
      start = index + 1;
    }
  });
  return start >= raid.encounters.length ? null : start;
}

// Die Bosse des Raids in Reihenfolge (Liste von Boss-ids)
export function getRaidBossIds(raid) {
  return raid.encounters.filter((encounter) => encounter.type === 'boss').map((encounter) => encounter.bossId);
}
