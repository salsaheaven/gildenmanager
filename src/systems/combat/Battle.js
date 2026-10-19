// ============================================================
// BATTLE – der Zustand eines laufenden Kampfes
// Kennt alle Kämpfer, die Runde, den Zufall, die Taktik und den Kampfbericht.
// Bietet Hilfsfragen an wie "Wen greift der Boss an?" oder "Wer ist am verletztesten?".
// ============================================================

import { Combatant } from './Combatant.js';
import { MINIONS } from '../../data/enemies.js';

export class Battle {
  // recordLog = false spart Zeit, wenn nur das Ergebnis zählt (z.B. bei 200 Simulationen)
  constructor(heroes, boss, tactic, random, recordLog) {
    this.heroes = heroes;      // Combatant-Liste der Helden
    this.enemies = [boss];     // Combatant-Liste der Gegner (Boss + Diener)
    this.boss = boss;
    this.tactic = tactic;
    this.random = random;
    this.recordLog = recordLog;
    this.round = 0;
    this.log = [];             // Einträge: { round, text, kind }
    this.snapshots = [];       // Leben aller Kämpfer am Ende jeder Runde (für den Live-Ticker)
    this.nextMinionNumber = 1;
    this.forcedTarget = null;  // Herausforderungsruf: { combatant, rounds }
  }

  // ---------- Bericht ----------

  // kind = 'info', 'damage', 'crit', 'heal', 'shield', 'mechanic', 'warning', 'death'
  addLog(text, kind = 'info') {
    if (this.recordLog) {
      this.log.push({ round: this.round, text: text, kind: kind });
    }
  }

  takeSnapshot() {
    if (!this.recordLog) {
      return;
    }
    const all = this.heroes.concat(this.enemies);
    this.snapshots.push({
      round: this.round,
      combatants: all.map((c) => ({ id: c.id, hp: c.hp, maxHp: c.maxHp, shield: c.shield, alive: c.alive })),
    });
  }

  // ---------- Wer lebt noch? ----------

  getLivingHeroes() {
    return this.heroes.filter((hero) => hero.alive);
  }

  getLivingEnemies() {
    return this.enemies.filter((enemy) => enemy.alive);
  }

  getLivingMinions() {
    return this.enemies.filter((enemy) => enemy.alive && enemy.isMinion);
  }

  // Der Kampf endet, wenn alle Helden gefallen sind oder der Boss besiegt ist
  isOver() {
    return this.getLivingHeroes().length === 0 || !this.boss.alive;
  }

  // ---------- Ziele ----------

  // Wen greift der Boss an? Erzwungenes Ziel (Herausforderungsruf), sonst den mit der meisten Aggro.
  getBossTarget() {
    if (this.forcedTarget && this.forcedTarget.combatant.alive && this.forcedTarget.rounds > 0) {
      return this.forcedTarget.combatant;
    }
    let target = null;
    for (const hero of this.getLivingHeroes()) {
      if (target === null || hero.threat > target.threat) {
        target = hero;
      }
    }
    return target;
  }

  // Ziel für Schadens-Skills: erst Diener (mit wenig Leben zuerst), dann der Boss
  getFocusTarget() {
    const minions = this.getLivingMinions();
    if (minions.length > 0) {
      minions.sort((a, b) => a.hp - b.hp);
      return minions[0];
    }
    return this.boss.alive ? this.boss : null;
  }

  // Der Held mit dem prozentual wenigsten Leben
  getLowestAlly() {
    let lowest = null;
    for (const hero of this.getLivingHeroes()) {
      if (lowest === null || hero.getHpPercent() < lowest.getHpPercent()) {
        lowest = hero;
      }
    }
    return lowest;
  }

  getAverageHeroHpPercent() {
    const living = this.getLivingHeroes();
    if (living.length === 0) {
      return 0;
    }
    let sum = 0;
    for (const hero of living) {
      sum += hero.getHpPercent();
    }
    return sum / living.length;
  }

  // ---------- Diener ----------

  spawnMinion(minionId) {
    const minionData = MINIONS[minionId];
    const minion = new Combatant({
      id: 'minion-' + this.nextMinionNumber,
      name: minionData.name + ' ' + this.nextMinionNumber,
      side: 'enemy',
      stats: minionData.stats,
      isMinion: true,
    });
    this.nextMinionNumber++;
    this.enemies.push(minion);
    return minion;
  }
}
