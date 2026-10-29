// Tests für Tagesaufgaben, Sold, Erkunden und "Wie gestern" (P7).

import { describe, it, expect } from 'vitest';
import { Game } from '../src/core/Game.js';
import { TASK_RULES, HERO_TASKS } from '../src/data/heroTasks.js';
import { HERO_RARITIES } from '../src/data/heroRarities.js';
import { CONSUMABLES } from '../src/data/consumables.js';
import { BALANCING } from '../src/data/balancing.js';
import { getTrainingXp } from '../src/systems/HeroTaskSystem.js';

// Ein Spiel mit count angeheuerten Helden und viel Gold
function gameWithHeroes(count, seed = 11) {
  const game = new Game(seed);
  game.guild.gold = 100000;
  while (game.guild.heroes.length < count) {
    const candidate = game.guild.candidates[0];
    if (!candidate) {
      game.refreshCandidates();
      continue;
    }
    game.hireHero(candidate.id);
  }
  return { game, heroes: game.guild.heroes };
}

describe('Aufgaben-Daten', () => {
  it('jede Seltenheit hat Sold, Kräuter-Funde sind echte Waren, Grenze 20', () => {
    for (const rarityId in HERO_RARITIES) {
      expect(HERO_RARITIES[rarityId].dailyWage).toBeGreaterThan(0);
    }
    for (const supplyId in TASK_RULES.herbFinds) {
      expect(CONSUMABLES.some((consumable) => consumable.id === supplyId)).toBe(true);
    }
    expect(BALANCING.maxHeroes).toBe(20);
  });
});

describe('Aufgaben verteilen', () => {
  it('nur wählbare Aufgaben, Erkunden nur für freigeschaltete Dungeons, Aufgabe bleibt stehen', () => {
    const { game, heroes } = gameWithHeroes(1);
    const hero = heroes[0];
    expect(game.setHeroTask(hero.id, 'dungeon')).toBe('notChoosable');
    expect(game.setHeroTask(hero.id, 'scouting', 'ruinedChapel')).toBe('locked');
    expect(game.setHeroTask(hero.id, 'scouting')).toBe('locked');
    expect(game.setHeroTask(hero.id, 'training')).toBe('ok');
    game.endDay();
    expect(hero.task.taskId).toBe('training');
    expect(HERO_TASKS.training.choosable).toBe(true);
  });

  it('Training bringt EP und kostet Gold; ohne Gold fällt es aus', () => {
    const { game, heroes } = gameWithHeroes(1);
    const hero = heroes[0];
    game.setHeroTask(hero.id, 'training');
    const xpGain = getTrainingXp(hero);
    expect(xpGain).toBeGreaterThan(0);
    const goldBefore = game.guild.gold;
    game.endDay();
    const result = game.lastDaySummary.tasks[0];
    expect(result.xp).toBe(xpGain);
    expect(game.guild.gold).toBe(goldBefore - TASK_RULES.trainingCost - game.lastDaySummary.wages.paid);

    game.guild.gold = 0;
    game.endDay();
    expect(game.lastDaySummary.tasks[0].skipped).toBe('noGold');
    expect(game.lastDaySummary.tasks[0].xp).toBe(0);
  });

  it('Kräuter sammeln: nach einigen Tagen liegt etwas in der Vorratskammer', () => {
    const { game, heroes } = gameWithHeroes(1);
    game.setHeroTask(heroes[0].id, 'herbs');
    let found = 0;
    for (let day = 0; day < 10; day++) {
      game.endDay();
      if (game.lastDaySummary.tasks[0].foundSupply) {
        found++;
      }
    }
    expect(found).toBeGreaterThan(0);
    const total = Object.values(game.guild.supplies).reduce((sum, count) => sum + count, 0);
    expect(total).toBe(found);
  });

  it('Verletzte und Helden im Dungeon erledigen keine Aufgabe', () => {
    const { game, heroes } = gameWithHeroes(3);
    for (const hero of heroes) {
      game.setHeroTask(hero.id, 'training');
    }
    heroes[0].injuryDays = 1;
    game.startExpedition('bearCave', [heroes[1].id], 'never');
    game.endDay();
    expect(game.lastDaySummary.tasks.map((task) => task.heroId)).toEqual([heroes[2].id]);
  });
});

describe('Sold', () => {
  it('jeder Held kostet am Abend Sold; reicht das Gold nicht, wird Held für Held bezahlt, solange es reicht', () => {
    const { game, heroes } = gameWithHeroes(3);
    const total = heroes.reduce((sum, hero) => sum + HERO_RARITIES[hero.rarityId].dailyWage, 0);
    expect(game.getDailyWages()).toBe(total);
    game.guild.gold = 1000;
    game.endDay();
    expect(game.lastDaySummary.wages).toMatchObject({ total, paid: total, unpaidNames: [], leftNames: [] });
    expect(game.guild.gold).toBe(1000 - total);

    // Nur genug Gold für den ersten Helden: Die anderen gehen leer aus und sind unzufrieden
    const firstWage = HERO_RARITIES[heroes[0].rarityId].dailyWage;
    game.guild.gold = firstWage;
    game.endDay();
    expect(game.lastDaySummary.wages.paid).toBe(firstWage);
    expect(game.lastDaySummary.wages.unpaidNames).toEqual([heroes[1].name, heroes[2].name]);
    expect(heroes[0].isUnhappy()).toBe(false);
    expect(heroes[1].isUnhappy()).toBe(true);
  });
});

describe('Erkunden', () => {
  it('der erkundete Dungeon ist für genau einen Run vorbereitet', () => {
    const { game, heroes } = gameWithHeroes(2);
    game.setHeroTask(heroes[0].id, 'scouting', 'bearCave');
    game.endDay();
    expect(game.lastDaySummary.tasks[0].scoutedDungeonId).toBe('bearCave');
    expect(game.isDungeonScouted('bearCave')).toBe(true);

    game.setHeroTask(heroes[0].id, 'rest');
    game.startExpedition('bearCave', [heroes[1].id], 'never');
    const report = game.endDay()[0];
    expect(report.scouted).toBe(true);
    expect(game.isDungeonScouted('bearCave')).toBe(false);
    // Der gespeicherte Run weiß, dass er erkundet war (gleiches Ergebnis beim erneuten Ansehen)
    const loaded = Game.fromSaveData(JSON.parse(JSON.stringify(game.toSaveData())));
    expect(loaded.guild.reports[0].expedition.scouted).toBe(true);
  });
});

describe('Wie gestern', () => {
  it('plant die Gruppen von gestern noch einmal ein, ohne Verletzte, Vorräte nur soweit vorhanden', () => {
    const { game, heroes } = gameWithHeroes(3);
    game.buySupply('healingPotions');
    game.startExpedition('bearCave', [heroes[0].id, heroes[1].id], 'never', ['healingPotions']);
    game.endDay();
    for (const hero of heroes) {
      hero.injuryDays = 0;
    }
    heroes[1].injuryDays = 1;

    expect(game.repeatYesterday()).toBe(1);
    const expedition = game.guild.expeditions[0];
    expect(expedition.dungeonId).toBe('bearCave');
    expect(expedition.getHeroIds()).toEqual([heroes[0].id]);
    expect(expedition.supplies).toEqual([]); // die Heiltränke von gestern sind verbraucht
    // Zweimal drücken plant nichts doppelt
    expect(game.repeatYesterday()).toBe(0);
  });
});
