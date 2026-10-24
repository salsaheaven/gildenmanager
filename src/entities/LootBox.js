// ============================================================
// LOOTBOX – eine ungeöffnete Kiste
// Was in einer Kistenart steckt (Preis, Chancen …), steht in data/lootBoxes.js.
// Das eigentliche Auswürfeln übernimmt das LootSystem.
// ============================================================

import { getLootBoxType } from '../data/lootBoxes.js';

export class LootBox {
  // itemLevel  = Item-Level der Items darin (Boss-Kisten: Stufe des Dungeons)
  // bonusItems = zusätzliche Items über die normale Anzahl hinaus (z.B. durch einen Glückspilz)
  constructor(typeId, itemLevel = 1, bonusItems = 0) {
    this.typeId = typeId; // z.B. 'wood' oder 'gold'
    this.itemLevel = itemLevel;
    this.bonusItems = bonusItems;
  }

  getType() {
    return getLootBoxType(this.typeId);
  }

  getName() {
    return this.getType().name;
  }

  // Öffnet die Kiste und gibt die Items zurück (das seltenste zuletzt).
  open(lootSystem, guild) {
    return lootSystem.rollBoxContents(this.getType(), guild, this.itemLevel, this.bonusItems);
  }

  toSaveData() {
    return { typeId: this.typeId, itemLevel: this.itemLevel, bonusItems: this.bonusItems };
  }

  static fromSaveData(data) {
    return new LootBox(data.typeId, data.itemLevel, data.bonusItems);
  }
}
