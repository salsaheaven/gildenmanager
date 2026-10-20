// Tests für die Skalierung: Item-Level, Gegnerstufen, Rüstung, alte Spielstände.

import { describe, it, expect } from 'vitest';
import { SCALING, getItemLevelFactor, getEnemyLevelFactors, getDefenseConstant } from '../src/data/scaling.js';
import { DUNGEONS, getBossLevel } from '../src/data/dungeons.js';
import { getItemTemplate } from '../src/data/items.js';
import { getBoss } from '../src/data/enemies.js';
import { Item } from '../src/entities/Item.js';
import { Guild } from '../src/entities/Guild.js';
import { LootSystem } from '../src/systems/LootSystem.js';
import { createBossCombatant } from '../src/systems/combat/CombatSimulator.js';
import { Random } from '../src/core/Random.js';
import { Game } from '../src/core/Game.js';
import { createTestGroup } from '../src/systems/combat/TestGroup.js';

describe('Formeln', () => {
  it('Item-, Gegner- und Rüstungsfaktoren wachsen mit der Stufe', () => {
    expect(getItemLevelFactor(1)).toBeCloseTo(SCALING.itemBaseFactor);
    expect(getItemLevelFactor(10)).toBeGreaterThan(getItemLevelFactor(5));
    expect(getEnemyLevelFactors(1)).toEqual({ health: 1, attack: 1, defense: 1 });
    expect(getEnemyLevelFactors(5).health).toBeGreaterThan(1);
    expect(getDefenseConstant(10)).toBeGreaterThan(getDefenseConstant(1));
  });

  it('Dungeons haben eine gültige Stufe, spätere Dungeons sind nicht leichter', () => {
    let previousLevel = 0;
    for (const dungeon of DUNGEONS) {
      expect(dungeon.level).toBeGreaterThanOrEqual(1);
      expect(dungeon.level).toBeLessThanOrEqual(SCALING.maxLevel);
      expect(dungeon.level).toBeGreaterThanOrEqual(previousLevel);
      previousLevel = dungeon.level;
    }
  });
});

describe('Item-Level', () => {
  it('ein Item höherer Stufe ist stärker als dasselbe Item niedriger Stufe', () => {
    const lootSystem = new LootSystem(new Random(1));
    const sword = getItemTemplate('sword');
    const low = lootSystem.createItem('uncommon', 1, 1, sword);
    const high = lootSystem.createItem('uncommon', 2, 10, sword);
    expect(low.itemLevel).toBe(1);
    expect(high.itemLevel).toBe(10);
    expect(high.stats.attack).toBeGreaterThan(low.stats.attack * 3);
  });

  it('Kisten geben ihr Item-Level an alle Items weiter und speichern es', () => {
    const guild = new Guild();
    guild.boxes = [];
    guild.addBox('chestMorva', 3);
    const saved = Guild.fromSaveData(JSON.parse(JSON.stringify(guild.toSaveData())));
    const box = saved.takeBox('chestMorva');
    expect(box.itemLevel).toBe(3);
    const items = box.open(new LootSystem(new Random(2)), saved);
    for (const item of items) {
      expect(item.itemLevel).toBe(3);
    }
  });

  it('nach einem Erfolg hat die Boss-Kiste die Stufe des Dungeons', () => {
    const game = new Game(11);
    const group = createTestGroup(10);
    group.forEach((hero, index) => { hero.id = 100 + index; });
    game.guild.heroes.push(...group);
    game.startExpedition('bearCave', group.map((hero) => hero.id), 'never');
    game.advanceTime(game.guild.expeditions[0].getTotalTime() + 1);
    const box = game.guild.boxes.find((b) => b.typeId === 'chestGrimfang');
    expect(box.itemLevel).toBe(DUNGEONS[0].level);
  });

  it('Items aus alten Spielständen (ohne Item-Level) werden auf Stufe 1 umgerechnet', () => {
    const old = Item.fromSaveData({ id: 1, templateId: 'sword', rarityId: 'uncommon', name: 'Schwert', stats: { attack: 8 } });
    expect(old.itemLevel).toBe(1);
    expect(old.stats.attack).toBe(Math.round(8 * getItemLevelFactor(1)));
    const again = Item.fromSaveData(old.toSaveData());
    expect(again.stats.attack).toBe(old.stats.attack); // nicht nochmal umrechnen
  });
});

describe('Gegnerstufen', () => {
  it('Bosse kämpfen auf der Stufe ihres Dungeons und sind dort stärker', () => {
    expect(getBossLevel('grimfang')).toBe(DUNGEONS[0].level);
    expect(getBossLevel('skarrix')).toBe(DUNGEONS[2].level);
    const boss = getBoss('skarrix');
    const level1 = createBossCombatant(boss, 1);
    const level5 = createBossCombatant(boss, 5);
    expect(level5.maxHp).toBeGreaterThan(level1.maxHp);
  });
});
