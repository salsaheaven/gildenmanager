// ============================================================
// HERO – ein Held der Gilde (oder ein Bewerber in der Taverne)
// Kennt seine Klasse, Seltenheit, Eigenschaften, sein Level und seine Ausrüstung
// und rechnet daraus seine fertigen Werte aus.
// ============================================================

import { Item } from './Item.js';
import { getHeroClass } from '../data/heroClasses.js';
import { getHeroRarity } from '../data/heroRarities.js';
import { getRarity, getRarityRank } from '../data/rarities.js';
import { getTrait } from '../data/traits.js';
import { SLOT_NAMES } from '../data/items.js';
import { getOrdersForClass } from '../data/heroOrders.js';

// Alle Ausrüstungsplätze, z.B. ['weapon', 'offhand', 'head', …]
export const EQUIPMENT_SLOTS = Object.keys(SLOT_NAMES);

export class Hero {
  // id       = eindeutige Nummer
  // name     = z.B. "Brakka Eisenhand"
  // classId  = Klasse (data/heroClasses.js)
  // rarityId = Seltenheit des Helden (data/heroRarities.js)
  // traitIds = Liste der Eigenschaften (data/traits.js)
  // looks    = Aussehen: { skin: Farbe, hair: Farbe }
  constructor(id, name, classId, rarityId, traitIds, looks) {
    this.id = id;
    this.name = name;
    this.classId = classId;
    this.rarityId = rarityId;
    this.traitIds = traitIds;
    this.looks = looks;
    this.level = 1;
    this.xp = 0;

    // Anweisungen für den Kampf: Anweisungs-id → gewählte Option (siehe data/heroOrders.js).
    // Fehlt eine Anweisung, gilt die Standard-Option.
    this.orders = {};

    // Ausrüstung: pro Platz ein Item oder null (leer)
    this.equipment = {};
    for (const slot of EQUIPMENT_SLOTS) {
      this.equipment[slot] = null;
    }
  }

  getClass() {
    return getHeroClass(this.classId);
  }

  // Name und Farbe der Seltenheit (z.B. "Episch", lila)
  getRarity() {
    return getRarity(this.rarityId);
  }

  getRarityRank() {
    return getRarityRank(this.rarityId);
  }

  getTraits() {
    return this.traitIds.map((traitId) => getTrait(traitId));
  }

  getHireCost() {
    return getHeroRarity(this.rarityId).hireCost;
  }

  // ---------- Werte ----------

  // Werte ohne Ausrüstung: Grundwerte der Klasse + Wachstum pro Level,
  // beides verstärkt durch die Seltenheit des Helden
  getBaseStats() {
    const heroClass = this.getClass();
    const heroRarity = getHeroRarity(this.rarityId);
    const stats = {};
    for (const statName in heroClass.baseStats) {
      const base = heroClass.baseStats[statName] * heroRarity.statMultiplier;
      const growth = heroClass.growth[statName] * heroRarity.growthMultiplier * (this.level - 1);
      stats[statName] = base + growth;
    }
    return stats;
  }

  // Fertige Werte: Grundwerte + Ausrüstung, danach Prozent-Boni der Eigenschaften
  getStats() {
    const stats = this.getBaseStats();

    for (const slot of EQUIPMENT_SLOTS) {
      const item = this.equipment[slot];
      if (item) {
        for (const statName in item.stats) {
          stats[statName] = (stats[statName] || 0) + item.stats[statName];
        }
      }
    }

    for (const trait of this.getTraits()) {
      for (const statName in trait.statBonus) {
        stats[statName] = stats[statName] * (1 + trait.statBonus[statName]);
      }
    }

    for (const statName in stats) {
      stats[statName] = Math.round(stats[statName]);
    }
    return stats;
  }

  // Ausrüstungswert: Summe der Stärke aller angelegten Items (wie die "Itemstufe" im MMO)
  getGearScore() {
    let score = 0;
    for (const slot of EQUIPMENT_SLOTS) {
      const item = this.equipment[slot];
      if (item) {
        score += item.getPower();
      }
    }
    return score;
  }

  // ---------- Ausrüstung ----------

  // Darf der Held dieses Item tragen?
  // Waffen und Nebenhand hängen von der Klasse ab, alles andere darf jeder.
  canEquip(item) {
    const slot = item.getSlot();
    if (slot === 'weapon' || slot === 'offhand') {
      return this.getClass().weapons.includes(item.templateId);
    }
    return true;
  }

  // Legt ein Item an. Gibt das Item zurück, das vorher im Platz war (oder null).
  equip(item) {
    const slot = item.getSlot();
    const previousItem = this.equipment[slot];
    this.equipment[slot] = item;
    return previousItem;
  }

  // Nimmt das Item aus einem Platz ab und gibt es zurück (oder null, wenn leer)
  unequip(slot) {
    const item = this.equipment[slot];
    this.equipment[slot] = null;
    return item;
  }

  // Wie viel stärker (+) oder schwächer (−) wäre der Held mit diesem Item im Vergleich zum jetzigen?
  getUpgradeValue(item) {
    const current = this.equipment[item.getSlot()];
    const currentPower = current ? current.getPower() : 0;
    return item.getPower() - currentPower;
  }

  // ---------- Anweisungen ----------

  // Welche Option ist bei dieser Anweisung gewählt? (sonst die erste = Standard)
  getChosenOption(order) {
    const chosenId = this.orders[order.id];
    const chosen = order.options.find((option) => option.id === chosenId);
    return chosen || order.options[0];
  }

  setOrder(orderId, optionId) {
    this.orders[orderId] = optionId;
  }

  // Fasst alle gewählten Optionen zu einem Paket für die Kampf-KI zusammen
  getOrderSettings() {
    const settings = { abilityWhen: {} };
    for (const order of getOrdersForClass(this.classId)) {
      const effects = this.getChosenOption(order).effects;
      for (const key in effects) {
        if (key === 'abilityWhen') {
          Object.assign(settings.abilityWhen, effects.abilityWhen);
        } else {
          settings[key] = effects[key];
        }
      }
    }
    return settings;
  }

  // ---------- Speichern ----------

  toSaveData() {
    const equipment = {};
    for (const slot of EQUIPMENT_SLOTS) {
      const item = this.equipment[slot];
      equipment[slot] = item ? item.toSaveData() : null;
    }
    return {
      id: this.id,
      name: this.name,
      classId: this.classId,
      rarityId: this.rarityId,
      traitIds: this.traitIds,
      looks: this.looks,
      level: this.level,
      xp: this.xp,
      equipment: equipment,
      orders: this.orders,
    };
  }

  static fromSaveData(data) {
    const hero = new Hero(data.id, data.name, data.classId, data.rarityId, data.traitIds, data.looks);
    hero.level = data.level;
    hero.xp = data.xp;
    hero.orders = data.orders || {};
    for (const slot of EQUIPMENT_SLOTS) {
      const itemData = data.equipment[slot];
      hero.equipment[slot] = itemData ? Item.fromSaveData(itemData) : null;
    }
    return hero;
  }
}
