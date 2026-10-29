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
import { combineOrderEffects } from '../systems/combat/OrderSettings.js';
import { getTalentRows, findTalent, TALENT_RULES } from '../data/talents.js';
import { getXpForNextLevel } from '../data/experience.js';
import { SCALING } from '../data/scaling.js';
import { MAX_RESISTANCE } from '../data/damageTypes.js';

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
    this.xp = 0;              // gesammelte EP auf dem aktuellen Level
    this.injuryDays = 0;      // > 0 = verletzt, noch so viele Tage (kann nicht in Dungeons)
    // Gewählte Tagesaufgabe, wenn er nicht kämpft (siehe data/heroTasks.js). Bleibt stehen, bis man sie ändert.
    // dungeonId nur beim Erkunden: welcher Dungeon erkundet wird
    this.task = { taskId: 'rest', dungeonId: null };
    // Gewählte Talente (Liste von Talent-ids, siehe data/talents.js)
    this.talentIds = [];

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

  // ---------- Erfahrung & Verletzung ----------

  isMaxLevel() {
    return this.level >= SCALING.maxLevel;
  }

  // EP, die für das nächste Level nötig sind
  getXpForNextLevel() {
    return getXpForNextLevel(this.level);
  }

  // 0 bis 1: Fortschritt zum nächsten Level (für den Balken)
  getXpProgress() {
    if (this.isMaxLevel()) {
      return 1;
    }
    return this.xp / this.getXpForNextLevel();
  }

  // Gibt EP. Reichen sie, steigt der Held auf (auch mehrere Level auf einmal).
  // Gibt zurück, wie viele Level er aufgestiegen ist.
  addXp(amount) {
    let levelsGained = 0;
    this.xp += amount;
    while (!this.isMaxLevel() && this.xp >= this.getXpForNextLevel()) {
      this.xp -= this.getXpForNextLevel();
      this.level++;
      levelsGained++;
    }
    // Auf dem Höchstlevel sammelt man keine EP mehr
    if (this.isMaxLevel()) {
      this.xp = 0;
    }
    return levelsGained;
  }

  isInjured() {
    return this.injuryDays > 0;
  }

  // Ein Tag Heilung (am Ende jedes Tages). Gibt true zurück, wenn der Held gerade wieder fit geworden ist.
  healOneDay() {
    if (!this.isInjured()) {
      return false;
    }
    this.injuryDays--;
    return this.injuryDays === 0;
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
        score += this.getItemPower(item);
      }
    }
    return score;
  }

  // Resistenzen aus allen angelegten Items zusammengezählt, höchstens MAX_RESISTANCE pro Schadensart.
  // Ergebnis z.B. { acid: 18, shadow: 5 }
  getResistances() {
    const resistances = {};
    for (const slot of EQUIPMENT_SLOTS) {
      const item = this.equipment[slot];
      if (!item) {
        continue;
      }
      for (const damageTypeId in item.resistances) {
        const total = (resistances[damageTypeId] || 0) + item.resistances[damageTypeId];
        resistances[damageTypeId] = Math.min(MAX_RESISTANCE, total);
      }
    }
    return resistances;
  }

  // Stärke eines Items für diesen Helden: Es zählen nur Werte, die seiner Klasse etwas bringen
  // (usefulStats in heroClasses.js). Ein Zauberring ist für den Krieger also nichts wert.
  getItemPower(item) {
    return item.getPower(this.getClass().usefulStats);
  }

  // ---------- Ausrüstung ----------

  // Darf der Held das Item tragen? Waffen nur aus der Liste seiner Klasse,
  // Rüstung nur in der Rüstungsart seiner Klasse, Ringe immer.
  canEquip(item) {
    const slot = item.getSlot();
    if (slot === 'weapon' || slot === 'offhand') {
      return this.getClass().weapons.includes(item.templateId);
    }
    const armorType = item.getTemplate().armorType;
    if (armorType) {
      return this.getClass().armorType === armorType;
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
    const currentPower = current ? this.getItemPower(current) : 0;
    return this.getItemPower(item) - currentPower;
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

  // Fasst alle gewählten Anweisungen und Talente zu einem Paket für den Kampf zusammen (siehe combat/OrderSettings.js)
  getOrderSettings() {
    const effectsList = getOrdersForClass(this.classId).map((order) => this.getChosenOption(order).effects);
    const talents = this.talentIds.map((talentId) => findTalent(talentId));
    for (const talent of talents) {
      effectsList.push(talent.effects);
    }
    const settings = combineOrderEffects(effectsList);
    // Auren für die ganze Gruppe behalten ihre Talent-id, damit sie in einer Gruppe nur einmal zählen
    for (const talent of talents) {
      if (talent.effects.groupAura) {
        settings.groupAuras.push({ id: talent.id, ...talent.effects.groupAura });
      }
    }
    return settings;
  }

  // ---------- Talente (siehe data/talents.js) ----------

  // Ist die Talentreihe (0, 1 oder 2) für sein Level schon frei?
  isTalentRowUnlocked(rowIndex) {
    return this.level >= TALENT_RULES.rowLevels[rowIndex];
  }

  // Wie viele Talente darf er in dieser Reihe nehmen? (2 bei Doppelwahl, sonst 1; 0, wenn noch gesperrt)
  getTalentPicksAllowed(rowIndex) {
    if (!this.isTalentRowUnlocked(rowIndex)) {
      return 0;
    }
    return rowIndex < TALENT_RULES.doubleRowsByRarity[this.rarityId] ? 2 : 1;
  }

  // Welche Talente hat er in dieser Reihe gewählt?
  getTalentsInRow(rowIndex) {
    const row = getTalentRows(this.classId)[rowIndex] || [];
    return row.filter((talent) => this.talentIds.includes(talent.id));
  }

  // Kann er dieses Talent jetzt wählen? (eigene Klasse, Reihe frei, noch Platz in der Reihe, noch nicht gewählt)
  canChooseTalent(talentId) {
    const rows = getTalentRows(this.classId);
    const rowIndex = rows.findIndex((row) => row.some((talent) => talent.id === talentId));
    if (rowIndex === -1 || this.talentIds.includes(talentId)) {
      return false;
    }
    return this.getTalentsInRow(rowIndex).length < this.getTalentPicksAllowed(rowIndex);
  }

  chooseTalent(talentId) {
    if (!this.canChooseTalent(talentId)) {
      return false;
    }
    this.talentIds.push(talentId);
    return true;
  }

  // Wie viele Talent-Wahlen sind gerade noch offen? (für den Hinweis "Talent frei!")
  getFreeTalentPicks() {
    let free = 0;
    for (let rowIndex = 0; rowIndex < getTalentRows(this.classId).length; rowIndex++) {
      free += this.getTalentPicksAllowed(rowIndex) - this.getTalentsInRow(rowIndex).length;
    }
    return free;
  }

  // Was kostet Umskillen? (Gold pro Level)
  getRespecCost() {
    return TALENT_RULES.respecCostPerLevel * this.level;
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
      injuryDays: this.injuryDays,
      equipment: equipment,
      orders: this.orders,
      task: this.task,
      talentIds: this.talentIds,
    };
  }

  static fromSaveData(data) {
    const hero = new Hero(data.id, data.name, data.classId, data.rarityId, data.traitIds, data.looks);
    hero.level = data.level;
    hero.xp = data.xp;
    hero.injuryDays = data.injuryDays || 0;
    // Alte Spielstände (Echtzeit) zählten die Verletzung in Spielsekunden: noch verletzt = 1 Tag
    if (data.injuryDays === undefined && data.injurySeconds > 0) {
      hero.injuryDays = 1;
    }
    hero.orders = data.orders || {};
    hero.task = data.task;
    hero.talentIds = data.talentIds;
    for (const slot of EQUIPMENT_SLOTS) {
      const itemData = data.equipment[slot];
      hero.equipment[slot] = itemData ? Item.fromSaveData(itemData) : null;
    }
    return hero;
  }
}
