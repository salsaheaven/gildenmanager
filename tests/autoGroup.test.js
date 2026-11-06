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

describe('Konter-Stand (Risiko live)', () => {
  it('zeigt pro bekanntem Konter, ob jemand in der Gruppe ihn kann', async () => {
    const { Game } = await import('../src/core/Game.js');
    const { Hero } = await import('../src/entities/Hero.js');
    const { getKnowledgeTotal } = await import('../src/systems/DungeonKnowledge.js');
    const game = new Game(4);
    const rogue = new Hero(1, 'Schurke', 'rogue', 'uncommon', [], { skin: '#fff', hair: '#000' });
    const mage = new Hero(2, 'Magier', 'mage', 'uncommon', [], { skin: '#fff', hair: '#000' });
    game.guild.heroes.push(rogue, mage);
    // Unerkundet: keine Konter bekannt, aber verdeckte Bosse
    let status = game.getCounterStatus('ruinedChapel', [mage.id]);
    expect(status.counters).toEqual([]);
    expect(status.unknownBosses).toBeGreaterThan(0);
    // Erkundet: Morva braucht Unterbrechen (und Fluch lösen)
    game.guild.dungeonKnowledge.ruinedChapel = getKnowledgeTotal('ruinedChapel');
    status = game.getCounterStatus('ruinedChapel', [mage.id]);
    expect(status.counters.find((counter) => counter.id === 'interrupt').covered).toBe(false);
    status = game.getCounterStatus('ruinedChapel', [mage.id, rogue.id]);
    expect(status.counters.find((counter) => counter.id === 'interrupt').covered).toBe(true);
    expect(status.unknownBosses).toBe(0);
  });
});
