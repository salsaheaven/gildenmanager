// Tests für Schadensarten und Resistenzen

import { describe, it, expect } from 'vitest';
import { DAMAGE_TYPES, MAX_RESISTANCE } from '../src/data/damageTypes.js';
import { BOSSES, MINIONS } from '../src/data/enemies.js';
import { Combatant } from '../src/systems/combat/Combatant.js';
import { Hero } from '../src/entities/Hero.js';
import { Item } from '../src/entities/Item.js';

function makeTarget(resistances) {
  return new Combatant({ id: 't', name: 'Ziel', side: 'hero', stats: { health: 1000, defense: 0 }, resistances });
}

describe('Schadensarten', () => {
  it('alle Gegner und Mechaniken benutzen gültige Schadensarten', () => {
    for (const boss of BOSSES) {
      if (boss.attackDamageType) {
        expect(DAMAGE_TYPES[boss.attackDamageType], boss.id).toBeDefined();
      }
      for (const mechanic of boss.mechanics) {
        if (mechanic.damageType) {
          expect(DAMAGE_TYPES[mechanic.damageType], mechanic.name).toBeDefined();
        }
      }
    }
    for (const minionId in MINIONS) {
      const type = MINIONS[minionId].attackDamageType;
      if (type) {
        expect(DAMAGE_TYPES[type], minionId).toBeDefined();
      }
    }
  });

  it('Resistenz mindert nur Schaden der passenden Art', () => {
    const plain = makeTarget({});
    const resistant = makeTarget({ acid: 50 });
    expect(plain.takeDamage(100, true, 'acid').damage).toBe(100);
    expect(resistant.takeDamage(100, true, 'acid').damage).toBe(50);
    expect(resistant.takeDamage(100, true, 'shadow').damage).toBe(100);
    expect(resistant.takeDamage(100, true).damage).toBe(100); // körperlich
  });

  it('Resistenzen der Ausrüstung werden zusammengezählt, höchstens bis zur Obergrenze', () => {
    const hero = new Hero(1, 'Test', 'warrior', 'uncommon', [], {});
    hero.equip(new Item(1, 'plateHelmet', 'rare', 'Helm', { defense: 1 }, 1, { acid: 30 }));
    hero.equip(new Item(2, 'plateArmor', 'rare', 'Harnisch', { defense: 1 }, 1, { acid: 30, shadow: 5 }));
    expect(hero.getResistances()).toEqual({ acid: MAX_RESISTANCE, shadow: 5 });
  });
});
