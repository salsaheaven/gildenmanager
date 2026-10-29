// ============================================================
// FORMAT – kleine Helfer, um Zahlen und Werte als Text anzuzeigen
// ============================================================

import { STAT_NAMES, SLOT_NAMES, ARMOR_TYPES, getArmorTypeName } from '../data/items.js';
import { DAMAGE_TYPES } from '../data/damageTypes.js';
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

// Resistenzen als Text: { acid: 8 } → "+8 % Säure"
export function formatResistances(resistances) {
  const parts = [];
  for (const damageTypeId in resistances) {
    parts.push('+' + resistances[damageTypeId] + ' % ' + DAMAGE_TYPES[damageTypeId].name);
  }
  return parts.join('  ');
}

// Alle Werte eines Items als Text: Werte und Resistenzen, z.B. "+3 Angriff  +9 Leben  +8 % Säure"
export function formatItemValues(item) {
  const resistanceText = formatResistances(item.resistances);
  return formatStats(item.getStats()) + (resistanceText ? '  ' + resistanceText : '');
}

// Unterschied pro Wert zwischen einem Item und dem gerade angelegten (oder null = Platz leer).
// Ergebnis: Liste von { text, change } mit change = 'up' (mehr), 'down' (weniger).
// Beispiel: [{ text: '+3 Angriff', change: 'up' }, { text: '−2 Rüstung', change: 'down' }]
// Bewusst keine Gesamtnote: Was besser ist, entscheidet der Spieler.
export function describeStatDifferences(item, currentItem) {
  const itemStats = item.getStats();
  const currentStats = currentItem ? currentItem.getStats() : {};
  const statNames = new Set(Object.keys(itemStats).concat(Object.keys(currentStats)));
  const differences = [];
  for (const statName in STAT_NAMES) {
    if (!statNames.has(statName)) {
      continue;
    }
    const newValue = itemStats[statName] || 0;
    const oldValue = currentStats[statName] || 0;
    addDifference(differences, newValue - oldValue, STAT_NAMES[statName]);
  }
  // Resistenzen genauso, z.B. "+8 % Säure"
  for (const damageTypeId in DAMAGE_TYPES) {
    const newValue = item.resistances[damageTypeId] || 0;
    const oldValue = currentItem ? (currentItem.resistances[damageTypeId] || 0) : 0;
    addDifference(differences, newValue - oldValue, '% ' + DAMAGE_TYPES[damageTypeId].name);
  }
  return differences;
}

// Hängt einen Unterschied an die Liste an (0 = nichts). label z.B. "Angriff" oder "% Säure"
function addDifference(differences, difference, label) {
  if (difference > 0) {
    differences.push({ text: '+' + difference + ' ' + label, change: 'up' });
  } else if (difference < 0) {
    differences.push({ text: '−' + Math.abs(difference) + ' ' + label, change: 'down' });
  }
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
