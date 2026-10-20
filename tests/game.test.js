// Tests für die Spiellogik: Zufall, Uhr, Lootsystem, Spiel-Aktionen, Speichern.

import { describe, it, expect } from 'vitest';
import { Random } from '../src/core/Random.js';
import { GameClock } from '../src/core/GameClock.js';
import { Game } from '../src/core/Game.js';
import { SaveManager } from '../src/core/SaveManager.js';
import { Guild } from '../src/entities/Guild.js';
import { LootSystem } from '../src/systems/LootSystem.js';
import { getLootBoxType } from '../src/data/lootBoxes.js';
import { BALANCING } from '../src/data/balancing.js';

function createMemoryStorage() {
  const memory = {};
  return {
    getItem: (key) => (key in memory ? memory[key] : null),
    setItem: (key, value) => { memory[key] = value; },
    removeItem: (key) => { delete memory[key]; },
  };
}

describe('Random', () => {
  it('liefert mit gleichem Seed die gleichen Zahlen', () => {
    const a = new Random(42);
    const b = new Random(42);
    for (let i = 0; i < 10; i++) {
      expect(a.next()).toBe(b.next());
    }
  });

  it('pickWeighted hält sich ungefähr an die Gewichte', () => {
    const random = new Random(1);
    let countA = 0;
    for (let i = 0; i < 10000; i++) {
      if (random.pickWeighted({ a: 75, b: 25 }) === 'a') {
        countA++;
      }
    }
    expect(countA / 10000).toBeGreaterThan(0.72);
    expect(countA / 10000).toBeLessThan(0.78);
  });

  it('pickWeighted wählt nie etwas mit Gewicht 0', () => {
    const random = new Random(5);
    for (let i = 0; i < 5000; i++) {
      expect(random.pickWeighted({ a: 0, b: 10, c: 0 })).toBe('b');
    }
  });
});

describe('GameClock', () => {
  it('Geschwindigkeit multipliziert die Zeit', () => {
    const clock = new GameClock();
    clock.setSpeed(4);
    expect(clock.update(1)).toBe(4);
    expect(clock.totalGameSeconds).toBe(4);
  });

  it('in der Pause vergeht keine Zeit', () => {
    const clock = new GameClock();
    clock.togglePause();
    expect(clock.update(10)).toBe(0);
    expect(clock.totalGameSeconds).toBe(0);
  });

  it('startet an Tag 1 um 08:00', () => {
    const clock = new GameClock();
    expect(clock.getDay()).toBe(1);
    expect(clock.getTimeText()).toBe('08:00');
  });
});

describe('LootSystem', () => {
  it('eine Kiste enthält die richtige Anzahl Items, seltenstes zuletzt', () => {
    const guild = new Guild();
    const lootSystem = new LootSystem(new Random(7));
    const boxType = getLootBoxType('epic');
    const items = lootSystem.rollBoxContents(boxType, guild);

    expect(items.length).toBe(boxType.itemCount);
    for (let i = 1; i < items.length; i++) {
      expect(items[i].getRarityRank()).toBeGreaterThanOrEqual(items[i - 1].getRarityRank());
    }
  });

  it('Holzkisten-Verteilung stimmt ungefähr mit den Chancen überein', () => {
    const guild = new Guild();
    const lootSystem = new LootSystem(new Random(123));
    const chances = getLootBoxType('wood').chances;
    const counts = { poor: 0, common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 };

    const rolls = 20000;
    for (let i = 0; i < rolls; i++) {
      guild.itemsSinceEpic = 0; // Pity ausschalten, wir wollen nur die reinen Chancen
      counts[lootSystem.rollRarity(chances, guild)]++;
    }

    for (const rarityId of ['poor', 'common', 'uncommon', 'rare']) {
      const percent = (counts[rarityId] / rolls) * 100;
      expect(Math.abs(percent - chances[rarityId])).toBeLessThan(1.5);
    }
  });

  it('Pity: nach der Pechsträhne kommt garantiert ein episches Item', () => {
    const guild = new Guild();
    const lootSystem = new LootSystem(new Random(9));
    const onlyJunk = { poor: 100 };

    for (let i = 0; i < BALANCING.pityEpicAfterItems; i++) {
      expect(lootSystem.rollRarity(onlyJunk, guild)).toBe('poor');
    }
    expect(lootSystem.rollRarity(onlyJunk, guild)).toBe('epic');
    expect(guild.itemsSinceEpic).toBe(0);
  });
});

describe('Game', () => {
  it('der Kurier ist abgeschaltet und bringt keine Kisten', () => {
    const game = new Game(1);
    const boxesBefore = game.guild.boxes.length;
    game.update(BALANCING.courierIntervalSeconds * 10);
    expect(game.guild.boxes.length).toBe(boxesBefore);
  });

  it('eingeschaltet bringt der Kurier nach Ablauf der Zeit eine Kiste', () => {
    BALANCING.courierEnabled = true;
    const game = new Game(1);
    const boxesBefore = game.guild.boxes.length;
    let arrived = 0;
    game.on('boxArrived', () => arrived++);

    game.update(BALANCING.courierIntervalSeconds - 1);
    expect(arrived).toBe(0);
    game.update(1);
    expect(arrived).toBe(1);
    expect(game.guild.boxes.length).toBe(boxesBefore + 1);
    BALANCING.courierEnabled = false;
  });

  it('Kiste kaufen kostet Gold und klappt nicht ohne Gold', () => {
    const game = new Game(1);
    game.guild.gold = 30;
    expect(game.buyBox('wood')).toBe(true);
    expect(game.guild.gold).toBe(30 - getLootBoxType('wood').price);
    expect(game.buyBox('gold')).toBe(false);
  });

  it('Kiste öffnen legt Items ins Inventar, verkaufen bringt Gold', () => {
    const game = new Game(1);
    const items = game.openBox('wood');
    expect(game.guild.inventory.length).toBe(items.length);

    const goldBefore = game.guild.gold;
    const earned = game.sellItem(items[0].id);
    expect(earned).toBeGreaterThan(0);
    expect(game.guild.gold).toBe(goldBefore + earned);
    expect(game.guild.inventory.length).toBe(items.length - 1);
  });

  it('openBox ohne passende Kiste gibt null zurück', () => {
    const game = new Game(1);
    expect(game.openBox('epic')).toBe(null);
  });
});

describe('Speichern und Laden', () => {
  it('ein gespeichertes Spiel wird genauso wieder geladen', () => {
    const game = new Game(99);
    game.openBox('wood');
    game.update(12);
    game.clock.setSpeed(2);

    const saveManager = new SaveManager(createMemoryStorage());
    saveManager.save(game);
    const loaded = Game.fromSaveData(saveManager.load());

    expect(loaded.toSaveData()).toEqual(game.toSaveData());
    // Auch der Zufall geht genau gleich weiter (kein Neuladen-Trick für besseren Loot)
    expect(loaded.random.next()).toBe(game.random.next());
  });

  it('ohne Spielstand gibt load() null zurück', () => {
    const saveManager = new SaveManager(createMemoryStorage());
    expect(saveManager.load()).toBe(null);
  });
});
