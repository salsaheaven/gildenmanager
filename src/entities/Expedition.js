// ============================================================
// EXPEDITION – ein laufender Dungeon-Run einer Gruppe
//
// Beim Start wird der ganze Run mit einem festen Seed vorberechnet (simulateRun).
// Danach läuft nur noch die Zeit: elapsed zählt Spielsekunden, bis der Run vorbei ist.
// Ob jemand zuschaut, ist egal. Die Kampfszene zeigt nur an, was gerade passiert.
//
// Rückzug per Hand: Der Run wird mit demselben Seed neu berechnet, mit Rückzug ab der nächsten Runde.
// Bis dahin verläuft er also genau gleich, danach folgt der Rückzug.
//
// Damit der Run auch nach dem Neuladen genau gleich verläuft, speichert die Expedition
// ein Abbild der Helden vom Start (Werte, Ausrüstung, Anweisungen).
// ============================================================

import { Hero } from './Hero.js';
import { simulateRun } from '../systems/combat/CombatSimulator.js';
import { computeRunTimeline, findRunPosition } from '../systems/combat/BattleTimeline.js';
import { BALANCING } from '../data/balancing.js';

export class Expedition {
  // heroSnapshots = Speicherdaten der Helden beim Start (Hero.toSaveData)
  constructor(id, dungeonId, heroSnapshots, tacticId, retreatRuleId, seed) {
    this.id = id;
    this.dungeonId = dungeonId;
    this.heroSnapshots = heroSnapshots;
    this.tacticId = tacticId;
    this.retreatRuleId = retreatRuleId;
    this.seed = seed;
    this.elapsed = 0;            // vergangene Spielsekunden seit dem Start
    this.manualRetreat = null;   // { encounterIndex, round } wenn per Hand zurückgezogen
    this.result = null;          // berechnetes Ergebnis (wird nicht gespeichert, sondern neu berechnet)
    this.timeline = null;
  }

  getHeroIds() {
    return this.heroSnapshots.map((snapshot) => snapshot.id);
  }

  // Berechnet den Run (nur beim ersten Mal, danach aus dem Zwischenspeicher)
  getResult() {
    if (this.result === null) {
      this.result = simulateRun({
        heroes: this.heroSnapshots.map((snapshot) => Hero.fromSaveData(snapshot)),
        dungeonId: this.dungeonId,
        tacticId: this.tacticId,
        retreatRuleId: this.retreatRuleId,
        seed: this.seed,
        recordLog: true,
        manualRetreat: this.manualRetreat,
      });
      this.timeline = computeRunTimeline(this.result, BALANCING.travelSeconds);
    }
    return this.result;
  }

  getTimeline() {
    this.getResult();
    return this.timeline;
  }

  getTotalTime() {
    return this.getTimeline().totalTime;
  }

  // 0 (gerade gestartet) bis 1 (fertig)
  getProgress() {
    return Math.min(1, this.elapsed / this.getTotalTime());
  }

  isFinished() {
    return this.elapsed >= this.getTotalTime();
  }

  // Wo steht die Gruppe gerade? (siehe findRunPosition)
  getPosition() {
    return findRunPosition(this.getResult(), this.getTimeline(), this.elapsed);
  }

  update(gameSeconds) {
    this.elapsed += gameSeconds;
  }

  // Rückzug per Hand ab der nächsten Runde. Gibt false zurück, wenn es nichts mehr zu retten gibt.
  orderRetreat() {
    if (this.manualRetreat !== null || this.isFinished()) {
      return false;
    }
    const position = this.getPosition();
    if (position.traveling) {
      // Auf dem Weg: die nächste Begegnung findet einfach nicht mehr statt
      this.manualRetreat = { encounterIndex: position.encounterIndex, round: 0 };
    } else {
      this.manualRetreat = { encounterIndex: position.encounterIndex, round: position.round + 1 };
    }
    // Neu berechnen. Bis zum Rückzug bleibt alles gleich, elapsed läuft einfach weiter.
    this.result = null;
    this.timeline = null;
    // Ist der Run dadurch kürzer geworden, als schon vergangen ist, endet er jetzt
    this.elapsed = Math.min(this.elapsed, this.getTotalTime());
    return true;
  }

  // Sofort beenden (Schnellkampf, wenn freigeschaltet)
  finishNow() {
    this.elapsed = this.getTotalTime();
  }

  toSaveData() {
    return {
      id: this.id,
      dungeonId: this.dungeonId,
      heroSnapshots: this.heroSnapshots,
      tacticId: this.tacticId,
      retreatRuleId: this.retreatRuleId,
      seed: this.seed,
      elapsed: this.elapsed,
      manualRetreat: this.manualRetreat,
    };
  }

  static fromSaveData(data) {
    const expedition = new Expedition(data.id, data.dungeonId, data.heroSnapshots, data.tacticId, data.retreatRuleId, data.seed);
    expedition.elapsed = data.elapsed;
    expedition.manualRetreat = data.manualRetreat;
    return expedition;
  }
}
