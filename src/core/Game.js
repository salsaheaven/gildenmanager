// ============================================================
// GAME – das Herz des Spiels
// Hält alle Teile zusammen (Tag, Gilde, Systeme) und bietet die Aktionen an,
// die die Oberfläche auslösen kann (Kiste kaufen, öffnen, Item verkaufen, Tag beenden …).
//
// Das Spiel ist rundenbasiert: 1 Runde = 1 Tag. Jeder Held hat pro Tag eine Aufgabe
// (zurzeit: Dungeon oder Ausruhen). Erst bei "Tag beenden" (endDay) wird alles ausgekämpft.
//
// Ereignisse (Events): Die Oberfläche kann mit game.on('name', funktion) zuhören.
//   'changed'              → irgendetwas am Spielstand hat sich geändert
//   'candidatesRefreshed'  → neue Bewerber in der Taverne (Daten: Liste der Bewerber)
//   'expeditionFinished'   → ein Dungeon-Run ist ausgekämpft (Daten: der Bericht, siehe finishExpedition)
//   'dayEnding'            → gleich wird der Tag ausgewertet (z.B. um Level-Up-Banner zurückzuhalten)
//   'dayEnded'             → ein Tag ist vorbei (Daten: { day, reports })
//   'heroLevelUp'          → ein Held ist aufgestiegen (Daten: { hero, newLevel })
//   'heroHealed'           → ein verletzter Held ist wieder fit (Daten: der Held)
// ============================================================

import { Random } from './Random.js';
import { Guild } from '../entities/Guild.js';
import { LootSystem } from '../systems/LootSystem.js';
import { RecruitmentSystem } from '../systems/RecruitmentSystem.js';
import { BALANCING } from '../data/balancing.js';
import { getLootBoxType } from '../data/lootBoxes.js';
import { getDungeon } from '../data/dungeons.js';
import { Expedition } from '../entities/Expedition.js';
import { applyRunResults } from '../systems/ExperienceSystem.js';
import { getGroupGoldBonus, getGroupExtraChestItems } from '../systems/TraitEffects.js';

export class Game {
  constructor(seed = Date.now()) {
    this.day = 1;            // der aktuelle Tag (beginnt bei 1). Zählt auch für die Endwertung.
    this.random = new Random(seed);
    this.guild = new Guild();
    this.lootSystem = new LootSystem(this.random);
    this.recruitmentSystem = new RecruitmentSystem(this.random);
    this.listeners = {};

    this.recruitmentSystem.refreshCandidates(this.guild);
  }

  // ---------- Ereignisse ----------

  on(eventName, callback) {
    if (!this.listeners[eventName]) {
      this.listeners[eventName] = [];
    }
    this.listeners[eventName].push(callback);
  }

  emit(eventName, data) {
    const callbacks = this.listeners[eventName] || [];
    for (const callback of callbacks) {
      callback(data);
    }
  }

  // ---------- Runden (1 Runde = 1 Tag) ----------

  // Beendet den Tag: Alle geplanten Runs werden ausgekämpft, Verletzte heilen,
  // es kommen neue Bewerber, und der nächste Tag beginnt.
  // Gibt die Berichte der heutigen Runs zurück (in der Reihenfolge, in der sie geplant wurden).
  endDay() {
    const endedDay = this.day;
    this.emit('dayEnding');

    // 1. Wer schon verletzt war, heilt einen Tag lang.
    //    (Zuerst, damit Helden, die heute fallen, morgen noch verletzt sind.)
    for (const hero of this.guild.heroes) {
      if (hero.healOneDay()) {
        this.emit('heroHealed', hero);
      }
    }

    // 2. Alle Runs von heute auskämpfen
    const reports = [];
    for (const expedition of this.guild.expeditions.slice()) {
      reports.push(this.finishExpedition(expedition));
    }

    // 3. Der nächste Tag beginnt: neue Bewerber in der Taverne
    this.day++;
    this.refreshCandidates();

    this.emit('dayEnded', { day: endedDay, reports: reports });
    this.emit('changed');
    return reports;
  }

  refreshCandidates() {
    const candidates = this.recruitmentSystem.refreshCandidates(this.guild);
    this.emit('candidatesRefreshed', candidates);
    this.emit('changed');
  }

  // ---------- Aktionen: Kisten & Items ----------

  buyBox(boxTypeId) {
    const boxType = getLootBoxType(boxTypeId);
    if (!this.guild.spendGold(boxType.price)) {
      return false;
    }
    this.guild.addBox(boxTypeId);
    this.emit('changed');
    return true;
  }

  // Öffnet eine Kiste. Gibt die Items zurück (seltenstes zuletzt) oder null, wenn keine da ist.
  openBox(boxTypeId) {
    const box = this.guild.takeBox(boxTypeId);
    if (!box) {
      return null;
    }
    const items = box.open(this.lootSystem, this.guild);
    this.emit('changed');
    return items;
  }

  // Verkauft ein Item. Gibt das erhaltene Gold zurück (0, wenn es das Item nicht gibt).
  sellItem(itemId) {
    const item = this.guild.removeItem(itemId);
    if (!item) {
      return 0;
    }
    const gold = item.getSellValue();
    this.guild.addGold(gold);
    this.emit('changed');
    return gold;
  }

  // Verkauft alle Items einer Seltenheit (z.B. allen Schrott). Gibt das Gold zurück.
  sellAllOfRarity(rarityId) {
    const toSell = this.guild.inventory.filter((item) => item.rarityId === rarityId);
    let gold = 0;
    for (const item of toSell) {
      this.guild.removeItem(item.id);
      gold += item.getSellValue();
    }
    this.guild.addGold(gold);
    this.emit('changed');
    return gold;
  }

  // ---------- Dungeons ----------

  // Ist der Dungeon freigeschaltet? (der erste immer, die anderen nach dem vorigen)
  isDungeonUnlocked(dungeonId) {
    const dungeon = getDungeon(dungeonId);
    return dungeon.unlockAfter === null || this.guild.getClears(dungeon.unlockAfter) > 0;
  }

  // Plant einen Run für heute. Ausgekämpft wird er erst bei "Tag beenden".
  // Gibt 'ok' oder einen Grund zurück:
  // 'locked' (Dungeon gesperrt), 'noHeroes', 'tooMany', 'busy' (ein Held ist heute schon eingeplant),
  // 'injured' (ein Held ist verletzt)
  startExpedition(dungeonId, heroIds, retreatRuleId) {
    if (!this.isDungeonUnlocked(dungeonId)) {
      return 'locked';
    }
    if (heroIds.length === 0) {
      return 'noHeroes';
    }
    if (heroIds.length > 5) {
      return 'tooMany';
    }
    for (const heroId of heroIds) {
      const hero = this.guild.findHero(heroId);
      if (!hero || this.guild.isHeroBusy(heroId)) {
        return 'busy';
      }
      if (hero.isInjured()) {
        return 'injured';
      }
    }

    const seed = Math.floor(this.random.next() * 2147483647);
    const expedition = new Expedition(this.guild.nextExpeditionId, dungeonId, heroIds.slice(), retreatRuleId, seed);
    this.guild.nextExpeditionId++;
    this.guild.expeditions.push(expedition);
    this.emit('changed');
    return 'ok';
  }

  // Nimmt einen geplanten Run wieder aus dem Tagesplan. Die Helden sind dann wieder frei.
  cancelExpedition(expeditionId) {
    const expedition = this.guild.findExpedition(expeditionId);
    if (!expedition) {
      return false;
    }
    this.guild.expeditions = this.guild.expeditions.filter((e) => e.id !== expeditionId);
    this.emit('changed');
    return true;
  }

  // Kämpft einen geplanten Run aus (beim Tagesende): Belohnung verteilen, Bericht schreiben.
  // Die Helden kämpfen so, wie sie jetzt ausgerüstet sind.
  finishExpedition(expedition) {
    const heroes = expedition.getHeroIds().map((heroId) => this.guild.findHero(heroId)).filter((hero) => hero);
    const result = expedition.resolve(heroes);
    const dungeon = getDungeon(expedition.dungeonId);
    const success = result.outcome === 'success';

    const report = {
      expeditionId: expedition.id,
      dungeonId: dungeon.id,
      outcome: result.outcome,
      day: this.day,
      heroNames: result.heroes.map((hero) => hero.name),
      fallenNames: result.heroes.filter((hero) => !hero.alive).map((hero) => hero.name),
      gold: 0,
      trashGold: 0,
      bonusGold: 0,         // Extra-Gold durch "Gierig"
      bonusGoldHero: null,  // wer es gebracht hat
      chest: null,
      chestBonusItems: 0,   // Extra-Items durch "Glückspilz"
      chestBonusHero: null,
      firstClear: false,
      expedition: expedition.toSaveData(), // zum erneuten Ansehen
    };

    this.guild.dungeonAttempts[dungeon.id] = this.guild.getAttempts(dungeon.id) + 1;

    // Kleines Gold für jede besiegte Trash-Gruppe, damit sich auch ein gescheiterter Run lohnt
    for (let i = 0; i < result.encounters.length; i++) {
      if (dungeon.encounters[i].type === 'trash' && result.encounters[i].outcome === 'victory') {
        report.trashGold += dungeon.rewards.trashGold || 0;
      }
    }
    this.guild.addGold(report.trashGold);
    if (success) {
      report.gold = dungeon.rewards.gold;
      report.chest = dungeon.rewards.chest;
      report.firstClear = this.guild.getClears(dungeon.id) === 0;
      this.guild.addGold(dungeon.rewards.gold);
      // Ein Glückspilz in der Gruppe legt ein Item mehr in die Kiste
      const extraItems = getGroupExtraChestItems(heroes);
      report.chestBonusItems = extraItems.bonus;
      report.chestBonusHero = extraItems.heroName;
      this.guild.addBox(dungeon.rewards.chest, dungeon.level, extraItems.bonus); // Items in der Stufe des Dungeons
      this.guild.dungeonClears[dungeon.id] = this.guild.getClears(dungeon.id) + 1;
    }

    // Ein Gieriger in der Gruppe holt mehr Gold heraus (auf Boss- und Trash-Gold)
    const goldBonus = getGroupGoldBonus(heroes);
    report.bonusGold = Math.round((report.gold + report.trashGold) * goldBonus.bonus);
    report.bonusGoldHero = report.bonusGold > 0 ? goldBonus.heroName : null;
    this.guild.addGold(report.bonusGold);

    // Erfahrung für alle gewonnenen Begegnungen, Verletzungen für Gefallene
    report.heroResults = applyRunResults(this.guild, result, dungeon);

    this.guild.expeditions = this.guild.expeditions.filter((e) => e.id !== expedition.id);
    this.guild.reports.unshift(report);
    this.guild.reports = this.guild.reports.slice(0, BALANCING.keptReports);

    this.emit('expeditionFinished', report);
    for (const heroResult of report.heroResults) {
      if (heroResult.levelsGained > 0) {
        this.emit('heroLevelUp', { hero: this.guild.findHero(heroResult.heroId), newLevel: heroResult.newLevel });
      }
    }
    this.emit('changed');
    return report;
  }

  // ---------- Aktionen: Helden ----------

  // Sofort neue Bewerber rufen (kostet Gold)
  rerollCandidates() {
    if (!this.guild.spendGold(BALANCING.candidateRerollCost)) {
      return false;
    }
    this.refreshCandidates();
    return true;
  }

  // Heuert einen Bewerber an. Gibt einen Grund zurück, falls es nicht klappt:
  // 'ok', 'noRoom' (Gilde voll), 'noGold' oder 'notFound'
  hireHero(candidateId) {
    const candidate = this.guild.findCandidate(candidateId);
    if (!candidate) {
      return 'notFound';
    }
    if (!this.guild.hasRoomForHero()) {
      return 'noRoom';
    }
    if (!this.guild.spendGold(candidate.getHireCost())) {
      return 'noGold';
    }
    this.guild.candidates = this.guild.candidates.filter((c) => c.id !== candidateId);
    this.guild.heroes.push(candidate);
    this.emit('changed');
    return 'ok';
  }

  // Entlässt einen Helden. Seine Ausrüstung kommt zurück ins Inventar.
  dismissHero(heroId) {
    const hero = this.guild.findHero(heroId);
    if (!hero || this.guild.isHeroBusy(heroId)) {
      return false;
    }
    for (const slot in hero.equipment) {
      const item = hero.unequip(slot);
      if (item) {
        this.guild.addItem(item);
      }
    }
    this.guild.heroes = this.guild.heroes.filter((h) => h.id !== heroId);
    this.emit('changed');
    return true;
  }

  // Legt ein Item aus dem Inventar an. Das alte Item kommt zurück ins Inventar.
  equipItem(heroId, itemId) {
    const hero = this.guild.findHero(heroId);
    const item = this.guild.findItem(itemId);
    if (!hero || !item || !hero.canEquip(item)) {
      return false;
    }
    this.guild.removeItem(itemId);
    const previousItem = hero.equip(item);
    if (previousItem) {
      this.guild.addItem(previousItem);
    }
    this.emit('changed');
    return true;
  }

  // Legt für jeden Platz das beste passende Item aus dem Inventar an.
  // Gibt zurück, wie viele Items angelegt wurden.
  equipBestItems(heroId) {
    const hero = this.guild.findHero(heroId);
    if (!hero) {
      return 0;
    }
    let count = 0;
    for (const slot in hero.equipment) {
      let bestItem = null;
      let bestValue = 0;
      for (const item of this.guild.inventory) {
        if (item.getSlot() !== slot || !hero.canEquip(item)) {
          continue;
        }
        const value = hero.getUpgradeValue(item);
        if (value > bestValue) {
          bestValue = value;
          bestItem = item;
        }
      }
      if (bestItem) {
        this.equipItem(heroId, bestItem.id);
        count++;
      }
    }
    return count;
  }

  // Ändert eine Kampf-Anweisung eines Helden (siehe data/heroOrders.js)
  setHeroOrder(heroId, orderId, optionId) {
    const hero = this.guild.findHero(heroId);
    if (!hero) {
      return false;
    }
    hero.setOrder(orderId, optionId);
    this.emit('changed');
    return true;
  }

  // Nimmt ein Item ab und legt es ins Inventar
  unequipItem(heroId, slot) {
    const hero = this.guild.findHero(heroId);
    if (!hero) {
      return false;
    }
    const item = hero.unequip(slot);
    if (!item) {
      return false;
    }
    this.guild.addItem(item);
    this.emit('changed');
    return true;
  }

  // ---------- Speichern ----------

  toSaveData() {
    return {
      day: this.day,
      randomState: this.random.state,
      guild: this.guild.toSaveData(),
    };
  }

  static fromSaveData(data) {
    const game = new Game();
    game.day = data.day || getDayFromOldClock(data.clock);
    game.random.state = data.randomState;
    game.guild = Guild.fromSaveData(data.guild);
    // Alte Spielstände haben noch keine Bewerber
    if (game.guild.candidates.length === 0) {
      game.recruitmentSystem.refreshCandidates(game.guild);
    }
    return game;
  }
}

// Alte Spielstände (Echtzeit) hatten eine Spieluhr statt eines Tageszählers.
// 1 Spielsekunde war 1 Spielminute, ein Tag also 1440 Spielsekunden.
function getDayFromOldClock(clockData) {
  if (!clockData) {
    return 1;
  }
  return Math.floor(clockData.totalGameSeconds / 1440) + 1;
}
