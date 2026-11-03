// Tests für die Auto-Gruppe (füllt leere Plätze mit freien Helden).

import { describe, it, expect } from 'vitest';
import { Game } from '../src/core/Game.js';
import { getPositionId } from '../src/data/groupRules.js';

const START_TEAM = ['paladin', 'rogue', 'mage', 'bard', 'druid'];

// Gegründete Gilde mit count Helden
function gameWithHeroes(count, seed = 51) {
  const game = new Game(seed);
  game.foundGuild('', START_TEAM);
  game.guild.gold = 100000;
  while (game.guild.heroes.length < count) {
    if (game.guild.candidates.length === 0) {
      game.refreshCandidates();
    }
    game.hireHero(game.guild.candidates[0].id);
  }
  return game;
}

describe('Auto-Gruppe', () => {
  it('füllt eine leere Gruppe mit Tank, Heiler und 3 weiteren', () => {
    const game = gameWithHeroes(5);
    const ids = game.suggestAutoGroup('bearCave', []);
    expect(ids).toHaveLength(5);
    const positions = ids.map((heroId) => getPositionId(game.guild.findHero(heroId).getClass()));
    expect(positions).toContain('tank');
    expect(positions).toContain('healer');
  });

  it('gewählte Helden bleiben drin, Verletzte und Helden in stehenden Gruppen nicht', () => {
    const game = gameWithHeroes(12);
    const chosen = game.guild.heroes[3];
    const injured = game.guild.heroes[4];
    injured.injuryDays = 1;
    const ids = game.suggestAutoGroup('bearCave', [chosen.id]);
    expect(ids[0]).toBe(chosen.id);
    expect(ids).not.toContain(injured.id);

    game.createStandingGroup('bearCave', ids, 'never');
    const next = game.suggestAutoGroup('bearCave', []);
    expect(next.some((heroId) => ids.includes(heroId))).toBe(false);
  });

  it('bevorzugt einen Konter, wenn der Dungeon erkundet ist', () => {
    // Kapelle: Morvas Schattenwoge ist unterbrechbar, der Schurke kann unterbrechen.
    // Alle anderen sind stärker, also kommt er nur wegen des Konters mit.
    const game = gameWithHeroes(12);
    for (const hero of game.guild.heroes) {
      hero.level = hero.classId === 'rogue' ? 1 : 10;
    }
    const withoutKnowledge = game.suggestAutoGroup('ruinedChapel', []).map((heroId) => game.guild.findHero(heroId).classId);
    expect(withoutKnowledge).not.toContain('rogue');

    game.guild.dungeonKnowledge.ruinedChapel = 1;
    const withKnowledge = game.suggestAutoGroup('ruinedChapel', []).map((heroId) => game.guild.findHero(heroId).classId);
    expect(withKnowledge).toContain('rogue');
  });
});
