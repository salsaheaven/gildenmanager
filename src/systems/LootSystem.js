// ============================================================
// LOOTSYSTEM – würfelt aus, was in einer Kiste steckt
// - Seltenheit nach den Chancen der Kiste
// - Pity-System: Nach zu viel Pech gibt es garantiert ein episches Item
// - Item-Vorlage, Name und Werte (Werte wachsen mit dem Item-Level, siehe data/scaling.js)
// - Boss-Kisten: ein garantiertes Boss-Item (fester Name, Mindest-Seltenheit)
// ============================================================

import { Item } from '../entities/Item.js';
import { ITEM_TEMPLATES, ITEM_SUFFIXES, getItemTemplate } from '../data/items.js';
import { getRarity, getRarityRank } from '../data/rarities.js';
import { BALANCING } from '../data/balancing.js';
import { getItemLevelFactor } from '../data/scaling.js';

export class LootSystem {
  constructor(random) {
    this.random = random;
  }

  // Öffnet eine Kiste: erzeugt alle Items, legt sie ins Inventar der Gilde
  // und gibt sie sortiert zurück (das seltenste zuletzt, für die Spannung!).
  // itemLevel  = Item-Level aller Items in der Kiste
  // bonusItems = so viele Zufalls-Items kommen zusätzlich dazu (z.B. durch einen Glückspilz)
  rollBoxContents(boxType, guild, itemLevel = 1, bonusItems = 0) {
    const items = [];
    let normalCount = boxType.itemCount + bonusItems;

    // Boss-Kiste: ein Item aus der Beutetabelle des Bosses ist garantiert
    if (boxType.bossLoot) {
      const bossItem = this.rollBossItem(boxType, guild, itemLevel);
      items.push(bossItem);
      guild.addItem(bossItem);
      normalCount--;
    }

    for (let i = 0; i < normalCount; i++) {
      const rarityId = this.rollRarity(boxType.chances, guild);
      const item = this.createItem(rarityId, guild.createItemId(), itemLevel);
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

  // Ein besonderes Item des Bosses, mindestens in seiner Mindest-Seltenheit
  rollBossItem(boxType, guild, itemLevel) {
    const entry = this.random.pick(boxType.bossLoot);
    let rarityId = this.rollRarity(boxType.chances, guild);
    if (getRarityRank(rarityId) < getRarityRank(entry.minRarity)) {
      rarityId = entry.minRarity;
    }
    return this.createItem(rarityId, guild.createItemId(), itemLevel, getItemTemplate(entry.templateId), entry.name);
  }

  // Baut ein fertiges Item: zufällige Vorlage, passender Name, Werte mit leichter Streuung.
  // template und fixedName sind freiwillig (für Boss-Items mit festem Namen).
  createItem(rarityId, itemId, itemLevel = 1, template = null, fixedName = null) {
    if (template === null) {
      template = this.random.pick(ITEM_TEMPLATES);
    }
    const rarity = getRarity(rarityId);
    const levelFactor = getItemLevelFactor(itemLevel);

    const stats = {};
    for (const statName in template.stats) {
      const baseValue = template.stats[statName];
      // ±15 % Zufall, damit nicht jedes Item gleich ist
      const variation = this.random.between(0.85, 1.15);
      stats[statName] = Math.max(1, Math.round(baseValue * rarity.statMultiplier * levelFactor * variation));
    }

    const name = fixedName || this.createItemName(template, rarityId);
    return new Item(itemId, template.id, rarityId, name, stats, itemLevel);
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
