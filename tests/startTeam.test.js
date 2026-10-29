// Tests für die Starttruppe, die Aufgabe "Aufträge erledigen" und Erkunden für mehrere Gruppen (M3, Schritt 1).

import { describe, it, expect } from 'vitest';
import { START_TEAM_SLOTS, START_TEAM_RULES } from '../src/data/startTeam.js';
import { TASK_RULES } from '../src/data/heroTasks.js';
import { getHeroClass } from '../src/data/heroClasses.js';
import { Game } from '../src/core/Game.js';
import { getClassesForSlot, getMissingArmorTypes, checkStartTeam } from '../src/systems/StartTeam.js';
import { resolveHeroTasks, getJobGold } from '../src/systems/HeroTaskSystem.js';

// Paladin (Platte), Schurke (Leder), Magier (Stoff), Barde (Stoff), Druide (Leder)
const GOOD_TEAM = ['paladin', 'rogue', 'mage', 'bard', 'druid'];

describe('Starttruppe', () => {
  it('jeder Platz hat Klassen zur Auswahl, und zusammen sind alle Rüstungsarten möglich', () => {
    for (let slotIndex = 0; slotIndex < START_TEAM_SLOTS.length; slotIndex++) {
      const classes = getClassesForSlot(slotIndex);
      expect(classes.length, START_TEAM_SLOTS[slotIndex].name).toBeGreaterThan(0);
      for (const heroClass of classes) {
        expect(heroClass.role).toBe(START_TEAM_SLOTS[slotIndex].role);
      }
    }
    expect(checkStartTeam(GOOD_TEAM)).toBe('ok');
  });

  it('prüft Rollen, leere Plätze und fehlende Rüstungsarten', () => {
    expect(checkStartTeam(['paladin', 'rogue', 'mage'])).toBe('wrongCount');
    expect(checkStartTeam(['paladin', null, 'mage', 'bard', 'druid'])).toBe('emptySlot');
    expect(checkStartTeam(['priest', 'rogue', 'mage', 'bard', 'druid'])).toBe('wrongRole');
    // Krieger (Platte), Magier (Stoff), Hexenmeister (Stoff), Barde (Stoff), Priester (Stoff): kein Leder
    const noLeather = ['warrior', 'mage', 'warlock', 'bard', 'priest'];
    expect(checkStartTeam(noLeather)).toBe('missingArmor');
    expect(getMissingArmorTypes(noLeather)).toEqual(['leather']);
    expect(getMissingArmorTypes([null, null, null, null, null])).toEqual(START_TEAM_RULES.requiredArmorTypes);
  });

  it('foundGuild: 5 grüne Helden der gewählten Klassen, Name, nur einmal; wird gespeichert', () => {
    const game = new Game(21);
    expect(game.guild.founded).toBe(false);
    expect(game.foundGuild('Test', ['warrior', 'mage', 'warlock', 'bard', 'priest'])).toBe('missingArmor');
    expect(game.guild.heroes).toHaveLength(0);

    expect(game.foundGuild('  Die Eisernen  ', GOOD_TEAM)).toBe('ok');
    expect(game.guild.name).toBe('Die Eisernen');
    expect(game.guild.heroes.map((hero) => hero.classId)).toEqual(GOOD_TEAM);
    for (const hero of game.guild.heroes) {
      expect(hero.rarityId).toBe(START_TEAM_RULES.rarityId);
      expect(hero.level).toBe(1);
    }
    expect(game.foundGuild('Nochmal', GOOD_TEAM)).toBe('alreadyFounded');

    const loaded = Game.fromSaveData(JSON.parse(JSON.stringify(game.toSaveData())));
    expect(loaded.guild.founded).toBe(true);
    expect(loaded.guild.heroes).toHaveLength(5);
  });

  it('ohne Namen gibt es den Standardnamen', () => {
    const game = new Game(22);
    game.foundGuild('   ', GOOD_TEAM);
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
    game.guild.scoutedDungeons.bearCave = true;
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
