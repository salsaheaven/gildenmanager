// ============================================================
// ABILITYEFFECTS – was passiert, wenn ein Held einen Skill oder Angriff benutzt
// Rechnet Schaden, Heilung, Schilde, Buffs usw. aus und schreibt den Kampfbericht.
// ============================================================

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

// Held fügt einem Gegner Schaden zu (mit Taktik-Faktor und Aggro)
export function heroDealsDamage(battle, caster, target, actionName, scaling, power, options = {}) {
  const output = rollOutput(battle, caster, scaling, power, options.critBonus || 0);
  const result = target.takeDamage(output.amount * battle.tactic.damageMultiplier);
  caster.damageDone += result.damage;
  caster.threat += result.damage * (options.threat || 1);

  const critText = output.crit ? ' kritisch' : '';
  battle.addLog(caster.name + ': ' + actionName + ' trifft ' + target.name + critText + ' für ' + result.damage + '.',
    output.crit ? 'crit' : 'damage',
    { sourceId: caster.id, hits: [target.describeHit(result.damage, 'damage', output.crit, result.absorbed)] });
  if (!target.alive) {
    battle.addLog(target.name + ' ist besiegt!', 'death');
  }
  return result.damage;
}

// Normaler Angriff, wenn kein Skill passt
export function useBasicAttack(battle, caster) {
  const target = battle.getFocusTarget();
  if (!target) {
    return;
  }
  const attack = caster.basicAttack;
  heroDealsDamage(battle, caster, target, attack.name, attack.scaling, attack.power, { threat: attack.threat || 1 });
}

// Einen Skill ausführen. Mana und Abklingzeit werden hier abgezogen.
export function useAbility(battle, caster, abilityId, ability) {
  caster.mana -= ability.manaCost;
  caster.startCooldown(abilityId, ability.cooldown);

  switch (ability.type) {
    case 'damage':
      applyDamage(battle, caster, ability);
      break;
    case 'dot':
      applyPoison(battle, caster, abilityId, ability);
      break;
    case 'heal':
      applyHeal(battle, caster, ability);
      break;
    case 'shield':
      applyShield(battle, caster, ability);
      break;
    case 'buff':
      caster.addEffect({ kind: 'damageTaken', value: ability.value, remaining: ability.duration });
      battle.addLog(caster.name + ' benutzt ' + ability.name + '.', 'shield',
        { sourceId: caster.id, labels: [{ targetId: caster.id, text: ability.name }] });
      break;
    case 'taunt':
      applyTaunt(battle, caster, ability);
      break;
    case 'mana':
      caster.mana = Math.min(caster.maxMana, caster.mana + caster.maxMana * ability.value);
      battle.addLog(caster.name + ' sammelt sich: ' + ability.name + '.', 'info',
        { labels: [{ targetId: caster.id, text: '+Mana' }] });
      break;
    case 'cleanse':
      applyCleanse(battle, caster, ability);
      break;
    case 'stun':
      applyStun(battle, caster, ability);
      break;
    case 'interrupt':
      applyInterrupt(battle, caster, ability);
      break;
    default:
      throw new Error('Unbekannter Skill-Typ: ' + ability.type);
  }
}

function applyDamage(battle, caster, ability) {
  const targets = ability.target === 'allEnemies' ? battle.getLivingEnemies() : [battle.getFocusTarget()];
  for (const target of targets) {
    if (target && target.alive) {
      heroDealsDamage(battle, caster, target, ability.name, ability.scaling, ability.power, ability);
    }
  }
}

// Gift: macht mehrere Runden lang Schaden (wird am Rundenanfang abgerechnet)
function applyPoison(battle, caster, abilityId, ability) {
  const target = battle.getFocusTarget();
  if (!target) {
    return;
  }
  const output = rollOutput(battle, caster, ability.scaling, ability.power);
  target.addEffect({
    kind: 'dot',
    name: ability.name,
    sourceId: caster.id,
    damagePerRound: output.amount * battle.tactic.damageMultiplier,
    remaining: ability.duration,
    isDebuff: true,
  });
  battle.addLog(caster.name + ' vergiftet ' + target.name + ' mit ' + ability.name + '.', 'damage',
    { sourceId: caster.id, labels: [{ targetId: target.id, text: 'Gift' }] });
}

function applyHeal(battle, caster, ability) {
  const target = battle.getLowestAlly();
  if (!target) {
    return;
  }
  const output = rollOutput(battle, caster, ability.scaling, ability.power);
  const healed = target.heal(output.amount);
  caster.healingDone += healed;
  caster.threat += healed * COMBAT_RULES.healThreat;
  const critText = output.crit ? ' kritisch' : '';
  battle.addLog(caster.name + ': ' + ability.name + ' heilt ' + target.name + critText + ' um ' + healed + '.', 'heal',
    { sourceId: caster.id, hits: [target.describeHit(healed, 'heal', output.crit)] });
}

function applyShield(battle, caster, ability) {
  let targets;
  if (ability.target === 'allAllies') {
    targets = battle.getLivingHeroes();
  } else {
    targets = [battle.getBossTarget()];
  }
  let total = 0;
  const hits = [];
  for (const target of targets) {
    if (!target) {
      continue;
    }
    const output = rollOutput(battle, caster, ability.scaling, ability.power);
    const amount = Math.round(output.amount);
    target.shield += amount;
    total += amount;
    hits.push(target.describeHit(amount, 'shield'));
  }
  // Schilde zählen in der Auswertung als "Heilung" (Schutz)
  caster.healingDone += total;
  caster.threat += total * COMBAT_RULES.shieldThreat;
  const who = targets.length === 1 && targets[0] ? targets[0].name : 'die Gruppe';
  battle.addLog(caster.name + ': ' + ability.name + ' schützt ' + who + ' (' + total + ').', 'shield',
    { sourceId: caster.id, hits: hits });
}

function applyTaunt(battle, caster, ability) {
  let highest = 0;
  for (const hero of battle.getLivingHeroes()) {
    highest = Math.max(highest, hero.threat);
  }
  caster.threat = highest * COMBAT_RULES.tauntThreatFactor + 10;
  battle.forcedTarget = { combatant: caster, rounds: ability.duration };
  battle.addLog(caster.name + ': ' + ability.name + '! Der Gegner wendet sich ihm zu.', 'info',
    { sourceId: caster.id, labels: [{ targetId: caster.id, text: 'Herausforderung!' }] });
}

function applyCleanse(battle, caster, ability) {
  const target = battle.getLivingHeroes().find((hero) => hero.hasDebuff());
  if (!target) {
    return;
  }
  target.effects = target.effects.filter((effect) => !effect.isDebuff);
  battle.addLog(caster.name + ': ' + ability.name + ' befreit ' + target.name + ' vom Fluch.', 'shield',
    { sourceId: caster.id, labels: [{ targetId: target.id, text: 'Fluch gelöst' }] });
}

// Betäubung: Gegner verlieren ihren nächsten Zug. Ein Boss-Zauber wird dadurch nur verzögert.
function applyStun(battle, caster, ability) {
  const labels = [];
  for (const enemy of battle.getLivingEnemies()) {
    enemy.addEffect({ kind: 'stun', remaining: ability.duration });
    labels.push({ targetId: enemy.id, text: 'Eingefroren' });
  }
  battle.addLog(caster.name + ': ' + ability.name + ' friert alle Gegner ein!', 'mechanic',
    { sourceId: caster.id, labels: labels });
}

// Unterbrechen: bricht einen unterbrechbaren Boss-Zauber ab
function applyInterrupt(battle, caster, ability) {
  const boss = battle.boss;
  if (boss.casting && boss.casting.interruptible) {
    battle.addLog(caster.name + ': ' + ability.name + ' unterbricht ' + boss.casting.name + '!', 'mechanic',
      { sourceId: caster.id, labels: [{ targetId: boss.id, text: 'UNTERBROCHEN!' }], cast: { state: 'end' } });
    boss.casting = null;
  }
  heroDealsDamage(battle, caster, boss, ability.name, ability.scaling, ability.power, ability);
}
