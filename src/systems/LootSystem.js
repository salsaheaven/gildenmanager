// ============================================================
// LOOTSYSTEM – würfelt aus, was in einer Kiste steckt
// - Seltenheit nach den Chancen der Kiste
// - Pity-System: Nach zu viel Pech gibt es garantiert ein episches Item
// - Item-Vorlage, Name und Werte (Werte wachsen mit dem Item-Level, siehe data/scaling.js)
// - Boss-Kisten: ein garantiertes Boss-Item (fester Name, Mindest-Seltenheit, feste Resistenz des Bosses)
// - Resistenzen: Zufalls-Items haben manchmal eine zufällige Resistenz (Chance und Höhe in rarities.js)
// ============================================================

import { Item } from '../entities/Item.js';
import { ITEM_TEMPLATES, ITEM_SUFFIXES, getItemTemplate } from '../data/items.js';
import { RESISTANCE_TYPES } from '../data/damageTypes.js';
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
    const item = this.createItem(rarityId, guild.createItemId(), itemLevel, getItemTemplate(entry.templateId), entry.name,
      boxType.bossResistance || null);
    item.bossItemId = entry.id; // damit das Sammelbuch das Item erkennt
    return item;
  }

  // Baut ein fertiges Item: zufällige Vorlage, passender Name, Werte mit leichter Streuung.
  // template und fixedName sind freiwillig (für Boss-Items mit festem Namen).
  // fixedResistance = Schadensart, gegen die das Item sicher eine Resistenz hat (Boss-Items),
  //                   sonst bekommt es mit etwas Glück eine zufällige.
  createItem(rarityId, itemId, itemLevel = 1, template = null, fixedName = null, fixedResistance = null) {
    if (template === null) {
      template = this.pickTemplate();
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
    const resistances = this.rollResistances(rarity, fixedResistance);
    return new Item(itemId, template.id, rarityId, name, stats, itemLevel, resistances);
  }

  // Resistenz eines neuen Items: fest (Boss-Item) oder mit etwas Glück eine zufällige.
  // Ergebnis z.B. { acid: 8 } oder {} (keine Resistenz)
  rollResistances(rarity, fixedResistance) {
    if (rarity.resistance === 0) {
      return {};
    }
    if (fixedResistance) {
      return { [fixedResistance]: rarity.resistance };
    }
    if (this.random.next() < rarity.randomResistanceChance) {
      return { [this.random.pick(RESISTANCE_TYPES)]: rarity.resistance };
    }
    return {};
  }

  // Eine zufällige Item-Vorlage, gewichtet mit dropWeight (siehe items.js, ohne Angabe 1)
  pickTemplate() {
    const weights = {};
    for (const template of ITEM_TEMPLATES) {
      weights[template.id] = template.dropWeight || 1;
    }
    return getItemTemplate(this.random.pickWeighted(weights));
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
