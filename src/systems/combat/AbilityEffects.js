// ============================================================
// ABILITYEFFECTS – was passiert, wenn ein Held einen Skill oder Angriff benutzt
// Ablauf: Ziele bestimmen → Aktion melden (für Animation und Skill-Namen in der Szene)
//         → Wirkung ausrechnen (Schaden, Heilung, Schild …) und in den Kampfbericht schreiben.
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

// Held fügt einem Gegner Schaden zu (mit Aggro)
export function heroDealsDamage(battle, caster, target, actionName, scaling, power, options = {}) {
  const output = rollOutput(battle, caster, scaling, power, options.critBonus || 0);
  const result = target.takeDamage(output.amount);
  caster.damageDone += result.damage;
  caster.threat += result.damage * (options.threat || 1);

  const critText = output.crit ? ' kritisch' : '';
  battle.addLog(caster.name + ': ' + actionName + ' trifft ' + target.name + critText + ' für ' + result.damage + '.',
    output.crit ? 'crit' : 'damage',
    { hits: [target.describeHit(result.damage, 'damage', output.crit, result.absorbed)] });
  if (!target.alive) {
    battle.addLog(target.name + ' ist besiegt!', 'death');
  }
  return result.damage;
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
function getTargets(battle, caster, ability) {
  let targets;
  switch (ability.target) {
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
    case 'self':
      targets = [caster];
      break;
    case 'lowestAlly':
      targets = [battle.getLowestAlly()];
      break;
    case 'bossTarget':
      targets = [battle.getBossTarget()];
      break;
    case 'allAllies':
      targets = battle.getLivingHeroes();
      break;
    case 'debuffedAlly':
      targets = [battle.getLivingHeroes().find((hero) => hero.hasDebuff())];
      break;
    default:
      throw new Error('Unbekanntes Skill-Ziel: ' + ability.target);
  }
  // Leere Einträge (z.B. kein Ziel gefunden) entfernen
  return targets.filter((target) => target && target.alive);
}

// Einen Skill ausführen. Mana und Abklingzeit werden hier abgezogen.
export function useAbility(battle, caster, abilityId, ability) {
  caster.mana -= ability.manaCost;
  caster.startCooldown(abilityId, ability.cooldown);

  const targets = getTargets(battle, caster, ability);
  if (targets.length === 0) {
    return;
  }
  battle.logAction(caster, ability.name, ability.fx, targets, true, abilityId);

  switch (ability.type) {
    case 'damage':
      for (const target of targets) {
        if (target.alive) {
          heroDealsDamage(battle, caster, target, ability.name, ability.scaling, ability.power, ability);
        }
      }
      break;
    case 'dot':
      applyPoison(battle, caster, ability, targets[0]);
      break;
    case 'heal':
      applyHeal(battle, caster, ability, targets[0]);
      break;
    case 'shield':
      applyShield(battle, caster, ability, targets);
      break;
    case 'buff':
      caster.addEffect({ kind: 'damageTaken', value: ability.value, remaining: ability.duration });
      battle.addLog(caster.name + ' benutzt ' + ability.name + '.', 'shield');
      break;
    case 'taunt':
      applyTaunt(battle, caster, ability);
      break;
    case 'mana':
      caster.mana = Math.min(caster.maxMana, caster.mana + caster.maxMana * ability.value);
      battle.addLog(caster.name + ' sammelt sich: ' + ability.name + '.', 'info',
        { labels: [{ targetId: caster.id, text: '+Mana' }], manaUpdate: { targetId: caster.id, mana: Math.round(caster.mana) } });
      break;
    case 'cleanse':
      targets[0].effects = targets[0].effects.filter((effect) => !effect.isDebuff);
      battle.addLog(caster.name + ': ' + ability.name + ' befreit ' + targets[0].name + ' vom Fluch.', 'shield',
        { labels: [{ targetId: targets[0].id, text: 'Fluch gelöst' }] });
      break;
    case 'stun':
      applyStun(battle, caster, ability, targets);
      break;
    case 'interrupt':
      applyInterrupt(battle, caster, ability, targets[0]);
      break;
    default:
      throw new Error('Unbekannter Skill-Typ: ' + ability.type);
  }
}

// Gift: macht mehrere Runden lang Schaden (wird am Rundenanfang abgerechnet)
function applyPoison(battle, caster, ability, target) {
  const output = rollOutput(battle, caster, ability.scaling, ability.power);
  target.addEffect({
    kind: 'dot',
    name: ability.name,
    sourceId: caster.id,
    damagePerRound: output.amount,
    remaining: ability.duration,
    isDebuff: true,
  });
  battle.addLog(caster.name + ' vergiftet ' + target.name + ' mit ' + ability.name + '.', 'damage',
    { labels: [{ targetId: target.id, text: 'Gift' }] });
}

function applyHeal(battle, caster, ability, target) {
  const output = rollOutput(battle, caster, ability.scaling, ability.power);
  const healed = target.heal(output.amount);
  caster.healingDone += healed;
  caster.threat += healed * COMBAT_RULES.healThreat;
  const critText = output.crit ? ' kritisch' : '';
  battle.addLog(caster.name + ': ' + ability.name + ' heilt ' + target.name + critText + ' um ' + healed + '.', 'heal',
    { hits: [target.describeHit(healed, 'heal', output.crit)] });
}

function applyShield(battle, caster, ability, targets) {
  let total = 0;
  const hits = [];
  for (const target of targets) {
    const output = rollOutput(battle, caster, ability.scaling, ability.power);
    const amount = Math.round(output.amount);
    target.shield += amount;
    total += amount;
    hits.push(target.describeHit(amount, 'shield'));
  }
  // Schilde zählen in der Auswertung als "Heilung" (Schutz)
  caster.healingDone += total;
  caster.threat += total * COMBAT_RULES.shieldThreat;
  const who = targets.length === 1 ? targets[0].name : 'die Gruppe';
  battle.addLog(caster.name + ': ' + ability.name + ' schützt ' + who + ' (' + total + ').', 'shield', { hits: hits });
}

function applyTaunt(battle, caster, ability) {
  let highest = 0;
  for (const hero of battle.getLivingHeroes()) {
    highest = Math.max(highest, hero.threat);
  }
  caster.threat = highest * COMBAT_RULES.tauntThreatFactor + 10;
  battle.forcedTarget = { combatant: caster, rounds: ability.duration };
  battle.addLog(caster.name + ': ' + ability.name + '! Der Gegner wendet sich ihm zu.', 'info');
}

// Betäubung: Gegner verlieren ihren nächsten Zug. Ein Boss-Zauber wird dadurch nur verzögert.
function applyStun(battle, caster, ability, targets) {
  const labels = [];
  for (const enemy of targets) {
    enemy.addEffect({ kind: 'stun', remaining: ability.duration });
    labels.push({ targetId: enemy.id, text: 'Eingefroren' });
  }
  battle.addLog(caster.name + ': ' + ability.name + ' friert alle Gegner ein!', 'mechanic', { labels: labels });
}

// Unterbrechen: bricht einen unterbrechbaren Boss-Zauber ab
function applyInterrupt(battle, caster, ability, target) {
  const boss = battle.boss;
  const casting = battle.getCasting();
  if (casting && casting.interruptible) {
    battle.addLog(caster.name + ': ' + ability.name + ' unterbricht ' + casting.name + '!', 'mechanic',
      { labels: [{ targetId: boss.id, text: 'UNTERBROCHEN!' }], cast: { state: 'end' } });
    boss.casting = null;
  }
  heroDealsDamage(battle, caster, target, ability.name, ability.scaling, ability.power, ability);
}
