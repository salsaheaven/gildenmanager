// Tests für Verbrauchsgüter, Händler und Vorratskammer (P6).

import { describe, it, expect } from 'vitest';
import { CONSUMABLES, DAILY_OFFER_COUNT, SUPPLY_SLOTS, getConsumable } from '../src/data/consumables.js';
import { LOOT_BOXES } from '../src/data/lootBoxes.js';
import { RESISTANCE_TYPES } from '../src/data/damageTypes.js';
import { Game } from '../src/core/Game.js';
import { simulateRun } from '../src/systems/combat/CombatSimulator.js';
import { combineSupplyEffects } from '../src/systems/combat/SupplyEffects.js';
import { createTestGroup } from '../src/systems/combat/TestGroup.js';

// Ein Spiel mit einem angeheuerten Helden und viel Gold
function gameWithHero() {
  const game = new Game(3);
  game.guild.gold = 10000;
  const candidate = game.guild.candidates[0];
  game.hireHero(candidate.id);
  return { game, hero: game.guild.heroes[0] };
}

describe('Verbrauchsgüter-Daten', () => {
  it('jede Ware ist vollständig, Resistenzen nur gegen echte Schadensarten', () => {
    const ids = new Set();
    for (const consumable of CONSUMABLES) {
      expect(ids.has(consumable.id)).toBe(false);
      ids.add(consumable.id);
      expect(consumable.price).toBeGreaterThan(0);
      expect(['always', 'daily']).toContain(consumable.stock);
      expect(['run', 'instant']).toContain(consumable.use);
      expect(consumable.description).toBeTruthy();
      for (const damageType in consumable.effects.resistance || {}) {
        expect(RESISTANCE_TYPES).toContain(damageType);
      }
    }
    expect(CONSUMABLES.filter((c) => c.stock === 'daily').length).toBeGreaterThanOrEqual(DAILY_OFFER_COUNT);
  });

  it('keine Kiste ist mehr kaufbar', () => {
    for (const box of LOOT_BOXES) {
      expect(box.price, box.id).toBeNull();
    }
  });
});

describe('Händler', () => {
  it('Tagesangebot: verschiedene Waren, wechselt am nächsten Tag', () => {
    const game = new Game(5);
    const first = game.guild.dailyOffer.slice();
    expect(first).toHaveLength(DAILY_OFFER_COUNT);
    expect(new Set(first).size).toBe(DAILY_OFFER_COUNT);
    const offers = [first.join()];
    for (let day = 0; day < 5; day++) {
      game.endDay();
      offers.push(game.guild.dailyOffer.join());
    }
    expect(new Set(offers).size).toBeGreaterThan(1);
  });

  it('Grundware immer kaufbar, Tagesware nur im Angebot, kostet Gold', () => {
    const { game } = gameWithHero();
    const goldBefore = game.guild.gold;
    expect(game.buySupply('healingPotions')).toBe(true);
    expect(game.guild.gold).toBe(goldBefore - getConsumable('healingPotions').price);
    expect(game.guild.countSupply('healingPotions')).toBe(1);

    const notOffered = CONSUMABLES.find((c) => c.stock === 'daily' && !game.guild.dailyOffer.includes(c.id));
    expect(game.buySupply(notOffered.id)).toBe(false);
    expect(game.buySupply(game.guild.dailyOffer[0])).toBe(true);

    game.guild.gold = 0;
    expect(game.buySupply('manaPotions')).toBe(false);
  });
});

describe('Vorräte im Run', () => {
  it('Einplanen nimmt Vorräte heraus, Absagen gibt sie zurück, höchstens SUPPLY_SLOTS', () => {
    const { game, hero } = gameWithHero();
    game.buySupply('healingPotions');
    game.buySupply('manaPotions');
    game.buySupply('manaPotions');
    expect(game.startExpedition('bearCave', [hero.id], 'never', ['healingPotions', 'manaPotions', 'manaPotions']))
      .toBe('tooManySupplies');
    expect(game.startExpedition('bearCave', [hero.id], 'never', ['bandages'])).toBe('notForRuns');
    expect(game.startExpedition('bearCave', [hero.id], 'never', ['healingPotions', 'healingPotions'])).toBe('noSupplies');
    expect(game.guild.countSupply('healingPotions')).toBe(1); // bei Fehlern wird nichts genommen

    expect(game.startExpedition('bearCave', [hero.id], 'never', ['healingPotions', 'manaPotions'])).toBe('ok');
    expect(SUPPLY_SLOTS).toBe(2);
    expect(game.guild.countSupply('healingPotions')).toBe(0);
    const expedition = game.guild.expeditions[0];
    expect(game.setExpeditionSupplies(expedition.id, ['manaPotions', 'manaPotions'])).toBe('ok');
    expect(game.guild.countSupply('healingPotions')).toBe(1);
    expect(game.guild.countSupply('manaPotions')).toBe(0);

    game.cancelExpedition(expedition.id);
    expect(game.guild.countSupply('manaPotions')).toBe(2);
  });

  it('nach dem Run sind die Vorräte verbraucht und stehen im Bericht; Spielstand speichert alles', () => {
    const { game, hero } = gameWithHero();
    game.buySupply('healingPotions');
    game.buySupply('manaPotions');
    game.startExpedition('bearCave', [hero.id], 'never', ['healingPotions']);
    game.endDay();
    expect(game.guild.countSupply('healingPotions')).toBe(0);
    expect(game.guild.reports[0].supplies).toEqual(['healingPotions']);
    const loaded = Game.fromSaveData(JSON.parse(JSON.stringify(game.toSaveData())));
    expect(loaded.guild.countSupply('manaPotions')).toBe(1);
    expect(loaded.guild.dailyOffer).toEqual(game.guild.dailyOffer);
  });

  it('Wirkungen werden zusammengezählt', () => {
    const effects = combineSupplyEffects(['acidWard', 'acidWard', 'furyElixir']);
    expect(effects.resistance.acid).toBe(30);
    expect(effects.damageDone).toBeCloseTo(0.1);
    expect(effects.restHealth).toBe(0);
  });

  it('Vorräte verändern den Kampf (Steinhaut: weniger erlittener Schaden)', () => {
    let without = 0;
    let withStone = 0;
    for (let seed = 1; seed <= 10; seed++) {
      const a = simulateRun({ heroes: createTestGroup(2), dungeonId: 'bearCave', seed });
      const b = simulateRun({ heroes: createTestGroup(2), dungeonId: 'bearCave', seed, supplies: ['stoneskin'] });
      without += a.encounters[0].heroes.reduce((sum, h) => sum + h.damageTaken, 0);
      withStone += b.encounters[0].heroes.reduce((sum, h) => sum + h.damageTaken, 0);
    }
    expect(withStone).toBeLessThan(without);
  });
});

describe('Verbandszeug', () => {
  it('verkürzt eine Verletzung um einen Tag, nur bei Verletzten', () => {
    const { game, hero } = gameWithHero();
    game.buySupply('bandages');
    expect(game.useSupplyOnHero('bandages', hero.id)).toBe(false); // nicht verletzt
    hero.injuryDays = 2;
    expect(game.useSupplyOnHero('bandages', hero.id)).toBe(true);
    expect(hero.injuryDays).toBe(1);
    expect(game.guild.countSupply('bandages')).toBe(0);
    expect(game.useSupplyOnHero('bandages', hero.id)).toBe(false); // keins mehr da
  });
});
