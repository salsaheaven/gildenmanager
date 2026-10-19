// ============================================================
// COMBATSIMULATOR – spielt einen ganzen Kampf Runde für Runde durch
//
// Ablauf jeder Runde:
//   1. Rundenanfang: Abklingzeiten, Mana, Gift/Flüche, Effekte laufen ab
//   2. Alle Helden handeln (in der Reihenfolge der Gruppe)
//   3. Alle Gegner handeln (Diener, dann Boss)
// Der Kampf endet, wenn der Boss fällt, alle Helden gefallen sind
// oder die maximale Rundenzahl erreicht ist.
//
// Gleicher Seed = gleicher Kampf. So lassen sich Kämpfe wiederholen und testen.
// ============================================================

import { Random } from '../../core/Random.js';
import { Combatant } from './Combatant.js';
import { Battle } from './Battle.js';
import { chooseAbility } from './HeroAI.js';
import { takeEnemyTurn } from './EnemyAI.js';
import { useAbility, useBasicAttack } from './AbilityEffects.js';
import { ABILITIES } from '../../data/abilities.js';
import { COMBAT_RULES } from '../../data/combatRules.js';
import { getBoss } from '../../data/enemies.js';
import { getTactic } from '../../data/tactics.js';

// Macht aus einem Helden (entities/Hero.js) einen Kämpfer
export function createHeroCombatant(hero) {
  const heroClass = hero.getClass();
  return new Combatant({
    id: 'hero-' + hero.id,
    heroId: hero.id,
    classId: hero.classId,
    name: hero.name,
    side: 'hero',
    row: heroClass.row,
    stats: hero.getStats(),
    abilityIds: heroClass.abilities,
    basicAttack: heroClass.basicAttack,
    orderSettings: hero.getOrderSettings(),
  });
}

export function createBossCombatant(bossData) {
  return new Combatant({
    id: 'boss',
    name: bossData.name,
    side: 'enemy',
    stats: bossData.stats,
    bossData: bossData,
  });
}

// options = { heroes: Hero-Liste, bossId, tacticId, seed, recordLog }
export function simulateBattle(options) {
  const bossData = getBoss(options.bossId);
  const random = new Random(options.seed);
  const heroes = options.heroes.map((hero) => createHeroCombatant(hero));
  const boss = createBossCombatant(bossData);
  const battle = new Battle(heroes, boss, getTactic(options.tacticId), random, options.recordLog);

  const maxRounds = bossData.isDummy ? bossData.dummyRounds : COMBAT_RULES.maxRounds;
  // Wer zu Beginn dabei ist (für die Kampfszene)
  const startingCombatants = heroes.concat([boss]).map((combatant) => combatant.describe());
  battle.addLog('Der Kampf gegen ' + boss.name + ' beginnt!', 'info');
  battle.takeSnapshot();

  while (!battle.isOver() && battle.round < maxRounds) {
    battle.round++;
    startRound(battle);

    for (const hero of battle.heroes) {
      if (battle.isOver()) {
        break;
      }
      if (hero.alive && !hero.isStunned()) {
        takeHeroTurn(battle, hero);
      }
    }

    // Kopie der Liste, weil der Boss während seines Zuges neue Diener rufen kann
    for (const enemy of battle.enemies.slice()) {
      if (battle.isOver()) {
        break;
      }
      if (enemy.alive) {
        takeEnemyTurn(battle, enemy);
      }
    }

    battle.takeSnapshot();
  }

  const result = createResult(battle, bossData, maxRounds);
  result.startingCombatants = startingCombatants;
  return result;
}

function takeHeroTurn(battle, hero) {
  warnIfOutOfMana(battle, hero);
  const abilityId = chooseAbility(battle, hero);
  if (abilityId) {
    useAbility(battle, hero, abilityId, ABILITIES[abilityId]);
  } else {
    useBasicAttack(battle, hero);
  }
}

// Geht einem Heiler oder Zauberer das Mana aus, gibt es (einmal) eine Warnung.
// Erholt sich das Mana wieder über die Hälfte, kann später erneut gewarnt werden.
function warnIfOutOfMana(battle, hero) {
  if (hero.maxMana <= 0) {
    return;
  }
  const manaPercent = hero.getManaPercent();
  if (manaPercent < COMBAT_RULES.lowManaWarning && !hero.warnedLowMana) {
    hero.warnedLowMana = true;
    battle.addLog(hero.name + ' hat kaum noch Mana!', 'warning', { labels: [{ targetId: hero.id, text: 'Kein Mana!' }] });
  } else if (manaPercent > 0.5) {
    hero.warnedLowMana = false;
  }
}

// Rundenanfang: Abklingzeiten, Mana, Gift und Flüche, auslaufende Effekte
function startRound(battle) {
  if (battle.forcedTarget) {
    battle.forcedTarget.rounds--;
    if (battle.forcedTarget.rounds <= 0) {
      battle.forcedTarget = null;
    }
  }

  const everyone = battle.heroes.concat(battle.enemies);
  for (const combatant of everyone) {
    if (!combatant.alive) {
      continue;
    }
    combatant.startRound();

    for (const effect of combatant.effects.slice()) {
      if (effect.kind === 'dot') {
        tickDamageOverTime(battle, combatant, effect, everyone);
      }
      effect.remaining--;
    }
    combatant.effects = combatant.effects.filter((effect) => effect.remaining > 0);
  }
}

function tickDamageOverTime(battle, target, effect, everyone) {
  if (!target.alive) {
    return;
  }
  const result = target.takeDamage(effect.damagePerRound, true);
  const source = everyone.find((combatant) => combatant.id === effect.sourceId);
  if (source) {
    source.damageDone += result.damage;
  }
  battle.addLog(effect.name + ' verletzt ' + target.name + ' um ' + result.damage + '.', 'damage',
    { hits: [target.describeHit(result.damage, 'damage')] });
  if (!target.alive) {
    battle.addLog(target.name + (target.side === 'hero' ? ' fällt!' : ' ist besiegt!'), 'death');
  }
}

function createResult(battle, bossData, maxRounds) {
  const victory = !battle.boss.alive;
  const timedOut = !victory && battle.getLivingHeroes().length > 0;

  if (bossData.isDummy) {
    battle.addLog('Die Zeit ist um. Gemessen wurde der Schaden über ' + maxRounds + ' Runden.', 'info');
  } else if (victory) {
    battle.addLog(battle.boss.name + ' ist besiegt! Sieg!', 'death');
  } else if (timedOut) {
    battle.addLog('Die Gruppe ist erschöpft und muss sich zurückziehen. Niederlage.', 'warning');
  } else {
    battle.addLog('Die ganze Gruppe ist gefallen. Niederlage.', 'warning');
  }

  return {
    bossId: bossData.id,
    isDummy: bossData.isDummy || false,
    victory: victory,
    timedOut: timedOut,
    rounds: battle.round,
    bossHpPercent: battle.boss.getHpPercent(),
    heroes: battle.heroes.map((hero) => ({
      combatantId: hero.id,
      heroId: hero.heroId,
      classId: hero.classId,
      name: hero.name,
      alive: hero.alive,
      hp: hero.hp,
      maxHp: hero.maxHp,
      damageDone: Math.round(hero.damageDone),
      healingDone: Math.round(hero.healingDone),
      damageTaken: Math.round(hero.damageTaken),
    })),
    log: battle.log,
    snapshots: battle.snapshots,
  };
}
