// Tests für Zerlegen und Verbessern (M2).

import { describe, it, expect } from 'vitest';
import { SALVAGE_YIELD, UPGRADE_RULES } from '../src/data/crafting.js';
import { RARITIES } from '../src/data/rarities.js';
import { Item } from '../src/entities/Item.js';
import { Hero } from '../src/entities/Hero.js';
import { Game } from '../src/core/Game.js';
import { getUpgradeCost, getSalvageYield } from '../src/systems/CraftingSystem.js';

const LOOKS = { skin: '#f1c39b', hair: '#6b3f17' };

// Ein Spiel mit einem Item im Inventar und viel Material und Gold
function gameWithItem(rarityId = 'rare') {
  const game = new Game(9);
  game.guild.gold = 100000;
  game.guild.materials = { dust: 10000, crystal: 1000 };
  const item = new Item(game.guild.createItemId(), 'sword', rarityId, 'Testklinge', { attack: 50, health: 20 });
  game.guild.addItem(item);
  return { game, item };
}

describe('Crafting-Daten', () => {
  it('jede Seltenheit gibt Material, Kristalle erst ab Blau', () => {
    for (const rarity of RARITIES) {
      expect(SALVAGE_YIELD[rarity.id], rarity.id).toBeDefined();
      expect(SALVAGE_YIELD[rarity.id].dust).toBeGreaterThan(0);
    }
    expect(SALVAGE_YIELD.uncommon.crystal).toBe(0);
    expect(SALVAGE_YIELD.rare.crystal).toBeGreaterThan(0);
  });

  it('Kosten steigen, ab +6 mit Kristallen und unsicher', () => {
    const item = new Item(1, 'sword', 'rare', 'X', { attack: 10 });
    const first = getUpgradeCost(item);
    expect(first).toMatchObject({ targetLevel: 1, crystal: 0, chance: 1 });
    item.upgradeLevel = 5;
    const sixth = getUpgradeCost(item);
    expect(sixth.crystal).toBe(1);
    expect(sixth.chance).toBeLessThan(1);
    expect(sixth.dust).toBeGreaterThan(first.dust);
    item.upgradeLevel = UPGRADE_RULES.maxLevel;
    expect(getUpgradeCost(item)).toBeNull();
  });
});

describe('Verbesserte Werte', () => {
  it('+6 % pro Stufe auf alle Grundwerte; Grundwerte bleiben, Name zeigt die Stufe; wird gespeichert', () => {
    const item = new Item(1, 'sword', 'rare', 'Klinge', { attack: 50, health: 20 });
    item.upgradeLevel = 5;
    expect(item.getStats()).toEqual({ attack: 65, health: 26 });
    expect(item.stats).toEqual({ attack: 50, health: 20 });
    expect(item.getDisplayName()).toBe('Klinge +5');
    const loaded = Item.fromSaveData(JSON.parse(JSON.stringify(item.toSaveData())));
    expect(loaded.upgradeLevel).toBe(5);
  });

  it('der Held bekommt die verbesserten Werte', () => {
    const hero = new Hero(1, 'H', 'warrior', 'uncommon', [], LOOKS);
    const item = new Item(1, 'sword', 'rare', 'Klinge', { attack: 50 });
    hero.equip(item);
    const before = hero.getStats().attack;
    item.upgradeLevel = 10;
    expect(hero.getStats().attack).toBe(before + 30);
  });
});

describe('Zerlegen', () => {
  it('gibt Material nach Seltenheit, das Item ist weg; eine Verbesserung bringt nichts zurück', () => {
    const { game, item } = gameWithItem('epic');
    item.upgradeLevel = 4;
    const dustBefore = game.guild.materials.dust;
    const yieldOf = game.salvageItem(item.id);
    expect(yieldOf).toEqual(SALVAGE_YIELD.epic);
    expect(game.guild.materials.dust).toBe(dustBefore + SALVAGE_YIELD.epic.dust);
    expect(game.guild.findItem(item.id)).toBeFalsy();
    expect(game.salvageItem(item.id)).toBeNull();
    expect(getSalvageYield(item)).toEqual(SALVAGE_YIELD.epic);
  });

  it('alle Items einer Seltenheit auf einmal', () => {
    const game = new Game(10);
    for (let i = 0; i < 3; i++) {
      game.guild.addItem(new Item(game.guild.createItemId(), 'sword', 'poor', 'Schrott', { attack: 1 }));
    }
    game.guild.addItem(new Item(game.guild.createItemId(), 'sword', 'rare', 'Gut', { attack: 9 }));
    const total = game.salvageAllOfRarity('poor');
    expect(total.dust).toBe(3 * SALVAGE_YIELD.poor.dust);
    expect(game.guild.inventory).toHaveLength(1);
  });
});

describe('Verbessern', () => {
  it('bis +5 klappt immer, kostet Material und Gold', () => {
    const { game, item } = gameWithItem();
    const goldBefore = game.guild.gold;
    for (let level = 1; level <= 5; level++) {
      expect(game.upgradeItem(item.id)).toBe('success');
    }
    expect(item.upgradeLevel).toBe(5);
    const goldSpent = UPGRADE_RULES.goldPerLevel * (1 + 2 + 3 + 4 + 5);
    expect(game.guild.gold).toBe(goldBefore - goldSpent);
  });

  it('ab +6 kann es fehlschlagen: Material weg, Stufe bleibt; nie über +10', () => {
    const { game, item } = gameWithItem();
    item.upgradeLevel = 5;
    let failures = 0;
    let tries = 0;
    while (item.upgradeLevel < UPGRADE_RULES.maxLevel && tries < 200) {
      const before = item.upgradeLevel;
      const result = game.upgradeItem(item.id);
      if (result === 'failed') {
        failures++;
        expect(item.upgradeLevel).toBe(before);
      }
      tries++;
    }
    expect(item.upgradeLevel).toBe(UPGRADE_RULES.maxLevel);
    expect(failures).toBeGreaterThan(0);
    expect(game.upgradeItem(item.id)).toBe('maxLevel');
  });

  it('ohne Material oder Gold geht es nicht; angelegte Items lassen sich auch verbessern', () => {
    const game = new Game(11);
    game.guild.gold = 1000;
    const candidate = game.guild.candidates[0];
    game.hireHero(candidate.id);
    const hero = game.guild.heroes[0];
    const item = new Item(game.guild.createItemId(), 'attackRing', 'rare', 'Ring', { attack: 5 });
    hero.equip(item);
    expect(game.upgradeItem(item.id)).toBe('notEnough');
    game.guild.materials.dust = 3;
    expect(game.upgradeItem(item.id)).toBe('success');
    expect(hero.equipment[item.getSlot()].upgradeLevel).toBe(1);
    expect(game.upgradeItem(9999)).toBe('notFound');
  });
});
