// ============================================================
// GUILD – die Gilde des Spielers
// Hält Gold, Kisten, Inventar, Helden, Bewerber und Statistiken.
// (Später kommen hier Gebäude dazu.)
// ============================================================

import { RivalGuild } from './RivalGuild.js';
import { RIVAL_GUILDS } from '../data/rivalGuilds.js';
import { CollectionBook } from './CollectionBook.js';
import { Item } from './Item.js';
import { LootBox } from './LootBox.js';
import { Hero } from './Hero.js';
import { Expedition } from './Expedition.js';
import { GuildHall } from './GuildHall.js';
import { BALANCING } from '../data/balancing.js';

export class Guild {
  constructor() {
    this.name = 'Die Unbesiegbaren';
    this.founded = false; // false = Startbildschirm "Gründe deine Gilde" ist noch offen (siehe Game.foundGuild)
    this.gold = BALANCING.startGold;
    this.boxes = [];     // ungeöffnete Kisten (LootBox-Objekte)
    this.inventory = []; // Items (Item-Objekte)
    this.nextItemId = 1; // fortlaufende Nummer für neue Items
    this.heroes = [];     // Helden der Gilde (Hero-Objekte)
    this.candidates = []; // Bewerber in der Taverne (Hero-Objekte)
    this.nextHeroId = 1;  // fortlaufende Nummer für neue Helden

    // Dungeons
    this.expeditions = [];     // für heute geplante Runs (Expedition-Objekte)
    this.nextExpeditionId = 1;
    this.dungeonClears = {};   // Dungeon-id → wie oft geschafft
    this.dungeonAttempts = {}; // Dungeon-id → wie oft versucht (egal wie es ausging)
    this.reports = [];         // Berichte über abgeschlossene Runs (neueste zuerst)
    this.collection = new CollectionBook(); // Sammelbuch: welche Boss-Items schon gefunden wurden
    this.materials = { dust: 0, crystal: 0, raw: 0, herbs: 0 }; // Materiallager: Staub, Kristalle, Rohstoffe, Kräuter (siehe data/crafting.js)
    this.supplies = {};        // Vorratskammer: Verbrauchsgut-id → Anzahl (siehe data/consumables.js)
    this.dailyOffer = [];      // heutiges Tagesangebot des Händlers (Liste von Verbrauchsgut-ids)
    this.scoutedDungeons = {}; // erkundete Dungeons: Dungeon-id → wie viele Kampftage die Erkundung noch hält
    this.lastDayPlan = [];     // die Gruppen von gestern, für "Wie gestern": [{ dungeonId, heroIds, retreatRuleId, supplies }]
    this.hall = new GuildHall(); // Gildenhalle: Gebäude und Baustelle (siehe data/buildings.js)
    this.firstClearDays = {};  // Dungeon-id → Tag, an dem deine Gilde ihn zum ersten Mal geschafft hat (Rangliste)

    // KI-Gilden und Server (siehe data/rivalGuilds.js und systems/RivalSystem.js)
    this.rivals = RIVAL_GUILDS.map((rival) => new RivalGuild(rival.id));
    this.news = [];            // Neuigkeiten-Ticker, neueste zuerst: [{ day, text, color, kind, isPlayer }]
    this.serverFirsts = {};    // Dungeon-id → { name, day, isPlayer }: wer ihn als erste Gilde geschafft hat

    // Titel: verdiente Titel aus Server-Firsts (die aus dem Sammelbuch rechnet das Buch selbst aus)
    this.earnedTitles = [];
    this.selectedTitle = null; // gewählter Gildentitel (oder null = keiner), steht oben neben dem Namen

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

  // itemLevel = Item-Level der Items darin (1 = Anfang)
  addBox(boxTypeId, itemLevel = 1, bonusItems = 0) {
    this.boxes.push(new LootBox(boxTypeId, itemLevel, bonusItems));
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

  // Ein Held verlässt die Gilde: Seine Ausrüstung kommt ins Inventar.
  removeHero(heroId) {
    const hero = this.findHero(heroId);
    if (!hero) {
      return false;
    }
    for (const slot in hero.equipment) {
      const item = hero.unequip(slot);
      if (item) {
        this.addItem(item);
      }
    }
    this.heroes = this.heroes.filter((other) => other.id !== heroId);
    return true;
  }

  // Wie viele Helden passen in die Gilde? (Grundwert + Kaserne)
  getMaxHeroes() {
    return BALANCING.maxHeroes + this.hall.getEffect('extraHeroSlots', 0);
  }

  hasRoomForHero() {
    return this.heroes.length < this.getMaxHeroes();
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

  // Ist der Held heute schon für einen Dungeon eingeplant? (ein Held = eine Aufgabe pro Tag)
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

  // Ein Item im Inventar ODER angelegt bei einem Helden (oder null)
  findItemAnywhere(itemId) {
    const inInventory = this.findItem(itemId);
    if (inInventory) {
      return inInventory;
    }
    for (const hero of this.heroes) {
      for (const slot in hero.equipment) {
        if (hero.equipment[slot] && hero.equipment[slot].id === itemId) {
          return hero.equipment[slot];
        }
      }
    }
    return null;
  }

  // Legt Material ins Lager, z.B. addMaterials({ dust: 3, raw: 1 }). Fehlende Sorten zählen als 0.
  addMaterials(materials) {
    for (const materialId in this.materials) {
      this.materials[materialId] += materials[materialId] || 0;
    }
  }

  // Ist genug Material da? cost = z.B. { raw: 10, dust: 4 } (Gold zählt hier nicht)
  hasMaterials(cost) {
    for (const materialId in this.materials) {
      if (this.materials[materialId] < (cost[materialId] || 0)) {
        return false;
      }
    }
    return true;
  }

  // Nimmt Material aus dem Lager. Gibt false zurück (und nimmt nichts), wenn es nicht reicht.
  spendMaterials(cost) {
    if (!this.hasMaterials(cost)) {
      return false;
    }
    for (const materialId in this.materials) {
      this.materials[materialId] -= cost[materialId] || 0;
    }
    return true;
  }

  // ---------- Vorratskammer ----------

  countSupply(consumableId) {
    return this.supplies[consumableId] || 0;
  }

  addSupply(consumableId, amount = 1) {
    this.supplies[consumableId] = this.countSupply(consumableId) + amount;
  }

  // Nimmt eine Ware heraus. Gibt false zurück, wenn keine da ist.
  takeSupply(consumableId) {
    if (this.countSupply(consumableId) <= 0) {
      return false;
    }
    this.supplies[consumableId]--;
    if (this.supplies[consumableId] === 0) {
      delete this.supplies[consumableId];
    }
    return true;
  }

  toSaveData() {
    return {
      name: this.name,
      founded: this.founded,
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
      collection: this.collection.toSaveData(),
      materials: this.materials,
      supplies: this.supplies,
      dailyOffer: this.dailyOffer,
      scoutedDungeons: this.scoutedDungeons,
      lastDayPlan: this.lastDayPlan,
      firstClearDays: this.firstClearDays,
      hall: this.hall.toSaveData(),
      rivals: this.rivals.map((rival) => rival.toSaveData()),
      news: this.news,
      serverFirsts: this.serverFirsts,
      earnedTitles: this.earnedTitles,
      selectedTitle: this.selectedTitle,
    };
  }

  static fromSaveData(data) {
    const guild = new Guild();
    guild.name = data.name;
    guild.founded = data.founded;
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
    guild.collection = CollectionBook.fromSaveData(data.collection);
    guild.materials = data.materials;
    guild.supplies = data.supplies;
    guild.dailyOffer = data.dailyOffer;
    guild.scoutedDungeons = data.scoutedDungeons;
    guild.lastDayPlan = data.lastDayPlan;
    guild.firstClearDays = data.firstClearDays;
    guild.hall = GuildHall.fromSaveData(data.hall);
    guild.rivals = data.rivals.map((rivalData) => RivalGuild.fromSaveData(rivalData));
    guild.news = data.news;
    guild.serverFirsts = data.serverFirsts;
    guild.earnedTitles = data.earnedTitles;
    guild.selectedTitle = data.selectedTitle;
    return guild;
  }
}
