// ============================================================
// COMBATANT – ein Kämpfer während eines Kampfes (Held, Boss oder Diener)
// Hält Leben, Mana, Schild, Aggro, Abklingzeiten und laufende Effekte.
// Wird für jeden Kampf neu erstellt, der Held selbst wird dabei nicht verändert.
// ============================================================

import { COMBAT_RULES } from '../../data/combatRules.js';

export class Combatant {
  // options = {
  //   id, name, side ('hero' oder 'enemy'), row ('front'/'back'),
  //   stats: { health, mana, attack, magic, defense },
  //   abilityIds (Liste), basicAttack, heroId (nur Helden), classId (nur Helden),
  //   bossData (nur Bosse), isMinion + minionId (nur Diener)
  // }
  constructor(options) {
    this.id = options.id;
    this.name = options.name;
    this.side = options.side;
    this.row = options.row || 'front';
    this.heroId = options.heroId || null;
    this.classId = options.classId || null;
    this.bossData = options.bossData || null;
    this.isMinion = options.isMinion || false;
    this.minionId = options.minionId || null;

    this.maxHp = options.stats.health;
    this.hp = this.maxHp;
    this.maxMana = options.stats.mana || 0;
    this.mana = this.maxMana;
    this.attack = options.stats.attack || 0;
    this.magic = options.stats.magic || 0;
    this.defense = options.stats.defense || 0;

    this.abilityIds = options.abilityIds || [];
    this.basicAttack = options.basicAttack || null;

    this.alive = true;
    this.shield = 0;            // fängt Schaden ab, bevor Leben verloren geht
    this.threat = 0;            // Aggro: der Boss greift den Helden mit der meisten an
    this.cooldowns = {};        // Skill-id → Runden bis wieder verfügbar
    this.effects = [];          // laufende Effekte (Buffs, Gift, Flüche, Betäubung)
    this.casting = null;        // Boss: Mechanik, die gerade vorbereitet wird
    this.enraged = false;       // Boss: rast bereits?

    // Statistik für die Auswertung (wie ein "Schadensmesser" im MMO)
    this.damageDone = 0;
    this.healingDone = 0;
    this.damageTaken = 0;
  }

  getHpPercent() {
    return this.hp / this.maxHp;
  }

  getManaPercent() {
    return this.maxMana > 0 ? this.mana / this.maxMana : 1;
  }

  isBoss() {
    return this.bossData !== null;
  }

  // Steckbrief für die Kampfszene: wer ist das, wo steht er, wie viel Leben?
  describe() {
    return {
      id: this.id,
      name: this.name,
      side: this.side,
      row: this.row,
      hp: this.hp,
      maxHp: this.maxHp,
      heroId: this.heroId,
      classId: this.classId,
      bossId: this.bossData ? this.bossData.id : null,
      minionId: this.minionId,
    };
  }

  // Beschreibt einen Treffer oder eine Heilung für die Kampfszene (aufploppende Zahl + Lebensbalken)
  // kind = 'damage', 'heal' oder 'shield'
  describeHit(amount, kind, crit = false, absorbed = 0) {
    return {
      targetId: this.id,
      amount: amount,
      kind: kind,
      crit: crit,
      absorbed: absorbed,
      hpAfter: this.hp,
      shieldAfter: this.shield,
    };
  }

  // ---------- Effekte ----------

  addEffect(effect) {
    this.effects.push(effect);
  }

  hasEffect(kind) {
    return this.effects.some((effect) => effect.kind === kind);
  }

  isStunned() {
    return this.hasEffect('stun');
  }

  hasDebuff() {
    return this.effects.some((effect) => effect.isDebuff);
  }

  // Faktor auf erlittenen Schaden (z.B. 0.5 bei Eiserner Wacht)
  getDamageTakenFactor() {
    let factor = 1;
    for (const effect of this.effects) {
      if (effect.kind === 'damageTaken') {
        factor = factor * (1 + effect.value);
      }
    }
    return factor;
  }

  // ---------- Schaden & Heilung ----------

  // Nimmt Schaden: erst Rüstung und Buffs, dann fängt der Schild ab, dann geht Leben verloren.
  // Gibt zurück: { damage: verlorenes Leben, absorbed: vom Schild abgefangen }
  takeDamage(rawAmount, ignoreDefense = false) {
    let amount = rawAmount * this.getDamageTakenFactor();
    if (!ignoreDefense) {
      const reduction = this.defense / (this.defense + COMBAT_RULES.defenseConstant);
      amount = amount * (1 - reduction);
    }
    amount = Math.max(1, Math.round(amount));

    const absorbed = Math.min(this.shield, amount);
    this.shield -= absorbed;
    const damage = Math.min(this.hp, amount - absorbed);
    this.hp -= damage;
    this.damageTaken += damage;

    if (this.hp <= 0) {
      this.alive = false;
      this.effects = [];
      this.shield = 0;
      this.casting = null;
    }
    return { damage: damage, absorbed: absorbed };
  }

  // Heilt, aber nie über das Maximum. Gibt die echte Heilung zurück.
  heal(amount) {
    const healed = Math.min(this.maxHp - this.hp, Math.round(amount));
    this.hp += healed;
    return healed;
  }

  // ---------- Abklingzeiten ----------

  isReady(abilityId) {
    return !this.cooldowns[abilityId];
  }

  startCooldown(abilityId, rounds) {
    if (rounds > 0) {
      // +1, weil am Anfang der nächsten Runde schon heruntergezählt wird
      this.cooldowns[abilityId] = rounds + 1;
    }
  }

  // Am Rundenanfang: Abklingzeiten herunterzählen, Mana auffüllen
  startRound() {
    for (const abilityId in this.cooldowns) {
      this.cooldowns[abilityId]--;
      if (this.cooldowns[abilityId] <= 0) {
        delete this.cooldowns[abilityId];
      }
    }
    if (this.maxMana > 0) {
      this.mana = Math.min(this.maxMana, this.mana + this.maxMana * COMBAT_RULES.manaRegenPerRound);
    }
  }
}
