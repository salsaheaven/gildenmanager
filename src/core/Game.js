// ============================================================
// GAME – das Herz des Spiels
// Hält alle Teile zusammen (Uhr, Gilde, Systeme) und bietet die Aktionen an,
// die die Oberfläche auslösen kann (Kiste kaufen, öffnen, Item verkaufen …).
//
// Ereignisse (Events): Die Oberfläche kann mit game.on('name', funktion) zuhören.
//   'changed'     → irgendetwas am Spielstand hat sich geändert
//   'boxArrived'  → der Kurier hat eine Kiste gebracht (Daten: Kistenart-id)
// ============================================================

import { GameClock } from './GameClock.js';
import { Random } from './Random.js';
import { Guild } from '../entities/Guild.js';
import { LootSystem } from '../systems/LootSystem.js';
import { BALANCING } from '../data/balancing.js';
import { getLootBoxType } from '../data/lootBoxes.js';

export class Game {
  constructor(seed = Date.now()) {
    this.clock = new GameClock();
    this.random = new Random(seed);
    this.guild = new Guild();
    this.lootSystem = new LootSystem(this.random);
    this.courierTimer = 0; // Spielsekunden seit der letzten Kurier-Lieferung
    this.listeners = {};
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
    this.updateCourier(gameSeconds);
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

  // ---------- Aktionen ----------

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

  // ---------- Speichern ----------

  toSaveData() {
    return {
      clock: this.clock.toSaveData(),
      randomState: this.random.state,
      guild: this.guild.toSaveData(),
      courierTimer: this.courierTimer,
    };
  }

  static fromSaveData(data) {
    const game = new Game();
    game.clock = GameClock.fromSaveData(data.clock);
    game.random.state = data.randomState;
    game.guild = Guild.fromSaveData(data.guild);
    game.courierTimer = data.courierTimer;
    return game;
  }
}
