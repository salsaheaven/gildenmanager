// ============================================================
// BATTLE – der Zustand eines laufenden Kampfes
// Kennt alle Kämpfer, die Runde, den Zufall, und den Kampfbericht.
// Der Boss ist freiwillig: Bei Trash-Gruppen gibt es keinen (boss = null).
// Bietet Hilfsfragen an wie "Wen greift der Boss an?" oder "Wer ist am verletztesten?".
// ============================================================

import { getEnemyLevelFactors, getDefenseConstant } from '../../data/scaling.js';
import { Combatant } from './Combatant.js';
import { MINIONS } from '../../data/enemies.js';

export class Battle {
  // recordLog = false spart Zeit, wenn nur das Ergebnis zählt (z.B. bei 200 Simulationen)
  // enemyLevel = Stufe der Gegner (Stufe des Dungeons, siehe data/scaling.js)
  constructor(heroes, boss, random, recordLog, enemyLevel = 1) {
    this.heroes = heroes;      // Combatant-Liste der Helden
    this.enemies = boss ? [boss] : []; // Combatant-Liste der Gegner (Boss + Diener/Trash)
    this.boss = boss;                  // null bei Trash-Gruppen
    this.random = random;
    this.recordLog = recordLog;
    this.round = 0;
    this.log = [];             // Einträge: { round, text, kind, ...details } (siehe addLog)
    this.snapshots = [];       // Leben aller Kämpfer am Ende jeder Runde (für den Live-Ticker)
    this.nextMinionNumber = 1;
    this.enemyLevel = enemyLevel;
    this.forcedTarget = null;  // Herausforderungsruf: { combatant, rounds }

    // Rückzug: läuft gerade? wie viele Runden noch? geschafft?
    this.retreating = false;
    this.retreatRoundsLeft = 0;
    this.retreatFinished = false;
  }

  // ---------- Bericht ----------

  // kind    = 'info', 'damage', 'crit', 'heal', 'shield', 'mechanic', 'warning', 'death',
  //           'action' (nur für die Szene, erscheint nicht im Bericht, siehe logAction)
  // details = Zusatzinfos für die Kampfszene (alle freiwillig):
  //   sourceId = wer handelt (macht einen kleinen Ausfallschritt)
  //   hits     = Liste von Treffern/Heilungen (siehe Combatant.describeHit)
  //   labels   = Liste von { targetId, text } für aufploppende Wörter wie "UNTERBROCHEN!"
  //   cast     = { state: 'start' oder 'end', name } für den Zauberbalken des Bosses
  //   spawn    = Liste neuer Diener (siehe Combatant.describe)
  addLog(text, kind = 'info', details = {}) {
    if (this.recordLog) {
      this.log.push({ round: this.round, text: text, kind: kind, ...details });
    }
  }

  // Meldet eine Aktion für die Kampfszene (Animation + Skill-Name), ohne Text im Kampfbericht.
  // showName = true: der Name ploppt klein über dem Handelnden auf (bei Skills, nicht bei normalen Angriffen)
  // abilityId = welcher Skill benutzt wurde (damit die Szene die Abklingzeit anzeigen kann), sonst null
  logAction(source, name, fx, targets, showName, abilityId = null) {
    this.addLog('', 'action', {
      action: {
        sourceId: source.id,
        name: name,
        fx: fx,
        targetIds: targets.map((target) => target.id),
        showName: showName,
        abilityId: abilityId,
        manaAfter: source.maxMana > 0 ? Math.round(source.mana) : null,
      },
    });
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

  // Der Kampf endet, wenn alle Helden gefallen sind, der Rückzug geschafft ist
  // oder der Boss besiegt ist (bei Trash-Gruppen: alle Gegner besiegt)
  isOver() {
    if (this.retreatFinished || this.getLivingHeroes().length === 0) {
      return true;
    }
    return this.isWon();
  }

  isWon() {
    if (this.boss) {
      return !this.boss.alive;
    }
    return this.getLivingEnemies().length === 0;
  }

  // Was der Boss gerade vorbereitet (null, wenn nichts oder kein Boss da ist)
  getCasting() {
    return this.boss && this.boss.alive ? this.boss.casting : null;
  }

  isDummyFight() {
    return this.boss !== null && Boolean(this.boss.bossData.isDummy);
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

  // Ziel für Schadens-Skills: erst Diener (mit wenig Leben zuerst), dann der Boss.
  // Hat der Held die Anweisung "Boss zuerst", nimmt er den Boss, solange der lebt.
  getFocusTarget(attacker = null) {
    if (attacker && attacker.orderSettings.targetPriority === 'boss' && this.boss && this.boss.alive) {
      return this.boss;
    }
    const minions = this.getLivingMinions();
    if (minions.length > 0) {
      minions.sort((a, b) => a.hp - b.hp);
      return minions[0];
    }
    return this.boss && this.boss.alive ? this.boss : null;
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

  // Erzeugt einen Diener oder Trash-Gegner und stellt ihn in den Kampf
  spawnMinion(minionId) {
    const minionData = MINIONS[minionId];
    const minion = new Combatant({
      id: 'minion-' + this.nextMinionNumber,
      name: minionData.name + ' ' + this.nextMinionNumber,
      side: 'enemy',
      stats: scaleEnemyStats(minionData.stats, this.enemyLevel),
      isMinion: true,
      minionId: minionId,
    });
    minion.defenseConstant = getDefenseConstant(this.enemyLevel);
    this.nextMinionNumber++;
    this.enemies.push(minion);
    return minion;
  }
}

// Gegnerwerte an die Stufe anpassen (Faktoren siehe data/scaling.js)
export function scaleEnemyStats(stats, level) {
  const factors = getEnemyLevelFactors(level);
  return {
    health: Math.round(stats.health * factors.health),
    attack: stats.attack * factors.attack,
    defense: stats.defense * factors.defense,
  };
}
