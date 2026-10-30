// Tests für Schmieden, Umschmieden und Brauen (M3 Schritt 4).

import { describe, it, expect } from 'vitest';
import { Game } from '../src/core/Game.js';
import { FORGE_RULES, REFORGE_RULES, MATERIALS } from '../src/data/crafting.js';
import { BREW_RECIPES } from '../src/data/alchemy.js';
import { CONSUMABLES } from '../src/data/consumables.js';
import { RARITIES } from '../src/data/rarities.js';
import { getForgeCost, getForgeItemLevel, getReforgeTargets, getReforgeCost } from '../src/systems/ForgeSystem.js';
import { getAvailableRecipes, getBrewCost } from '../src/systems/AlchemySystem.js';
import { getItemTemplate } from '../src/data/items.js';

// Starttruppe mit allen Rüstungsarten (wie in buildings.test.js)
const START_TEAM = ['paladin', 'rogue', 'mage', 'bard', 'druid'];

// Ein gegründetes Spiel mit viel Material und den gewünschten Gebäudestufen, z.B. { forge: 2 }
function gameWithHall(levels = {}) {
  const game = new Game(77);
  game.foundGuild('', START_TEAM);
  game.guild.materials = { dust: 1000, crystal: 100, raw: 1000, herbs: 1000 };
  game.guild.hall.levels = { ...levels };
  return game;
}

describe('Schmiede- und Brau-Daten', () => {
  it('Kosten nutzen nur bekannte Materialien, Rezepte ergeben echte Waren', () => {
    for (const cost of [FORGE_RULES.cost, REFORGE_RULES.baseCost]) {
      for (const materialId in cost) {
        expect(MATERIALS[materialId], materialId).toBeDefined();
      }
    }
    for (const rarity of RARITIES) {
      expect(REFORGE_RULES.rarityFactor[rarity.id], rarity.id).toBeGreaterThan(0);
    }
    for (const recipe of BREW_RECIPES) {
      expect(CONSUMABLES.some((consumable) => consumable.id === recipe.consumableId), recipe.id).toBe(true);
      expect(recipe.cost.herbs).toBeGreaterThan(0);
      for (const materialId in recipe.cost) {
        expect(MATERIALS[materialId], materialId).toBeDefined();
      }
    }
  });
});

describe('Schmieden', () => {
  it('ohne Schmiede geht nichts, mit Schmiede kommt ein weißes Item ins Inventar', () => {
    const game = gameWithHall();
    expect(game.forgeItem('plateHelmet').result).toBe('noForge');

    game.guild.hall.levels.forge = 1;
    const rawBefore = game.guild.materials.raw;
    const outcome = game.forgeItem('plateHelmet');
    expect(outcome.result).toBe('ok');
    expect(outcome.item.rarityId).toBe('common');
    expect(outcome.item.templateId).toBe('plateHelmet');
    expect(outcome.item.itemLevel).toBe(1);
    expect(game.guild.findItem(outcome.item.id)).toBeTruthy();
    expect(game.guild.materials.raw).toBe(rawBefore - FORGE_RULES.cost.raw);
  });

  it('zu wenig Material: nichts passiert', () => {
    const game = gameWithHall({ forge: 1 });
    game.guild.materials.raw = FORGE_RULES.cost.raw - 1;
    const itemsBefore = game.guild.inventory.length;
    expect(game.forgeItem('sword').result).toBe('notEnough');
    expect(game.guild.inventory.length).toBe(itemsBefore);
    expect(game.guild.materials.raw).toBe(FORGE_RULES.cost.raw - 1);
  });

  it('Item-Level folgt dem höchsten geschafften Dungeon, Schmiede Stufe 3 ist billiger', () => {
    const game = gameWithHall({ forge: 1 });
    game.guild.firstClearDays = { bearCave: 1, ruinedChapel: 3 };
    expect(getForgeItemLevel(game.guild)).toBe(3);
    const normal = getForgeCost(game.guild);
    game.guild.hall.levels.forge = 3;
    expect(getForgeCost(game.guild).raw).toBeLessThan(normal.raw);
  });
});

describe('Umschmieden', () => {
  it('erst ab Schmiede Stufe 2, nur Rüstung, gleicher Platz, Verbesserung bleibt', () => {
    const game = gameWithHall({ forge: 1 });
    const armor = game.lootSystem.createItem('rare', game.guild.createItemId(), 3, getItemTemplate('plateArmor'));
    armor.upgradeLevel = 4;
    game.guild.addItem(armor);
    const targets = getReforgeTargets(armor);
    expect(targets.length).toBeGreaterThan(0);
    expect(game.reforgeItem(armor.id, targets[0].id)).toBe('noReforge');

    game.guild.hall.levels.forge = 2;
    const oldSlot = armor.getTemplate().slot;
    const oldArmorType = armor.getTemplate().armorType;
    expect(game.reforgeItem(armor.id, targets[0].id)).toBe('ok');
    expect(armor.getTemplate().slot).toBe(oldSlot);
    expect(armor.getTemplate().armorType).not.toBe(oldArmorType);
    expect(armor.upgradeLevel).toBe(4);
    expect(armor.itemLevel).toBe(3);
    expect(armor.rarityId).toBe('rare');
  });

  it('Waffen lassen sich nicht umschmieden, teurer bei höherer Seltenheit', () => {
    const game = gameWithHall({ forge: 2 });
    const sword = game.lootSystem.createItem('rare', game.guild.createItemId(), 1, getItemTemplate('sword'));
    game.guild.addItem(sword);
    expect(getReforgeTargets(sword)).toEqual([]);
    expect(game.reforgeItem(sword.id, 'plateArmor')).toBe('notArmor');

    const white = game.lootSystem.createItem('common', 0, 1, getItemTemplate('plateArmor'));
    const epic = game.lootSystem.createItem('epic', 0, 1, getItemTemplate('plateArmor'));
    expect(getReforgeCost(epic).raw).toBeGreaterThan(getReforgeCost(white).raw);
    // Umschmieden ist teurer als ein neues Teil zu schmieden
    expect(getReforgeCost(white).raw).toBeGreaterThan(FORGE_RULES.cost.raw);
  });
});

describe('Brauen', () => {
  it('Rezepte hängen von der Labor-Stufe ab, Brauen füllt die Vorratskammer', () => {
    const game = gameWithHall();
    expect(getAvailableRecipes(game.guild)).toEqual([]);
    expect(game.brewRecipe('brewHealing')).toBe('noLab');

    game.guild.hall.levels.alchemyLab = 1;
    expect(getAvailableRecipes(game.guild).every((recipe) => recipe.tier === 1)).toBe(true);
    expect(game.brewRecipe('brewShadowWard')).toBe('noLab');
    const herbsBefore = game.guild.materials.herbs;
    expect(game.brewRecipe('brewHealing')).toBe('ok');
    expect(game.guild.countSupply('healingPotions')).toBe(1);
    expect(game.guild.materials.herbs).toBe(herbsBefore - getBrewCost(game.guild, 'brewHealing').herbs);

    game.guild.hall.levels.alchemyLab = 3;
    expect(getAvailableRecipes(game.guild).length).toBe(BREW_RECIPES.length);
    expect(getBrewCost(game.guild, 'brewHealing').herbs).toBeLessThan(4);
  });

  it('zu wenig Kräuter: nichts passiert', () => {
    const game = gameWithHall({ alchemyLab: 1 });
    game.guild.materials.herbs = 0;
    expect(game.brewRecipe('brewMana')).toBe('notEnough');
    expect(game.guild.countSupply('manaPotions')).toBe(0);
  });
});
