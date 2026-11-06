// ============================================================
// ENEMYAI – was Boss und Diener in ihrem Zug tun
// Boss: Mechaniken nach Zeitplan (mit Ankündigung), Raserei, sonst normaler Angriff.
// Diener und Trash: greifen je nach "targeting" den mit der meisten Aggro oder einen zufälligen Helden an.
//   Hält ein Begleiter (Wolf des Jägers) sie fest, greifen sie nur ihn an.
// Normalen Angriffen kann man ausweichen (Mönch), großen Schlägen und Zaubern nicht.
// Raid-Bosse (data/raidBosses.js) können zusätzlich:
//   - Phasen: unter einer Lebensgrenze wechseln sie in die nächste Phase mit anderen Mechaniken
//   - Tank-Stapel: jeder normale Angriff macht den Tank anfälliger; ab einer Grenze übernimmt ein anderer Tank
//   - Gruppenschlag ('groupStrike'): trifft alle Helden einer einzigen Raid-Gruppe
// ============================================================

import { COMBAT_RULES } from '../../data/combatRules.js';
import { getHeroClass } from '../../data/heroClasses.js';
import { MINIONS } from '../../data/enemies.js';
import { getDamageType } from '../../data/damageTypes.js';

export function takeEnemyTurn(battle, enemy) {
  if (enemy.isStunned()) {
    battle.addLog(enemy.name + ' ist eingefroren und kann nicht handeln.', 'info',
      { labels: [{ targetId: enemy.id, text: 'Eingefroren' }] });
    return;
  }
  if (enemy.isMinion) {
    minionAttack(battle, enemy);
    return;
  }
  takeBossTurn(battle, enemy);
}

function minionAttack(battle, minion) {
  const minionData = MINIONS[minion.minionId];
  let target;
  if (minion.boundTo && minion.boundTo.alive) {
    target = minion.boundTo;
  } else if (minionData.targeting === 'threat') {
    target = battle.getBossTarget();
  } else {
    target = battle.random.pick(battle.getLivingHeroes());
  }
  battle.logAction(minion, null, minionData.attackFx, [target], false);
  const source = { key: 'minion:' + minion.minionId, name: minionData.name, type: 'minion' };
  enemyHits(battle, minion, target, 'greift an', 1.0, minionData.attackDamageType || 'physical', source, true);
}

function takeBossTurn(battle, boss) {
  const bossData = boss.bossData;
  if (bossData.isDummy) {
    return;
  }

  // Ein angekündigter Zauber wird jetzt ausgelöst
  if (boss.casting) {
    const mechanic = boss.casting;
    boss.casting = null;
    resolveMechanic(battle, boss, mechanic);
    return;
  }

  // Raserei
  if (bossData.enrageRound !== null && battle.round >= bossData.enrageRound && !boss.enraged) {
    boss.enraged = true;
    battle.addLog(boss.name + ' gerät in Raserei! Der Schaden verdoppelt sich.', 'warning',
      { labels: [{ targetId: boss.id, text: 'RASEREI!' }] });
  }

  // Raid-Boss: Phasenwechsel?
  checkPhaseChange(battle, boss);

  // Ist eine Mechanik fällig? (gezählt wird ab dem Beginn der aktuellen Phase)
  for (const mechanic of getActiveMechanics(boss)) {
    if (isMechanicDue(mechanic, battle.round - boss.phaseStartRound)) {
      if (mechanic.type === 'groupStrike') {
        boss.strikeGroupIndex = battle.random.pick(battle.getLivingGroupIndexes());
      }
      if (mechanic.castTime > 0) {
        boss.casting = mechanic;
        // Beim Gruppenschlag steht dabei, welche Gruppe es treffen wird (die Szene hebt die Reihe hervor)
        const isStrike = mechanic.type === 'groupStrike';
        const castName = isStrike ? mechanic.name + ' auf Gruppe ' + (boss.strikeGroupIndex + 1) : mechanic.name;
        battle.addLog(boss.name + ' bereitet ' + castName + ' vor!', 'warning',
          { cast: { state: 'start', name: castName, groupIndex: isStrike ? boss.strikeGroupIndex : null } });
      } else {
        resolveMechanic(battle, boss, mechanic);
      }
      return;
    }
  }

  const target = battle.getBossTarget();
  battle.logAction(boss, null, bossData.attackFx, [target], false);
  const source = { key: 'attack:' + bossData.id, name: 'Angriffe von ' + boss.name, type: 'attack' };
  enemyHits(battle, boss, target, 'schlägt zu', 1.0, bossData.attackDamageType || 'physical', source, true);
  if (bossData.tankStacks) {
    addTankStack(battle, boss, target);
  }
}

// ---------- Raid: Phasen ----------

// Die Mechaniken der aktuellen Phase (Phase 0 = die normalen mechanics des Bosses)
function getActiveMechanics(boss) {
  if (boss.phaseIndex === 0) {
    return boss.bossData.mechanics;
  }
  return boss.bossData.phases[boss.phaseIndex - 1].mechanics;
}

// Fällt das Leben des Bosses unter die Grenze der nächsten Phase, beginnt sie jetzt
function checkPhaseChange(battle, boss) {
  const phases = boss.bossData.phases;
  if (!phases || boss.phaseIndex >= phases.length) {
    return;
  }
  const nextPhase = phases[boss.phaseIndex];
  if (boss.getHpPercent() >= nextPhase.belowHpPercent) {
    return;
  }
  boss.phaseIndex++;
  boss.phaseStartRound = battle.round;
  battle.addLog(boss.name + ': ' + nextPhase.name + '! ' + nextPhase.text, 'warning',
    { labels: [{ targetId: boss.id, text: nextPhase.name }] });
}

// ---------- Raid: Tank-Stapel und Tankwechsel ----------

// Der getroffene Held bekommt einen Stapel (er nimmt mehr Schaden), alle anderen verlieren einen.
// Hat er zu viele Stapel, übernimmt automatisch ein anderer lebender Tank den Boss.
function addTankStack(battle, boss, target) {
  const rules = boss.bossData.tankStacks;
  for (const hero of battle.getLivingHeroes()) {
    if (hero === target) {
      hero.tankStacks++;
      hero.tankStackValue = rules.damageTakenPerStack;
    } else if (hero.tankStacks > 0) {
      hero.tankStacks--;
    }
  }
  if (!target || !target.alive || target.tankStacks < rules.swapAt) {
    return;
  }
  const otherTank = findSwapTank(battle, target);
  if (!otherTank) {
    if (!boss.warnedNoSwapTank) {
      boss.warnedNoSwapTank = true;
      battle.addLog('Kein zweiter Tank für den Tankwechsel! ' + target.name + ' muss weiter ' + rules.name + ' aushalten.', 'warning',
        { labels: [{ targetId: target.id, text: rules.name + ' ×' + target.tankStacks }] });
    }
    return;
  }
  // Der andere Tank spottet: Er hat jetzt mehr Bedrohung als der bisherige Tank
  otherTank.threat = target.threat * COMBAT_RULES.tauntThreatFactor + 10;
  if (battle.forcedTarget && battle.forcedTarget.combatant === target) {
    battle.forcedTarget = null;
  }
  battle.addLog('Tankwechsel: ' + otherTank.name + ' übernimmt ' + boss.name + ' von ' + target.name +
    ' (' + rules.name + ' ×' + target.tankStacks + ').', 'info',
    { labels: [{ targetId: otherTank.id, text: 'Tankwechsel!' }] });
}

// Ein anderer lebender Tank, am liebsten der mit den wenigsten Stapeln (null, wenn es keinen gibt)
function findSwapTank(battle, currentTank) {
  let best = null;
  for (const hero of battle.getLivingHeroes()) {
    if (hero === currentTank || getHeroClass(hero.classId).role !== 'tank') {
      continue;
    }
    if (hero.tankStacks >= currentTank.tankStacks) {
      continue;
    }
    if (best === null || hero.tankStacks < best.tankStacks) {
      best = hero;
    }
  }
  return best;
}

function isMechanicDue(mechanic, round) {
  return round >= mechanic.firstAt && (round - mechanic.firstAt) % mechanic.every === 0;
}

// Quelle für "Woran es lag" (siehe CauseTracker.js)
function getMechanicSource(mechanic) {
  return { key: 'mechanic:' + mechanic.name, name: mechanic.name, type: 'mechanic', hint: mechanic.hint,
    mechanicType: mechanic.type, interruptible: mechanic.interruptible === true };
}

function resolveMechanic(battle, boss, mechanic) {
  const source = getMechanicSource(mechanic);
  // Ein unterbrechbarer Zauber ist durchgekommen: in der Szene "Verpasst!" zeigen und merken
  const missed = mechanic.interruptible === true && mechanic.castTime > 0;
  if (missed) {
    battle.causes.addMissedInterrupt(mechanic.name);
  }
  const missedLabels = missed ? [{ targetId: boss.id, text: 'Verpasst!' }] : [];
  switch (mechanic.type) {
    case 'tankBuster': {
      const target = battle.getBossTarget();
      battle.logAction(boss, mechanic.name, mechanic.fx, [target], true);
      battle.addLog(boss.name + ': ' + mechanic.name + '!', 'mechanic', { cast: { state: 'end' }, labels: missedLabels });
      enemyHits(battle, boss, target, 'trifft mit voller Wucht', mechanic.power, mechanic.damageType || 'physical', source);
      break;
    }
    case 'groupCast':
      battle.logAction(boss, mechanic.name, mechanic.fx, battle.getLivingHeroes(), true);
      battle.addLog(boss.name + ': ' + mechanic.name + ' trifft die ganze Gruppe!', 'mechanic',
        { cast: { state: 'end' }, labels: missedLabels });
      for (const hero of battle.getLivingHeroes()) {
        enemyHits(battle, boss, hero, 'trifft', mechanic.power, mechanic.damageType || 'physical', source);
      }
      break;
    case 'groupStrike': {
      // Die Gruppe wurde beim Ankündigen gewählt; ist sie inzwischen gefallen, trifft es eine andere
      const groupIndexes = battle.getLivingGroupIndexes();
      if (!groupIndexes.includes(boss.strikeGroupIndex)) {
        boss.strikeGroupIndex = battle.random.pick(groupIndexes);
      }
      const group = battle.getLivingHeroes().filter((hero) => hero.groupIndex === boss.strikeGroupIndex);
      battle.logAction(boss, mechanic.name, mechanic.fx, group, true);
      battle.addLog(boss.name + ': ' + mechanic.name + ' trifft Gruppe ' + (boss.strikeGroupIndex + 1) + '!', 'mechanic',
        { cast: { state: 'end' }, labels: missedLabels });
      for (const hero of group) {
        enemyHits(battle, boss, hero, 'trifft', mechanic.power, mechanic.damageType || 'physical', source);
      }
      break;
    }
    case 'shell': {
      // Panzer: weniger erlittener Schaden, bis er gebrochen wird oder abläuft
      boss.addEffect({
        kind: 'damageTaken', value: -mechanic.damageReduction, remaining: mechanic.duration,
        counterKind: 'shell', points: mechanic.breakPoints, name: mechanic.name, buffId: 'shell',
      });
      battle.causes.addCounterMechanic(mechanic.name, mechanic.type);
      battle.logAction(boss, mechanic.name, mechanic.fx, [boss], true);
      battle.addLog(boss.name + ' hüllt sich in ' + mechanic.name + '! Er nimmt kaum noch Schaden.', 'mechanic',
        { labels: [{ targetId: boss.id, text: mechanic.name + '!' }] });
      break;
    }
    case 'frenzy': {
      // Wutanfall: mehr Schaden, bis er gedämpft wird oder abläuft
      boss.addEffect({
        kind: 'frenzy', value: mechanic.damageBonus, remaining: mechanic.duration,
        counterKind: 'frenzy', points: mechanic.breakPoints, name: mechanic.name, buffId: 'frenzy',
        cause: source, // Schaden im Wutanfall zählt für "Woran es lag" zu dieser Mechanik
      });
      battle.causes.addCounterMechanic(mechanic.name, mechanic.type);
      battle.logAction(boss, mechanic.name, mechanic.fx, [boss], true);
      battle.addLog(boss.name + ' gerät in ' + mechanic.name + '! Er schlägt viel härter zu.', 'mechanic',
        { labels: [{ targetId: boss.id, text: mechanic.name + '!' }] });
      break;
    }
    case 'frontWave': {
      const frontRow = battle.getLivingHeroes().filter((hero) => hero.row === 'front');
      battle.logAction(boss, mechanic.name, mechanic.fx, frontRow, true);
      battle.addLog(boss.name + ': ' + mechanic.name + ' trifft die vordere Reihe!', 'mechanic',
        { cast: { state: 'end' }, labels: missedLabels });
      for (const hero of frontRow) {
        enemyHits(battle, boss, hero, 'trifft', mechanic.power, mechanic.damageType || 'physical', source);
      }
      break;
    }
    case 'summon': {
      const spawned = [];
      for (let i = 0; i < mechanic.count; i++) {
        spawned.push(battle.spawnMinion(mechanic.minion).describe());
      }
      battle.logAction(boss, mechanic.name, mechanic.fx, [], true);
      battle.addLog(boss.name + ': ' + mechanic.name + '! ' + mechanic.count + ' Diener erscheinen.', 'mechanic',
        { spawn: spawned });
      break;
    }
    case 'curse': {
      const target = battle.random.pick(battle.getLivingHeroes());
      target.addEffect({
        kind: 'dot',
        name: mechanic.name,
        sourceId: boss.id,
        damagePerRound: boss.attack * mechanic.power,
        damageType: mechanic.damageType || 'physical',
        remaining: mechanic.duration,
        isDebuff: true,
        cause: source, // für "Woran es lag"
      });
      battle.logAction(boss, mechanic.name, mechanic.fx, [target], true);
      battle.addLog(boss.name + ' belegt ' + target.name + ' mit ' + mechanic.name + '.', 'mechanic',
        { labels: [{ targetId: target.id, text: 'Verflucht' }] });
      break;
    }
    default:
      throw new Error('Unbekannte Mechanik: ' + mechanic.type);
  }
}

// Ein Gegner trifft einen Helden. damageType = Schadensart (siehe data/damageTypes.js)
// source = woher der Schaden kommt (für "Woran es lag", siehe CauseTracker.js)
// dodgeable = true bei normalen Angriffen: Dann kann der Held ausweichen (Mönch).
function enemyHits(battle, enemy, target, verb, power, damageType, source, dodgeable = false) {
  if (!target) {
    return;
  }
  if (dodgeable && target.getDodgeChance() > 0 && battle.random.next() < target.getDodgeChance()) {
    battle.addLog(target.name + ' weicht dem Angriff von ' + enemy.name + ' aus.', 'info',
      { labels: [{ targetId: target.id, text: 'Ausgewichen' }] });
    return;
  }
  const variation = battle.random.between(1 - COMBAT_RULES.enemyVariation, 1 + COMBAT_RULES.enemyVariation);
  const enrageFactor = enemy.enraged ? 2 : 1;
  // Wutanfall (Mechanik 'frenzy'): zusätzlicher Schaden
  const frenzy = enemy.effects.find((effect) => effect.kind === 'frenzy') || null;
  const frenzyFactor = frenzy ? 1 + frenzy.value : 1;
  const crit = battle.random.next() < COMBAT_RULES.enemyCritChance;
  const critFactor = crit ? COMBAT_RULES.critMultiplier : 1;
  const result = target.takeDamage(enemy.attack * power * variation * enrageFactor * frenzyFactor * critFactor, false, damageType);
  enemy.damageDone += result.damage;
  // In Raserei zählt der Schaden zur Raserei: Der Kampf hat zu lange gedauert
  if (enemy.enraged) {
    battle.causes.addDamage({ key: 'enrage:' + enemy.name, name: 'Raserei von ' + enemy.name, type: 'enrage' }, result.damage);
  } else if (frenzy) {
    battle.causes.addDamage(frenzy.cause, result.damage);
  } else {
    battle.causes.addDamage(source, result.damage);
  }

  const critText = crit ? ' kritisch' : '';
  let text = enemy.name + ' ' + verb + critText + ': ' + target.name + ' verliert ' + result.damage + ' Leben';
  if (damageType !== 'physical') {
    text += ' durch ' + getDamageType(damageType).name; // z.B. "… verliert 37 Leben durch Säure"
  }
  if (result.absorbed > 0) {
    text += ' (' + result.absorbed + ' vom Schild abgefangen)';
  }
  battle.addLog(text + '.', crit ? 'crit' : 'damage',
    { hits: [target.describeHit(result.damage, 'damage', crit, result.absorbed, damageType)] });
  logSavedByTalent(battle, target, result);
  if (!target.alive) {
    battle.addLog(target.name + ' fällt!', 'death', { heroFallen: true });
  }
}

// Talent "Letztes Gefecht" u.ä. hat einen Helden gerettet: in Bericht und Szene zeigen
export function logSavedByTalent(battle, target, result) {
  if (result.savedByTalent) {
    battle.addLog(target.name + ' überlebt mit letzter Kraft!', 'warning',
      { labels: [{ targetId: target.id, text: 'Letzte Kraft!' }] });
  }
}
