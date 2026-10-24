// ============================================================
// ENEMYAI – was Boss und Diener in ihrem Zug tun
// Boss: Mechaniken nach Zeitplan (mit Ankündigung), Raserei, sonst normaler Angriff.
// Diener und Trash: greifen je nach "targeting" den mit der meisten Aggro oder einen zufälligen Helden an.
// ============================================================

import { COMBAT_RULES } from '../../data/combatRules.js';
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
  if (minionData.targeting === 'threat') {
    target = battle.getBossTarget();
  } else {
    target = battle.random.pick(battle.getLivingHeroes());
  }
  battle.logAction(minion, null, minionData.attackFx, [target], false);
  enemyHits(battle, minion, target, 'greift an', 1.0, minionData.attackDamageType || 'physical');
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

  // Ist eine Mechanik fällig?
  for (const mechanic of bossData.mechanics) {
    if (isMechanicDue(mechanic, battle.round)) {
      if (mechanic.castTime > 0) {
        boss.casting = mechanic;
        battle.addLog(boss.name + ' bereitet ' + mechanic.name + ' vor!', 'warning',
          { cast: { state: 'start', name: mechanic.name } });
      } else {
        resolveMechanic(battle, boss, mechanic);
      }
      return;
    }
  }

  const target = battle.getBossTarget();
  battle.logAction(boss, null, bossData.attackFx, [target], false);
  enemyHits(battle, boss, target, 'schlägt zu', 1.0, bossData.attackDamageType || 'physical');
}

function isMechanicDue(mechanic, round) {
  return round >= mechanic.firstAt && (round - mechanic.firstAt) % mechanic.every === 0;
}

function resolveMechanic(battle, boss, mechanic) {
  switch (mechanic.type) {
    case 'tankBuster': {
      const target = battle.getBossTarget();
      battle.logAction(boss, mechanic.name, mechanic.fx, [target], true);
      battle.addLog(boss.name + ': ' + mechanic.name + '!', 'mechanic', { cast: { state: 'end' } });
      enemyHits(battle, boss, target, 'trifft mit voller Wucht', mechanic.power, mechanic.damageType || 'physical');
      break;
    }
    case 'groupCast':
      battle.logAction(boss, mechanic.name, mechanic.fx, battle.getLivingHeroes(), true);
      battle.addLog(boss.name + ': ' + mechanic.name + ' trifft die ganze Gruppe!', 'mechanic', { cast: { state: 'end' } });
      for (const hero of battle.getLivingHeroes()) {
        enemyHits(battle, boss, hero, 'trifft', mechanic.power, mechanic.damageType || 'physical');
      }
      break;
    case 'frontWave': {
      const frontRow = battle.getLivingHeroes().filter((hero) => hero.row === 'front');
      battle.logAction(boss, mechanic.name, mechanic.fx, frontRow, true);
      battle.addLog(boss.name + ': ' + mechanic.name + ' trifft die vordere Reihe!', 'mechanic', { cast: { state: 'end' } });
      for (const hero of frontRow) {
        enemyHits(battle, boss, hero, 'trifft', mechanic.power, mechanic.damageType || 'physical');
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
function enemyHits(battle, enemy, target, verb, power, damageType) {
  if (!target) {
    return;
  }
  const variation = battle.random.between(1 - COMBAT_RULES.enemyVariation, 1 + COMBAT_RULES.enemyVariation);
  const enrageFactor = enemy.enraged ? 2 : 1;
  const crit = battle.random.next() < COMBAT_RULES.enemyCritChance;
  const critFactor = crit ? COMBAT_RULES.critMultiplier : 1;
  const result = target.takeDamage(enemy.attack * power * variation * enrageFactor * critFactor, false, damageType);
  enemy.damageDone += result.damage;

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
  if (!target.alive) {
    battle.addLog(target.name + ' fällt!', 'death');
  }
}
