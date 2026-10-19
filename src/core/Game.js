// ============================================================
// GAME – das Herz des Spiels
// Hält alle Teile zusammen (Uhr, Gilde, Systeme) und bietet die Aktionen an,
// die die Oberfläche auslösen kann (Kiste kaufen, öffnen, Item verkaufen …).
//
// Ereignisse (Events): Die Oberfläche kann mit game.on('name', funktion) zuhören.
//   'changed'              → irgendetwas am Spielstand hat sich geändert
//   'boxArrived'           → der Kurier hat eine Kiste gebracht (Daten: Kistenart-id)
//   'candidatesRefreshed'  → neue Bewerber in der Taverne (Daten: Liste der Bewerber)
// ============================================================

import { GameClock } from './GameClock.js';
import { Random } from './Random.js';
import { Guild } from '../entities/Guild.js';
import { LootSystem } from '../systems/LootSystem.js';
import { RecruitmentSystem } from '../systems/RecruitmentSystem.js';
import { BALANCING } from '../data/balancing.js';
import { getLootBoxType } from '../data/lootBoxes.js';

export class Game {
  constructor(seed = Date.now()) {
    this.clock = new GameClock();
    this.random = new Random(seed);
    this.guild = new Guild();
    this.lootSystem = new LootSystem(this.random);
    this.recruitmentSystem = new RecruitmentSystem(this.random);
    this.courierTimer = 0;   // Spielsekunden seit der letzten Kurier-Lieferung
    this.candidateTimer = 0; // Spielsekunden seit den letzten neuen Bewerbern
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

  // ---------- Spielschleife ----------

  // Wird in jedem Bild aufgerufen (etwa 60-mal pro Sekunde)
  update(realSeconds) {
    const gameSeconds = this.clock.update(realSeconds);
    if (gameSeconds === 0) {
      return;
    }
    this.advanceTime(gameSeconds);
  }

  // Lässt alle zeitabhängigen Dinge um so viele Spielsekunden weiterlaufen
  advanceTime(gameSeconds) {
    this.updateCourier(gameSeconds);
    this.updateCandidates(gameSeconds);
  }

  updateCourier(gameSeconds) {
    this.courierTimer += gameSeconds;
    // "while" statt "if": Bei hoher Geschwindigkeit könnten mehrere Lieferungen fällig sein
    while (this.courierTimer >= BALANCING.courierIntervalSeconds) {
      this.courierTimer -= BALANCING.courierIntervalSeconds;
      this.guild.addBox(BALANCING.courierBoxType);
      this.emit('boxArrived', BALANCING.courierBoxType);
      this.emit('changed');
    }
  }

  // Fortschritt bis zur nächsten Lieferung: 0 (gerade geliefert) bis 1 (gleich da)
  getCourierProgress() {
    return this.courierTimer / BALANCING.courierIntervalSeconds;
  }

  updateCandidates(gameSeconds) {
    this.candidateTimer += gameSeconds;
    if (this.candidateTimer >= BALANCING.candidateRefreshSeconds) {
      this.candidateTimer = 0;
      this.refreshCandidates();
    }
  }

  // Fortschritt bis zu neuen Bewerbern: 0 bis 1
  getCandidateProgress() {
    return this.candidateTimer / BALANCING.candidateRefreshSeconds;
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

  // ---------- Aktionen: Helden ----------

  // Sofort neue Bewerber rufen (kostet Gold)
  rerollCandidates() {
    if (!this.guild.spendGold(BALANCING.candidateRerollCost)) {
      return false;
    }
    this.candidateTimer = 0;
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
    if (!hero) {
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
      clock: this.clock.toSaveData(),
      randomState: this.random.state,
      guild: this.guild.toSaveData(),
      courierTimer: this.courierTimer,
      candidateTimer: this.candidateTimer,
    };
  }

  static fromSaveData(data) {
    const game = new Game();
    game.clock = GameClock.fromSaveData(data.clock);
    game.random.state = data.randomState;
    game.guild = Guild.fromSaveData(data.guild);
    game.courierTimer = data.courierTimer;
    game.candidateTimer = data.candidateTimer || 0;
    // Alte Spielstände haben noch keine Bewerber
    if (game.guild.candidates.length === 0) {
      game.recruitmentSystem.refreshCandidates(game.guild);
    }
    return game;
  }
}
