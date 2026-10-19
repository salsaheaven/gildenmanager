// ============================================================
// GUILD – die Gilde des Spielers
// Hält Gold, Kisten, Inventar und Statistiken.
// (Später kommen hier Helden und Gebäude dazu.)
// ============================================================

import { Item } from './Item.js';
import { LootBox } from './LootBox.js';
import { BALANCING } from '../data/balancing.js';

export class Guild {
  constructor() {
    this.name = 'Die Unbesiegbaren';
    this.gold = BALANCING.startGold;
    this.boxes = [];     // ungeöffnete Kisten (LootBox-Objekte)
    this.inventory = []; // Items (Item-Objekte)
    this.nextItemId = 1; // fortlaufende Nummer für neue Items

    // Pity-Zähler: Items seit dem letzten epischen oder legendären Item
    this.itemsSinceEpic = 0;

    // Statistiken für spätere Erfolge
    this.stats = {
      boxesOpened: 0,
      itemsFound: 0,
      legendariesFound: 0,
    };

    for (const boxTypeId of BALANCING.startBoxes) {
      this.addBox(boxTypeId);
    }
  }

  // ---------- Gold ----------

  canAfford(amount) {
    return this.gold >= amount;
  }

  addGold(amount) {
    this.gold += amount;
  }

  spendGold(amount) {
    if (!this.canAfford(amount)) {
      return false;
    }
    this.gold -= amount;
    return true;
  }

  // ---------- Kisten ----------

  addBox(boxTypeId) {
    this.boxes.push(new LootBox(boxTypeId));
  }

  // Nimmt eine Kiste dieser Art heraus (oder null, wenn keine da ist)
  takeBox(boxTypeId) {
    for (let i = 0; i < this.boxes.length; i++) {
      if (this.boxes[i].typeId === boxTypeId) {
        const box = this.boxes[i];
        this.boxes.splice(i, 1);
        return box;
      }
    }
    return null;
  }

  countBoxes(boxTypeId) {
    let count = 0;
    for (const box of this.boxes) {
      if (box.typeId === boxTypeId) {
        count++;
      }
    }
    return count;
  }

  // ---------- Inventar ----------

  // Gibt eine neue, eindeutige Item-Nummer zurück
  createItemId() {
    const id = this.nextItemId;
    this.nextItemId++;
    return id;
  }

  addItem(item) {
    this.inventory.push(item);
  }

  removeItem(itemId) {
    for (let i = 0; i < this.inventory.length; i++) {
      if (this.inventory[i].id === itemId) {
        const item = this.inventory[i];
        this.inventory.splice(i, 1);
        return item;
      }
    }
    return null;
  }

  findItem(itemId) {
    for (const item of this.inventory) {
      if (item.id === itemId) {
        return item;
      }
    }
    return null;
  }

  // ---------- Speichern ----------

  toSaveData() {
    return {
      name: this.name,
      gold: this.gold,
      boxes: this.boxes.map((box) => box.toSaveData()),
      inventory: this.inventory.map((item) => item.toSaveData()),
      nextItemId: this.nextItemId,
      itemsSinceEpic: this.itemsSinceEpic,
      stats: this.stats,
    };
  }

  static fromSaveData(data) {
    const guild = new Guild();
    guild.name = data.name;
    guild.gold = data.gold;
    guild.boxes = data.boxes.map((boxData) => LootBox.fromSaveData(boxData));
    guild.inventory = data.inventory.map((itemData) => Item.fromSaveData(itemData));
    guild.nextItemId = data.nextItemId;
    guild.itemsSinceEpic = data.itemsSinceEpic;
    guild.stats = data.stats;
    return guild;
  }
}
