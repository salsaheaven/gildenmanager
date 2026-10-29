// ============================================================
// BUILDINGSYSTEM – Gebäude bauen und unterhalten
//   - Bau starten: kostet Gold und Material, nur eine Baustelle gleichzeitig
//   - jeden Abend (Game.endDay): ein Bautag vergeht, ist er fertig, steigt das Gebäude eine Stufe
//   - jeden Abend: Unterhalt aller Gebäude. Reicht das Gold nicht, wird nichts bezahlt
//     und am nächsten Tag wirkt kein Gebäude.
// Die Zahlen stehen in data/buildings.js, den Stand hält entities/GuildHall.js.
// ============================================================

import { BUILDINGS, getBuilding } from '../data/buildings.js';

// Die Daten der nächsten Stufe (cost, buildDays, upkeep, effects, text) oder null, wenn schon Stufe 3
export function getNextLevel(hall, buildingId) {
  const building = getBuilding(buildingId);
  const level = hall.getLevel(buildingId);
  if (level >= building.levels.length) {
    return null;
  }
  return building.levels[level];
}

// Hat die Gilde genug Gold und Material? cost = { gold, dust, crystal }
export function canAffordCost(guild, cost) {
  return guild.canAfford(cost.gold) && guild.materials.dust >= cost.dust && guild.materials.crystal >= cost.crystal;
}

// Kann der Bau beginnen? Gibt 'ok' oder einen Grund zurück:
// 'maxLevel' (schon Stufe 3), 'busy' (es wird schon etwas gebaut), 'notEnough' (Gold oder Material fehlt)
export function checkConstruction(guild, buildingId) {
  const nextLevel = getNextLevel(guild.hall, buildingId);
  if (nextLevel === null) {
    return 'maxLevel';
  }
  if (guild.hall.construction !== null) {
    return 'busy';
  }
  if (!canAffordCost(guild, nextLevel.cost)) {
    return 'notEnough';
  }
  return 'ok';
}

// Beginnt den Bau der nächsten Stufe und bezahlt ihn. Gibt 'ok' oder den Grund aus checkConstruction zurück.
export function startConstruction(guild, buildingId) {
  const check = checkConstruction(guild, buildingId);
  if (check !== 'ok') {
    return check;
  }
  const nextLevel = getNextLevel(guild.hall, buildingId);
  guild.spendGold(nextLevel.cost.gold);
  guild.materials.dust -= nextLevel.cost.dust;
  guild.materials.crystal -= nextLevel.cost.crystal;
  guild.hall.construction = {
    buildingId: buildingId,
    targetLevel: guild.hall.getLevel(buildingId) + 1,
    daysLeft: nextLevel.buildDays,
  };
  return 'ok';
}

// Ein Bautag vergeht (bei "Tag beenden"). Ist der Bau fertig, steigt das Gebäude eine Stufe.
// Gibt { buildingId, level } zurück, wenn heute etwas fertig wurde, sonst null.
export function advanceConstruction(hall) {
  const construction = hall.construction;
  if (construction === null) {
    return null;
  }
  construction.daysLeft--;
  if (construction.daysLeft > 0) {
    return null;
  }
  hall.levels[construction.buildingId] = construction.targetLevel;
  hall.construction = null;
  return { buildingId: construction.buildingId, level: construction.targetLevel };
}

// Unterhalt aller gebauten Gebäude für einen Tag (in Gold)
export function getDailyUpkeep(hall) {
  let total = 0;
  for (const buildingId in hall.levels) {
    const level = hall.getLevel(buildingId);
    if (level > 0) {
      total += BUILDINGS[buildingId].levels[level - 1].upkeep;
    }
  }
  return total;
}

// Bezahlt den Unterhalt. Alles oder nichts: Reicht das Gold nicht, wird nichts bezahlt
// und die Gebäude wirken am nächsten Tag nicht. Gibt { total, paid } zurück.
export function payUpkeep(guild) {
  const total = getDailyUpkeep(guild.hall);
  if (total === 0 || guild.spendGold(total)) {
    guild.hall.upkeepPaid = true;
    return { total, paid: total };
  }
  guild.hall.upkeepPaid = false;
  return { total, paid: 0 };
}
