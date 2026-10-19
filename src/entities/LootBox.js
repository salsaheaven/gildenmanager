// ============================================================
// LOOTBOX – eine ungeöffnete Kiste
// Was in einer Kistenart steckt (Preis, Chancen …), steht in data/lootBoxes.js.
// Das eigentliche Auswürfeln übernimmt das LootSystem.
// ============================================================

import { getLootBoxType } from '../data/lootBoxes.js';

export class LootBox {
  constructor(typeId) {
    this.typeId = typeId; // z.B. 'wood' oder 'gold'
  }

  getType() {
    return getLootBoxType(this.typeId);
  }

  getName() {
    return this.getType().name;
  }

  // Öffnet die Kiste und gibt die Items zurück (das seltenste zuletzt).
  open(lootSystem, guild) {
    return lootSystem.rollBoxContents(this.getType(), guild);
  }

  toSaveData() {
    return { typeId: this.typeId };
  }

  static fromSaveData(data) {
    return new LootBox(data.typeId);
  }
}
