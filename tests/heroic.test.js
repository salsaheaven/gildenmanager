// Tests für die heroische Stufe: freischalten, umschalten, stärkere Gegner, bessere Belohnung, Speichern.

import { describe, it, expect } from 'vitest';
import { Game } from '../src/core/Game.js';
import { createTestGroup } from '../src/systems/combat/TestGroup.js';
import { getDungeon } from '../src/data/dungeons.js';
import { HEROIC } from '../src/data/heroic.js';
import { getRunDungeon } from '../src/systems/HeroicMode.js';
import { simulateRun } from '../src/systems/combat/CombatSimulator.js';

// Ein Spiel mit einer starken 5er-Gruppe, die die Bärenhöhle auch heroisch sicher schafft
function gameWithGroup(level = 15) {
  const game = new Game(11);
  const group = createTestGroup(level);
  group.forEach((hero, index) => { hero.id = 100 + index; });
  game.guild.heroes.push(...group);
  return { game, heroIds: group.map((hero) => hero.id) };
}

describe('Heroisch', () => {
  it('die heroische Kopie hat höhere Stufe und mehr Gold, das Original bleibt unverändert', () => {
    const normal = getDungeon('bearCave');
    const heroic = getRunDungeon('bearCave', true);
    expect(heroic.level).toBe(normal.level + HEROIC.levelBonus);
    expect(heroic.rewards.gold).toBeGreaterThan(normal.rewards.gold);
    expect(heroic.heroic).toBe(true);
    expect(getRunDungeon('bearCave', false)).toBe(normal);
    expect(getDungeon('bearCave').level).toBe(normal.level);
  });

  it('erst nach dem ersten Sieg umschaltbar', () => {
    const { game } = gameWithGroup();
    expect(game.setDungeonHeroic('bearCave', true)).toBe('notAvailable');
    expect(game.isDungeonHeroic('bearCave')).toBe(false);
    game.guild.dungeonClears = { bearCave: 1 };
    expect(game.setDungeonHeroic('bearCave', true)).toBe('ok');
    expect(game.isDungeonHeroic('bearCave')).toBe(true);
    expect(game.setDungeonHeroic('bearCave', false)).toBe('ok');
    expect(game.isDungeonHeroic('bearCave')).toBe(false);
  });

  it('ein heroischer Sieg gibt eine Kiste auf höherer Stufe mit einem Item mehr und zählt mit', () => {
    const { game, heroIds } = gameWithGroup();
    game.guild.dungeonClears = { bearCave: 1 };
    game.setDungeonHeroic('bearCave', true);
    game.startExpedition('bearCave', heroIds, 'never');
    const report = game.endDay()[0];
    expect(report.outcome).toBe('success');
    expect(report.heroic).toBe(true);
    expect(report.heroicFirstClear).toBe(true);
    expect(report.gold).toBe(getRunDungeon('bearCave', true).rewards.gold);
    const box = game.guild.boxes.find((entry) => entry.typeId === getDungeon('bearCave').rewards.chest);
    expect(box.itemLevel).toBe(getDungeon('bearCave').level + HEROIC.levelBonus);
    expect(box.bonusItems).toBeGreaterThanOrEqual(HEROIC.extraChestItems);
    expect(game.guild.getHeroicClears('bearCave')).toBe(1);
    expect(game.guild.getClears('bearCave')).toBe(2);
    // Der gespeicherte Run lässt sich heroisch noch einmal genauso ansehen
    expect(report.expedition.heroic).toBe(true);
  });

  it('heroische Gegner sind stärker: dieselbe Gruppe gewinnt seltener', () => {
    const { game, heroIds } = gameWithGroup(5);
    const heroes = heroIds.map((heroId) => game.guild.findHero(heroId));
    let normalWins = 0;
    let heroicWins = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const options = { heroes, dungeonId: 'ruinedChapel', retreatRuleId: 'never', seed };
      normalWins += simulateRun({ ...options, heroic: false }).outcome === 'success' ? 1 : 0;
      heroicWins += simulateRun({ ...options, heroic: true }).outcome === 'success' ? 1 : 0;
    }
    expect(heroicWins).toBeLessThan(normalWins);
  });

  it('Einstellung und Zähler werden gespeichert', () => {
    const { game } = gameWithGroup();
    game.guild.dungeonClears = { bearCave: 1 };
    game.guild.heroicClears = { bearCave: 2 };
    game.setDungeonHeroic('bearCave', true);
    const loaded = Game.fromSaveData(JSON.parse(JSON.stringify(game.toSaveData())));
    expect(loaded.isDungeonHeroic('bearCave')).toBe(true);
    expect(loaded.guild.getHeroicClears('bearCave')).toBe(2);
  });
});
