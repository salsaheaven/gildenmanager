// ============================================================
// GUILD – die Gilde des Spielers
// Hält Gold, Kisten, Inventar, Helden, Bewerber und Statistiken.
// (Später kommen hier Gebäude dazu.)
// ============================================================

import { Item } from './Item.js';
import { LootBox } from './LootBox.js';
import { Hero } from './Hero.js';
import { Expedition } from './Expedition.js';
import { BALANCING } from '../data/balancing.js';

export class Guild {
  constructor() {
    this.name = 'Die Unbesiegbaren';
    this.gold = BALANCING.startGold;
    this.boxes = [];     // ungeöffnete Kisten (LootBox-Objekte)
    this.inventory = []; // Items (Item-Objekte)
    this.nextItemId = 1; // fortlaufende Nummer für neue Items
    this.heroes = [];     // Helden der Gilde (Hero-Objekte)
    this.candidates = []; // Bewerber in der Taverne (Hero-Objekte)
    this.nextHeroId = 1;  // fortlaufende Nummer für neue Helden

    // Dungeons
    this.expeditions = [];     // laufende Runs (Expedition-Objekte)
    this.nextExpeditionId = 1;
    this.dungeonClears = {};   // Dungeon-id → wie oft geschafft
    this.dungeonAttempts = {}; // Dungeon-id → wie oft versucht (egal wie es ausging)
    this.reports = [];         // Berichte über abgeschlossene Runs (neueste zuerst)

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

  // ---------- Helden ----------

  createHeroId() {
    const id = this.nextHeroId;
    this.nextHeroId++;
    return id;
  }

  hasRoomForHero() {
    return this.heroes.length < BALANCING.maxHeroes;
  }

  findHero(heroId) {
    for (const hero of this.heroes) {
      if (hero.id === heroId) {
        return hero;
      }
    }
    return null;
  }

  findCandidate(heroId) {
    for (const candidate of this.candidates) {
      if (candidate.id === heroId) {
        return candidate;
      }
    }
    return null;
  }

  // Sucht den Helden, für den dieses Item die größte Verbesserung wäre.
  // Gibt { hero, value } zurück oder null, wenn es für niemanden besser ist.
  findBestUpgrade(item) {
    let best = null;
    for (const hero of this.heroes) {
      if (!hero.canEquip(item)) {
        continue;
      }
      const value = hero.getUpgradeValue(item);
      if (value > 0 && (best === null || value > best.value)) {
        best = { hero: hero, value: value };
      }
    }
    return best;
  }

  // Ist der Held gerade in einem Dungeon unterwegs?
  isHeroBusy(heroId) {
    return this.expeditions.some((expedition) => expedition.getHeroIds().includes(heroId));
  }

  // ---------- Dungeons ----------

  getClears(dungeonId) {
    return this.dungeonClears[dungeonId] || 0;
  }

  getAttempts(dungeonId) {
    return this.dungeonAttempts[dungeonId] || 0;
  }

  findExpedition(expeditionId) {
    return this.expeditions.find((expedition) => expedition.id === expeditionId) || null;
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
      heroes: this.heroes.map((hero) => hero.toSaveData()),
      candidates: this.candidates.map((candidate) => candidate.toSaveData()),
      nextHeroId: this.nextHeroId,
      expeditions: this.expeditions.map((expedition) => expedition.toSaveData()),
      nextExpeditionId: this.nextExpeditionId,
      dungeonClears: this.dungeonClears,
      dungeonAttempts: this.dungeonAttempts,
      reports: this.reports,
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
    // "|| []" damit auch alte Spielstände ohne Helden geladen werden können
    guild.heroes = (data.heroes || []).map((heroData) => Hero.fromSaveData(heroData));
    guild.candidates = (data.candidates || []).map((heroData) => Hero.fromSaveData(heroData));
    guild.nextHeroId = data.nextHeroId || 1;
    guild.expeditions = (data.expeditions || []).map((expeditionData) => Expedition.fromSaveData(expeditionData));
    guild.nextExpeditionId = data.nextExpeditionId || 1;
    guild.dungeonClears = data.dungeonClears || {};
    guild.dungeonAttempts = data.dungeonAttempts || {};
    guild.reports = data.reports || [];
    return guild;
  }
}
