// Tests für das Sammelbuch.

import { describe, it, expect } from 'vitest';
import { CollectionBook } from '../src/entities/CollectionBook.js';
import { Item } from '../src/entities/Item.js';
import { Game } from '../src/core/Game.js';
import { COLLECTION_PAGES, getPageItems, getAllCollectionItems } from '../src/data/collectionBook.js';
import { DUNGEONS } from '../src/data/dungeons.js';

// Ein Boss-Item von Hand
function bossItem(bossItemId, rarityId) {
  const item = new Item(1, 'sword', rarityId, 'Test', { attack: 5 });
  item.bossItemId = bossItemId;
  return item;
}

const BEAR_PAGE = COLLECTION_PAGES.find((page) => page.dungeonId === 'bearCave');

describe('Sammelbuch-Daten', () => {
  it('jeder Dungeon hat eine Seite, jede Seite hat Boss-Items', () => {
    for (const dungeon of DUNGEONS) {
      const page = COLLECTION_PAGES.find((entry) => entry.dungeonId === dungeon.id);
      expect(page, dungeon.id).toBeDefined();
      expect(page.title).toBeTruthy();
      expect(getPageItems(page).length).toBeGreaterThan(0);
    }
  });

  it('alle Boss-Items haben eine einmalige Kennung', () => {
    const ids = getAllCollectionItems().map((entry) => entry.id);
    expect(ids.every((id) => typeof id === 'string' && id.length > 0)).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('Sammelbuch eintragen', () => {
  it('neu, besser, nichts Neues; normale Items zählen nicht', () => {
    const book = new CollectionBook();
    expect(book.record(new Item(1, 'sword', 'epic', 'Normal', {})).status).toBeNull();
    expect(book.record(bossItem('grimfangFang', 'rare')).status).toBe('new');
    expect(book.record(bossItem('grimfangFang', 'rare')).status).toBeNull();
    expect(book.record(bossItem('grimfangFang', 'uncommon')).status).toBeNull();
    expect(book.record(bossItem('grimfangFang', 'epic')).status).toBe('improved');
    expect(book.getBestRarity('grimfangFang')).toBe('epic');
    expect(book.getProgress().found).toBe(1);
  });

  it('volle Seite: wird einmal gemeldet, schaltet Titel und Gold-Bonus frei; Glanz ab Lila', () => {
    const book = new CollectionBook();
    const ids = getPageItems(BEAR_PAGE).map((entry) => entry.id);
    expect(book.getGoldBonus('bearCave')).toBe(0);

    for (let i = 0; i < ids.length - 1; i++) {
      expect(book.record(bossItem(ids[i], 'epic')).completedPage).toBeNull();
    }
    expect(book.record(bossItem(ids[ids.length - 1], 'rare')).completedPage).toBe(BEAR_PAGE);
    expect(book.isPageComplete(BEAR_PAGE)).toBe(true);
    expect(book.isPageShiny(BEAR_PAGE)).toBe(false);
    // Verbessern auf einer vollen Seite meldet die Seite nicht noch einmal
    expect(book.record(bossItem(ids[ids.length - 1], 'epic')).completedPage).toBeNull();
    expect(book.isPageShiny(BEAR_PAGE)).toBe(true);

    expect(book.getGoldBonus('bearCave')).toBe(BEAR_PAGE.goldBonus);
    expect(book.getUnlockedTitles()).toEqual([BEAR_PAGE.title]);
    // Titel wählen läuft über das Spiel (Titel gibt es aus Sammelbuch und Server-Firsts)
    const game = new Game(1);
    expect(game.selectGuildTitle(BEAR_PAGE.title)).toBe(false);
    game.guild.collection = book;
    expect(game.selectGuildTitle(BEAR_PAGE.title)).toBe(true);
    expect(game.guild.selectedTitle).toBe(BEAR_PAGE.title);
  });
});

describe('Sammelbuch im Spiel', () => {
  it('Boss-Kisten tragen ihr Boss-Item ein, das Buch wird mitgespeichert, Verkaufen löscht nichts', () => {
    const game = new Game(7);
    game.guild.addBox('chestGrimfang', 1);
    const items = game.openBox('chestGrimfang');
    const boss = items.find((item) => item.bossItemId);
    expect(boss).toBeDefined();
    expect(boss.collectionStatus).toBe('new');
    expect(game.guild.collection.getBestRarity(boss.bossItemId)).toBe(boss.rarityId);

    game.sellItem(boss.id);
    const loaded = Game.fromSaveData(JSON.parse(JSON.stringify(game.toSaveData())));
    expect(loaded.guild.collection.getBestRarity(boss.bossItemId)).toBe(boss.rarityId);
  });

  it('volle Seite gibt mehr Gold in ihrem Dungeon', () => {
    const game = new Game(2);
    for (const entry of getPageItems(BEAR_PAGE)) {
      game.guild.collection.record(bossItem(entry.id, 'rare'));
    }
    game.guild.gold = 10000;
    // Eine starke Gruppe, die die Bärenhöhle sicher schafft
    const ids = [];
    for (const candidate of game.guild.candidates.slice(0, 4)) {
      game.hireHero(candidate.id);
      ids.push(candidate.id);
    }
    for (const hero of game.guild.heroes) {
      hero.level = 10;
    }
    game.startExpedition('bearCave', ids, 'never');
    game.endDay();
    const report = game.guild.reports[0];
    expect(report.gold + report.trashGold).toBeGreaterThan(0);
    expect(report.collectionGold).toBe(Math.round((report.gold + report.trashGold) * BEAR_PAGE.goldBonus));
    expect(report.collectionGold).toBeGreaterThan(0);
  });
});
