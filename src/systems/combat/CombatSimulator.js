// ============================================================
// COMBATSIMULATOR – spielt Kämpfe Runde für Runde durch
//
// Ablauf jeder Runde:
//   1. Rundenanfang: Abklingzeiten, Mana, Gift/Flüche, Effekte laufen ab, evtl. Rückzug beginnen
//   2. Alle Helden handeln (in der Reihenfolge der Gruppe). Mit Beschleunigung handelt ein Held zweimal.
//   3. Begleiter handeln (z.B. der Wolf des Jägers)
//   4. Alle Gegner handeln (Diener/Trash, dann Boss)
// Ein Kampf endet, wenn die Gegner besiegt sind, alle Helden gefallen sind,
// der Rückzug geschafft ist oder die maximale Rundenzahl erreicht ist.
//
// Drei Einstiege:
//   simulateBattle   = ein einzelner Bosskampf mit frischen Helden (Kampf-Labor)
//   simulateRun      = ein ganzer Dungeon-Run: Begegnungen nacheinander, Leben und Mana gehen mit
//   runEncounter     = eine Begegnung mit bereits vorhandenen Kämpfern (wird von beiden benutzt)
//
// Gleicher Seed = gleicher Kampf. So lassen sich Kämpfe wiederholen und testen.
// ============================================================

import { getDefenseConstant } from '../../data/scaling.js';
import { Random } from '../../core/Random.js';
import { Combatant } from './Combatant.js';
import { Battle, scaleEnemyStats } from './Battle.js';
import { chooseAbility } from './HeroAI.js';
import { takeEnemyTurn, logSavedByTalent } from './EnemyAI.js';
import { applyGroupAuras } from './OrderSettings.js';
import { useAbility, useBasicAttack, heroDealsDamage } from './AbilityEffects.js';
import { ABILITIES } from '../../data/abilities.js';
import { COMBAT_RULES } from '../../data/combatRules.js';
import { getBoss, MINIONS } from '../../data/enemies.js';
import { getHeroClass } from '../../data/heroClasses.js';
import { getDungeon } from '../../data/dungeons.js';
import { getRetreatRule } from '../../data/retreatRules.js';
import { TASK_RULES } from '../../data/heroTasks.js';
import { combineSupplyEffects, applySupplyEffects, applyManaAtStart, applyRestHealth } from './SupplyEffects.js';

// Macht aus einem Helden (entities/Hero.js) einen Kämpfer
// Talente mit Werte-Bonus (z.B. +20 % Leben) wirken hier auf die Werte.
export function createHeroCombatant(hero) {
  const heroClass = hero.getClass();
  const settings = hero.getOrderSettings();
  const stats = { ...hero.getStats() };
  for (const statName in settings.statBonus) {
    stats[statName] = Math.round((stats[statName] || 0) * (1 + settings.statBonus[statName]));
  }
  return new Combatant({
    id: 'hero-' + hero.id,
    heroId: hero.id,
    classId: hero.classId,
    name: hero.name,
    side: 'hero',
    row: heroClass.row,
    stats: stats,
    resistances: hero.getResistances(),
    abilityIds: heroClass.abilities,
    basicAttack: heroClass.basicAttack,
    orderSettings: settings,
    passive: heroClass.passive,
  });
}

export function createBossCombatant(bossData, level = 1) {
  return new Combatant({
    id: 'boss',
    name: bossData.name,
    side: 'enemy',
    stats: scaleEnemyStats(bossData.stats, level),
    bossData: bossData,
  });
}

// ---------- Einstiege ----------

// Ein einzelner Bosskampf. options = { heroes: Hero-Liste, bossId, seed, recordLog,
//                                      enemyLevel (Stufe des Bosses, Standard 1) }
export function simulateBattle(options) {
  const random = new Random(options.seed);
  const heroes = options.heroes.map((hero) => createHeroCombatant(hero));
  applyGroupAuras(heroes);
  return runEncounter(heroes, { type: 'boss', bossId: options.bossId }, random, options.recordLog, {},
    options.enemyLevel || 1);
}

// Ein ganzer Dungeon-Run.
// options = { heroes, dungeonId, retreatRuleId, seed, recordLog, supplies }
//   supplies = freiwillig: mitgenommene Verbrauchsgüter (Liste von ids, siehe data/consumables.js)
//   scouted  = freiwillig: true, wenn der Dungeon erkundet wurde (etwas mehr Schaden, siehe data/heroTasks.js)
// Gibt { dungeonId, outcome, encounters, heroes } zurück.
//   outcome = 'success', 'defeat', 'retreat' oder 'timeout'
export function simulateRun(options) {
  const dungeon = getDungeon(options.dungeonId);
  const retreatRule = getRetreatRule(options.retreatRuleId || 'never');
  const random = new Random(options.seed);
  const heroes = options.heroes.map((hero) => createHeroCombatant(hero));
  applyGroupAuras(heroes);
  const supplyEffects = combineSupplyEffects(options.supplies || []);
  if (options.scouted) {
    supplyEffects.damageDone += TASK_RULES.scoutingDamageBonus;
  }
  applySupplyEffects(heroes, supplyEffects);

  const encounters = [];
  let outcome = 'success';

  for (let i = 0; i < dungeon.encounters.length; i++) {
    // Rückzug zwischen zwei Begegnungen: sicher, es wird nicht mehr gekämpft
    if (i > 0 && shouldRetreatByRule(heroes, retreatRule)) {
      outcome = 'retreat';
      break;
    }
    if (i > 0) {
      restBetweenEncounters(heroes);
      applyRestHealth(heroes, supplyEffects);
    }
    applyManaAtStart(heroes, supplyEffects);

    const retreatOptions = { rule: retreatRule };
    const result = runEncounter(heroes, dungeon.encounters[i], random, options.recordLog, retreatOptions,
      dungeon.level);
    encounters.push(result);

    if (result.outcome !== 'victory') {
      outcome = result.outcome;
      break;
    }
  }

  return {
    dungeonId: dungeon.id,
    outcome: outcome,
    encounters: encounters,
    heroes: heroes.map((hero) => ({ heroId: hero.heroId, name: hero.name, alive: hero.alive, hp: hero.hp, maxHp: hero.maxHp })),
  };
}

// Eine Begegnung (Trash-Gruppe oder Boss) mit vorhandenen Helden-Kämpfern.
// encounter = { type: 'boss', bossId } oder { type: 'trash', name, enemies: [...] }
// retreatOptions = { rule (aus retreatRules.js) }
// level          = Stufe der Gegner (Stufe des Dungeons, siehe data/scaling.js)
export function runEncounter(heroes, encounter, random, recordLog, retreatOptions, level = 1) {
  // Die Statistik (Schadensmesser) zählt pro Begegnung neu
  for (const hero of heroes) {
    hero.damageDone = 0;
    hero.healingDone = 0;
    hero.damageTaken = 0;
  }

  const bossData = encounter.type === 'boss' ? getBoss(encounter.bossId) : null;
  // Rüstung wirkt je nach Stufe des Kampfs unterschiedlich stark
  for (const hero of heroes) {
    hero.defenseConstant = getDefenseConstant(level);
  }
  const boss = bossData ? createBossCombatant(bossData, level) : null;
  if (boss) {
    boss.defenseConstant = getDefenseConstant(level);
  }
  const battle = new Battle(heroes, boss, random, recordLog, level);
  if (encounter.type === 'trash') {
    for (const enemyId of encounter.enemies) {
      battle.spawnMinion(enemyId);
    }
  }
  // Begleiter kommen zu jeder Begegnung frisch dazu (nur, wenn ihr Held noch lebt)
  for (const hero of heroes) {
    if (hero.alive && getHeroClass(hero.classId).pet) {
      battle.summonPet(hero);
    }
  }

  const encounterName = bossData ? bossData.name : encounter.name;
  const maxRounds = bossData && bossData.isDummy ? bossData.dummyRounds : COMBAT_RULES.maxRounds;
  // Wer zu Beginn dabei ist (für die Kampfszene), mit dem aktuellen Leben aus vorigen Begegnungen
  const startingCombatants = heroes.concat(battle.pets, battle.enemies).map((combatant) => combatant.describe());
  battle.addLog('Der Kampf gegen ' + encounterName + ' beginnt!', 'info');
  battle.takeSnapshot();

  while (!battle.isOver() && battle.round < maxRounds) {
    battle.round++;
    startRound(battle);
    checkRetreat(battle, retreatOptions);

    for (const hero of battle.heroes) {
      if (battle.isOver()) {
        break;
      }
      if (hero.alive && !hero.isStunned()) {
        takeHeroTurn(battle, hero);
        // Beschleunigung (Chronomant): gleich noch ein Zug
        if (hero.alive && hero.hasEffect('haste') && !battle.isOver()) {
          takeHeroTurn(battle, hero);
        }
      }
    }

    for (const pet of battle.pets) {
      if (battle.isOver()) {
        break;
      }
      if (pet.alive && !pet.isStunned() && !battle.retreating) {
        takePetTurn(battle, pet);
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

    advanceRetreat(battle);
    battle.takeSnapshot();
  }

  const result = createResult(battle, encounter, encounterName, bossData, maxRounds);
  result.startingCombatants = startingCombatants;
  return result;
}

// ---------- Züge ----------

function takeHeroTurn(battle, hero) {
  warnIfOutOfMana(battle, hero);
  const abilityId = chooseAbility(battle, hero);
  if (abilityId) {
    useAbility(battle, hero, abilityId, ABILITIES[abilityId]);
  } else if (!battle.retreating) {
    // Beim Rückzug wird nicht angegriffen
    useBasicAttack(battle, hero);
  }
}

// Begleiter: stellt sich einem Diener entgegen (der dann nur noch ihn angreift) und beißt ihn.
// Am liebsten nimmt er einen, der zufällig angreift, denn den kann der Tank nicht halten.
// Gibt es keinen Diener, greift er das normale Ziel an (z.B. den Boss).
function takePetTurn(battle, pet) {
  if (!pet.boundEnemy || !pet.boundEnemy.alive) {
    pet.boundEnemy = null;
    const free = battle.getLivingMinions().filter((minion) => !minion.boundTo || !minion.boundTo.alive);
    const randomAttacker = free.find((minion) => MINIONS[minion.minionId].targeting === 'random');
    const chosen = randomAttacker || free[0] || null;
    if (chosen) {
      pet.boundEnemy = chosen;
      chosen.boundTo = pet;
      battle.addLog(pet.name + ' stellt sich ' + chosen.name + ' entgegen.', 'info',
        { labels: [{ targetId: chosen.id, text: 'Gebunden' }] });
    }
  }
  const target = pet.boundEnemy || battle.getFocusTarget(pet);
  if (!target) {
    return;
  }
  battle.logAction(pet, pet.basicAttack.name, pet.basicAttack.fx, [target], false);
  heroDealsDamage(battle, pet, target, pet.basicAttack.name, pet.basicAttack.scaling, pet.basicAttack.power);
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
    battle.causes.addOutOfMana(hero.name);
    battle.addLog(hero.name + ' hat kaum noch Mana!', 'warning', { labels: [{ targetId: hero.id, text: 'Kein Mana!' }] });
  } else if (manaPercent > 0.5) {
    hero.warnedLowMana = false;
  }
}

// ---------- Rückzug ----------

function countFallen(heroes) {
  return heroes.filter((hero) => !hero.alive).length;
}

function shouldRetreatByRule(heroes, rule) {
  return rule.afterFallen !== null && countFallen(heroes) >= rule.afterFallen;
}

// Am Rundenanfang: Soll der Rückzug beginnen (laut Rückzugsregel)?
function checkRetreat(battle, retreatOptions) {
  if (battle.retreating || !retreatOptions) {
    return;
  }
  const byRule = retreatOptions.rule && shouldRetreatByRule(battle.heroes, retreatOptions.rule);
  if (!byRule) {
    return;
  }
  battle.retreating = true;
  battle.retreatRoundsLeft = COMBAT_RULES.retreatRounds;
  const labels = battle.getLivingHeroes().map((hero) => ({ targetId: hero.id, text: 'Rückzug!' }));
  battle.addLog('RÜCKZUG! Die Gruppe kämpft sich zum Ausgang durch.', 'warning', { labels: labels });
}

// Am Rundenende: Rückzug eine Runde weiter, evtl. geschafft
function advanceRetreat(battle) {
  if (!battle.retreating || battle.getLivingHeroes().length === 0) {
    return;
  }
  battle.retreatRoundsLeft--;
  if (battle.retreatRoundsLeft <= 0) {
    battle.retreatFinished = true;
  }
}

// Zwischen zwei Begegnungen: etwas Leben und Mana zurück, alle Effekte enden. Gefallene bleiben gefallen.
function restBetweenEncounters(heroes) {
  for (const hero of heroes) {
    if (!hero.alive) {
      continue;
    }
    hero.heal(hero.maxHp * COMBAT_RULES.restHealthRegain);
    hero.mana = Math.min(hero.maxMana, hero.mana + hero.maxMana * COMBAT_RULES.restManaRegain);
    hero.shield = 0;
    hero.threat = 0;
    hero.effects = [];
    hero.cooldowns = {};
    hero.usedOnce = {};
    hero.warnedLowMana = false;
  }
}

// ---------- Rundenanfang ----------

// Abklingzeiten, Mana, Gift und Flüche, auslaufende Effekte
function startRound(battle) {
  if (battle.forcedTarget) {
    battle.forcedTarget.rounds--;
    if (battle.forcedTarget.rounds <= 0) {
      battle.forcedTarget = null;
    }
  }

  const everyone = battle.heroes.concat(battle.pets, battle.enemies);
  for (const combatant of everyone) {
    if (!combatant.alive) {
      continue;
    }
    combatant.startRound();

    for (const effect of combatant.effects.slice()) {
      if (effect.kind === 'dot') {
        tickDamageOverTime(battle, combatant, effect, everyone);
      }
      if (effect.kind === 'hot') {
        tickHealOverTime(battle, combatant, effect, everyone);
      }
      effect.remaining--;
    }
    combatant.effects = combatant.effects.filter((effect) => effect.remaining > 0);
  }
}

// Gift und Flüche. Mit "growth" wird der Schaden jede Runde größer (Hexenmeister).
function tickDamageOverTime(battle, target, effect, everyone) {
  if (!target.alive) {
    return;
  }
  const growthFactor = 1 + (effect.growth || 0) * (effect.ticks || 0);
  effect.ticks = (effect.ticks || 0) + 1;
  const result = target.takeDamage(effect.damagePerRound * growthFactor, true, effect.damageType || 'physical');
  const source = everyone.find((combatant) => combatant.id === effect.sourceId);
  if (source) {
    source.damageDone += result.damage;
  }
  // Flüche von Bossen zählen für "Woran es lag" zu ihrer Mechanik
  if (target.side === 'hero' && effect.cause) {
    battle.causes.addDamage(effect.cause, result.damage);
  }
  battle.addLog(effect.name + ' verletzt ' + target.name + ' um ' + result.damage + '.', 'damage',
    { hits: [target.describeHit(result.damage, 'damage', false, 0, effect.damageType || 'physical')] });
  logSavedByTalent(battle, target, result);
  if (!target.alive) {
    battle.addLog(target.name + (target.side === 'hero' ? ' fällt!' : ' ist besiegt!'), 'death',
      { heroFallen: target.side === 'hero' });
  }
}

// Heilung über Zeit (Druide, Barde)
function tickHealOverTime(battle, target, effect, everyone) {
  const healed = target.heal(effect.healPerRound);
  const source = everyone.find((combatant) => combatant.id === effect.sourceId);
  if (source) {
    source.healingDone += healed;
  }
  if (healed > 0) {
    battle.addLog(effect.name + ' heilt ' + target.name + ' um ' + healed + '.', 'heal',
      { hits: [target.describeHit(healed, 'heal')] });
  }
}

// ---------- Ergebnis ----------

// Wie viel Leben haben die Gegner noch? (Boss: sein Leben, Trash: alle zusammen)
function getEnemyHpPercent(battle) {
  if (battle.boss) {
    return battle.boss.getHpPercent();
  }
  let hp = 0;
  let maxHp = 0;
  for (const enemy of battle.enemies) {
    hp += enemy.hp;
    maxHp += enemy.maxHp;
  }
  return maxHp > 0 ? hp / maxHp : 0;
}

function createResult(battle, encounter, encounterName, bossData, maxRounds) {
  let outcome;
  if (battle.isWon()) {
    outcome = 'victory';
  } else if (battle.retreatFinished) {
    outcome = 'retreat';
  } else if (battle.getLivingHeroes().length === 0) {
    outcome = 'defeat';
  } else {
    outcome = 'timeout';
  }

  if (bossData && bossData.isDummy) {
    battle.addLog('Die Zeit ist um. Gemessen wurde der Schaden über ' + maxRounds + ' Runden.', 'info');
  } else if (outcome === 'victory') {
    battle.addLog(encounterName + (bossData ? ' ist besiegt! Sieg!' : ': alle Gegner besiegt!'), 'death');
  } else if (outcome === 'retreat') {
    battle.addLog('Die Gruppe hat sich in Sicherheit gebracht.', 'warning');
  } else if (outcome === 'timeout') {
    battle.addLog('Die Gruppe ist erschöpft und muss sich zurückziehen. Niederlage.', 'warning');
  } else {
    battle.addLog('Die ganze Gruppe ist gefallen. Niederlage.', 'warning');
  }

  return {
    encounterType: encounter.type,
    encounterName: encounterName,
    bossId: bossData ? bossData.id : null,
    isDummy: Boolean(bossData && bossData.isDummy),
    outcome: outcome,
    victory: outcome === 'victory',
    timedOut: outcome === 'timeout',
    rounds: battle.round,
    bossHpPercent: getEnemyHpPercent(battle),
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
    causes: battle.causes.toResult(), // woher der Schaden kam (siehe CauseTracker.js)
  };
}
