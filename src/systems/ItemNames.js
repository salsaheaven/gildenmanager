// ============================================================
// ITEMNAMES – der Name eines Items, gebaut aus seinen Bausteinen
// Ein Item merkt sich nicht nur seinen fertigen Namen, sondern auch, woraus er besteht
// (Vorlage, Seltenheit, Namenszusatz, Boss-Item). So lässt sich der Name nach einem
// Sprachwechsel in der neuen Sprache neu bauen (siehe Game.fromSaveData).
//   Legendär:     besonderer Name der Vorlage ("Morgenröte")
//   Schrott:      "Rissiges Schwert"
//   Gewöhnlich:   "Schwert"
//   sonst:        "Schwert des Bären" (Namenszusatz aus ITEM_SUFFIXES)
//   Boss-Items:   fester Name aus der Beutetabelle des Bosses (bzw. des Sets)
// ============================================================

import { getItemTemplate, ITEM_SUFFIXES } from '../data/items.js';
import { LOOT_BOXES } from '../data/lootBoxes.js';
import { SETS } from '../data/sets.js';

// Name aus Vorlage, Seltenheit und Namenszusatz (Nummer in ITEM_SUFFIXES, null = keiner)
export function buildItemName(template, rarityId, suffixIndex) {
  if (rarityId === 'legendary') {
    return template.legendaryName;
  }
  if (rarityId === 'poor') {
    return template.poorName;
  }
  if (rarityId === 'common' || suffixIndex === null || suffixIndex === undefined) {
    return template.name;
  }
  return template.name + ' ' + ITEM_SUFFIXES[suffixIndex];
}

// Der Name eines vorhandenen Items in der aktuellen Sprache
export function getItemName(item) {
  if (item.bossItemId) {
    const bossName = findBossItemName(item.bossItemId);
    if (bossName) {
      return bossName;
    }
  }
  return buildItemName(getItemTemplate(item.templateId), item.rarityId, item.suffixIndex);
}

// Fester Name eines Boss-Items (oder eines umgeschmiedeten Set-Teils, Kennung "setWarrior_chest"), sonst null
function findBossItemName(bossItemId) {
  for (const boxType of LOOT_BOXES) {
    const entry = (boxType.bossLoot || []).find((loot) => loot.id === bossItemId);
    if (entry) {
      return entry.name;
    }
  }
  const [setId, slot] = bossItemId.split('_');
  const set = SETS.find((entry) => entry.id === setId);
  return set && set.pieceNames[slot] ? set.pieceNames[slot] : null;
}
