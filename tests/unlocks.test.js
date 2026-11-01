// Tests für das schrittweise Freischalten (Tutorial).

import { describe, it, expect } from 'vitest';
import { Game } from '../src/core/Game.js';
import { UNLOCKS } from '../src/data/unlocks.js';
import { HERO_TASKS } from '../src/data/heroTasks.js';

const START_TEAM = ['paladin', 'rogue', 'mage', 'bard', 'druid'];

function foundedGame() {
  const game = new Game(44);
  game.foundGuild('', START_TEAM);
  return game;
}

describe('Freischalt-Daten', () => {
  it('jede Freischaltung hat Text und mindestens eine Bedingung, Aufgaben verweisen auf echte ids', () => {
    for (const unlock of UNLOCKS) {
      expect(unlock.text.length, unlock.id).toBeGreaterThan(0);
      expect(Object.keys(unlock.condition).length, unlock.id).toBeGreaterThan(0);
    }
    for (const taskId in HERO_TASKS) {
      if (HERO_TASKS[taskId].unlock) {
        expect(UNLOCKS.some((unlock) => unlock.id === HERO_TASKS[taskId].unlock), taskId).toBe(true);
      }
    }
  });
});

describe('Schrittweises Freischalten', () => {
  it('am ersten Tag ist nur das Nötigste frei, mit den Tagen kommt mehr dazu', () => {
    const game = foundedGame();
    expect(game.isFeatureUnlocked('tavern')).toBe(false);
    expect(game.isFeatureUnlocked('guildHall')).toBe(false);
    game.endDay();
    expect(game.isFeatureUnlocked('tavern')).toBe(true);
    expect(game.getUnannouncedUnlocks()).toContain('tavern');
    expect(game.getDailyTodos()[0]).toEqual({ id: 'unlock', unlockId: 'tavern', count: 1, screenId: 'tavern' });

    game.acknowledgeUnlock('tavern');
    expect(game.getUnannouncedUnlocks()).not.toContain('tavern');
    expect(game.isFeatureUnlocked('tavern')).toBe(true);
  });

  it('Talente kommen mit Level 5, das Freigeschaltete wird gespeichert', () => {
    const game = foundedGame();
    game.guild.heroes[0].level = 5;
    game.updateUnlocks();
    expect(game.isFeatureUnlocked('talents')).toBe(true);
    const loaded = Game.fromSaveData(JSON.parse(JSON.stringify(game.toSaveData())));
    expect(loaded.isFeatureUnlocked('talents')).toBe(true);
    expect(loaded.isFeatureUnlocked('guildHall')).toBe(false);
  });

  it('Test-Menü: alles frei, ohne offene Hinweise', () => {
    const game = foundedGame();
    game.unlockEverything();
    for (const unlock of UNLOCKS) {
      expect(game.isFeatureUnlocked(unlock.id)).toBe(true);
    }
    expect(game.getUnannouncedUnlocks()).toEqual([]);
  });
});
