// Tests für die Gildenhalle (Gebäude, Bauen, Unterhalt, Wirkungen) und unbezahlten Sold (M3, Schritt 2).

import { describe, it, expect } from 'vitest';
import { BUILDINGS, BUILDING_ORDER } from '../src/data/buildings.js';
import { BALANCING } from '../src/data/balancing.js';
import { TASK_RULES } from '../src/data/heroTasks.js';
import { WAGE_RULES, HERO_RARITIES } from '../src/data/heroRarities.js';
import { UPGRADE_RULES } from '../src/data/crafting.js';
import { getDungeon } from '../src/data/dungeons.js';
import { Game } from '../src/core/Game.js';
import { Item } from '../src/entities/Item.js';
import { getDailyUpkeep } from '../src/systems/BuildingSystem.js';
import { getTrainingXp, getTrainingCost } from '../src/systems/HeroTaskSystem.js';
import { applyRunResults } from '../src/systems/ExperienceSystem.js';
import { getUpgradeCost } from '../src/systems/CraftingSystem.js';

const START_TEAM = ['paladin', 'rogue', 'mage', 'bard', 'druid'];

// Eine gegründete Gilde mit viel Gold und Material
function richGame(seed = 31) {
  const game = new Game(seed);
  game.foundGuild('', START_TEAM);
  game.guild.gold = 100000;
  game.guild.materials = { dust: 10000, crystal: 1000 };
  return game;
}

// Baut ein Gebäude auf die gewünschte Stufe (über "Tag beenden", wie im Spiel)
function buildUpTo(game, buildingId, targetLevel) {
  while (game.guild.hall.getLevel(buildingId) < targetLevel) {
    expect(game.buildBuilding(buildingId)).toBe('ok');
    while (game.guild.hall.construction !== null) {
      game.endDay();
    }
  }
}

describe('Gebäude-Daten', () => {
  it('jedes Gebäude hat 3 Stufen mit Kosten, Bauzeit, Unterhalt, Wirkung und Text', () => {
    expect([...BUILDING_ORDER].sort()).toEqual(Object.keys(BUILDINGS).sort());
    for (const buildingId in BUILDINGS) {
      const building = BUILDINGS[buildingId];
      expect(building.name).toBeTruthy();
      expect(building.levels).toHaveLength(3);
      for (const level of building.levels) {
        expect(level.cost.gold).toBeGreaterThan(0);
        expect(level.cost.dust).toBeGreaterThanOrEqual(0);
        expect(level.cost.crystal).toBeGreaterThanOrEqual(0);
        expect(level.buildDays).toBeGreaterThan(0);
        expect(level.upkeep).toBeGreaterThan(0);
        expect(Object.keys(level.effects).length).toBeGreaterThan(0);
        expect(level.text).toBeTruthy();
      }
    }
  });
});

describe('Bauen', () => {
  it('kostet Gold und Material, dauert Tage, nur eine Baustelle; fertig steht im Tagesabschluss', () => {
    const game = richGame();
    const level1 = BUILDINGS.barracks.levels[0];
    const goldBefore = game.guild.gold;
    expect(game.buildBuilding('barracks')).toBe('ok');
    expect(game.guild.gold).toBe(goldBefore - level1.cost.gold);
    expect(game.buildBuilding('forge')).toBe('busy');

    for (let day = 1; day < level1.buildDays; day++) {
      game.endDay();
      expect(game.lastDaySummary.finishedBuilding).toBeNull();
      expect(game.guild.hall.getLevel('barracks')).toBe(0);
    }
    game.endDay();
    expect(game.lastDaySummary.finishedBuilding).toEqual({ buildingId: 'barracks', level: 1 });
    expect(game.guild.hall.getLevel('barracks')).toBe(1);
    expect(game.guild.hall.construction).toBeNull();
  });

  it('ohne Gold oder Material geht es nicht, nach Stufe 3 ist Schluss; wird gespeichert', () => {
    const poor = new Game(32);
    poor.foundGuild('', START_TEAM);
    poor.guild.materials = { dust: 0, crystal: 0 };
    expect(poor.buildBuilding('forge')).toBe('notEnough');

    const game = richGame(33);
    buildUpTo(game, 'mapRoom', 3);
    expect(game.buildBuilding('mapRoom')).toBe('maxLevel');
    game.buildBuilding('forge');
    const loaded = Game.fromSaveData(JSON.parse(JSON.stringify(game.toSaveData())));
    expect(loaded.guild.hall.getLevel('mapRoom')).toBe(3);
    expect(loaded.guild.hall.construction.buildingId).toBe('forge');
  });
});

describe('Unterhalt', () => {
  it('kostet jeden Abend Gold; reicht es nicht, wirkt am nächsten Tag kein Gebäude', () => {
    const game = richGame(34);
    buildUpTo(game, 'barracks', 1);
    const upkeep = BUILDINGS.barracks.levels[0].upkeep;
    expect(game.getDailyUpkeep()).toBe(upkeep);
    expect(game.guild.getMaxHeroes()).toBe(BALANCING.maxHeroes + 5);

    // Genug Gold für den Sold, aber nicht mehr für den Unterhalt
    game.guild.gold = game.getDailyWages() + upkeep - 1;
    game.endDay();
    expect(game.lastDaySummary.upkeep).toEqual({ total: upkeep, paid: 0 });
    expect(game.guild.hall.upkeepPaid).toBe(false);
    expect(game.guild.getMaxHeroes()).toBe(BALANCING.maxHeroes);

    game.guild.gold = 1000;
    game.endDay();
    expect(game.guild.hall.upkeepPaid).toBe(true);
    expect(game.guild.getMaxHeroes()).toBe(BALANCING.maxHeroes + 5);
  });

  it('der Unterhalt gilt für die Stufe, nicht zusammengezählt', () => {
    const game = richGame(35);
    buildUpTo(game, 'barracks', 2);
    expect(getDailyUpkeep(game.guild.hall)).toBe(BUILDINGS.barracks.levels[1].upkeep);
  });
});

describe('Wirkungen der Gebäude', () => {
  it('Trainingshalle: mehr EP und billiger', () => {
    const game = richGame(36);
    const hero = game.guild.heroes[0];
    const xpBefore = getTrainingXp(hero, game.guild);
    buildUpTo(game, 'trainingHall', 1);
    expect(getTrainingXp(hero, game.guild)).toBeGreaterThan(xpBefore);
    expect(getTrainingCost(game.guild)).toBeLessThan(TASK_RULES.trainingCost);
  });

  it('Lazarett: mit Glück wird ein Gefallener gar nicht verletzt', () => {
    const game = richGame(37);
    buildUpTo(game, 'infirmary', 3);
    const hero = game.guild.heroes[0];
    const dungeon = getDungeon('bearCave');
    const result = { encounters: [], heroes: [{ heroId: hero.id, alive: false }] };

    const lucky = applyRunResults(game.guild, result, dungeon, { next: () => 0 });
    expect(lucky[0]).toMatchObject({ injured: false, savedByInfirmary: true });
    expect(hero.isInjured()).toBe(false);

    const unlucky = applyRunResults(game.guild, result, dungeon, { next: () => 0.99 });
    expect(unlucky[0].injured).toBe(true);
    expect(hero.isInjured()).toBe(true);
  });

  it('Schmiede: höhere Chance beim Verbessern ab +6', () => {
    const game = richGame(38);
    const item = new Item(1, 'sword', 'rare', 'Klinge', { attack: 10 });
    item.upgradeLevel = 5;
    const without = getUpgradeCost(item, game.guild.hall.getEffect('upgradeChanceBonus', 0)).chance;
    expect(without).toBe(UPGRADE_RULES.successChance[6]);
    buildUpTo(game, 'forge', 1);
    const withForge = getUpgradeCost(item, game.guild.hall.getEffect('upgradeChanceBonus', 0)).chance;
    expect(withForge).toBeCloseTo(without + BUILDINGS.forge.levels[0].effects.upgradeChanceBonus);
  });

  it('Kartenraum: eine Erkundung hält mehrere Kampftage', () => {
    const game = richGame(39);
    buildUpTo(game, 'mapRoom', 1);
    const [scout, ...fighters] = game.guild.heroes;
    game.setHeroTask(scout.id, 'scouting', 'bearCave');
    game.endDay();
    game.setHeroTask(scout.id, 'rest');
    expect(game.guild.scoutedDungeons.bearCave).toBe(2);

    for (let fightDay = 1; fightDay <= 2; fightDay++) {
      // Wer im ersten Run gefallen ist, wird für den Test sofort geheilt
      for (const hero of fighters) {
        hero.injuryDays = 0;
      }
      expect(game.startExpedition('bearCave', fighters.map((hero) => hero.id), 'never')).toBe('ok');
      const reports = game.endDay();
      expect(reports[0].scouted).toBe(true);
    }
    expect(game.isDungeonScouted('bearCave')).toBe(false);
  });
});

describe('Unbezahlter Sold', () => {
  it('ohne Sold unzufrieden (kämpft schlechter), nach 3 Tagen verlässt der Held die Gilde, die Ausrüstung bleibt', () => {
    const game = new Game(40);
    game.foundGuild('', START_TEAM);
    const hero = game.guild.heroes[0];
    const ring = new Item(game.guild.createItemId(), 'attackRing', 'rare', 'Ring', { attack: 5 });
    hero.equip(ring);
    expect(hero.getOrderSettings().damageDone).toBe(0);

    // Immer genug Gold für alle außer dem ersten Helden: Er steht in der Liste vorne, also Gold so setzen,
    // dass sein Sold fehlt, dann zahlt payWages die anderen
    const hisWage = HERO_RARITIES[hero.rarityId].dailyWage;
    for (let day = 1; day <= WAGE_RULES.unpaidDaysUntilLeave; day++) {
      game.guild.gold = hisWage - 1;
      game.endDay();
      if (day < WAGE_RULES.unpaidDaysUntilLeave) {
        expect(hero.isUnhappy()).toBe(true);
        expect(hero.getOrderSettings().damageDone).toBeCloseTo(WAGE_RULES.unhappyEffects.damageDone);
      }
    }
    expect(game.lastDaySummary.wages.leftNames).toContain(hero.name);
    expect(game.guild.findHero(hero.id)).toBeFalsy();
    expect(game.guild.findItem(ring.id)).toBeTruthy();
  });

  it('wer wieder Sold bekommt, ist wieder zufrieden', () => {
    const game = new Game(41);
    game.foundGuild('', START_TEAM);
    game.guild.gold = 0;
    game.endDay();
    expect(game.guild.heroes.every((hero) => hero.isUnhappy())).toBe(true);
    game.guild.gold = 1000;
    game.endDay();
    expect(game.guild.heroes.every((hero) => !hero.isUnhappy())).toBe(true);
  });
});
