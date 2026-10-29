// ============================================================
// COMBATANT – ein Kämpfer während eines Kampfes (Held, Boss oder Diener)
// Hält Leben, Mana, Schild, Aggro, Abklingzeiten und laufende Effekte.
// Wird für jeden Kampf neu erstellt, der Held selbst wird dabei nicht verändert.
// ============================================================

import { getDefenseConstant } from '../../data/scaling.js';
import { COMBAT_RULES } from '../../data/combatRules.js';
import { createEmptyOrderSettings } from './OrderSettings.js';

export class Combatant {
  // options = {
  //   id, name, side ('hero' oder 'enemy'), row ('front'/'back'),
  //   stats: { health, mana, attack, magic, defense },
  //   abilityIds (Liste), basicAttack, heroId (nur Helden), classId (nur Helden),
  //   bossData (nur Bosse), isMinion + minionId (nur Diener),
  //   orderSettings (nur Helden: Anweisungen, siehe Hero.getOrderSettings),
  //   passive (nur Helden: dauerhafte Fähigkeit der Klasse, siehe heroClasses.js),
  //   isPet + ownerId + petSprite (nur Begleiter, z.B. der Wolf des Jägers)
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
    this.orderSettings = options.orderSettings || createEmptyOrderSettings();
    this.isPet = options.isPet || false;
    this.ownerId = options.ownerId || null;
    this.petSprite = options.petSprite || null;   // { sprite, colors } für die Kampfszene

    // Dauerhafte Fähigkeiten der Klasse (z.B. Ausweichen beim Mönch, Wundenzorn beim Barbar)
    const passive = options.passive || {};
    this.baseDodgeChance = passive.dodgeChance || 0;
    this.rageFromMissingHealth = passive.rageFromMissingHealth || 0;

    this.maxHp = options.stats.health;
    this.hp = this.maxHp;
    this.maxMana = options.stats.mana || 0;
    this.mana = this.maxMana;
    this.attack = options.stats.attack || 0;
    this.magic = options.stats.magic || 0;
    this.defense = options.stats.defense || 0;
    // Resistenzen gegen Schadensarten in Prozent, z.B. { acid: 15 } (nur Helden, aus ihrer Ausrüstung)
    this.resistances = options.resistances || {};
    // Wie stark Rüstung wirkt. Hängt von der Stufe des Kampfs ab und wird von der Begegnung gesetzt.
    this.defenseConstant = getDefenseConstant(1);

    this.abilityIds = options.abilityIds || [];
    this.basicAttack = options.basicAttack || null;

    this.alive = true;
    this.shield = 0;            // fängt Schaden ab, bevor Leben verloren geht
    this.threat = 0;            // Aggro: der Boss greift den Helden mit der meisten an
    this.cooldowns = {};        // Skill-id → Runden bis wieder verfügbar
    this.usedOnce = {};         // Skill-id → true: Skills "einmal pro Kampf", die schon benutzt wurden
    this.boundTo = null;        // Diener: von diesem Begleiter festgehalten (greift nur ihn an)
    this.boundEnemy = null;     // Begleiter: diesen Gegner hält er gerade fest
    this.effects = [];          // laufende Effekte (Buffs, Gift, Flüche, Betäubung)
    this.casting = null;        // Boss: Mechanik, die gerade vorbereitet wird
    this.enraged = false;       // Boss: rast bereits?
    this.warnedLowMana = false; // Held: wurde schon vor leerem Mana gewarnt?

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
      mana: Math.round(this.mana),
      maxMana: this.maxMana,
      heroId: this.heroId,
      classId: this.classId,
      bossId: this.bossData ? this.bossData.id : null,
      minionId: this.minionId,
      isPet: this.isPet,
      petSprite: this.petSprite,
    };
  }

  // Beschreibt einen Treffer oder eine Heilung für die Kampfszene (aufploppende Zahl + Lebensbalken)
  // kind = 'damage', 'heal' oder 'shield'
  // damageType = Schadensart (nur bei Schaden), färbt die Zahl in der Szene
  describeHit(amount, kind, crit = false, absorbed = 0, damageType = 'physical') {
    return {
      targetId: this.id,
      amount: amount,
      kind: kind,
      damageType: damageType,
      crit: crit,
      absorbed: absorbed,
      hpAfter: this.hp,
      shieldAfter: this.shield,
    };
  }

  // ---------- Effekte ----------

  // Neuen Effekt anhängen. Hat er eine buffId (der Skill, von dem er stammt) und liegt derselbe Buff
  // schon auf dem Kämpfer, wird der alte ersetzt statt gestapelt. So zählen gleiche Buffs nie doppelt.
  addEffect(effect) {
    if (effect.buffId) {
      this.effects = this.effects.filter((existing) => existing.buffId !== effect.buffId);
    }
    this.effects.push(effect);
  }

  // Liegt ein Buff von diesem Skill auf mir?
  hasBuff(buffId) {
    return this.effects.some((effect) => effect.buffId === buffId);
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

  // Faktor auf erlittenen Schaden (z.B. 0.5 bei Eiserner Wacht, 0 bei Gottesschild)
  getDamageTakenFactor() {
    if (this.hasEffect('immune')) {
      return 0;
    }
    // Anweisung (z.B. "Bollwerk": −30 %)
    let factor = 1 + this.orderSettings.damageTaken;
    for (const effect of this.effects) {
      if (effect.kind === 'damageTaken') {
        factor = factor * (1 + effect.value);
      }
    }
    return factor;
  }

  // Faktor auf den eigenen Schaden: Anweisung, Buffs (z.B. Lied der Klingen) und Wundenzorn (Barbar)
  getDamageDoneFactor() {
    let factor = 1 + this.orderSettings.damageDone;
    for (const effect of this.effects) {
      if (effect.kind === 'damageDone') {
        factor = factor * (1 + effect.value);
      }
    }
    if (this.rageFromMissingHealth > 0) {
      factor = factor * (1 + (1 - this.getHpPercent()) * this.rageFromMissingHealth);
    }
    return factor;
  }

  // Chance, einem normalen Angriff auszuweichen (Mönch, Fließende Abwehr, Anweisung "Kranich")
  getDodgeChance() {
    let chance = this.baseDodgeChance + this.orderSettings.dodge;
    for (const effect of this.effects) {
      if (effect.kind === 'dodge') {
        chance += effect.value;
      }
    }
    return Math.max(0, Math.min(0.9, chance));
  }

  // ---------- Anweisungen (siehe data/heroOrders.js) ----------

  // Faktor auf die eigene Heilung und eigene Schilde
  getHealingFactor() {
    return 1 + this.orderSettings.healingDone;
  }

  // Faktor auf die Aggro, die dieser Kämpfer erzeugt
  getThreatFactor() {
    return 1 + this.orderSettings.threat;
  }

  // Wie viel Mana kostet dieser Skill für diesen Helden? (Anweisungen können das ändern)
  getManaCost(ability) {
    return Math.round(ability.manaCost * (1 + this.orderSettings.manaCost));
  }

  // Faktor auf die Stärke eines einzelnen Skills (z.B. "Natternbiss 60 % stärker")
  getAbilityPowerFactor(abilityId) {
    return 1 + (this.orderSettings.abilityPower[abilityId] || 0);
  }

  // Anteil des eigenen Schadens, der einen selbst heilt (Blutrausch)
  getLifesteal() {
    let share = 0;
    for (const effect of this.effects) {
      if (effect.kind === 'lifesteal') {
        share += effect.value;
      }
    }
    return share;
  }

  // ---------- Schaden & Heilung ----------

  // Nimmt Schaden: erst Rüstung, Resistenz und Buffs, dann fängt der Schild ab, dann geht Leben verloren.
  // damageType = Schadensart (siehe data/damageTypes.js). Eine passende Resistenz mindert den Schaden zusätzlich.
  // Gibt zurück: { damage: verlorenes Leben, absorbed: vom Schild abgefangen }
  takeDamage(rawAmount, ignoreDefense = false, damageType = 'physical') {
    const factor = this.getDamageTakenFactor();
    if (factor === 0) {
      // Unverwundbar (Gottesschild): kein Schaden
      return { damage: 0, absorbed: 0 };
    }
    let amount = rawAmount * factor;
    if (!ignoreDefense) {
      const reduction = this.defense / (this.defense + this.defenseConstant);
      amount = amount * (1 - reduction);
    }
    const resistance = this.resistances[damageType] || 0;
    amount = amount * (1 - resistance / 100);
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

  // Steht wieder auf (Ruf der Wurzeln) mit diesem Anteil seines Lebens
  revive(hpShare) {
    this.alive = true;
    this.hp = Math.max(1, Math.round(this.maxHp * hpShare));
    this.threat = 0;
  }

  // Heilt, aber nie über das Maximum. Gibt die echte Heilung zurück.
  heal(amount) {
    const healed = Math.min(this.maxHp - this.hp, Math.round(amount));
    this.hp += healed;
    return healed;
  }

  // ---------- Abklingzeiten ----------

  isReady(abilityId) {
    return !this.cooldowns[abilityId] && !this.usedOnce[abilityId];
  }

  // Für Skills "einmal pro Kampf": als benutzt merken
  markUsedOnce(abilityId) {
    this.usedOnce[abilityId] = true;
  }

  // Wie viele Runden Abklingzeit stehen insgesamt noch aus? (für den Zeitsprung des Chronomanten)
  getTotalCooldown() {
    let total = 0;
    for (const abilityId in this.cooldowns) {
      total += this.cooldowns[abilityId];
    }
    return total;
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
