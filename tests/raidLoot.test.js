// Tests für die Raid-Beute (M4 Schritt 5c): Legendär nur aus Raid-Kisten (als Waffe oder Ring),
// Raid-Pity, Aschenessenz, Raid-Kisten pro besiegtem Boss, Set-Teile umschmieden, Sammelbuch-Seite des Raids.

import { describe, it, expect } from 'vitest';
import { LOOT_BOXES, getLootBoxType } from '../src/data/lootBoxes.js';
import { RAIDS } from '../src/data/raids.js';
import { BALANCING } from '../src/data/balancing.js';
import { SET_REFORGE_RULES } from '../src/data/crafting.js';
import { getSet } from '../src/data/sets.js';
import { COLLECTION_PAGES, getPageItems, getPageName } from '../src/data/collectionBook.js';
import { Game } from '../src/core/Game.js';
import { Item } from '../src/entities/Item.js';

describe('Kisten-Daten', () => {
  it('Legendär gibt es nur in Raid-Kisten', () => {
    for (const boxType of LOOT_BOXES) {
      const legendary = boxType.chances.legendary || 0;
      if (boxType.isRaidChest) {
        expect(legendary, boxType.id).toBeGreaterThan(0);
        expect(boxType.legendarySlots.length).toBeGreaterThan(0);
        expect(boxType.raidIngredients.max).toBeGreaterThanOrEqual(boxType.raidIngredients.min);
      } else {
        expect(legendary, boxType.id).toBe(0);
      }
    }
  });

  it('jeder Raid-Boss gibt eine Raid-Kiste', () => {
    for (const raid of RAIDS) {
      for (const encounter of raid.encounters.filter((entry) => entry.type === 'boss')) {
        expect(getLootBoxType(encounter.chest).isRaidChest, encounter.bossId).toBe(true);
      }
    }
  });
});

describe('Raid-Kisten öffnen', () => {
  it('legendäre Items aus Raid-Kisten sind immer Waffen oder Ringe, dazu gibt es Aschenessenz', () => {
    const game = new Game(5);
    let legendaries = 0;
    for (let i = 0; i < 60; i++) {
      game.guild.addBox('raidChestAshKing', 30);
      const essenceBefore = game.guild.materials.ashEssence;
      const items = game.openBox('raidChestAshKing');
      expect(game.guild.materials.ashEssence - essenceBefore).toBeGreaterThanOrEqual(2);
      for (const item of items.filter((entry) => entry.rarityId === 'legendary')) {
        expect(['weapon', 'ring'], item.name).toContain(item.getSlot());
        legendaries++;
      }
    }
    expect(legendaries).toBeGreaterThan(0);
  });

  it('Raid-Pity: Nach der Pechsträhne ist die nächste Raid-Kiste legendär', () => {
    const game = new Game(6);
    game.guild.raidChestsSinceLegendary = BALANCING.raidLegendaryPityAfter - 1;
    game.guild.addBox('raidChestColossus', 30);
    const items = game.openBox('raidChestColossus');
    expect(items.some((item) => item.rarityId === 'legendary')).toBe(true);
    expect(game.guild.raidChestsSinceLegendary).toBe(0);
  });

  it('normale Kisten enthalten nie Legendär', () => {
    const game = new Game(7);
    for (let i = 0; i < 40; i++) {
      game.guild.addBox('chestIgnara', 28);
      const items = game.openBox('chestIgnara');
      expect(items.some((item) => item.rarityId === 'legendary')).toBe(false);
    }
  });
});

describe('Set-Teile umschmieden', () => {
  function createSetHelm(game) {
    const set = getSet('setWarrior');
    const item = new Item(game.guild.createItemId(), set.templates.head, 'epic', set.pieceNames.head, { defense: 10 }, 30, { fire: 12 });
    item.setId = set.id;
    item.upgradeLevel = 3;
    game.guild.addItem(item);
    return item;
  }

  it('wird zum Teil eines anderen Sets (auch andere Rüstungsart), Verbesserung und Resistenz bleiben', () => {
    const game = new Game(8);
    const helm = createSetHelm(game);
    game.guild.addMaterials(SET_REFORGE_RULES.cost);
    expect(game.reforgeSetItem(helm.id, 'setMage')).toBe('ok');
    const mageSet = getSet('setMage');
    expect(helm.setId).toBe('setMage');
    expect(helm.templateId).toBe(mageSet.templates.head);
    expect(helm.name).toBe(mageSet.pieceNames.head);
    expect(helm.upgradeLevel).toBe(3);
    expect(helm.resistances).toEqual({ fire: 12 });
    expect(game.guild.materials.ashEssence).toBe(0);
  });

  it('ohne Aschenessenz geht es nicht', () => {
    const game = new Game(9);
    const helm = createSetHelm(game);
    expect(game.reforgeSetItem(helm.id, 'setMage')).toBe('notEnough');
    expect(helm.setId).toBe('setWarrior');
  });
});

describe('Sammelbuch-Seite des Raids', () => {
  it('enthält die Boss-Items aller Raid-Kisten', () => {
    const page = COLLECTION_PAGES.find((entry) => entry.raidId === 'ashHalls');
    expect(getPageName(page)).toBe('Die Aschenhallen');
    const expected = RAIDS[0].encounters.filter((entry) => entry.type === 'boss')
      .reduce((sum, entry) => sum + getLootBoxType(entry.chest).bossLoot.length, 0);
    expect(getPageItems(page).length).toBe(expected);
  });
});
