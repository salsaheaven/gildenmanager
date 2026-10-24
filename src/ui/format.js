// ============================================================
// FORMAT – kleine Helfer, um Zahlen und Werte als Text anzuzeigen
// ============================================================

import { STAT_NAMES, SLOT_NAMES, ARMOR_TYPES, getArmorTypeName } from '../data/items.js';
import { getSuitableClasses } from '../data/heroClasses.js';

// { attack: 9, health: 20 } → "+9 Angriff  +20 Leben"
export function formatStats(stats) {
  const parts = [];
  for (const statName in stats) {
    if (stats[statName] !== 0) {
      parts.push('+' + stats[statName] + ' ' + STAT_NAMES[statName]);
    }
  }
  return parts.join('  ');
}

// 5 → "+5", -3 → "−3", 0 → "±0"
export function formatDifference(value) {
  if (value > 0) {
    return '+' + value;
  }
  if (value < 0) {
    return '−' + Math.abs(value);
  }
  return '±0';
}

// Platz und Rüstungsart eines Items, z.B. "Kopf · Stoff" oder "Waffe"
export function describeItemKind(item) {
  const armorTypeName = getArmorTypeName(item.getTemplate());
  return SLOT_NAMES[item.getSlot()] + (armorTypeName ? ' · ' + armorTypeName : '');
}

// Für welche Klassen das Item gedacht ist, z.B. "Für: Priester, Runenwirker, Magier"
export function describeSuitableClasses(item) {
  const names = getSuitableClasses(item.getTemplate()).map((heroClass) => heroClass.name);
  return 'Für: ' + names.join(', ');
}

// Welche Rüstung eine Klasse trägt, z.B. "Krieger: nur Platte"
export function describeClassArmor(heroClass) {
  return heroClass.name + ': nur ' + ARMOR_TYPES[heroClass.armorType].name;
}
