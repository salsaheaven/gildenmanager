// Tests für die Markierung "neue Ausrüstung verfügbar" (UI-Neubau, Schritt 1).

import { describe, it, expect } from 'vitest';
import { Game } from '../src/core/Game.js';
import { Item } from '../src/entities/Item.js';

// Starttruppe mit allen Rüstungsarten (wie in buildings.test.js)
const START_TEAM = ['paladin', 'rogue', 'mage', 'bard', 'druid'];

function foundedGame() {
  const game = new Game(5);
  game.foundGuild('', START_TEAM);
  game.guild.inventory = [];
  return game;
}

describe('Neue Ausrüstung', () => {
  it('ein passendes Item markiert den Platz, bis die Liste geöffnet wurde', () => {
    const game = foundedGame();
    const paladin = game.guild.heroes.find((hero) => hero.classId === 'paladin');
    expect(game.getSlotsWithNewGear(paladin.id)).toEqual([]);

    const ring = new Item(game.guild.createItemId(), 'attackRing', 'rare', 'Ring', { attack: 5 });
    game.guild.addItem(ring);
    expect(game.getSlotsWithNewGear(paladin.id)).toEqual(['ring']);

    game.markEquipSlotSeen(paladin.id, 'ring');
    expect(game.getSlotsWithNewGear(paladin.id)).toEqual([]);
  });

  it('Rüstung der falschen Art markiert nichts, abgelegte Teile sind für den Helden nicht neu', () => {
    const game = foundedGame();
    const mage = game.guild.heroes.find((hero) => hero.classId === 'mage');
    const plate = new Item(game.guild.createItemId(), 'plateHelmet', 'rare', 'Helm', { defense: 3 });
    game.guild.addItem(plate);
    expect(game.getSlotsWithNewGear(mage.id)).not.toContain('head');

    const robe = new Item(game.guild.createItemId(), 'clothArmor', 'rare', 'Robe', { magic: 3 });
    game.guild.addItem(robe);
    expect(game.getSlotsWithNewGear(mage.id)).toContain('chest');
    game.markEquipSlotSeen(mage.id, 'chest');
    game.equipItem(mage.id, robe.id);
    game.unequipItem(mage.id, 'chest');
    expect(game.getSlotsWithNewGear(mage.id)).not.toContain('chest');
  });

  it('wird mitgespeichert', () => {
    const game = foundedGame();
    const hero = game.guild.heroes[0];
    game.guild.addItem(new Item(game.guild.createItemId(), 'attackRing', 'rare', 'Ring', { attack: 5 }));
    game.markEquipSlotSeen(hero.id, 'ring');
    const loaded = Game.fromSaveData(JSON.parse(JSON.stringify(game.toSaveData())));
    expect(loaded.getSlotsWithNewGear(hero.id)).toEqual([]);
  });
});
