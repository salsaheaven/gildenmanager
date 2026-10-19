// ============================================================
// ITEM – ein einzelner Gegenstand (Waffe, Rüstung, Ring …)
// ============================================================

import { getRarity, getRarityRank } from '../data/rarities.js';
import { getItemTemplate, STAT_POWER_WEIGHTS } from '../data/items.js';

export class Item {
  // id         = eindeutige Nummer dieses Items
  // templateId = aus welcher Vorlage (data/items.js) es stammt
  // rarityId   = Seltenheit (data/rarities.js)
  // name       = fertiger Name, z.B. "Schwert des Bären"
  // stats      = fertige Werte, z.B. { attack: 9 }
  constructor(id, templateId, rarityId, name, stats) {
    this.id = id;
    this.templateId = templateId;
    this.rarityId = rarityId;
    this.name = name;
    this.stats = stats;
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
    };
  }

  static fromSaveData(data) {
    return new Item(data.id, data.templateId, data.rarityId, data.name, data.stats);
  }
}
