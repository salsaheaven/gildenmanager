// ============================================================
// HEROAI – entscheidet, was ein Held in seinem Zug tut
// Geht die Skills nach Priorität durch und nimmt den ersten, der
//   1. bereit ist (keine Abklingzeit),
//   2. genug Mana hat und
//   3. dessen Bedingung ("when" in data/abilities.js) gerade zutrifft.
// Passt nichts, gibt es einen normalen Angriff.
// ============================================================

import { ABILITIES } from '../../data/abilities.js';

// Gibt die id des gewählten Skills zurück, oder null für einen normalen Angriff
export function chooseAbility(battle, hero) {
  const abilityIds = hero.abilityIds.slice();
  abilityIds.sort((a, b) => ABILITIES[a].priority - ABILITIES[b].priority);

  for (const abilityId of abilityIds) {
    const ability = ABILITIES[abilityId];
    if (!hero.isReady(abilityId)) {
      continue;
    }
    if (hero.mana < ability.manaCost) {
      continue;
    }
    if (isConditionMet(battle, hero, ability.when)) {
      return abilityId;
    }
  }
  return null;
}

// Alle Bedingungen, die in data/abilities.js unter "when" stehen können
function isConditionMet(battle, hero, condition) {
  const tactic = battle.tactic;
  const boss = battle.boss;
  const bossTarget = battle.getBossTarget();
  const lowestAlly = battle.getLowestAlly();

  switch (condition) {
    case 'always':
      return battle.getFocusTarget() !== null;

    // Der Boss greift gerade jemand anderen an
    case 'notTanking':
      return boss.alive && !boss.bossData.isDummy && bossTarget !== hero;

    // Ein Tank-Buster auf mich wird vorbereitet, oder ich habe wenig Leben
    case 'busterIncomingOrSelfLow': {
      const busterComing = boss.casting && boss.casting.type === 'tankBuster' && bossTarget === hero;
      return busterComing || hero.getHpPercent() < tactic.selfDefenseThreshold;
    }

    case 'allyHurt':
      return lowestAlly !== null && lowestAlly.getHpPercent() < tactic.healThreshold;

    case 'allyBadlyHurt':
      return lowestAlly !== null && lowestAlly.getHpPercent() < tactic.healThreshold - 0.2;

    case 'lowMana':
      return hero.getManaPercent() < 0.3;

    // Der, den der Boss angreift, hat keinen Schild
    case 'targetUnshielded':
      return boss.alive && !boss.bossData.isDummy && bossTarget !== null && bossTarget.shield <= 0;

    // Gruppenschaden wird vorbereitet, oder die Gruppe ist schon angeschlagen
    case 'groupThreatened': {
      const groupHitComing = boss.casting && (boss.casting.type === 'groupCast' || boss.casting.type === 'frontWave');
      return groupHitComing || battle.getAverageHeroHpPercent() < tactic.healThreshold;
    }

    case 'allyDebuffed':
      return battle.getLivingHeroes().some((ally) => ally.hasDebuff());

    case 'multipleEnemies':
      return battle.getLivingEnemies().length >= 2;

    case 'bossCasting':
      return boss.casting !== null;

    case 'bossCastingInterruptible':
      return boss.casting !== null && boss.casting.interruptible;

    // Das Ziel hat noch kein Gift von mir
    case 'targetWithoutPoison': {
      const target = battle.getFocusTarget();
      if (!target) {
        return false;
      }
      return !target.effects.some((effect) => effect.kind === 'dot' && effect.sourceId === hero.id);
    }

    default:
      throw new Error('Unbekannte Skill-Bedingung: ' + condition);
  }
}
