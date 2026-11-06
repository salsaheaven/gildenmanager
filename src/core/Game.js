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
//   'raidFinished'         → der Raid des Tages ist ausgekämpft (Daten: der Bericht, siehe finishRaid)
// ============================================================

import { getSalvageYield, upgradeItem } from '../systems/CraftingSystem.js';
import { forgeItem, reforgeItem } from '../systems/ForgeSystem.js';
import { getSlotsWithNewGear, markSlotSeen, markItemSeen } from '../systems/NewGear.js';
import { countPossibleGroups, groupHeroesByPosition, checkGroup } from '../systems/GroupCounter.js';
import { getPositionId } from '../data/groupRules.js';
import { getDailyTodos, getEndDayWarnings } from '../systems/DailyTodo.js';
import { suggestAutoGroup } from '../systems/AutoGroup.js';
import { getFreeGroupName, getMissingMembers, findSubstitute, getAvailableSupplies } from '../systems/StandingGroups.js';
import { StandingGroup } from '../entities/StandingGroup.js';
import { updateUnlocks, getUnannouncedUnlocks } from '../systems/Unlocks.js';
import { UNLOCKS } from '../data/unlocks.js';
import { getSet } from '../data/sets.js';
import { getKnownCount, getKnowledgeTotal, getKnowledgeLevel, isEncounterKnown, getKnownDamageTypes, getHiddenMechanicNames } from '../systems/DungeonKnowledge.js';
import { brew } from '../systems/AlchemySystem.js';
import { START_TEAM_RULES, START_TEAM_CLASSES } from '../data/startTeam.js';
import { advanceRivals, recordPlayerClear, getLeaderboard } from '../systems/RivalSystem.js';
import { getDayPlan } from '../systems/DayPlan.js';
import { HERO_TASKS } from '../data/heroTasks.js';
import { resolveHeroTasks, payWages, getDailyWages } from '../systems/HeroTaskSystem.js';
import { startConstruction, payUpkeep, advanceConstruction, getDailyUpkeep } from '../systems/BuildingSystem.js';
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
import { getRaid, RAID_RULES } from '../data/raids.js';
import { getWeekday, getWeek, isRaidDay, isRaidUnlocked, getFightingGroups, checkRaid, getNextEncounterIndex } from '../systems/RaidRules.js';
import { suggestAutoRaid } from '../systems/AutoRaid.js';
import { simulateRaidRun } from '../systems/combat/CombatSimulator.js';
import { getGroupGoldBonus, getGroupExtraChestItems } from '../systems/TraitEffects.js';

// Höchstens so viele Helden pro Raid-Gruppe
const RAID_GROUP_SIZE = RAID_RULES.groupSize;

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
    this.lastRaidReport = null; // Bericht des letzten Raid-Tags (nur im Speicher, für den Tagesabschluss)
  }

  // ---------- Ereignisse ----------

  on(eventName, callback) {
    if (!this.listeners[eventName]) {
      this.listeners[eventName] = [];
    }
    this.listeners[eventName].push(callback);
  }

  emit(eventName, data) {
    // Bei jeder Änderung neu ausrechnen, ob der Raid heute loszieht (Verletzte, neue Helden, Aufstellung …)
    if (eventName === 'changed') {
      this.refreshRaidToday();
    }
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
    const taskEntries = plan.entries.filter((entry) =>
      entry.taskId !== 'dungeon' && entry.taskId !== 'raid' && entry.taskId !== 'injured');
    // Zieht heute der Raid los? (Wer heute fällt, ist danach verletzt: deshalb vorher merken)
    this.refreshRaidToday();
    const raidToday = this.guild.raidPlan.activeToday;

    // 1. Wer schon verletzt war, heilt einen Tag lang.
    //    (Zuerst, damit Helden, die heute fallen, morgen noch verletzt sind.)
    for (const hero of this.guild.heroes) {
      if (hero.healOneDay()) {
        this.emit('heroHealed', hero);
      }
    }

    // 2. Alle Runs von heute auskämpfen, an Raid-Tagen den Raid
    const reports = [];
    for (const expedition of this.guild.expeditions.slice()) {
      reports.push(this.finishExpedition(expedition));
    }
    this.lastRaidReport = raidToday ? this.finishRaid() : null;
    // Erkundungen der Dungeons, in denen heute gekämpft wurde: ein Kampftag ist verbraucht
    // (mit Kartenraum hält eine Erkundung mehrere Kampftage)
    const foughtDungeonIds = new Set(reports.map((report) => report.dungeonId));
    for (const dungeonId of foughtDungeonIds) {
      if (this.guild.scoutedDungeons[dungeonId]) {
        this.guild.scoutedDungeons[dungeonId]--;
        if (this.guild.scoutedDungeons[dungeonId] <= 0) {
          delete this.guild.scoutedDungeons[dungeonId];
        }
      }
    }

    // 3. Aufgaben der anderen Helden (Training, Kräuter, Erkunden), danach der Sold für alle
    const taskResults = resolveHeroTasks(this.guild, taskEntries, this.random);
    for (const taskResult of taskResults) {
      if (taskResult.levelsGained > 0) {
        this.emit('heroLevelUp', { hero: this.guild.findHero(taskResult.heroId), newLevel: taskResult.newLevel });
      }
    }
    const wages = payWages(this.guild);
    // Danach der Unterhalt der Gebäude (Helden gehen vor: erst der Sold, dann die Gebäude)
    const upkeep = payUpkeep(this.guild);
    // Ein Bautag vergeht. Fertig ist ein Gebäude ab morgen nutzbar.
    const finishedBuilding = advanceConstruction(this.guild.hall);

    // 4. Die KI-Gilden sind dran (nach deinen Runs: am selben Abend bist du zuerst)
    const rivalNews = advanceRivals(this.guild, endedDay, this.random);
    // Neuigkeiten des Abends: deine (schon im Ticker) und die der Rivalen
    const news = this.guild.news.filter((entry) => entry.day === endedDay);
    this.lastDaySummary = {
      day: endedDay, tasks: taskResults, wages: wages, upkeep: upkeep, finishedBuilding: finishedBuilding,
      news: news, rivalNews: rivalNews,
    };

    // 5. Der nächste Tag beginnt: neue Bewerber in der Taverne, neues Tagesangebot beim Händler, stehende Gruppen einplanen
    this.day++;
    this.refreshCandidates();
    this.refreshDailyOffer();
    // Die stehenden Gruppen ziehen auch heute los (Verletzte fehlen)
    this.planStandingGroups();
    // Neue Teile des Spiels freischalten (Tutorial)
    this.updateUnlocks();

    this.emit('dayEnded', { day: endedDay, reports: reports, summary: this.lastDaySummary, raidReport: this.lastRaidReport });
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
    // Eine stehende Gruppe merkt sich die neuen Vorräte auch für die nächsten Tage
    const group = this.findStandingGroup(expedition.standingGroupId);
    if (group) {
      group.supplies = supplyIds.slice();
    }
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
    // Das erste Boss-Item schaltet das Sammelbuch frei
    this.updateUnlocks();
    this.emit('changed');
    return items;
  }

  // Verkauft ein Item. Gibt das erhaltene Gold zurück (0, wenn es das Item nicht gibt oder es gesperrt ist).
  sellItem(itemId) {
    const found = this.guild.findItem(itemId);
    if (!found || found.locked) {
      return 0;
    }
    const item = this.guild.removeItem(itemId);
    const gold = item.getSellValue();
    this.guild.addGold(gold);
    this.emit('changed');
    return gold;
  }

  // ---------- Aktionen: Zerlegen & Verbessern (siehe data/crafting.js) ----------

  // Zerlegt ein Item aus dem Inventar zu Material. Gibt das Material zurück ({ dust, crystal, raw })
  // oder null (Item nicht da oder gesperrt).
  salvageItem(itemId) {
    const found = this.guild.findItem(itemId);
    if (!found || found.locked) {
      return null;
    }
    const item = this.guild.removeItem(itemId);
    const materials = getSalvageYield(item);
    this.guild.addMaterials(materials);
    this.emit('changed');
    return materials;
  }

  // Zerlegt alle Items einer Seltenheit (z.B. allen Schrott), gesperrte nicht. Gibt das Material zusammen zurück.
  salvageAllOfRarity(rarityId) {
    const total = {};
    for (const item of this.guild.inventory.filter((entry) => entry.rarityId === rarityId && !entry.locked)) {
      this.guild.removeItem(item.id);
      const materials = getSalvageYield(item);
      for (const materialId in materials) {
        total[materialId] = (total[materialId] || 0) + materials[materialId];
      }
    }
    this.guild.addMaterials(total);
    this.emit('changed');
    return total;
  }

  // Verbessert ein Item um eine Stufe (im Inventar oder bei einem Helden angelegt).
  // Gibt 'success', 'failed', 'maxLevel', 'notEnough' oder 'notFound' zurück.
  upgradeItem(itemId) {
    const item = this.guild.findItemAnywhere(itemId);
    if (!item) {
      return 'notFound';
    }
    const result = upgradeItem(this.guild, item, this.random);
    this.emit('changed');
    return result;
  }

  // ---------- Aktionen: Schmieden und Brauen (siehe systems/ForgeSystem.js und AlchemySystem.js) ----------

  // Schmiedet ein weißes Item nach einer Vorlage (Platz + Rüstungsart). Gibt { result, item } zurück,
  // result = 'ok', 'noForge' (keine Schmiede) oder 'notEnough' (Material fehlt).
  forgeItem(templateId) {
    const outcome = forgeItem(this.guild, this.lootSystem, templateId);
    if (outcome.result === 'ok') {
      this.emit('itemForged', outcome.item);
      this.emit('changed');
    }
    return outcome;
  }

  // Schmiedet ein Rüstungsteil aus dem Inventar in eine andere Rüstungsart um.
  // Gibt 'ok', 'notFound', 'noReforge', 'notArmor', 'wrongTarget' oder 'notEnough' zurück.
  reforgeItem(itemId, targetTemplateId) {
    const item = this.guild.findItem(itemId);
    if (!item) {
      return 'notFound';
    }
    const result = reforgeItem(this.guild, this.lootSystem, item, targetTemplateId);
    if (result === 'ok') {
      this.emit('changed');
    }
    return result;
  }

  // Braut einmal ein Rezept im Alchemielabor. Gibt 'ok', 'noLab' oder 'notEnough' zurück.
  brewRecipe(recipeId) {
    const result = brew(this.guild, recipeId);
    if (result === 'ok') {
      this.emit('changed');
    }
    return result;
  }

  // Verkauft alle Items einer Seltenheit (z.B. allen Schrott), gesperrte nicht. Gibt das Gold zurück.
  sellAllOfRarity(rarityId) {
    const toSell = this.guild.inventory.filter((item) => item.rarityId === rarityId && !item.locked);
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
    // An Raid-Tagen gibt es keine Dungeon-Runs (5 Dungeon-Tage, 2 Raid-Tage pro Woche), sobald der Raid offen ist
    if (this.areDungeonsClosedToday()) {
      return 'raidDay';
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
    // Erkundet? Dann ist dieser Run vorbereitet, der Vorteil hängt vom Wissen ab. Verbraucht wird die
    // Vorbereitung erst in endDay, wenn alle Gruppen des Tages gekämpft haben (alle Gruppen im selben Dungeon profitieren).
    expedition.scouting = this.getScoutingLevel(expedition.dungeonId);
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
      scouted: expedition.scouting !== null,  // war der Run durch Erkunden vorbereitet?
      scouting: expedition.scouting,          // Vorteil: null, 'partial' oder 'full' (siehe data/heroTasks.js)
      chest: null,
      chestBonusItems: 0,   // Extra-Items durch "Glückspilz"
      chestBonusHero: null,
      firstClear: false,
      serverFirst: false,   // als erste Gilde des Servers geschafft?
      // "Woran es lag": Top-Ursachen, Tipp und Hinweise (nur bei Niederlage oder Gefallenen, sonst null)
      // Mechaniken noch nicht erkundeter Bosse bleiben dabei vage
      analysis: needsDefeatAnalysis(result) ? analyzeRun(result, getHiddenMechanicNames(this.guild, dungeon.id)) : null,
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
      // Zum ersten Mal geschafft: in die Rangliste und den Ticker, evtl. Server-First
      if (report.firstClear) {
        this.guild.firstClearDays[dungeon.id] = this.day;
        report.serverFirst = recordPlayerClear(this.guild, dungeon.id, this.day);
      }
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
    report.heroResults = applyRunResults(this.guild, result, dungeon, this.random);

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

  // Gründet die Gilde: Name und die feste Starttruppe (data/startTeam.js).
  // classIds = freiwillig andere Klassen (nur für Tests).
  // Geht nur einmal pro Spielstand. Gibt 'ok' oder 'alreadyFounded' zurück.
  foundGuild(guildName, classIds = START_TEAM_CLASSES) {
    if (this.guild.founded) {
      return 'alreadyFounded';
    }
    const cleanName = (guildName || '').trim().slice(0, START_TEAM_RULES.maxGuildNameLength);
    this.guild.name = cleanName || START_TEAM_RULES.defaultGuildName;
    for (const classId of classIds) {
      const hero = this.recruitmentSystem.createHero(this.guild.createHeroId(), classId, START_TEAM_RULES.rarityId);
      this.guild.heroes.push(hero);
    }
    this.guild.founded = true;
    this.updateUnlocks();
    this.emit('changed');
    return 'ok';
  }

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
    this.guild.removeHero(heroId);
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
      // Was er gerade abgelegt hat, ist für ihn nichts Neues
      markItemSeen(hero, previousItem.getSlot(), previousItem.id);
    }
    this.emit('changed');
    return true;
  }

  // Alle Helden nach Position: { tank: [...], healer: [...], melee, ranged, support } (siehe data/groupRules.js)
  getHeroesByPosition() {
    return groupHeroesByPosition(this.guild.heroes);
  }

  // "Was gibt es heute zu tun?": Liste von { id, count, screenId } (siehe systems/DailyTodo.js)
  getDailyTodos() {
    return getDailyTodos(this.guild, this.lastDaySummary);
  }

  // Offene Punkte, die etwas kosten, wenn der Tag jetzt endet (Nachfrage bei "Tag beenden", blockiert nie)
  getEndDayWarnings() {
    return getEndDayWarnings(this.guild);
  }

  // Wie viele vollständige Gruppen gehen heute noch aus den freien Helden? (siehe systems/GroupCounter.js)
  countPossibleGroups() {
    return countPossibleGroups(this.guild);
  }

  // "Auto-Gruppe": füllt die leeren Plätze mit freien Helden (Tank/Heiler zuerst, dann Konter für bekannte Mechaniken).
  // Gibt die ganze vorgeschlagene Gruppe als Liste von Helden-ids zurück (siehe systems/AutoGroup.js).
  suggestAutoGroup(dungeonId, selectedHeroIds) {
    return suggestAutoGroup(this.guild, dungeonId, selectedHeroIds);
  }

  // Prüft eine Gruppe (Liste von Helden-ids): Pflicht-Positionen besetzt, Gruppe voll? (siehe systems/GroupCounter.js)
  checkGroup(heroIds) {
    const heroes = heroIds.map((heroId) => this.guild.findHero(heroId)).filter((hero) => hero);
    return checkGroup(heroes);
  }

  // Plätze eines Helden mit neuer, passender Ausrüstung im Inventar (siehe systems/NewGear.js)
  getSlotsWithNewGear(heroId) {
    const hero = this.guild.findHero(heroId);
    return hero ? getSlotsWithNewGear(this.guild, hero) : [];
  }

  // Der Spieler hat die Ausrüstungsliste dieses Platzes geöffnet: Die Markierung verschwindet.
  markEquipSlotSeen(heroId, slot) {
    const hero = this.guild.findHero(heroId);
    if (!hero) {
      return;
    }
    markSlotSeen(this.guild, hero, slot);
    this.emit('changed');
  }

  // Legt für jeden Platz das beste passende Item aus dem Inventar an ("Bestes anlegen").
  // "Bestes" = höchste Summe der Werte, die der Klasse nützen (Hero.getUpgradeValue); Resistenzen und Set-Boni
  // zählen nicht. Getragene Teile des eigenen Klassen-Sets bleiben aber dran, gesperrte Items (Schloss) auch.
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
      // Teile des eigenen Klassen-Sets bleiben dran (sonst gingen Set-Boni verloren)
      const current = hero.equipment[slot];
      if (current && current.setId && getSet(current.setId).classId === hero.classId) {
        continue;
      }
      // Gesperrte Items hat der Spieler bewusst festgelegt
      if (current && current.locked) {
        continue;
      }
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

  // Merkt sich, was diese Helden gerade tragen: { heldId: { platz: itemId oder null } } (für "Rückgängig")
  getEquipmentSnapshot(heroIds) {
    const snapshot = {};
    for (const heroId of heroIds) {
      const hero = this.guild.findHero(heroId);
      if (!hero) {
        continue;
      }
      snapshot[heroId] = {};
      for (const slot in hero.equipment) {
        snapshot[heroId][slot] = hero.equipment[slot] ? hero.equipment[slot].id : null;
      }
    }
    return snapshot;
  }

  // Stellt die gemerkte Ausrüstung wieder her ("Rückgängig" nach "Bestes anlegen").
  // Items, die es inzwischen nicht mehr im Inventar gibt (verkauft, zerlegt), werden übersprungen.
  restoreEquipment(snapshot) {
    for (const heroId in snapshot) {
      const hero = this.guild.findHero(Number(heroId));
      if (!hero) {
        continue;
      }
      for (const slot in snapshot[heroId]) {
        const wantedId = snapshot[heroId][slot];
        const current = hero.equipment[slot];
        if ((current ? current.id : null) === wantedId) {
          continue;
        }
        if (wantedId === null) {
          this.unequipItem(hero.id, slot);
        } else if (this.guild.findItem(wantedId)) {
          this.equipItem(hero.id, wantedId);
        }
      }
    }
    this.emit('changed');
  }

  // Sperrt ein Item oder öffnet das Schloss wieder (im Inventar oder angelegt).
  // Gesperrte Items tauscht "Bestes anlegen" nicht aus, und man kann sie nicht verkaufen oder zerlegen.
  // Gibt den neuen Zustand zurück (true = gesperrt) oder null, wenn es das Item nicht gibt.
  toggleItemLock(itemId) {
    const item = this.guild.findItemAnywhere(itemId);
    if (!item) {
      return null;
    }
    item.locked = !item.locked;
    this.emit('changed');
    return item.locked;
  }

  // Rüstet mehrere Helden nacheinander mit dem Besten aus dem Inventar aus (z.B. eine Dungeon-Gruppe).
  // Die Reihenfolge zählt: Wer zuerst dran ist, bekommt bei Ringen und gleicher Rüstungsart das Beste.
  // Gibt zurück, wie viele Items insgesamt angelegt wurden.
  equipBestForGroup(heroIds) {
    let count = 0;
    for (const heroId of heroIds) {
      count += this.equipBestItems(heroId);
    }
    return count;
  }

  // ---------- Aktionen: Talente (siehe data/talents.js) ----------

  // Wählt ein Talent für einen Helden. Gibt true zurück, wenn es geklappt hat.
  chooseHeroTalent(heroId, talentId) {
    const hero = this.guild.findHero(heroId);
    if (!hero || !hero.chooseTalent(talentId)) {
      return false;
    }
    this.emit('changed');
    return true;
  }

  // Umskillen: Alle Talente des Helden werden zurückgesetzt, das kostet Gold (siehe Hero.getRespecCost).
  // Gibt 'ok' oder einen Grund zurück ('notFound', 'nothingToReset', 'noGold').
  respecHero(heroId) {
    const hero = this.guild.findHero(heroId);
    if (!hero) {
      return 'notFound';
    }
    if (hero.talentIds.length === 0) {
      return 'nothingToReset';
    }
    if (!this.guild.spendGold(hero.getRespecCost())) {
      return 'noGold';
    }
    hero.talentIds = [];
    this.emit('changed');
    return 'ok';
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
    return (this.guild.scoutedDungeons[dungeonId] || 0) > 0;
  }

  // Dungeonwissen: { known, total, level } mit level 'none', 'partial' oder 'full' (siehe systems/DungeonKnowledge.js)
  getDungeonKnowledge(dungeonId) {
    return {
      known: getKnownCount(this.guild, dungeonId),
      total: getKnowledgeTotal(dungeonId),
      level: getKnowledgeLevel(this.guild, dungeonId),
    };
  }

  // Ist diese Begegnung (Index in dungeon.encounters) schon erkundet?
  isEncounterKnown(dungeonId, encounterIndex) {
    return isEncounterKnown(this.guild, dungeonId, encounterIndex);
  }

  // Schadensarten, die man schon kennt (nur aus erkundeten Begegnungen)
  getKnownDamageTypes(dungeonId) {
    return getKnownDamageTypes(this.guild, dungeonId);
  }

  // Vorteil eines Runs dort heute: null (nicht vorbereitet), sonst der Wissensstand 'partial' oder 'full'
  getScoutingLevel(dungeonId) {
    if (!this.isDungeonScouted(dungeonId)) {
      return null;
    }
    const level = getKnowledgeLevel(this.guild, dungeonId);
    return level === 'none' ? null : level;
  }

  // Sold, den die Gilde jeden Abend zahlt
  getDailyWages() {
    return getDailyWages(this.guild);
  }

  // ---------- Gildenhalle (siehe data/buildings.js) ----------

  // Beginnt den Bau der nächsten Stufe eines Gebäudes. Gibt 'ok', 'maxLevel', 'busy' oder 'notEnough' zurück.
  buildBuilding(buildingId) {
    const result = startConstruction(this.guild, buildingId);
    if (result === 'ok') {
      this.emit('changed');
    }
    return result;
  }

  // Unterhalt aller Gebäude pro Tag
  getDailyUpkeep() {
    return getDailyUpkeep(this.guild.hall);
  }

  // Zeigt die Einschätzung, woran eine Gruppe wohl scheitern würde? (Kartenraum Stufe 3)
  hasDefeatForecast() {
    return this.guild.hall.getEffect('defeatForecast', false);
  }

  // ---------- Schrittweises Freischalten (siehe data/unlocks.js) ----------

  // Ist dieser Teil des Spiels schon freigeschaltet? (z.B. 'tavern', 'guildHall')
  isFeatureUnlocked(unlockId) {
    return this.guild.unlockedFeatures.includes(unlockId);
  }

  // Prüft die Bedingungen und schaltet frei, was dran ist. Meldet Neues mit dem Ereignis 'featureUnlocked'.
  updateUnlocks() {
    for (const unlockId of updateUnlocks(this.guild, this.day)) {
      this.emit('featureUnlocked', unlockId);
    }
  }

  // Freischaltungen, deren Hinweis noch nicht angeschaut wurde (für "Was gibt es heute zu tun?")
  getUnannouncedUnlocks() {
    return getUnannouncedUnlocks(this.guild);
  }

  // Der Spieler hat den Hinweis angeschaut: Er verschwindet aus "Was gibt es heute zu tun?"
  acknowledgeUnlock(unlockId) {
    if (!this.guild.acknowledgedUnlocks.includes(unlockId)) {
      this.guild.acknowledgedUnlocks.push(unlockId);
      this.emit('changed');
    }
  }

  // Test-Menü: alles auf einmal freischalten (ohne Hinweise)
  unlockEverything() {
    for (const unlock of UNLOCKS) {
      if (!this.guild.unlockedFeatures.includes(unlock.id)) {
        this.guild.unlockedFeatures.push(unlock.id);
      }
      this.acknowledgeUnlock(unlock.id);
    }
    this.emit('changed');
  }

  // ---------- Stehende Gruppen (siehe systems/StandingGroups.js) ----------

  // Bildet eine stehende Gruppe und plant sie gleich für heute ein. Ab morgen zieht sie jeden Tag von selbst los.
  // Gibt 'ok' oder einen Grund aus startExpedition zurück. Die Helden verlassen dabei ihre bisherige stehende Gruppe.
  // An Raid-Tagen wird die Gruppe nur angelegt und zieht ab dem nächsten Dungeon-Tag los.
  createStandingGroup(dungeonId, heroIds, retreatRuleId, supplyIds = []) {
    const closedToday = this.areDungeonsClosedToday();
    if (closedToday) {
      const allThere = heroIds.length > 0 && heroIds.length <= 5 && heroIds.every((heroId) => this.guild.findHero(heroId));
      if (!this.isDungeonUnlocked(dungeonId) || !allThere) {
        return 'invalid';
      }
    } else {
      const result = this.startExpedition(dungeonId, heroIds, retreatRuleId, supplyIds);
      if (result !== 'ok') {
        return result;
      }
    }
    for (const other of this.guild.standingGroups) {
      other.heroIds = other.heroIds.filter((heroId) => !heroIds.includes(heroId));
    }
    this.guild.standingGroups = this.guild.standingGroups.filter((other) => other.heroIds.length > 0);
    const group = new StandingGroup(this.guild.nextStandingGroupId, getFreeGroupName(this.guild), dungeonId,
      heroIds.slice(), retreatRuleId, supplyIds.slice());
    this.guild.nextStandingGroupId++;
    this.guild.standingGroups.push(group);
    if (!closedToday) {
      const expedition = this.guild.expeditions[this.guild.expeditions.length - 1];
      expedition.standingGroupId = group.id;
    }
    this.emit('changed');
    return 'ok';
  }

  findStandingGroup(groupId) {
    return this.guild.standingGroups.find((group) => group.id === groupId) || null;
  }

  // Der heutige Run einer stehenden Gruppe (null, wenn sie heute aussetzt)
  getTodaysExpedition(groupId) {
    return this.guild.expeditions.find((expedition) => expedition.standingGroupId === groupId) || null;
  }

  // Plant eine stehende Gruppe für heute ein, mit allen Mitgliedern, die heute können (nicht verletzt, nicht schon eingeplant),
  // und den gewohnten Vorräten, soweit da. Gibt true zurück, wenn sie heute loszieht.
  planStandingGroup(groupId) {
    const group = this.findStandingGroup(groupId);
    if (!group || this.getTodaysExpedition(groupId) || !this.isDungeonUnlocked(group.dungeonId)) {
      return false;
    }
    const heroIds = group.heroIds.filter((heroId) => {
      const hero = this.guild.findHero(heroId);
      return hero && !hero.isInjured() && !this.guild.isHeroBusy(heroId);
    });
    if (heroIds.length === 0) {
      return false;
    }
    const supplies = getAvailableSupplies(this.guild, group.supplies);
    if (this.startExpedition(group.dungeonId, heroIds, group.retreatRuleId, supplies) !== 'ok') {
      return false;
    }
    this.guild.expeditions[this.guild.expeditions.length - 1].standingGroupId = group.id;
    return true;
  }

  // Jeden Morgen: alle stehenden Gruppen einplanen. Entlassene Helden fallen vorher aus ihrer Gruppe,
  // leere Gruppen lösen sich auf.
  // An Raid-Tagen (sobald der Raid offen ist) ziehen sie nicht los.
  planStandingGroups() {
    for (const group of this.guild.standingGroups) {
      group.heroIds = group.heroIds.filter((heroId) => this.guild.findHero(heroId));
    }
    this.guild.standingGroups = this.guild.standingGroups.filter((group) => group.heroIds.length > 0);
    if (this.areDungeonsClosedToday()) {
      return;
    }
    for (const group of this.guild.standingGroups) {
      this.planStandingGroup(group.id);
    }
  }

  // Wer fehlt heute in der Gruppe? [{ hero, positionId }] (verletzte Mitglieder)
  getMissingMembers(groupId) {
    const group = this.findStandingGroup(groupId);
    return group ? getMissingMembers(this.guild, group) : [];
  }

  // "Ersatz einsetzen": Für ein fehlendes Mitglied springt heute ein freier Held derselben Position ein.
  // Nur für heute, die Gruppe selbst bleibt gleich. Gibt den Ersatz-Helden zurück oder null.
  addSubstitute(groupId) {
    const expedition = this.getTodaysExpedition(groupId);
    if (!expedition || expedition.heroIds.length >= 5) {
      return null;
    }
    const group = this.findStandingGroup(groupId);
    // Wer heute schon als Ersatz dabei ist (nicht in der Gruppe), zählt pro Position
    const substitutesByPosition = {};
    for (const heroId of expedition.heroIds) {
      if (!group.heroIds.includes(heroId)) {
        const positionId = getPositionId(this.guild.findHero(heroId).getClass());
        substitutesByPosition[positionId] = (substitutesByPosition[positionId] || 0) + 1;
      }
    }
    for (const missing of this.getMissingMembers(groupId)) {
      // Für dieses fehlende Mitglied springt schon jemand ein? Dann das nächste fehlende
      if (substitutesByPosition[missing.positionId] > 0) {
        substitutesByPosition[missing.positionId]--;
        continue;
      }
      const substitute = findSubstitute(this.guild, missing.positionId);
      if (substitute) {
        expedition.heroIds.push(substitute.id);
        this.emit('changed');
        return substitute;
      }
    }
    return null;
  }

  // Heute aussetzen: Der heutige Run der Gruppe fällt aus, morgen zieht sie wieder los.
  skipStandingGroupToday(groupId) {
    const expedition = this.getTodaysExpedition(groupId);
    return expedition ? this.cancelExpedition(expedition.id) : false;
  }

  // Auflösen: Die Gruppe gibt es nicht mehr, ihr heutiger Run fällt aus.
  disbandStandingGroup(groupId) {
    this.skipStandingGroupToday(groupId);
    this.guild.standingGroups = this.guild.standingGroups.filter((group) => group.id !== groupId);
    this.emit('changed');
  }

  // Alle Titel, die die Gilde tragen darf: aus vollen Sammelbuch-Seiten und aus eigenen Server-Firsts
  getAvailableTitles() {
    return this.guild.collection.getUnlockedTitles().concat(this.guild.earnedTitles);
  }

  // Wählt einen Gildentitel (null = keinen Titel tragen)
  selectGuildTitle(title) {
    if (title !== null && !this.getAvailableTitles().includes(title)) {
      return false;
    }
    this.guild.selectedTitle = title;
    this.emit('changed');
    return true;
  }

  // Rangliste aller Gilden (siehe systems/RivalSystem.js)
  getLeaderboard() {
    return getLeaderboard(this.guild);
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
    markItemSeen(hero, slot, item.id);
    this.emit('changed');
    return true;
  }

  // ---------- Speichern ----------

  // ---------- Raid (siehe data/raids.js, systems/RaidRules.js, entities/RaidPlan.js) ----------

  getRaid() {
    return getRaid(this.guild.raidPlan.raidId);
  }

  // Wochentag (1 bis 7) und Woche des heutigen Tages
  getWeekday() {
    return getWeekday(this.day);
  }

  getWeek() {
    return getWeek(this.day);
  }

  isRaidDayToday() {
    return isRaidDay(this.day);
  }

  isRaidUnlocked() {
    return isRaidUnlocked(this.guild, this.getRaid());
  }

  // Heute keine Dungeons? Erst wenn der Raid offen ist, werden die Raid-Tage zu reinen Raid-Tagen.
  // Vorher sind alle 7 Tage Dungeon-Tage.
  areDungeonsClosedToday() {
    return this.isRaidDayToday() && this.isRaidUnlocked();
  }

  // Reicht die Raid-Aufstellung? { ok, heroCount, tanks, healers, problems }
  checkRaid() {
    return checkRaid(this.guild, this.guild.raidPlan);
  }

  // Die in dieser Woche schon besiegten Bosse (Wochen-Sperre)
  getDefeatedRaidBossIds() {
    return this.guild.raidPlan.getDefeatedBossIds(this.getWeek());
  }

  // Ab welcher Begegnung geht es diese Woche weiter? (null = alle Bosse dieser Woche besiegt)
  getNextRaidEncounterIndex() {
    return getNextEncounterIndex(this.getRaid(), this.getDefeatedRaidBossIds());
  }

  // Zieht der Raid heute los? Raid-Tag, Raid offen, noch Bosse übrig, nicht ausgesetzt,
  // heute noch nicht geraidet und die Aufstellung reicht. Das Ergebnis steht danach in raidPlan.activeToday.
  refreshRaidToday() {
    const plan = this.guild.raidPlan;
    plan.removeMissingHeroes(this.guild);
    const wouldRaid = this.areDungeonsClosedToday() && this.getNextRaidEncounterIndex() !== null &&
      plan.skippedDay !== this.day && plan.lastFoughtDay !== this.day;
    const ready = this.checkRaid().ok;
    plan.activeToday = wouldRaid && ready;
    plan.notReadyToday = wouldRaid && !ready;
    plan.dungeonsClosedToday = this.areDungeonsClosedToday();
    return plan.activeToday;
  }

  // Stellt die Raid-Gruppen ein: groups = 4 Listen mit Helden-ids (je höchstens 5, jeder Held nur einmal).
  // Gibt 'ok' oder 'invalid' zurück.
  setRaidGroups(groups) {
    const plan = this.guild.raidPlan;
    const seen = [];
    if (groups.length !== plan.groups.length) {
      return 'invalid';
    }
    for (const group of groups) {
      if (group.length > RAID_GROUP_SIZE) {
        return 'invalid';
      }
      for (const heroId of group) {
        if (!this.guild.findHero(heroId) || seen.includes(heroId)) {
          return 'invalid';
        }
        seen.push(heroId);
      }
    }
    plan.groups = groups.map((group) => group.slice());
    this.emit('changed');
    return 'ok';
  }

  // "Auto-Raid": stellt den Raid aus den einsatzbereiten Helden zusammen (siehe systems/AutoRaid.js)
  applyAutoRaid() {
    return this.setRaidGroups(suggestAutoRaid(this.guild));
  }

  // Setzt einen Helden in eine Raid-Gruppe (aus einer anderen Gruppe oder neu dazu).
  // Ist die Gruppe voll, tauscht er mit target (Helden-id in der Zielgruppe) bzw. es geht nicht.
  // Gibt 'ok', 'full' oder 'invalid' zurück.
  moveRaidHero(heroId, groupIndex, swapWithHeroId = null) {
    const plan = this.guild.raidPlan;
    if (!this.guild.findHero(heroId) || groupIndex < 0 || groupIndex >= plan.groups.length) {
      return 'invalid';
    }
    const groups = plan.groups.map((group) => group.slice());
    const fromIndex = plan.getGroupIndexOf(heroId);
    if (fromIndex === groupIndex) {
      return 'ok';
    }
    const target = groups[groupIndex];
    if (swapWithHeroId !== null && target.includes(swapWithHeroId)) {
      // Tauschen: Der andere geht dorthin, wo dieser Held herkommt (oder aus dem Raid, wenn er neu dazukommt)
      target.splice(target.indexOf(swapWithHeroId), 1);
      if (fromIndex !== -1) {
        groups[fromIndex].push(swapWithHeroId);
      }
    } else if (target.length >= RAID_GROUP_SIZE) {
      return 'full';
    }
    if (fromIndex !== -1) {
      groups[fromIndex].splice(groups[fromIndex].indexOf(heroId), 1);
    }
    target.push(heroId);
    return this.setRaidGroups(groups);
  }

  // Nimmt einen Helden aus der Raid-Aufstellung
  removeRaidHero(heroId) {
    const groups = this.guild.raidPlan.groups.map((group) => group.filter((id) => id !== heroId));
    return this.setRaidGroups(groups);
  }

  // Heute nicht raiden bzw. doch wieder raiden
  skipRaidToday() {
    this.guild.raidPlan.skippedDay = this.day;
    this.emit('changed');
  }

  planRaidToday() {
    if (this.guild.raidPlan.skippedDay === this.day) {
      this.guild.raidPlan.skippedDay = 0;
    }
    this.emit('changed');
  }

  // Kämpft den Raid des Tages aus: ab dem nächsten Boss der Woche bis zum ersten Wipe.
  // Besiegte Bosse sind bis Wochenende gesperrt. Gold für Bosse und Trash, EP und Verletzungen wie im Dungeon.
  // Gibt den Bericht zurück: { raidId, day, outcome, startIndex, result (zum Abspielen), defeatedBossIds,
  //                            gold, heroResults, heroNames, fallenNames }
  finishRaid() {
    const raid = this.getRaid();
    const plan = this.guild.raidPlan;
    const startIndex = this.getNextRaidEncounterIndex();
    const groups = getFightingGroups(this.guild, plan);
    const seed = Math.floor(this.random.next() * 2147483647);
    const result = simulateRaidRun({ groups: groups, raidId: raid.id, startIndex: startIndex, seed: seed, recordLog: true });

    const report = {
      raidId: raid.id,
      day: this.day,
      outcome: result.outcome,
      startIndex: startIndex,
      result: result,
      groups: groups.map((group) => group.map((hero) => hero.id)),
      defeatedBossIds: [],
      gold: 0,
      heroNames: result.heroes.map((hero) => hero.name),
      fallenNames: result.heroes.filter((hero) => !hero.alive).map((hero) => hero.name),
      heroResults: [],
    };
    result.encounters.forEach((encounterResult, offset) => {
      const encounter = raid.encounters[startIndex + offset];
      if (encounterResult.outcome !== 'victory') {
        return;
      }
      if (encounter.type === 'boss') {
        plan.markBossDefeated(encounter.bossId, this.getWeek());
        report.defeatedBossIds.push(encounter.bossId);
        report.gold += raid.bossGold;
      } else {
        report.gold += raid.trashGold;
      }
    });
    this.guild.addGold(report.gold);
    plan.lastFoughtDay = this.day;

    // EP für gewonnene Begegnungen, Verletzungen für Gefallene (wie im Dungeon, ab der heutigen ersten Begegnung)
    const foughtPart = { level: raid.level, encounters: raid.encounters.slice(startIndex) };
    report.heroResults = applyRunResults(this.guild, result, foughtPart, this.random);

    this.emit('raidFinished', report);
    for (const heroResult of report.heroResults) {
      if (heroResult.levelsGained > 0) {
        this.emit('heroLevelUp', { hero: this.guild.findHero(heroResult.heroId), newLevel: heroResult.newLevel });
      }
    }
    this.emit('changed');
    return report;
  }

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
