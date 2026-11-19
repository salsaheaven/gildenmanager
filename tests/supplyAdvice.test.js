// Tests für den Tränke-Ratgeber und die Notfall-Tränke (Heil- und Manatränke im Kampf).

import { describe, it, expect } from 'vitest';
import { Game } from '../src/core/Game.js';
import { suggestSupplies } from '../src/systems/SupplyAdvice.js';
import { combineSupplyEffects, applySupplyEffects, drinkEmergencyPotions } from '../src/systems/combat/SupplyEffects.js';
import { createHeroCombatant } from '../src/systems/combat/CombatSimulator.js';
import { createTestGroup } from '../src/systems/combat/TestGroup.js';
import { CONSUMABLES } from '../src/data/consumables.js';

describe('Tränke-Ratgeber', () => {
  it('jeder Trank hat "Stark bei" und Ratgeber-Daten', () => {
    for (const consumable of CONSUMABLES) {
      expect(consumable.strongAt, consumable.id).toBeTruthy();
      expect(consumable.advice.value, consumable.id).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(consumable.advice.helpsAgainst), consumable.id).toBe(true);
    }
  });

  it('empfiehlt höchstens 2 Tränke, die man heute bekommt, und zuerst die stärksten', () => {
    const game = new Game(3);
    game.guild.dailyOffer = ['furyElixir', 'stoneskin', 'fireWard'];
    const suggestion = suggestSupplies(game.guild, 'bearCave');
    expect(suggestion).toEqual(['furyElixir', 'stoneskin']);
  });

  it('nicht im Angebot und nicht im Lager: wird nicht empfohlen', () => {
    const game = new Game(3);
    game.guild.dailyOffer = ['fireWard', 'lightWard', 'acidWard'];
    const suggestion = suggestSupplies(game.guild, 'bearCave');
    expect(suggestion).not.toContain('furyElixir');
    // Schutztränke nur bei bekannter Schadensart: in der Bärenhöhle (unerkundet) keiner
    expect(suggestion.some((id) => id.endsWith('Ward'))).toBe(false);
  });

  it('Mana leer als Ursache: Manatränke werden empfohlen', () => {
    const game = new Game(3);
    game.guild.dailyOffer = ['fireWard', 'lightWard', 'acidWard'];
    expect(suggestSupplies(game.guild, 'bearCave', ['outOfMana'])).toContain('manaPotions');
  });
});

describe('Notfall-Tränke', () => {
  it('ein Held unter 50 % Leben trinkt einmal pro Begegnung einen Heiltrank', () => {
    const hero = createHeroCombatant(createTestGroup(10)[0]);
    applySupplyEffects([hero], combineSupplyEffects(['healingPotions']));
    hero.hp = Math.round(hero.maxHp * 0.3);
    const drunk = drinkEmergencyPotions(hero);
    expect(drunk[0].kind).toBe('heal');
    expect(hero.hp).toBeGreaterThan(hero.maxHp * 0.7);
    hero.hp = Math.round(hero.maxHp * 0.3);
    expect(drinkEmergencyPotions(hero)).toEqual([]);
  });

  it('ohne Trank passiert nichts', () => {
    const hero = createHeroCombatant(createTestGroup(10)[0]);
    applySupplyEffects([hero], combineSupplyEffects([]));
    hero.hp = 1;
    expect(drinkEmergencyPotions(hero)).toEqual([]);
  });
});
