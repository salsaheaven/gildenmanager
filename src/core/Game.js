// ============================================================
// GAME – das Herz des Spiels
// Hält alle Teile zusammen (Tag, Gilde, Systeme) und bietet die Aktionen an,
// die die Oberfläche auslösen kann (Kiste öffnen, Item verkaufen, Trank kaufen, Aufgaben verteilen, Tag beenden …).
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

import { getDayPlan } from '../systems/DayPlan.js';
import { HERO_TASKS } from '../data/heroTasks.js';
import { resolveHeroTasks, payWages, getDailyWages } from '../systems/HeroTaskSystem.js';
import { CONSUMABLES, DAILY_OFFER_COUNT, SUPPLY_SLOTS, getConsumable } from '../data/consumables.js';
import { needsDefeatAnalysis, analyzeRun } from '../systems/combat/DefeatAnalysis.js';
import { Random } from './Random.js';
import { Guild } from '../entities/Guild.js';
import { LootSystem } from '../systems/LootSystem.js';
import { RecruitmentSystem } from '../systems/RecruitmentSystem.js';
import { BALANCING } from '../data/balancing.js';
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
    this.refreshDailyOffer();
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

  // Beendet den Tag: Alle geplanten Runs werden ausgekämpft, die anderen Helden erledigen ihre Aufgaben,
  // Verletzte heilen, der Sold wird bezahlt, es kommen neue Bewerber, und der nächste Tag beginnt.
  // Gibt die Berichte der heutigen Runs zurück (in der Reihenfolge, in der sie geplant wurden).
  // Was die Aufgaben und der Sold ergeben haben, steht danach in this.lastDaySummary.
  endDay() {
    const endedDay = this.day;
    this.emit('dayEnding');

    // 0. Wer macht heute was? (vor allem anderen, damit Verletzte von heute nicht noch trainieren)
    const plan = getDayPlan(this.guild);
    const taskEntries = plan.entries.filter((entry) => entry.taskId !== 'dungeon' && entry.taskId !== 'injured');
    // Die Gruppen von heute für "Wie gestern" merken
    this.guild.lastDayPlan = this.guild.expeditions.map((expedition) => ({
      dungeonId: expedition.dungeonId,
      heroIds: expedition.getHeroIds().slice(),
      retreatRuleId: expedition.retreatRuleId,
      supplies: expedition.supplies.slice(),
    }));

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

    // 3. Aufgaben der anderen Helden (Training, Kräuter, Erkunden), danach der Sold für alle
    const taskResults = resolveHeroTasks(this.guild, taskEntries, this.random);
    for (const taskResult of taskResults) {
      if (taskResult.levelsGained > 0) {
        this.emit('heroLevelUp', { hero: this.guild.findHero(taskResult.heroId), newLevel: taskResult.newLevel });
      }
    }
    const wages = payWages(this.guild);
    this.lastDaySummary = { day: endedDay, tasks: taskResults, wages: wages };

    // 4. Der nächste Tag beginnt: neue Bewerber in der Taverne, neues Tagesangebot beim Händler
    this.day++;
    this.refreshCandidates();
    this.refreshDailyOffer();

    this.emit('dayEnded', { day: endedDay, reports: reports, summary: this.lastDaySummary });
    this.emit('changed');
    return reports;
  }

  refreshCandidates() {
    const candidates = this.recruitmentSystem.refreshCandidates(this.guild);
    this.emit('candidatesRefreshed', candidates);
    this.emit('changed');
  }

  // ---------- Aktionen: Händler & Vorräte (siehe data/consumables.js) ----------

  // Würfelt das Tagesangebot neu: DAILY_OFFER_COUNT verschiedene Waren mit stock 'daily'
  refreshDailyOffer() {
    const remaining = CONSUMABLES.filter((consumable) => consumable.stock === 'daily').map((consumable) => consumable.id);
    const offer = [];
    while (offer.length < DAILY_OFFER_COUNT && remaining.length > 0) {
      const picked = this.random.pick(remaining);
      offer.push(picked);
      remaining.splice(remaining.indexOf(picked), 1);
    }
    this.guild.dailyOffer = offer;
  }

  // Kann man diese Ware heute kaufen? (Grundware immer, sonst nur im Tagesangebot)
  isOnSale(consumableId) {
    const consumable = getConsumable(consumableId);
    return consumable.stock === 'always' || this.guild.dailyOffer.includes(consumableId);
  }

  // Kauft eine Ware in die Vorratskammer. Gibt true zurück, wenn es geklappt hat.
  buySupply(consumableId) {
    if (!this.isOnSale(consumableId)) {
      return false;
    }
    if (!this.guild.spendGold(getConsumable(consumableId).price)) {
      return false;
    }
    this.guild.addSupply(consumableId);
    this.emit('changed');
    return true;
  }

  // Benutzt Verbandszeug (oder eine andere Sofort-Ware) auf einem verletzten Helden
  useSupplyOnHero(consumableId, heroId) {
    const consumable = getConsumable(consumableId);
    const hero = this.guild.findHero(heroId);
    if (consumable.use !== 'instant' || !hero || !hero.isInjured() || this.guild.countSupply(consumableId) === 0) {
      return false;
    }
    this.guild.takeSupply(consumableId);
    hero.injuryDays = Math.max(0, hero.injuryDays - consumable.effects.injuryDays);
    this.emit('changed');
    return true;
  }

  // Ändert die Vorräte einer geplanten Gruppe. Die alten kommen zurück in die Vorratskammer,
  // die neuen werden herausgenommen. Gibt 'ok' oder einen Grund zurück.
  setExpeditionSupplies(expeditionId, supplyIds) {
    const expedition = this.guild.findExpedition(expeditionId);
    if (!expedition) {
      return 'notFound';
    }
    for (const supplyId of expedition.supplies) {
      this.guild.addSupply(supplyId);
    }
    expedition.supplies = [];
    const check = this.takeSuppliesForRun(supplyIds);
    if (check !== 'ok') {
      return check;
    }
    expedition.supplies = supplyIds.slice();
    this.emit('changed');
    return 'ok';
  }

  // Nimmt Vorräte für einen Run aus der Vorratskammer. Klappt es nicht ganz, wird nichts genommen.
  takeSuppliesForRun(supplyIds) {
    if (supplyIds.length > SUPPLY_SLOTS) {
      return 'tooManySupplies';
    }
    const needed = {};
    for (const supplyId of supplyIds) {
      if (getConsumable(supplyId).use !== 'run') {
        return 'notForRuns';
      }
      needed[supplyId] = (needed[supplyId] || 0) + 1;
    }
    for (const supplyId in needed) {
      if (this.guild.countSupply(supplyId) < needed[supplyId]) {
        return 'noSupplies';
      }
    }
    for (const supplyId of supplyIds) {
      this.guild.takeSupply(supplyId);
    }
    return 'ok';
  }

  // ---------- Aktionen: Kisten & Items ----------


  // Öffnet eine Kiste. Gibt die Items zurück (seltenstes zuletzt) oder null, wenn keine da ist.
  openBox(boxTypeId) {
    const box = this.guild.takeBox(boxTypeId);
    if (!box) {
      return null;
    }
    const items = box.open(this.lootSystem, this.guild);
    // Boss-Items ins Sammelbuch eintragen. Was neu oder besser ist, steht danach am Item (für die Anzeige).
    for (const item of items) {
      const entry = this.guild.collection.record(item);
      item.collectionStatus = entry.status;
      item.completedPage = entry.completedPage;
    }
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
  // supplyIds = mitgenommene Verbrauchsgüter (freiwillig, höchstens SUPPLY_SLOTS)
  startExpedition(dungeonId, heroIds, retreatRuleId, supplyIds = []) {
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

    const supplyCheck = this.takeSuppliesForRun(supplyIds);
    if (supplyCheck !== 'ok') {
      return supplyCheck;
    }

    const seed = Math.floor(this.random.next() * 2147483647);
    const expedition = new Expedition(this.guild.nextExpeditionId, dungeonId, heroIds.slice(), retreatRuleId, seed,
      supplyIds.slice());
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
    // Die Vorräte kommen zurück in die Vorratskammer
    for (const supplyId of expedition.supplies) {
      this.guild.addSupply(supplyId);
    }
    this.guild.expeditions = this.guild.expeditions.filter((e) => e.id !== expeditionId);
    this.emit('changed');
    return true;
  }

  // Kämpft einen geplanten Run aus (beim Tagesende): Belohnung verteilen, Bericht schreiben.
  // Die Helden kämpfen so, wie sie jetzt ausgerüstet sind.
  finishExpedition(expedition) {
    const heroes = expedition.getHeroIds().map((heroId) => this.guild.findHero(heroId)).filter((hero) => hero);
    // Erkundet? Dann ist dieser Run vorbereitet, und die Erkundung ist danach verbraucht
    expedition.scouted = this.guild.scoutedDungeons[expedition.dungeonId] === true;
    delete this.guild.scoutedDungeons[expedition.dungeonId];
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
      collectionGold: 0,    // Extra-Gold durch die volle Sammelbuch-Seite dieses Dungeons
      supplies: expedition.supplies.slice(), // verbrauchte Vorräte
      scouted: expedition.scouted,           // war der Dungeon erkundet?
      chest: null,
      chestBonusItems: 0,   // Extra-Items durch "Glückspilz"
      chestBonusHero: null,
      firstClear: false,
      // "Woran es lag": Top-Ursachen, Tipp und Hinweise (nur bei Niederlage oder Gefallenen, sonst null)
      analysis: needsDefeatAnalysis(result) ? analyzeRun(result) : null,
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

    // Volle Sammelbuch-Seite dieses Dungeons: mehr Gold (auf Boss- und Trash-Gold)
    report.collectionGold = Math.round((report.gold + report.trashGold) * this.guild.collection.getGoldBonus(dungeon.id));
    this.guild.addGold(report.collectionGold);

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

  // ---------- Aktionen: Tagesaufgaben (siehe data/heroTasks.js) ----------

  // Gibt einem Helden eine Aufgabe für die Tage, an denen er nicht kämpft.
  // dungeonId nur beim Erkunden (muss freigeschaltet sein). Gibt 'ok' oder einen Grund zurück.
  setHeroTask(heroId, taskId, dungeonId = null) {
    const hero = this.guild.findHero(heroId);
    if (!hero) {
      return 'notFound';
    }
    if (!HERO_TASKS[taskId] || !HERO_TASKS[taskId].choosable) {
      return 'notChoosable';
    }
    if (taskId === 'scouting' && (!dungeonId || !this.isDungeonUnlocked(dungeonId))) {
      return 'locked';
    }
    hero.task = { taskId: taskId, dungeonId: taskId === 'scouting' ? dungeonId : null };
    this.emit('changed');
    return 'ok';
  }

  // Ist dieser Dungeon für den nächsten Run erkundet?
  isDungeonScouted(dungeonId) {
    return this.guild.scoutedDungeons[dungeonId] === true;
  }

  // Sold, den die Gilde jeden Abend zahlt
  getDailyWages() {
    return getDailyWages(this.guild);
  }

  // "Wie gestern": plant die Gruppen von gestern noch einmal ein (gleicher Dungeon, gleiche Helden,
  // gleiche Rückzugsregel). Wer heute verletzt oder schon eingeplant ist, fehlt. Vorräte nur, soweit sie da sind.
  // Gibt die Anzahl der eingeplanten Gruppen zurück.
  repeatYesterday() {
    let planned = 0;
    for (const old of this.guild.lastDayPlan) {
      const heroIds = old.heroIds.filter((heroId) => {
        const hero = this.guild.findHero(heroId);
        return hero && !hero.isInjured() && !this.guild.isHeroBusy(heroId);
      });
      if (heroIds.length === 0 || !this.isDungeonUnlocked(old.dungeonId)) {
        continue;
      }
      const supplies = [];
      const taken = {};
      for (const supplyId of old.supplies) {
        taken[supplyId] = (taken[supplyId] || 0) + 1;
        if (taken[supplyId] <= this.guild.countSupply(supplyId)) {
          supplies.push(supplyId);
        }
      }
      if (this.startExpedition(old.dungeonId, heroIds, old.retreatRuleId, supplies) === 'ok') {
        planned++;
      }
    }
    return planned;
  }

  // Wählt einen Gildentitel aus dem Sammelbuch (null = keinen Titel tragen)
  selectGuildTitle(title) {
    if (!this.guild.collection.selectTitle(title)) {
      return false;
    }
    this.emit('changed');
    return true;
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
