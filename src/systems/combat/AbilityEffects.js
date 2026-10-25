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

// Held (oder Begleiter) fügt einem Gegner Schaden zu (mit Aggro).
// Buffs auf den eigenen Schaden (Lied der Klingen, Wundenzorn) wirken hier.
// Mit Blutrausch heilt ein Teil des Schadens den Angreifer selbst.
export function heroDealsDamage(battle, caster, target, actionName, scaling, power, options = {}) {
  const output = rollOutput(battle, caster, scaling, power, options.critBonus || 0);
  const damageType = options.damageType || 'physical';
  const result = target.takeDamage(output.amount * caster.getDamageDoneFactor(), false, damageType);
  caster.damageDone += result.damage;
  caster.threat += result.damage * (options.threat || 1);

  const critText = output.crit ? ' kritisch' : '';
  battle.addLog(caster.name + ': ' + actionName + ' trifft ' + target.name + critText + ' für ' + result.damage + '.',
    output.crit ? 'crit' : 'damage',
    { hits: [target.describeHit(result.damage, 'damage', output.crit, result.absorbed, damageType)] });
  if (!target.alive) {
    battle.addLog(target.name + ' ist besiegt!', 'death');
  }

  const lifesteal = caster.getLifesteal();
  if (lifesteal > 0 && result.damage > 0) {
    const healed = caster.heal(result.damage * lifesteal);
    if (healed > 0) {
      battle.addLog(caster.name + ' saugt ' + healed + ' Leben.', 'heal', { hits: [caster.describeHit(healed, 'heal')] });
    }
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
    case 'fallenAlly':
      // Das einzige Ziel, das tot sein darf (Wiederbelebung)
      return [battle.getFallenAlly()].filter((target) => target !== null);
    case 'bestDamageAlly':
      targets = [battle.getBestDamageAlly(caster)];
      break;
    case 'allyWithCooldowns':
      targets = [battle.getAllyWithCooldowns(caster)];
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
  if (ability.oncePerFight) {
    caster.markUsedOnce(abilityId);
  }

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
      applyPoison(battle, caster, abilityId, ability, targets[0]);
      break;
    case 'heal':
      applyHeal(battle, caster, ability, targets[0]);
      break;
    case 'hot':
      applyHealOverTime(battle, caster, abilityId, ability, targets);
      break;
    case 'revive':
      applyRevive(battle, caster, ability, targets[0]);
      break;
    case 'resetCooldowns':
      targets[0].cooldowns = {};
      battle.addLog(caster.name + ': ' + ability.name + '! Die Skills von ' + targets[0].name + ' sind sofort wieder bereit.', 'shield',
        { labels: [{ targetId: targets[0].id, text: 'Bereit!' }] });
      break;
    case 'shield':
      applyShield(battle, caster, ability, targets);
      break;
    case 'buff':
      applyBuff(battle, caster, abilityId, ability, targets);
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

// Gift oder Fluch: macht mehrere Runden lang Schaden (wird am Rundenanfang abgerechnet).
// Mit "growth" wächst der Schaden jede Runde (Hexenmeister).
function applyPoison(battle, caster, abilityId, ability, target) {
  const output = rollOutput(battle, caster, ability.scaling, ability.power);
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
  const word = ability.growth ? 'Fluch' : 'Gift';
  battle.addLog(caster.name + ' belegt ' + target.name + ' mit ' + ability.name + '.', 'damage',
    { labels: [{ targetId: target.id, text: word }] });
}

// Heilung über Zeit: heilt jede Runde ein Stück (wird am Rundenanfang abgerechnet)
function applyHealOverTime(battle, caster, abilityId, ability, targets) {
  for (const target of targets) {
    const output = rollOutput(battle, caster, ability.scaling, ability.power);
    target.addEffect({
      kind: 'hot',
      name: ability.name,
      buffId: abilityId,
      sourceId: caster.id,
      healPerRound: output.amount,
      remaining: ability.duration,
    });
  }
  const who = targets.length === 1 ? targets[0].name : 'die Gruppe';
  battle.addLog(caster.name + ': ' + ability.name + ' umhüllt ' + who + '.', 'heal',
    { labels: targets.map((target) => ({ targetId: target.id, text: ability.name })) });
}

// Wiederbelebung: Der Gefallene steht mit einem Teil seines Lebens wieder auf
function applyRevive(battle, caster, ability, target) {
  target.revive(ability.value);
  caster.healingDone += target.hp;
  battle.addLog(caster.name + ': ' + ability.name + '! ' + target.name + ' steht wieder auf.', 'heal',
    { hits: [target.describeHit(target.hp, 'heal')], labels: [{ targetId: target.id, text: 'Wiederbelebt!' }] });
}

// Buff: Verstärkung für sich selbst, einen Helden oder die ganze Gruppe (siehe "effect" in abilities.js).
// buffId = Skill-id: Derselbe Buff ersetzt sich selbst, statt sich zu stapeln.
function applyBuff(battle, caster, abilityId, ability, targets) {
  const kind = ability.effect || 'damageTaken';
  for (const target of targets) {
    target.addEffect({ kind: kind, buffId: abilityId, value: ability.value, remaining: ability.duration });
  }
  const who = targets.length === 1 && targets[0] === caster ? '' : ' auf ' + (targets.length === 1 ? targets[0].name : 'die Gruppe');
  battle.addLog(caster.name + ' wirkt ' + ability.name + who + '.', 'shield',
    { labels: targets.map((target) => ({ targetId: target.id, text: ability.name })) });
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
  const word = ability.label || 'Eingefroren';
  for (const enemy of targets) {
    enemy.addEffect({ kind: 'stun', remaining: ability.duration });
    labels.push({ targetId: enemy.id, text: word });
  }
  const who = targets.length === 1 ? targets[0].name : 'alle Gegner';
  battle.addLog(caster.name + ': ' + ability.name + ' trifft ' + who + ' (' + word + ')!', 'mechanic', { labels: labels });
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
