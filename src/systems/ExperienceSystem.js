// ============================================================
// EXPERIENCESYSTEM – verteilt nach einem Run Erfahrung und Verletzungen
// Die Zahlen stehen in data/experience.js.
//
// Ablauf für jeden Helden der Gruppe:
//   1. EP für alle gewonnenen Begegnungen (höhere Dungeon-Stufe = mehr EP)
//   2. weniger EP, wenn der Held über der Stufe des Dungeons liegt
//   3. doppelte EP (Aufhol-Erfahrung), wenn er weit unter den besten Helden der Gilde liegt
//   4. Wer gefallen ist, wird verletzt
// ============================================================

import { EXPERIENCE, INJURIES } from '../data/experience.js';

// EP für die ganze Gruppe aus einem Run (bevor sie pro Held angepasst werden)
// result  = Ergebnis von simulateRun, dungeon = Dungeon-Daten
export function calculateRunXp(result, dungeon) {
  const levelFactor = 1 + (dungeon.level - 1) * EXPERIENCE.xpGrowthPerDungeonLevel;
  let xp = 0;
  for (let i = 0; i < result.encounters.length; i++) {
    if (result.encounters[i].outcome === 'victory') {
      const type = dungeon.encounters[i].type;
      xp += EXPERIENCE.encounterXp[type] * levelFactor;
    }
  }
  return Math.round(xp);
}

// Durchschnittslevel der stärksten Helden der Gilde (Maßstab für die Aufhol-Erfahrung)
export function getTopHeroAverageLevel(guild) {
  const levels = guild.heroes.map((hero) => hero.level);
  levels.sort((a, b) => b - a);
  const top = levels.slice(0, EXPERIENCE.catchUpTopHeroes);
  if (top.length === 0) {
    return 1;
  }
  return top.reduce((sum, level) => sum + level, 0) / top.length;
}

// Bekommt dieser Held Aufhol-Erfahrung?
export function getsCatchUpXp(hero, guild) {
  return hero.level <= getTopHeroAverageLevel(guild) - EXPERIENCE.catchUpLevelGap;
}

// Faktor auf die EP für einen Helden (Abzug für zu leichte Dungeons, Aufhol-Bonus)
export function getHeroXpFactor(hero, dungeon, guild) {
  let factor = 1;
  const levelsAbove = hero.level - dungeon.level - EXPERIENCE.overLevelGrace;
  if (levelsAbove > 0) {
    factor = Math.max(EXPERIENCE.minOverLevelFactor, 1 - levelsAbove * EXPERIENCE.overLevelPenaltyPerLevel);
  }
  if (getsCatchUpXp(hero, guild)) {
    factor = factor * EXPERIENCE.catchUpMultiplier;
  }
  return factor;
}

// Verteilt EP und Verletzungen an die echten Helden der Gilde.
// Gibt pro Held zurück: { heroId, name, xp, levelsGained, newLevel, catchUp, injured }
export function applyRunResults(guild, result, dungeon) {
  const groupXp = calculateRunXp(result, dungeon);
  const outcomes = [];

  for (const heroResult of result.heroes) {
    const hero = guild.findHero(heroResult.heroId);
    if (!hero) {
      continue;
    }
    // Erst den Faktor bestimmen, dann EP geben (sonst zählt das neue Level schon mit)
    const catchUp = getsCatchUpXp(hero, guild);
    const xp = Math.round(groupXp * getHeroXpFactor(hero, dungeon, guild));
    const levelsGained = hero.addXp(xp);

    const injured = !heroResult.alive;
    if (injured) {
      hero.injurySeconds = INJURIES.injurySeconds;
    }

    outcomes.push({
      heroId: hero.id,
      name: hero.name,
      xp: xp,
      levelsGained: levelsGained,
      newLevel: hero.level,
      catchUp: catchUp,
      injured: injured,
    });
  }
  return outcomes;
}
