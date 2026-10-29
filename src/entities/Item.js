// ============================================================
// ITEM – ein einzelner Gegenstand (Waffe, Rüstung, Ring …)
// ============================================================

import { getRarity, getRarityRank } from '../data/rarities.js';
import { getItemTemplate, getTemplateColors, STAT_POWER_WEIGHTS } from '../data/items.js';

export class Item {
  // id         = eindeutige Nummer dieses Items
  // templateId = aus welcher Vorlage (data/items.js) es stammt
  // rarityId   = Seltenheit (data/rarities.js)
  // name       = fertiger Name, z.B. "Schwert des Bären"
  // stats      = fertige Werte, z.B. { attack: 9 }
  // itemLevel  = Item-Level: Stufe des Dungeons, aus dem es stammt (siehe data/scaling.js)
  // resistances = Resistenzen gegen Schadensarten in Prozent, z.B. { acid: 10 } (siehe data/damageTypes.js)
  constructor(id, templateId, rarityId, name, stats, itemLevel = 1, resistances = {}) {
    this.id = id;
    this.templateId = templateId;
    this.rarityId = rarityId;
    this.name = name;
    this.stats = stats;
    this.itemLevel = itemLevel;
    this.resistances = resistances;
    this.bossItemId = null; // Boss-Items: feste Kennung aus lootBoxes.js (für das Sammelbuch), sonst null
    // Nur direkt nach dem Öffnen einer Kiste, wird nicht gespeichert (siehe Game.openBox):
    this.collectionStatus = null; // 'new' / 'improved' / null: was das Item im Sammelbuch bewirkt hat
    this.completedPage = null;    // Sammelbuch-Seite, die durch dieses Item gerade voll wurde
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

  // Farben, die im Pixelbild ersetzt werden (z.B. Leder braun, Stoff violett)
  getSpriteColors() {
    return getTemplateColors(this.getTemplate());
  }

  // Gesamtstärke: Summe aller Werte (gewichtet, siehe STAT_POWER_WEIGHTS).
  // usefulStats = freiwillig: nur diese Werte zählen (z.B. die Werte, die einer Klasse etwas bringen)
  getPower(usefulStats = null) {
    let power = 0;
    for (const statName in this.stats) {
      if (usefulStats === null || usefulStats.includes(statName)) {
        power += this.stats[statName] * STAT_POWER_WEIGHTS[statName];
      }
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
      resistances: this.resistances,
      bossItemId: this.bossItemId,
    };
  }

  static fromSaveData(data) {
    const item = new Item(data.id, data.templateId, data.rarityId, data.name, data.stats, data.itemLevel, data.resistances);
    item.bossItemId = data.bossItemId;
    return item;
  }
}
