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

describe('Resistenzen auf Beute', () => {
  it('Boss-Items tragen die Resistenz ihres Bosses, Zufalls-Items manchmal eine zufällige', async () => {
    const { Guild } = await import('../src/entities/Guild.js');
    const { LootSystem } = await import('../src/systems/LootSystem.js');
    const { Random } = await import('../src/core/Random.js');
    const { getLootBoxType } = await import('../src/data/lootBoxes.js');
    const guild = new Guild();
    const lootSystem = new LootSystem(new Random(3));
    let bossItemsWithShadow = 0;
    let randomItemsWithResistance = 0;
    let randomItems = 0;
    for (let i = 0; i < 100; i++) {
      const items = lootSystem.rollBoxContents(getLootBoxType('chestMorva'), guild, 3);
      for (const item of items) {
        const isBossItem = ['Stab der Schattenruferin', 'Kapuze der Schwester', 'Gebetsring der Kapelle'].includes(item.name);
        if (isBossItem) {
          expect(item.resistances.shadow).toBeGreaterThan(0);
          bossItemsWithShadow++;
        } else {
          randomItems++;
          if (Object.keys(item.resistances).length > 0) {
            randomItemsWithResistance++;
          }
        }
      }
    }
    expect(bossItemsWithShadow).toBeGreaterThanOrEqual(100);
    expect(randomItemsWithResistance).toBeGreaterThan(0);
    expect(randomItemsWithResistance).toBeLessThan(randomItems / 2);
  });
});
