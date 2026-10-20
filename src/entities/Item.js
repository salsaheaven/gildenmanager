// ============================================================
// ITEM – ein einzelner Gegenstand (Waffe, Rüstung, Ring …)
// ============================================================

import { getRarity, getRarityRank } from '../data/rarities.js';
import { getItemTemplate, STAT_POWER_WEIGHTS } from '../data/items.js';
import { getItemLevelFactor } from '../data/scaling.js';

export class Item {
  // id         = eindeutige Nummer dieses Items
  // templateId = aus welcher Vorlage (data/items.js) es stammt
  // rarityId   = Seltenheit (data/rarities.js)
  // name       = fertiger Name, z.B. "Schwert des Bären"
  // stats      = fertige Werte, z.B. { attack: 9 }
  // itemLevel  = Item-Level: Stufe des Dungeons, aus dem es stammt (siehe data/scaling.js)
  constructor(id, templateId, rarityId, name, stats, itemLevel = 1) {
    this.id = id;
    this.templateId = templateId;
    this.rarityId = rarityId;
    this.name = name;
    this.stats = stats;
    this.itemLevel = itemLevel;
  }

  getTemplate() {
    return getItemTemplate(this.templateId);
  }

  getRarity() {
    return getRarity(this.rarityId);
  }

  // 0 = Schrott … 5 = Legendär
  getRarityRank() {
    return getRarityRank(this.rarityId);
  }

  getSlot() {
    return this.getTemplate().slot;
  }

  getSprite() {
    return this.getTemplate().sprite;
  }

  // Gesamtstärke: Summe aller Werte (gewichtet, siehe STAT_POWER_WEIGHTS).
  // Praktisch zum Vergleichen von Items.
  getPower() {
    let power = 0;
    for (const statName in this.stats) {
      power += this.stats[statName] * STAT_POWER_WEIGHTS[statName];
    }
    return Math.round(power);
  }

  getSellValue() {
    return this.getRarity().sellValue;
  }

  toSaveData() {
    return {
      id: this.id,
      templateId: this.templateId,
      rarityId: this.rarityId,
      name: this.name,
      stats: this.stats,
      itemLevel: this.itemLevel,
    };
  }

  static fromSaveData(data) {
    // Items aus alten Spielständen (vor dem Item-Level) waren viel stärker.
    // Sie werden auf die neuen Werte von Item-Level 1 umgerechnet.
    if (data.itemLevel === undefined) {
      const stats = {};
      for (const statName in data.stats) {
        stats[statName] = Math.max(1, Math.round(data.stats[statName] * getItemLevelFactor(1)));
      }
      return new Item(data.id, data.templateId, data.rarityId, data.name, stats, 1);
    }
    return new Item(data.id, data.templateId, data.rarityId, data.name, data.stats, data.itemLevel);
  }
}
