// ============================================================
// CRAFTINGSYSTEM – Zerlegen (Item → Material) und Verbessern (+1 bis +10)
// Die Zahlen stehen in data/crafting.js. Der Zufall (Erfolg ab +6) läuft über Random.
// ============================================================

import { SALVAGE_YIELD, UPGRADE_RULES } from '../data/crafting.js';

// Wie viel Material gibt dieses Item beim Zerlegen? { dust, crystal }
// (Nur der Grundwert der Seltenheit: Eine Verbesserung bringt nichts zurück.)
export function getSalvageYield(item) {
  return { ...SALVAGE_YIELD[item.rarityId] };
}

// Kann das Item noch verbessert werden?
export function canBeUpgraded(item) {
  return item.upgradeLevel < UPGRADE_RULES.maxLevel;
}

// Was kostet die nächste Stufe, und wie sicher klappt sie?
// chanceBonus = zusätzliche Chance durch die Schmiede (z.B. 0.05), höchstens bis 100 %
// Gibt { targetLevel, dust, crystal, gold, chance } zurück (oder null, wenn schon +10).
export function getUpgradeCost(item, chanceBonus = 0) {
  if (!canBeUpgraded(item)) {
    return null;
  }
  const targetLevel = item.upgradeLevel + 1;
  const crystal = targetLevel >= UPGRADE_RULES.crystalsFromLevel ? targetLevel - UPGRADE_RULES.crystalsFromLevel + 1 : 0;
  return {
    targetLevel: targetLevel,
    dust: UPGRADE_RULES.dustPerLevel * targetLevel,
    crystal: crystal,
    gold: UPGRADE_RULES.goldPerLevel * targetLevel,
    chance: Math.min(1, (UPGRADE_RULES.successChance[targetLevel] || 1) + chanceBonus),
  };
}

// Hat die Gilde genug Material und Gold dafür?
export function canAffordUpgrade(guild, cost) {
  return guild.materials.dust >= cost.dust && guild.materials.crystal >= cost.crystal && guild.canAfford(cost.gold);
}

// Versucht die nächste Stufe. Material und Gold werden immer verbraucht.
// Gibt 'success', 'failed', 'maxLevel' oder 'notEnough' zurück.
export function upgradeItem(guild, item, random) {
  const cost = getUpgradeCost(item, guild.hall.getEffect('upgradeChanceBonus', 0));
  if (cost === null) {
    return 'maxLevel';
  }
  if (!canAffordUpgrade(guild, cost)) {
    return 'notEnough';
  }
  guild.materials.dust -= cost.dust;
  guild.materials.crystal -= cost.crystal;
  guild.spendGold(cost.gold);
  if (cost.chance < 1 && random.next() >= cost.chance) {
    return 'failed';
  }
  item.upgradeLevel = cost.targetLevel;
  return 'success';
}
