// ============================================================
// LOOTSYSTEM – würfelt aus, was in einer Kiste steckt
// - Seltenheit nach den Chancen der Kiste
// - Pity-System: Nach zu viel Pech gibt es garantiert ein episches Item
// - Item-Vorlage, Name und Werte
// ============================================================

import { Item } from '../entities/Item.js';
import { ITEM_TEMPLATES, ITEM_SUFFIXES } from '../data/items.js';
import { getRarity, getRarityRank } from '../data/rarities.js';
import { BALANCING } from '../data/balancing.js';

export class LootSystem {
  constructor(random) {
    this.random = random;
  }

  // Öffnet eine Kiste: erzeugt alle Items, legt sie ins Inventar der Gilde
  // und gibt sie sortiert zurück (das seltenste zuletzt, für die Spannung!).
  rollBoxContents(boxType, guild) {
    const items = [];
    for (let i = 0; i < boxType.itemCount; i++) {
      const rarityId = this.rollRarity(boxType.chances, guild);
      const item = this.createItem(rarityId, guild.createItemId());
      items.push(item);
      guild.addItem(item);
    }

    guild.stats.boxesOpened++;
    guild.stats.itemsFound += items.length;

    items.sort((a, b) => a.getRarityRank() - b.getRarityRank());
    return items;
  }

  // Würfelt eine Seltenheit aus und kümmert sich um den Pity-Zähler.
  rollRarity(chances, guild) {
    let rarityId = this.random.pickWeighted(chances);

    const epicRank = getRarityRank('epic');
    const pityReached = guild.itemsSinceEpic >= BALANCING.pityEpicAfterItems;

    // Pity: Nach zu langer Pechsträhne wird mindestens "Episch" garantiert
    if (pityReached && getRarityRank(rarityId) < epicRank) {
      rarityId = 'epic';
    }

    if (getRarityRank(rarityId) >= epicRank) {
      guild.itemsSinceEpic = 0;
    } else {
      guild.itemsSinceEpic++;
    }

    if (rarityId === 'legendary') {
      guild.stats.legendariesFound++;
    }

    return rarityId;
  }

  // Baut ein fertiges Item: zufällige Vorlage, passender Name, Werte mit leichter Streuung.
  createItem(rarityId, itemId) {
    const template = this.random.pick(ITEM_TEMPLATES);
    const rarity = getRarity(rarityId);

    const stats = {};
    for (const statName in template.stats) {
      const baseValue = template.stats[statName];
      // ±15 % Zufall, damit nicht jedes Item gleich ist
      const variation = this.random.between(0.85, 1.15);
      stats[statName] = Math.max(1, Math.round(baseValue * rarity.statMultiplier * variation));
    }

    return new Item(itemId, template.id, rarityId, this.createItemName(template, rarityId), stats);
  }

  createItemName(template, rarityId) {
    if (rarityId === 'legendary') {
      return template.legendaryName;
    }
    if (rarityId === 'poor') {
      return 'Rissige(r) ' + template.name;
    }
    if (rarityId === 'common') {
      return template.name;
    }
    return template.name + ' ' + this.random.pick(ITEM_SUFFIXES);
  }
}
