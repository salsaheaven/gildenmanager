// ============================================================
// FORGESYSTEM – Schmieden und Umschmieden in der Schmiede der Gildenhalle
//   - Schmieden (ab Schmiede Stufe 1): Vorlage wählen (Platz + Rüstungsart), heraus kommt ein weißes Item
//   - Umschmieden (ab Schmiede Stufe 2): ein Rüstungsteil bekommt eine andere Rüstungsart
// Beides kostet nur Material (Rohstoffe, Staub, Kristalle), kein Gold.
// Die Zahlen stehen in data/crafting.js (FORGE_RULES, REFORGE_RULES).
// ============================================================

import { FORGE_RULES, REFORGE_RULES } from '../data/crafting.js';
import { ITEM_TEMPLATES, getItemTemplate } from '../data/items.js';
import { getDungeon } from '../data/dungeons.js';

// Welches Item-Level hat ein geschmiedetes Item? Die Stufe des höchsten geschafften Dungeons (sonst 1).
export function getForgeItemLevel(guild) {
  let level = 1;
  for (const dungeonId in guild.firstClearDays) {
    level = Math.max(level, getDungeon(dungeonId).level);
  }
  return level;
}

// Was kostet einmal Schmieden? (Schmiede Stufe 3 macht es billiger, gerundet, mindestens 1 je Sorte)
export function getForgeCost(guild) {
  const factor = guild.hall.getEffect('forgeCostFactor', 1);
  const cost = {};
  for (const materialId in FORGE_RULES.cost) {
    cost[materialId] = Math.max(1, Math.round(FORGE_RULES.cost[materialId] * factor));
  }
  return cost;
}

// Kann geschmiedet werden? Gibt 'ok' oder einen Grund zurück: 'noForge' (keine Schmiede), 'notEnough' (Material fehlt)
export function checkForge(guild) {
  if (!guild.hall.getEffect('forging', false)) {
    return 'noForge';
  }
  if (!guild.hasMaterials(getForgeCost(guild))) {
    return 'notEnough';
  }
  return 'ok';
}

// Schmiedet ein weißes Item nach der gewählten Vorlage und legt es ins Inventar.
// lootSystem = baut das Item (gleiche Werte-Regeln wie bei Beute)
// Gibt { result: 'ok', item } zurück oder { result: Grund aus checkForge, item: null }.
export function forgeItem(guild, lootSystem, templateId) {
  const check = checkForge(guild);
  if (check !== 'ok') {
    return { result: check, item: null };
  }
  guild.spendMaterials(getForgeCost(guild));
  const template = getItemTemplate(templateId);
  const item = lootSystem.createItem(FORGE_RULES.rarityId, guild.createItemId(), getForgeItemLevel(guild), template);
  guild.addItem(item);
  return { result: 'ok', item: item };
}

// Was kostet das Umschmieden dieses Items? (wächst mit der Seltenheit)
export function getReforgeCost(item) {
  const factor = REFORGE_RULES.rarityFactor[item.rarityId];
  const cost = {};
  for (const materialId in REFORGE_RULES.baseCost) {
    cost[materialId] = Math.round(REFORGE_RULES.baseCost[materialId] * factor);
  }
  return cost;
}

// In welche Vorlagen kann dieses Item umgeschmiedet werden? Gleicher Platz, andere Rüstungsart.
// Gibt eine leere Liste zurück, wenn das Item keine Rüstung ist.
export function getReforgeTargets(item) {
  const template = item.getTemplate();
  if (!template.armorType) {
    return [];
  }
  return ITEM_TEMPLATES.filter((other) =>
    other.slot === template.slot && other.armorType && other.armorType !== template.armorType);
}

// Kann umgeschmiedet werden? Gibt 'ok' oder einen Grund zurück:
// 'noReforge' (Schmiede unter Stufe 2), 'notArmor' (keine Rüstung), 'wrongTarget' (Vorlage passt nicht), 'notEnough'
export function checkReforge(guild, item, targetTemplateId) {
  if (!guild.hall.getEffect('reforging', false)) {
    return 'noReforge';
  }
  const targets = getReforgeTargets(item);
  if (targets.length === 0) {
    return 'notArmor';
  }
  if (!targets.some((target) => target.id === targetTemplateId)) {
    return 'wrongTarget';
  }
  if (!guild.hasMaterials(getReforgeCost(item))) {
    return 'notEnough';
  }
  return 'ok';
}

// Schmiedet ein Rüstungsteil um. Das Item behält id, Seltenheit, Item-Level, Verbesserung, Resistenzen
// und (bei Boss-Items) seine Kennung fürs Sammelbuch. Die Werte und der Name kommen von der neuen Vorlage.
// Gibt 'ok' oder den Grund aus checkReforge zurück.
export function reforgeItem(guild, lootSystem, item, targetTemplateId) {
  const check = checkReforge(guild, item, targetTemplateId);
  if (check !== 'ok') {
    return check;
  }
  guild.spendMaterials(getReforgeCost(item));
  const fresh = lootSystem.createItem(item.rarityId, item.id, item.itemLevel, getItemTemplate(targetTemplateId));
  item.templateId = fresh.templateId;
  item.stats = fresh.stats;
  item.name = fresh.name;
  return 'ok';
}
