// ============================================================
// CHANCEESTIMATOR – berechnet die Siegchance
// Simuliert denselben Kampf viele Male mit verschiedenem Zufall und zählt aus:
// Wie oft gewonnen? Wie oft ist jemand gefallen? Wer fällt am häufigsten?
// ============================================================

import { simulateBattle } from './CombatSimulator.js';
import { COMBAT_RULES } from '../../data/combatRules.js';

// options = { heroes, bossId, tacticId, count (optional), seed (optional) }
export function estimateChances(options) {
  const count = options.count || COMBAT_RULES.simulationCount;
  const baseSeed = options.seed || 1;

  let wins = 0;
  let totalRounds = 0;
  let fightsWithFallen = 0;
  let totalDamage = 0;
  const fallsByHero = {};
  for (const hero of options.heroes) {
    fallsByHero[hero.id] = 0;
  }

  for (let i = 0; i < count; i++) {
    const result = simulateBattle({
      heroes: options.heroes,
      bossId: options.bossId,
      tacticId: options.tacticId,
      seed: baseSeed + i * 7919, // weit auseinanderliegende Seeds = unterschiedliche Kämpfe
      recordLog: false,
    });

    if (result.victory) {
      wins++;
    }
    totalRounds += result.rounds;

    let anyFallen = false;
    for (const heroResult of result.heroes) {
      totalDamage += heroResult.damageDone;
      if (!heroResult.alive) {
        fallsByHero[heroResult.heroId]++;
        anyFallen = true;
      }
    }
    if (anyFallen) {
      fightsWithFallen++;
    }
  }

  const fallRateByHero = {};
  for (const heroId in fallsByHero) {
    fallRateByHero[heroId] = fallsByHero[heroId] / count;
  }

  return {
    count: count,
    winRate: wins / count,
    averageRounds: totalRounds / count,
    fallenRate: fightsWithFallen / count, // Anteil der Kämpfe, in denen mindestens ein Held fällt
    fallRateByHero: fallRateByHero,
    averageGroupDamagePerRound: totalDamage / totalRounds,
  };
}
