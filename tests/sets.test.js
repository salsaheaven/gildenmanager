// Tests für Klassen-Sets und Set-Dungeons (M4 Schritt 2).

import { describe, it, expect } from 'vitest';
import { SETS, SET_SLOTS, getSetLoot, getSetBonus } from '../src/data/sets.js';
import { HERO_CLASSES, getHeroClass } from '../src/data/heroClasses.js';
import { getItemTemplate } from '../src/data/items.js';
import { getLootBoxType } from '../src/data/lootBoxes.js';
import { getDungeon } from '../src/data/dungeons.js';
import { Game } from '../src/core/Game.js';
import { Item } from '../src/entities/Item.js';

describe('Set-Daten', () => {
  it('jede Klasse hat genau ein Set, die Teile passen zu ihrer Rüstungsart', () => {
    for (const heroClass of HERO_CLASSES) {
      const sets = SETS.filter((set) => set.classId === heroClass.id);
      expect(sets.length, heroClass.id).toBe(1);
      const set = sets[0];
      expect(set.armorType).toBe(heroClass.armorType);
      for (const slot of SET_SLOTS) {
        const template = getItemTemplate(set.templates[slot]);
        expect(template.slot).toBe(slot);
        expect(template.armorType).toBe(heroClass.armorType);
        expect(set.pieceNames[slot].length).toBeGreaterThan(0);
      }
      expect(getSetBonus(set, 2)).not.toBeNull();
      expect(getSetBonus(set, 3)).not.toBeNull();
    }
  });

  it('jeder Set-Dungeon verteilt alle Sets seiner Rüstungsart, Kennungen sind einmalig', () => {
    const ids = new Set();
    for (const [dungeonId, armorType] of [['ironCitadel', 'plate'], ['wildGrove', 'leather'], ['arcaneArchive', 'cloth']]) {
      const dungeon = getDungeon(dungeonId);
      expect(dungeon.level).toBe(30);
      const loot = getLootBoxType(dungeon.rewards.chest).bossLoot;
      const setCount = SETS.filter((set) => set.armorType === armorType).length;
      expect(loot.length).toBe(setCount * SET_SLOTS.length);
      for (const entry of loot) {
        expect(ids.has(entry.id)).toBe(false);
        ids.add(entry.id);
      }
    }
    expect(getSetLoot('plate').every((entry) => entry.setId)).toBe(true);
  });
});

describe('Set-Boni', () => {
  // Ein gegründetes Spiel; legt dem Helden Teile seines Sets an
  function heroWithSetPieces(classId, pieceCount, setClassId = classId) {
    const game = new Game(3);
    game.foundGuild('', ['paladin', 'rogue', 'mage', 'bard', 'druid']);
    const hero = game.guild.heroes.find((entry) => entry.classId === classId);
    const set = SETS.find((entry) => entry.classId === setClassId);
    for (const slot of SET_SLOTS.slice(0, pieceCount)) {
      const item = new Item(game.guild.createItemId(), set.templates[slot], 'epic', set.pieceNames[slot], { defense: 5 });
      item.setId = set.id;
      hero.equip(item);
    }
    return hero;
  }

  it('2 Teile geben den ersten Bonus, 3 Teile beide', () => {
    expect(heroWithSetPieces('mage', 1).getActiveSetBonuses()).toHaveLength(0);
    const two = heroWithSetPieces('mage', 2);
    expect(two.getActiveSetBonuses().map((active) => active.count)).toEqual([2]);
    expect(two.getOrderSettings().damageDone).toBeCloseTo(0.1);
    const three = heroWithSetPieces('mage', 3);
    expect(three.getActiveSetBonuses().map((active) => active.count)).toEqual([2, 3]);
    expect(three.getOrderSettings().damageDone).toBeCloseTo(0.2);
    expect(three.getOrderSettings().cheatDeath).toBe(true);
  });

  it('fremde Set-Teile derselben Rüstungsart geben keinen Bonus', () => {
    // Der Barde trägt Stoff wie der Magier, das Magier-Set wirkt bei ihm aber nicht
    expect(getHeroClass('bard').armorType).toBe('cloth');
    expect(heroWithSetPieces('bard', 3, 'mage').getActiveSetBonuses()).toHaveLength(0);
  });

  it('Set-Teile aus der Kiste tragen ihr Set und kommen ins Sammelbuch', () => {
    const game = new Game(4);
    game.foundGuild('', ['paladin', 'rogue', 'mage', 'bard', 'druid']);
    game.guild.addBox('chestMythrel', 30);
    const items = game.openBox('chestMythrel');
    const setPiece = items.find((item) => item.setId);
    expect(setPiece).toBeTruthy();
    expect(setPiece.getRarityRank()).toBeGreaterThanOrEqual(4);
    expect(game.guild.collection.getBestRarity(setPiece.bossItemId)).not.toBeNull();
  });
});
