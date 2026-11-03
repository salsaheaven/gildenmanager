// Tests für die Starttruppe, die Aufgabe "Aufträge erledigen" und Erkunden für mehrere Gruppen (M3, Schritt 1).

import { describe, it, expect } from 'vitest';
import { START_TEAM_CLASSES, START_TEAM_RULES } from '../src/data/startTeam.js';
import { TASK_RULES } from '../src/data/heroTasks.js';
import { getHeroClass } from '../src/data/heroClasses.js';
import { Game } from '../src/core/Game.js';
import { estimateRunChances } from '../src/systems/combat/ChanceEstimator.js';
import { resolveHeroTasks, getJobGold } from '../src/systems/HeroTaskSystem.js';

// Paladin (Platte), Schurke (Leder), Magier (Stoff), Barde (Stoff), Druide (Leder)
const GOOD_TEAM = ['paladin', 'rogue', 'mage', 'bard', 'druid'];

describe('Starttruppe', () => {
  it('feste Truppe: 5 Klassen, alle Rüstungsarten', () => {
    expect(START_TEAM_CLASSES).toHaveLength(5);
    const armorTypes = START_TEAM_CLASSES.map((classId) => getHeroClass(classId).armorType);
    for (const armorType of START_TEAM_RULES.requiredArmorTypes) {
      expect(armorTypes, armorType).toContain(armorType);
    }
  });

  it('schafft die Bärenhöhle ohne Ausrüstung meistens (Verletzte sind in Ordnung)', () => {
    const game = new Game(23);
    game.foundGuild('');
    const chances = estimateRunChances({ heroes: game.guild.heroes, dungeonId: 'bearCave', retreatRuleId: 'never', count: 60 });
    expect(chances.winRate).toBeGreaterThanOrEqual(0.8);
  });

  it('foundGuild: die 5 grünen Start-Helden, Name, nur einmal; wird gespeichert', () => {
    const game = new Game(21);
    expect(game.guild.founded).toBe(false);
    expect(game.foundGuild('  Die Eisernen  ')).toBe('ok');
    expect(game.guild.name).toBe('Die Eisernen');
    expect(game.guild.heroes.map((hero) => hero.classId)).toEqual(START_TEAM_CLASSES);
    for (const hero of game.guild.heroes) {
      expect(hero.rarityId).toBe(START_TEAM_RULES.rarityId);
      expect(hero.level).toBe(1);
    }
    expect(game.foundGuild('Nochmal')).toBe('alreadyFounded');

    const loaded = Game.fromSaveData(JSON.parse(JSON.stringify(game.toSaveData())));
    expect(loaded.guild.founded).toBe(true);
    expect(loaded.guild.heroes).toHaveLength(5);
  });

  it('ohne Namen gibt es den Standardnamen', () => {
    const game = new Game(22);
    game.foundGuild('   ');
    expect(game.guild.name).toBe(START_TEAM_RULES.defaultGuildName);
  });
});

describe('Aufträge erledigen', () => {
  function foundedGame(seed) {
    const game = new Game(seed);
    game.foundGuild('', GOOD_TEAM);
    return game;
  }

  it('bringt Gold nach Level mit etwas Zufall, aber keine EP', () => {
    const game = foundedGame(23);
    const hero = game.guild.heroes[0];
    hero.traitIds = [];
    const goldBefore = game.guild.gold;
    const [result] = resolveHeroTasks(game.guild, [{ hero, taskId: 'jobs' }], game.random);
    const expected = getJobGold(hero);
    expect(result.gold).toBeGreaterThanOrEqual(Math.floor(expected * (1 - TASK_RULES.jobGoldSpread)));
    expect(result.gold).toBeLessThanOrEqual(Math.ceil(expected * (1 + TASK_RULES.jobGoldSpread)));
    expect(result.xp).toBe(0);
    expect(result.jobText).toBeTruthy();
    expect(game.guild.gold).toBe(goldBefore + result.gold);
  });

  it('Gierig bringt mehr Gold', () => {
    const game = foundedGame(24);
    const hero = game.guild.heroes[0];
    hero.traitIds = ['greedy'];
    const [result] = resolveHeroTasks(game.guild, [{ hero, taskId: 'jobs' }], game.random);
    expect(result.greedyGold).toBeGreaterThan(0);
  });

  it('läuft über "Tag beenden" und steht in der Zusammenfassung', () => {
    const game = foundedGame(25);
    for (const hero of game.guild.heroes) {
      expect(game.setHeroTask(hero.id, 'jobs')).toBe('ok');
    }
    game.endDay();
    const jobs = game.lastDaySummary.tasks.filter((task) => task.taskId === 'jobs');
    expect(jobs).toHaveLength(5);
    expect(jobs.every((task) => task.gold > 0)).toBe(true);
  });
});

describe('Erkunden mit mehreren Gruppen', () => {
  it('eine Erkundung gilt für alle Gruppen eines Tages im selben Dungeon, danach ist sie verbraucht', () => {
    const game = new Game(26);
    game.guild.gold = 100000;
    while (game.guild.heroes.length < 8) {
      if (game.guild.candidates.length === 0) {
        game.refreshCandidates();
      }
      game.hireHero(game.guild.candidates[0].id);
    }
    const ids = game.guild.heroes.map((hero) => hero.id);
    game.guild.scoutedDungeons.bearCave = 1;
    game.guild.dungeonKnowledge.bearCave = 1; // Vorteil gibt es nur mit Wissen
    expect(game.startExpedition('bearCave', ids.slice(0, 4), 'never')).toBe('ok');
    expect(game.startExpedition('bearCave', ids.slice(4, 8), 'never')).toBe('ok');
    const reports = game.endDay();
    expect(reports).toHaveLength(2);
    expect(reports.every((report) => report.scouted)).toBe(true);
    expect(game.isDungeonScouted('bearCave')).toBe(false);
  });
});

describe('Klassen der Starttruppe', () => {
  it('die Beispiel-Truppe deckt Platte, Leder und Stoff ab', () => {
    const armorTypes = new Set(GOOD_TEAM.map((classId) => getHeroClass(classId).armorType));
    expect([...armorTypes].sort()).toEqual(['cloth', 'leather', 'plate']);
  });
});
