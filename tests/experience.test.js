// Tests für Erfahrung, Level-Ups, Aufhol-Erfahrung und Verletzungen.

import { describe, it, expect } from 'vitest';
import { EXPERIENCE, INJURIES, getXpForNextLevel } from '../src/data/experience.js';
import { SCALING } from '../src/data/scaling.js';
import { DUNGEONS, getDungeon } from '../src/data/dungeons.js';
import { Hero } from '../src/entities/Hero.js';
import { Guild } from '../src/entities/Guild.js';
import { Game } from '../src/core/Game.js';
import { calculateRunXp, getHeroXpFactor, applyRunResults } from '../src/systems/ExperienceSystem.js';
import { createTestGroup } from '../src/systems/combat/TestGroup.js';

function makeHero(id, level) {
  const hero = new Hero(id, 'Held ' + id, 'warrior', 'uncommon', [], { skin: '#fff', hair: '#000' });
  hero.level = level;
  return hero;
}

// Ein Spiel mit einer fertigen 5er-Gruppe auf diesem Level
function gameWithGroup(level) {
  const game = new Game(11);
  const group = createTestGroup(level);
  group.forEach((hero, index) => { hero.id = 100 + index; });
  game.guild.heroes.push(...group);
  return { game, heroIds: group.map((hero) => hero.id) };
}

describe('Level-Ups', () => {
  it('genug EP lassen den Helden aufsteigen, auch mehrere Level auf einmal', () => {
    const hero = makeHero(1, 1);
    expect(hero.addXp(getXpForNextLevel(1) - 1)).toBe(0);
    expect(hero.level).toBe(1);
    expect(hero.addXp(1 + getXpForNextLevel(2))).toBe(2);
    expect(hero.level).toBe(3);
    expect(hero.xp).toBe(0);
  });

  it('über das Höchstlevel geht es nicht hinaus', () => {
    const hero = makeHero(1, SCALING.maxLevel - 1);
    hero.addXp(10000000);
    expect(hero.level).toBe(SCALING.maxLevel);
    expect(hero.xp).toBe(0);
    expect(hero.getXpProgress()).toBe(1);
  });

  it('EP und Verletzung werden gespeichert', () => {
    const hero = makeHero(1, 4);
    hero.xp = 33;
    hero.injurySeconds = 50;
    const loaded = Hero.fromSaveData(JSON.parse(JSON.stringify(hero.toSaveData())));
    expect(loaded.xp).toBe(33);
    expect(loaded.injurySeconds).toBe(50);
  });
});

describe('EP-Berechnung', () => {
  const cave = DUNGEONS[0];
  const brood = DUNGEONS[2];

  it('EP gibt es nur für gewonnene Begegnungen, schwerere Dungeons geben mehr', () => {
    const allWon = { encounters: cave.encounters.map(() => ({ outcome: 'victory' })) };
    const onlyTrash = { encounters: [{ outcome: 'victory' }, { outcome: 'defeat' }] };
    expect(calculateRunXp(allWon, cave)).toBe(EXPERIENCE.encounterXp.trash + EXPERIENCE.encounterXp.boss);
    expect(calculateRunXp(onlyTrash, cave)).toBe(EXPERIENCE.encounterXp.trash);
    const broodWon = { encounters: brood.encounters.map(() => ({ outcome: 'victory' })) };
    expect(calculateRunXp(broodWon, brood)).toBeGreaterThan(calculateRunXp(allWon, cave));
  });

  it('weit überlevelte Helden bekommen weniger EP', () => {
    // Getrennte Gilden, damit keine Aufhol-Erfahrung mitspielt
    const guild = new Guild();
    const fitting = makeHero(1, cave.level);
    guild.heroes.push(fitting);
    expect(getHeroXpFactor(fitting, cave, guild)).toBe(1);
    const tooHigh = makeHero(2, cave.level + 4);
    guild.heroes = [tooHigh];
    expect(getHeroXpFactor(tooHigh, cave, guild)).toBeLessThan(1);
    expect(getHeroXpFactor(tooHigh, cave, guild)).toBeGreaterThanOrEqual(EXPERIENCE.minOverLevelFactor);
  });

  it('Helden weit unter den besten der Gilde bekommen Aufhol-Erfahrung', () => {
    const guild = new Guild();
    for (let i = 1; i <= 5; i++) {
      guild.heroes.push(makeHero(i, 8));
    }
    const newcomer = makeHero(9, 1);
    guild.heroes.push(newcomer);
    const dungeon = getDungeon('broodNests');
    expect(getHeroXpFactor(newcomer, dungeon, guild)).toBe(EXPERIENCE.catchUpMultiplier);
  });
});

describe('Nach dem Run', () => {
  it('ein Erfolg gibt allen Helden EP, der Bericht nennt sie', () => {
    const { game, heroIds } = gameWithGroup(1);
    game.startExpedition('bearCave', heroIds, 'balanced', 'never');
    const levelUps = [];
    game.on('heroLevelUp', (data) => levelUps.push(data));
    game.advanceTime(game.guild.expeditions[0].getTotalTime() + 1);
    const report = game.guild.reports[0];
    expect(report.heroResults.length).toBe(5);
    if (report.outcome === 'success') {
      // 70 EP reichen auf Level 1 für ein Level-Up
      expect(levelUps.length).toBe(5);
      expect(game.guild.findHero(heroIds[0]).level).toBe(2);
    }
  });

  it('Gefallene sind verletzt, können nicht los und heilen mit der Zeit', () => {
    const guild = new Guild();
    const hero = makeHero(1, 3);
    guild.heroes.push(hero);
    const result = { encounters: [{ outcome: 'defeat' }], heroes: [{ heroId: 1, alive: false }] };
    const outcomes = applyRunResults(guild, result, DUNGEONS[0]);
    expect(outcomes[0].injured).toBe(true);
    expect(hero.isInjured()).toBe(true);
    expect(hero.injurySeconds).toBe(INJURIES.injurySeconds);

    const game = new Game(3);
    game.guild.heroes.push(hero);
    expect(game.startExpedition('bearCave', [1], 'balanced', 'never')).toBe('injured');
    const healed = [];
    game.on('heroHealed', (healedHero) => healed.push(healedHero));
    game.advanceTime(INJURIES.injurySeconds + 1);
    expect(hero.isInjured()).toBe(false);
    expect(healed.length).toBe(1);
    expect(game.startExpedition('bearCave', [1], 'balanced', 'never')).toBe('ok');
  });
});
