// ============================================================
// LOOTSYSTEM – würfelt aus, was in einer Kiste steckt
// - Seltenheit nach den Chancen der Kiste
// - Pity-System: Nach zu viel Pech gibt es garantiert ein episches Item
// - Item-Vorlage, Name und Werte (Werte wachsen mit dem Item-Level, siehe data/scaling.js)
// - Boss-Kisten: ein garantiertes Boss-Item (fester Name, Mindest-Seltenheit, feste Resistenz des Bosses)
// - Resistenzen: Zufalls-Items haben manchmal eine zufällige Resistenz (Chance und Höhe in rarities.js)
// - Raid-Kisten: Legendär nur hier, immer als Waffe oder Ring; eigenes Pity (garantiert nach X Kisten ohne
//   Legendär); dazu Raid-Zutaten (Aschenessenz)
// ============================================================

import { Item } from '../entities/Item.js';
import { buildItemName } from './ItemNames.js';
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

    // Raid-Pity: Ist die Pechsträhne lang genug, wird das erste Zufalls-Item legendär
    const raidPity = boxType.isRaidChest && guild.raidChestsSinceLegendary >= BALANCING.raidLegendaryPityAfter - 1;
    for (let i = 0; i < normalCount; i++) {
      let rarityId = this.rollRarity(boxType.chances, guild);
      if (raidPity && i === 0) {
        rarityId = 'legendary';
      }
      // Legendär (nur aus Raid-Kisten) ist immer eine Waffe oder ein Ring
      const template = rarityId === 'legendary' ? this.pickTemplate(boxType.legendarySlots || null) : this.pickTemplateForGuild(guild);
      const item = this.createItem(rarityId, guild.createItemId(), itemLevel, template);
      items.push(item);
      guild.addItem(item);
    }

    if (boxType.isRaidChest) {
      const gotLegendary = items.some((item) => item.rarityId === 'legendary');
      guild.raidChestsSinceLegendary = gotLegendary ? 0 : guild.raidChestsSinceLegendary + 1;
      // Raid-Zutaten zum Umschmieden von Set-Teilen
      const ingredients = this.random.integer(boxType.raidIngredients.min, boxType.raidIngredients.max);
      guild.addMaterials({ ashEssence: ingredients });
      items.ingredients = { ashEssence: ingredients }; // für die Anzeige beim Öffnen
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
    // Legendär gibt es nur für Waffen und Ringe (Raid-Kisten): ein Boss-Rüstungsteil bleibt dann episch
    const template = getItemTemplate(entry.templateId);
    if (rarityId === 'legendary' && boxType.legendarySlots && !boxType.legendarySlots.includes(template.slot)) {
      rarityId = 'epic';
    }
    const item = this.createItem(rarityId, guild.createItemId(), itemLevel, template, entry.name,
      boxType.bossResistance || null);
    item.bossItemId = entry.id; // damit das Sammelbuch das Item erkennt
    item.setId = entry.setId || null; // Set-Teile der Set-Dungeons (siehe data/sets.js)
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

    // Namenszusatz ("des Bären") als Nummer merken, damit der Name in jeder Sprache neu gebaut werden kann
    const suffixIndex = fixedName || rarityId === 'common' || rarityId === 'poor' || rarityId === 'legendary'
      ? null
      : Math.floor(this.random.next() * ITEM_SUFFIXES.length);
    const name = fixedName || buildItemName(template, rarityId, suffixIndex);
    const resistances = this.rollResistances(rarity, fixedResistance);
    const item = new Item(itemId, template.id, rarityId, name, stats, itemLevel, resistances);
    item.suffixIndex = suffixIndex;
    return item;
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

  // Eine zufällige Item-Vorlage, gewichtet mit dropWeight (siehe items.js, ohne Angabe 1).
  // slots = freiwillig: nur Vorlagen dieser Plätze (z.B. ['weapon', 'ring'] für legendäre Raid-Beute)
  pickTemplate(slots = null) {
    const weights = {};
    for (const template of ITEM_TEMPLATES) {
      if (slots && !slots.includes(template.slot)) {
        continue;
      }
      weights[template.id] = template.dropWeight || 1;
    }
    return getItemTemplate(this.random.pickWeighted(weights));
  }

  // Eine zufällige Vorlage für ein Kisten-Item. Waffen und Schilde passen meist zum eigenen Kader:
  // Mit der Chance BALANCING.ownClassWeaponChance wird eine Waffe gegen eine getauscht, die ein eigener Held tragen darf.
  // Rüstung und Ringe bleiben ganz zufällig.
  pickTemplateForGuild(guild) {
    const template = this.pickTemplate();
    if (template.slot !== 'weapon' && template.slot !== 'offhand') {
      return template;
    }
    if (this.random.next() >= BALANCING.ownClassWeaponChance) {
      return template;
    }
    // Welche Waffen dürfen die eigenen Helden tragen? (gleicher Platz wie die gewürfelte)
    const usable = new Set();
    for (const hero of guild.heroes) {
      for (const templateId of hero.getClass().weapons) {
        if (getItemTemplate(templateId).slot === template.slot) {
          usable.add(templateId);
        }
      }
    }
    if (usable.size === 0 || usable.has(template.id)) {
      return template;
    }
    return getItemTemplate(this.random.pick([...usable]));
  }
}
