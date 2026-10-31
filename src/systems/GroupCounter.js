// ============================================================
// GROUPCOUNTER – Wie viele vollständige Dungeon-Gruppen kann ich heute noch bilden?
// Gezählt werden nur freie Helden: nicht verletzt und heute noch nicht eingeplant.
// Eine Gruppe braucht die Pflicht-Positionen aus GROUP_RULES (1 Tank, 1 Heiler), der Rest ist frei.
// Die Regeln stehen in data/groupRules.js.
// ============================================================

import { GROUP_RULES, POSITIONS, getPositionId } from '../data/groupRules.js';

// Die Helden der Gilde nach Position sortiert: { tank: [Held, …], healer: […], … }
export function groupHeroesByPosition(heroes) {
  const byPosition = {};
  for (const position of POSITIONS) {
    byPosition[position.id] = [];
  }
  for (const hero of heroes) {
    byPosition[getPositionId(hero.getClass())].push(hero);
  }
  return byPosition;
}

// Freie Helden: nicht verletzt und heute in keiner Gruppe
export function getFreeHeroes(guild) {
  return guild.heroes.filter((hero) => !hero.isInjured() && !guild.isHeroBusy(hero.id));
}

// Zählt die möglichen Gruppen aus den freien Helden.
// Gibt { groups, free, missing } zurück:
//   groups  = so viele vollständige Gruppen sind möglich
//   free    = Anzahl freier Helden pro Position, z.B. { tank: 2, healer: 1, … }
//   missing = was für die nächste Gruppe fehlt, z.B. { healer: 1, any: 2 } (any = Helden beliebiger Position)
export function countPossibleGroups(guild) {
  const freeHeroes = getFreeHeroes(guild);
  const byPosition = groupHeroesByPosition(freeHeroes);
  const free = {};
  for (const positionId in byPosition) {
    free[positionId] = byPosition[positionId].length;
  }

  // Wie viele Gruppen gehen? Jede Pflicht-Position und die Gesamtzahl begrenzen.
  let groups = Math.floor(freeHeroes.length / GROUP_RULES.size);
  for (const positionId in GROUP_RULES.required) {
    groups = Math.min(groups, Math.floor(free[positionId] / GROUP_RULES.required[positionId]));
  }

  // Was fehlt für die nächste Gruppe?
  const next = groups + 1;
  const missing = {};
  let missingRequired = 0;
  for (const positionId in GROUP_RULES.required) {
    const lacking = next * GROUP_RULES.required[positionId] - free[positionId];
    if (lacking > 0) {
      missing[positionId] = lacking;
      missingRequired += lacking;
    }
  }
  const lackingTotal = next * GROUP_RULES.size - freeHeroes.length - missingRequired;
  if (lackingTotal > 0) {
    missing.any = lackingTotal;
  }
  return { groups, free, missing };
}

// Prüft eine (auch unfertige) Gruppe gegen GROUP_RULES.
// Gibt { count, size, required, complete } zurück:
//   count    = so viele Helden sind gewählt, size = so viele passen hinein
//   required = pro Pflicht-Position { have, need }, z.B. { tank: { have: 1, need: 1 }, healer: { have: 0, need: 1 } }
//   complete = alle Plätze voll und alle Pflicht-Positionen besetzt
export function checkGroup(heroes) {
  const byPosition = groupHeroesByPosition(heroes);
  const required = {};
  let allRequired = true;
  for (const positionId in GROUP_RULES.required) {
    const need = GROUP_RULES.required[positionId];
    const have = byPosition[positionId].length;
    required[positionId] = { have, need };
    if (have < need) {
      allRequired = false;
    }
  }
  return {
    count: heroes.length,
    size: GROUP_RULES.size,
    required: required,
    complete: allRequired && heroes.length === GROUP_RULES.size,
  };
}
