// Tests für Positionen und den Gruppen-Zähler (UI-Neubau: Heldenübersicht nach Rollen).

import { describe, it, expect } from 'vitest';
import { Game } from '../src/core/Game.js';
import { HERO_CLASSES } from '../src/data/heroClasses.js';
import { POSITIONS, getPositionId } from '../src/data/groupRules.js';
import { countPossibleGroups } from '../src/systems/GroupCounter.js';

// Starttruppe: Paladin (Tank), Schurke (Nahkampf), Magier (Fernkampf), Barde (Unterstützer), Druide (Heiler)
const START_TEAM = ['paladin', 'rogue', 'mage', 'bard', 'druid'];

describe('Positionen', () => {
  it('jede Klasse hat eine der 5 Positionen, jede Position kommt vor', () => {
    const used = new Set();
    for (const heroClass of HERO_CLASSES) {
      const positionId = getPositionId(heroClass);
      expect(POSITIONS.some((position) => position.id === positionId), heroClass.id).toBe(true);
      used.add(positionId);
    }
    expect(used.size).toBe(POSITIONS.length);
  });
});

describe('Gruppen-Zähler', () => {
  it('Starttruppe = 1 Gruppe, für die zweite fehlen Tank, Heiler und 3 weitere', () => {
    const game = new Game(3);
    game.foundGuild('', START_TEAM);
    const result = countPossibleGroups(game.guild);
    expect(result.groups).toBe(1);
    expect(result.missing).toEqual({ tank: 1, healer: 1, any: 3 });
  });

  it('Verletzte und eingeplante Helden zählen nicht', () => {
    const game = new Game(3);
    game.foundGuild('', START_TEAM);
    const healer = game.guild.heroes.find((hero) => hero.classId === 'druid');
    healer.injuryDays = 1;
    expect(countPossibleGroups(game.guild).groups).toBe(0);
    expect(countPossibleGroups(game.guild).missing).toEqual({ healer: 1 });

    healer.injuryDays = 0;
    const rogue = game.guild.heroes.find((hero) => hero.classId === 'rogue');
    game.startExpedition('bearCave', [rogue.id], 'never');
    expect(countPossibleGroups(game.guild).groups).toBe(0);
    expect(countPossibleGroups(game.guild).missing).toEqual({ any: 1 });
  });
});
