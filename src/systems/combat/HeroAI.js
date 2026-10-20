// ============================================================
// HEROAI – entscheidet, was ein Held in seinem Zug tut
// Geht die Skills nach Priorität durch und nimmt den ersten, der
//   1. bereit ist (keine Abklingzeit),
//   2. genug Mana hat (und die Mana-Reserve aus den Anweisungen nicht angreift) und
//   3. dessen Bedingung gerade zutrifft. Die Bedingung steht unter "when" in data/abilities.js,
//      kann aber durch eine Anweisung des Spielers ersetzt werden (data/heroOrders.js).
// Passt nichts, gibt es einen normalen Angriff.
// ============================================================

import { ABILITIES } from '../../data/abilities.js';
import { COMBAT_RULES } from '../../data/combatRules.js';

// Beim Rückzug machen die Helden keinen Schaden mehr, sie heilen und schützen sich nur
const RETREAT_SKILL_TYPES = ['heal', 'shield', 'buff', 'mana', 'cleanse'];

// Gibt die id des gewählten Skills zurück, oder null für einen normalen Angriff
export function chooseAbility(battle, hero) {
  const abilityIds = hero.abilityIds.slice();
  abilityIds.sort((a, b) => ABILITIES[a].priority - ABILITIES[b].priority);

  for (const abilityId of abilityIds) {
    const ability = ABILITIES[abilityId];
    if (!hero.isReady(abilityId)) {
      continue;
    }
    if (battle.retreating && !RETREAT_SKILL_TYPES.includes(ability.type)) {
      continue;
    }
    if (hero.mana < ability.manaCost) {
      continue;
    }
    if (breaksManaReserve(hero, ability)) {
      continue;
    }
    const condition = hero.orderSettings.abilityWhen[abilityId] || ability.when;
    if (isConditionMet(battle, hero, condition, ability)) {
      return abilityId;
    }
  }
  return null;
}

// Anweisung "Mana aufheben": Schadens-Skills nur, wenn danach noch genug Mana übrig ist
function breaksManaReserve(hero, ability) {
  const reserve = hero.orderSettings.manaReserve;
  if (!reserve || ability.type !== 'damage' || ability.manaCost === 0) {
    return false;
  }
  return (hero.mana - ability.manaCost) / hero.maxMana < reserve;
}

// Alle Bedingungen, die in data/abilities.js unter "when" (oder in Anweisungen) stehen können
function isConditionMet(battle, hero, condition, ability) {
  const casting = battle.getCasting();
  const enemiesThere = battle.getLivingEnemies().length > 0 && !battle.isDummyFight();
  const bossTarget = battle.getBossTarget();
  const lowestAlly = battle.getLowestAlly();
  // Eine Anweisung "Heilen ab …" ersetzt die normale Heilschwelle
  const healThreshold = hero.orderSettings.healThreshold || COMBAT_RULES.healThreshold;

  switch (condition) {
    case 'always':
      return battle.getFocusTarget(hero) !== null;

    // Sobald der Skill bereit ist
    case 'ready':
      return true;

    // Nie benutzen
    case 'never':
      return false;

    // Die Gegner greifen gerade jemand anderen an
    case 'notTanking':
      return enemiesThere && bossTarget !== hero;

    // Ein Tank-Buster auf mich wird vorbereitet, oder ich habe wenig Leben
    case 'busterIncomingOrSelfLow': {
      const busterComing = casting !== null && casting.type === 'tankBuster' && bossTarget === hero;
      return busterComing || hero.getHpPercent() < COMBAT_RULES.selfDefenseThreshold;
    }

    // Nur wenn ein Tank-Buster angekündigt ist (bei Selbst-Skills: nur, wenn er mich trifft)
    case 'busterIncoming': {
      const busterComing = casting !== null && casting.type === 'tankBuster';
      return busterComing && (ability.target !== 'self' || bossTarget === hero);
    }

    case 'allyHurt':
      return lowestAlly !== null && lowestAlly.getHpPercent() < healThreshold;

    case 'allyBadlyHurt':
      return lowestAlly !== null && lowestAlly.getHpPercent() < healThreshold - 0.2;

    case 'lowMana':
      return hero.getManaPercent() < 0.3;

    case 'halfMana':
      return hero.getManaPercent() < 0.5;

    // Der, den die Gegner angreifen, hat keinen Schild
    case 'targetUnshielded':
      return enemiesThere && bossTarget !== null && bossTarget.shield <= 0;

    // Gruppenschaden wird vorbereitet, oder die Gruppe ist schon angeschlagen
    case 'groupThreatened': {
      const groupHitComing = casting !== null && (casting.type === 'groupCast' || casting.type === 'frontWave');
      return groupHitComing || battle.getAverageHeroHpPercent() < healThreshold;
    }

    // Nur wenn Gruppenschaden angekündigt ist
    case 'groupHitIncoming':
      return casting !== null && (casting.type === 'groupCast' || casting.type === 'frontWave');

    case 'allyDebuffed':
      return battle.getLivingHeroes().some((ally) => ally.hasDebuff());

    case 'multipleEnemies':
      return battle.getLivingEnemies().length >= 2;

    case 'manyEnemies':
      return battle.getLivingEnemies().length >= 3;

    case 'bossCasting':
      return casting !== null;

    case 'bossCastingInterruptible':
      return casting !== null && casting.interruptible;

    // Das Ziel hat noch kein Gift von mir
    case 'targetWithoutPoison': {
      const target = battle.getFocusTarget(hero);
      if (!target) {
        return false;
      }
      return !target.effects.some((effect) => effect.kind === 'dot' && effect.sourceId === hero.id);
    }

    default:
      throw new Error('Unbekannte Skill-Bedingung: ' + condition);
  }
}
