// ============================================================
// ABILITYEFFECTS – was passiert, wenn ein Held einen Skill oder Angriff benutzt
// Ablauf: Ziele bestimmen → Aktion melden (für Animation und Skill-Namen in der Szene)
//         → Wirkung ausrechnen (Schaden, Heilung, Schild …) und in den Kampfbericht schreiben.
// ============================================================

import { t } from '../../core/Language.js';
import { getCounterPoints, findCounterEffect } from './CounterPoints.js';
import { COMBAT_RULES } from '../../data/combatRules.js';

// Stärke einer Aktion: Wert (Angriff oder Magie) × Faktor × Zufall, evtl. kritisch.
// Gibt { amount, crit } zurück.
export function rollOutput(battle, caster, scaling, power, critBonus = 0) {
  const statValue = scaling === 'magic' ? caster.magic : caster.attack;
  const variation = battle.random.between(1 - COMBAT_RULES.variation, 1 + COMBAT_RULES.variation);
  let amount = statValue * power * variation;

  const crit = battle.random.next() < COMBAT_RULES.baseCritChance + critBonus;
  if (crit) {
    amount = amount * COMBAT_RULES.critMultiplier;
  }
  return { amount: amount, crit: crit };
}

// Held (oder Begleiter) fügt einem Gegner Schaden zu (mit Aggro).
// Buffs auf den eigenen Schaden (Lied der Klingen, Wundenzorn) wirken hier.
// Mit Blutrausch heilt ein Teil des Schadens den Angreifer selbst.
export function heroDealsDamage(battle, caster, target, actionName, scaling, power, options = {}) {
  const output = rollOutput(battle, caster, scaling, power, options.critBonus || 0);
  const damageType = options.damageType || 'physical';
  const result = target.takeDamage(output.amount * caster.getDamageDoneFactor(), false, damageType);
  caster.damageDone += result.damage;
  caster.threat += result.damage * (options.threat || 1) * caster.getThreatFactor();

  const critText = output.crit ? t('combat.crit') : '';
  battle.addLog(t('combat.hits', { caster: caster.name, action: actionName, target: target.name, crit: critText, amount: result.damage }),
    output.crit ? 'crit' : 'damage',
    { hits: [target.describeHit(result.damage, 'damage', output.crit, result.absorbed, damageType)] });
  if (!target.alive) {
    battle.addLog(t('combat.defeated', { name: target.name }), 'death');
  }
  breakShell(battle, caster, target);

  const lifesteal = caster.getLifesteal();
  if (lifesteal > 0 && result.damage > 0) {
    const healed = caster.heal(result.damage * lifesteal);
    if (healed > 0) {
      battle.addLog(t('combat.lifesteal', { name: caster.name, amount: healed }), 'heal', { hits: [caster.describeHit(healed, 'heal')] });
    }
  }
  return result.damage;
}

// Panzer brechen (Mechanik 'shell'): Treffer von Samurai, Barbar, Mönch (oder mit Konter-Talent) ziehen Punkte ab.
// Sind keine Punkte mehr übrig, ist der Panzer weg (siehe data/counters.js, COUNTER_POINTS).
function breakShell(battle, caster, target) {
  if (!target.alive) {
    return;
  }
  const shell = findCounterEffect(target, 'shell');
  const points = getCounterPoints(caster, 'breakShell');
  if (!shell || points === 0) {
    return;
  }
  shell.points -= points;
  if (shell.points <= 0) {
    target.effects = target.effects.filter((effect) => effect !== shell);
    battle.causes.addCountered(shell.name);
    battle.addLog(t('combat.shellBroken', { caster: caster.name, shell: shell.name, target: target.name }), 'mechanic',
      { labels: [{ targetId: target.id, text: t('combat.shellBrokenLabel') }] });
  } else {
    battle.addLog(t('combat.shellCracks', { caster: caster.name, shell: shell.name }), 'info',
      { labels: [{ targetId: target.id, text: t('combat.cracksLabel') }] });
  }
}

// Normaler Angriff, wenn kein Skill passt
export function useBasicAttack(battle, caster) {
  const target = battle.getFocusTarget(caster);
  if (!target) {
    return;
  }
  const attack = caster.basicAttack;
  battle.logAction(caster, attack.name, attack.fx, [target], false);
  heroDealsDamage(battle, caster, target, attack.name, attack.scaling, attack.power, { threat: attack.threat || 1 });
}

// Wen trifft ein Skill? (siehe "target" in data/abilities.js)
// Eine Anweisung kann das Ziel ersetzen (z.B. "Beschleunigt Heiler").
function getTargets(battle, caster, abilityId, ability) {
  const target = caster.orderSettings.abilityTarget[abilityId] || ability.target;
  let targets;
  switch (target) {
    case 'focus':
      targets = [battle.getFocusTarget(caster)];
      break;
    case 'boss':
      // Ohne Boss (Trash-Gruppe) trifft der Skill das normale Ziel
      targets = [battle.boss || battle.getFocusTarget(caster)];
      break;
    case 'allEnemies':
      targets = battle.getLivingEnemies();
      break;
    case 'threeEnemies':
      targets = battle.getThreeEnemies(caster);
      break;
    case 'strongestMinion':
      targets = [battle.getStrongestMinion()];
      break;
    case 'self':
      targets = [caster];
      break;
    case 'lowestAlly':
      targets = [battle.getLowestAlly(caster)];
      break;
    case 'bossTarget':
      targets = [battle.getBossTarget()];
      break;
    case 'allAllies':
      targets = battle.getAlliedHeroes(caster);
      break;
    case 'debuffedAlly':
      targets = [battle.getAlliedHeroes(caster).find((hero) => hero.hasDebuff())];
      break;
    case 'fallenAlly':
      // Das einzige Ziel, das tot sein darf (Wiederbelebung)
      return [battle.getFallenAlly(caster)].filter((target) => target !== null);
    case 'bestDamageAlly':
      targets = [battle.getBestDamageAlly(caster)];
      break;
    case 'allyWithCooldowns':
      targets = [battle.getAllyWithCooldowns(caster)];
      break;
    case 'healerAlly':
      targets = [battle.getAllyWithRole(caster, 'healer')];
      break;
    case 'tankAlly':
      targets = [battle.getAllyWithRole(caster, 'tank')];
      break;
    default:
      throw new Error('Unbekanntes Skill-Ziel: ' + target);
  }
  // Leere Einträge (z.B. kein Ziel gefunden) entfernen
  return targets.filter((target) => target && target.alive);
}

// Einen Skill ausführen. Mana und Abklingzeit werden hier abgezogen.
// power = Stärke des Skills, Anweisungen und Talente können sie verändern (z.B. "Natternbiss 60 % stärker").
// Ein Talent kann einen Skill auch länger halten lassen: Dann wird mit einer Kopie gerechnet, die eine längere Dauer hat.
export function useAbility(battle, caster, abilityId, baseAbility) {
  const durationBonus = caster.getAbilityDurationBonus(abilityId);
  // Länger oder (bei negativem Bonus) kürzer, aber immer mindestens 1 Runde
  const ability = durationBonus !== 0 && baseAbility.duration
    ? { ...baseAbility, duration: Math.max(1, baseAbility.duration + durationBonus) } : baseAbility;
  caster.mana -= caster.getManaCost(ability);
  const powerFactor = caster.getAbilityPowerFactor(abilityId);
  const power = (ability.power || 0) * powerFactor;
  caster.startCooldown(abilityId, ability.cooldown);
  if (ability.oncePerFight) {
    caster.markUsedOnce(abilityId);
  }

  const targets = getTargets(battle, caster, abilityId, ability);
  if (targets.length === 0) {
    return;
  }
  battle.logAction(caster, ability.name, ability.fx, targets, true, abilityId);

  switch (ability.type) {
    case 'damage':
      for (const target of targets) {
        if (target.alive) {
          heroDealsDamage(battle, caster, target, ability.name, ability.scaling, power, ability);
        }
      }
      break;
    case 'dot':
      applyPoison(battle, caster, abilityId, ability, power, targets[0]);
      break;
    case 'heal':
      applyHeal(battle, caster, ability, power, targets[0]);
      break;
    case 'hot':
      applyHealOverTime(battle, caster, abilityId, ability, power, targets);
      break;
    case 'revive':
      applyRevive(battle, caster, ability, ability.value * powerFactor, targets[0]);
      break;
    case 'resetCooldowns':
      targets[0].cooldowns = {};
      battle.addLog(t('combat.resetCooldowns', { caster: caster.name, ability: ability.name, target: targets[0].name }), 'shield',
        { labels: [{ targetId: targets[0].id, text: t('combat.readyLabel') }] });
      break;
    case 'shield':
      applyShield(battle, caster, ability, power, targets);
      break;
    case 'buff':
      applyBuff(battle, caster, abilityId, ability, ability.value * caster.getAbilityPowerFactor(abilityId), targets);
      break;
    case 'taunt':
      applyTaunt(battle, caster, ability);
      break;
    case 'mana':
      caster.mana = Math.min(caster.maxMana, caster.mana + caster.maxMana * ability.value * powerFactor);
      battle.addLog(t('combat.gathers', { caster: caster.name, ability: ability.name }), 'info',
        { labels: [{ targetId: caster.id, text: '+Mana' }], manaUpdate: { targetId: caster.id, mana: Math.round(caster.mana) } });
      break;
    case 'cleanse':
      targets[0].effects = targets[0].effects.filter((effect) => !effect.isDebuff);
      battle.addLog(t('combat.cleansed', { caster: caster.name, ability: ability.name, target: targets[0].name }), 'shield',
        { labels: [{ targetId: targets[0].id, text: t('combat.cleansedLabel') }] });
      break;
    case 'stun':
      applyStun(battle, caster, ability, targets);
      break;
    case 'interrupt':
      applyInterrupt(battle, caster, ability, power, targets[0]);
      break;
    default:
      throw new Error('Unbekannter Skill-Typ: ' + ability.type);
  }
  applyTalentExtras(battle, caster, abilityId, ability, targets);
}

// Zusätzliche Wirkungen, die ein Talent einem Skill gibt (siehe "Konter verteilen" in KONZEPT.md):
//   abilityInterrupts = unterbricht einen unterbrechbaren Boss-Zauber
//   abilityCleanses   = löst Flüche von den Zielen
//   abilityShield     = gibt den Zielen einen Schild
function applyTalentExtras(battle, caster, abilityId, ability, targets) {
  const settings = caster.orderSettings;
  if (settings.abilityInterrupts[abilityId]) {
    interruptCasting(battle, caster, ability.name);
  }
  if (settings.abilityCleanses[abilityId]) {
    for (const target of targets) {
      if (target.hasDebuff && target.hasDebuff()) {
        target.effects = target.effects.filter((effect) => !effect.isDebuff);
        battle.addLog(t('combat.cleansed', { caster: caster.name, ability: ability.name, target: target.name }), 'shield',
          { labels: [{ targetId: target.id, text: t('combat.cleansedLabel') }] });
      }
    }
  }
  const shieldPower = settings.abilityShield[abilityId] || 0;
  if (shieldPower > 0) {
    applyShield(battle, caster, { name: ability.name, scaling: 'magic' }, shieldPower, targets);
  }
}

// Bricht einen unterbrechbaren Boss-Zauber ab (falls gerade einer läuft)
function interruptCasting(battle, caster, actionName) {
  const casting = battle.getCasting();
  if (casting && casting.interruptible) {
    battle.addLog(t('combat.interrupts', { caster: caster.name, action: actionName, spell: casting.name }), 'mechanic',
      { labels: [{ targetId: battle.boss.id, text: t('combat.interruptedLabel') }], cast: { state: 'end' } });
    battle.boss.casting = null;
  }
}

// Gift oder Fluch: macht mehrere Runden lang Schaden (wird am Rundenanfang abgerechnet).
// Mit "growth" wächst der Schaden jede Runde (Hexenmeister).
function applyPoison(battle, caster, abilityId, ability, power, target) {
  const output = rollOutput(battle, caster, ability.scaling, power);
  target.addEffect({
    kind: 'dot',
    name: ability.name,
    sourceId: caster.id,
    abilityId: abilityId,
    damagePerRound: output.amount * caster.getDamageDoneFactor(),
    growth: ability.growth || 0,
    ticks: 0,
    damageType: ability.damageType || 'physical',
    remaining: ability.duration,
    isDebuff: true,
  });
  const word = ability.growth ? t('combat.curseLabel') : t('combat.poisonLabel');
  battle.addLog(t('combat.afflicts', { caster: caster.name, target: target.name, ability: ability.name }), 'damage',
    { labels: [{ targetId: target.id, text: word }] });
}

// Heilung über Zeit: heilt jede Runde ein Stück (wird am Rundenanfang abgerechnet)
function applyHealOverTime(battle, caster, abilityId, ability, power, targets) {
  for (const target of targets) {
    const output = rollOutput(battle, caster, ability.scaling, power);
    target.addEffect({
      kind: 'hot',
      name: ability.name,
      buffId: abilityId,
      sourceId: caster.id,
      healPerRound: output.amount * caster.getHealingFactor(),
      remaining: ability.duration,
    });
  }
  const who = targets.length === 1 ? targets[0].name : t('combat.theGroup');
  battle.addLog(t('combat.envelops', { caster: caster.name, ability: ability.name, who }), 'heal',
    { labels: targets.map((target) => ({ targetId: target.id, text: ability.name })) });
}

// Wiederbelebung: Der Gefallene steht mit einem Teil seines Lebens wieder auf (hpShare, z.B. 0.3, höchstens alles)
function applyRevive(battle, caster, ability, hpShare, target) {
  target.revive(Math.min(1, hpShare));
  caster.healingDone += target.hp;
  battle.addLog(t('combat.revives', { caster: caster.name, ability: ability.name, target: target.name }), 'heal',
    { hits: [target.describeHit(target.hp, 'heal')], labels: [{ targetId: target.id, text: t('combat.revivedLabel') }] });
}

// Buff: Verstärkung für sich selbst, einen Helden oder die ganze Gruppe (siehe "effect" in abilities.js).
// buffId = Skill-id: Derselbe Buff ersetzt sich selbst, statt sich zu stapeln.
// value = Stärke des Buffs (eine Anweisung kann sie verändern, z.B. "Lied der Klingen 40 % stärker")
function applyBuff(battle, caster, abilityId, ability, value, targets) {
  const kind = ability.effect || 'damageTaken';
  for (const target of targets) {
    target.addEffect({ kind: kind, buffId: abilityId, value: value, remaining: ability.duration });
  }
  const who = targets.length === 1 && targets[0] === caster ? '' : t('combat.castsOn', { who: targets.length === 1 ? targets[0].name : t('combat.theGroup') });
  battle.addLog(t('combat.casts', { caster: caster.name, ability: ability.name, on: who }), 'shield',
    { labels: targets.map((target) => ({ targetId: target.id, text: ability.name })) });
}

function applyHeal(battle, caster, ability, power, target) {
  const output = rollOutput(battle, caster, ability.scaling, power);
  const healed = target.heal(output.amount * caster.getHealingFactor());
  caster.healingDone += healed;
  caster.threat += healed * COMBAT_RULES.healThreat * caster.getThreatFactor();
  const critText = output.crit ? t('combat.crit') : '';
  battle.addLog(t('combat.heals', { caster: caster.name, ability: ability.name, target: target.name, crit: critText, amount: healed }), 'heal',
    { hits: [target.describeHit(healed, 'heal', output.crit)] });
}

function applyShield(battle, caster, ability, power, targets) {
  let total = 0;
  const hits = [];
  for (const target of targets) {
    const output = rollOutput(battle, caster, ability.scaling, power);
    const amount = Math.round(output.amount * caster.getHealingFactor());
    target.shield += amount;
    total += amount;
    hits.push(target.describeHit(amount, 'shield'));
  }
  // Schilde zählen in der Auswertung als "Heilung" (Schutz)
  caster.healingDone += total;
  caster.threat += total * COMBAT_RULES.shieldThreat * caster.getThreatFactor();
  const who = targets.length === 1 ? targets[0].name : t('combat.theGroup');
  battle.addLog(t('combat.protects', { caster: caster.name, ability: ability.name, who, amount: total }), 'shield', { hits: hits });
}

function applyTaunt(battle, caster, ability) {
  let highest = 0;
  for (const hero of battle.getLivingHeroes()) {
    highest = Math.max(highest, hero.threat);
  }
  caster.threat = highest * COMBAT_RULES.tauntThreatFactor + 10;
  battle.forcedTarget = { combatant: caster, rounds: ability.duration };
  battle.addLog(t('combat.taunts', { caster: caster.name, ability: ability.name }), 'info');
}

// Betäubung: Gegner verlieren ihren nächsten Zug. Ein Boss-Zauber wird dadurch nur verzögert.
function applyStun(battle, caster, ability, targets) {
  const labels = [];
  const word = ability.label || t('combat.frozenLabel');
  for (const enemy of targets) {
    enemy.addEffect({ kind: 'stun', remaining: ability.duration });
    labels.push({ targetId: enemy.id, text: word });
  }
  const who = targets.length === 1 ? targets[0].name : t('combat.allEnemies');
  battle.addLog(t('combat.stuns', { caster: caster.name, ability: ability.name, who, word }), 'mechanic', { labels: labels });
}

// Unterbrechen: bricht einen unterbrechbaren Boss-Zauber ab
function applyInterrupt(battle, caster, ability, power, target) {
  interruptCasting(battle, caster, ability.name);
  heroDealsDamage(battle, caster, target, ability.name, ability.scaling, power, ability);
}
