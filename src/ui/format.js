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

// Unterschied pro Wert zwischen einem Item und dem gerade angelegten (oder null = Platz leer).
// Ergebnis: Liste von { text, change } mit change = 'up' (mehr), 'down' (weniger).
// Beispiel: [{ text: '+3 Angriff', change: 'up' }, { text: '−2 Rüstung', change: 'down' }]
// Bewusst keine Gesamtnote: Was besser ist, entscheidet der Spieler.
export function describeStatDifferences(item, currentItem) {
  const statNames = new Set(Object.keys(item.stats));
  if (currentItem) {
    for (const statName in currentItem.stats) {
      statNames.add(statName);
    }
  }
  const differences = [];
  for (const statName in STAT_NAMES) {
    if (!statNames.has(statName)) {
      continue;
    }
    const newValue = item.stats[statName] || 0;
    const oldValue = currentItem ? (currentItem.stats[statName] || 0) : 0;
    const difference = newValue - oldValue;
    if (difference > 0) {
      differences.push({ text: '+' + difference + ' ' + STAT_NAMES[statName], change: 'up' });
    } else if (difference < 0) {
      differences.push({ text: '−' + Math.abs(difference) + ' ' + STAT_NAMES[statName], change: 'down' });
    }
  }
  return differences;
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
