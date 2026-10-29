// Tests für die Kampf-Anweisungen der Helden (Haltung + Eigenheit).

import { describe, it, expect } from 'vitest';
import { HERO_ORDERS } from '../src/data/heroOrders.js';
import { HERO_CLASSES, getHeroClass } from '../src/data/heroClasses.js';
import { Hero } from '../src/entities/Hero.js';
import { Game } from '../src/core/Game.js';
import { createTestGroup } from '../src/systems/combat/TestGroup.js';
import { estimateChances } from '../src/systems/combat/ChanceEstimator.js';
import { combineOrderEffects } from '../src/systems/combat/OrderSettings.js';

const LOOKS = { skin: '#f1c39b', hair: '#6b3f17' };

describe('Anweisungs-Daten', () => {
  it('jede Klasse hat genau zwei Anweisungen, die erste heißt "Haltung"', () => {
    for (const heroClass of HERO_CLASSES) {
      const orders = HERO_ORDERS[heroClass.id];
      expect(orders, heroClass.name).toBeDefined();
      expect(orders.length, heroClass.name).toBe(2);
      expect(orders[0].name, heroClass.name).toBe('Haltung');
    }
  });

  for (const classId in HERO_ORDERS) {
    it(`${classId}: Ausgewogen zuerst, jedes Extrem hat Vor- und Nachteil, Skills gehören zur Klasse`, () => {
      const heroClass = getHeroClass(classId);
      for (const order of HERO_ORDERS[classId]) {
        expect(order.options.length).toBe(3);
        expect(order.options[0].id).toBe('balanced');
        expect(order.options[0].effects).toEqual({});
        for (const option of order.options.slice(1)) {
          expect(option.pro, option.label).toBeTruthy();
          expect(option.contra, option.label).toBeTruthy();
          expect(Object.keys(option.effects).length, option.label).toBeGreaterThan(0);
          for (const field of ['abilityPower', 'abilityWhen', 'abilityTarget']) {
            for (const abilityId in option.effects[field] || {}) {
              expect(heroClass.abilities, option.label).toContain(abilityId);
            }
          }
        }
      }
    });
  }

  it('alle Optionen lassen sich im Kampf benutzen (keine unbekannten Bedingungen oder Ziele)', () => {
    for (const heroClass of HERO_CLASSES) {
      for (const order of HERO_ORDERS[heroClass.id]) {
        for (const option of order.options.slice(1)) {
          // Gruppe mit Tank, Heiler und der geprüften Klasse, damit auch Ziele wie "Heiler" existieren
          const group = createTestGroup(3, 'uncommon', ['warrior', 'priest', heroClass.id, 'mage', 'rogue']);
          group[2].setOrder(order.id, option.id);
          for (const bossId of ['grimfang', 'morva', 'skarrix']) {
            expect(() => estimateChances({ heroes: group, bossId, count: 3 }), option.label).not.toThrow();
          }
        }
      }
    }
  });
});

describe('Anweisungen zusammenfassen', () => {
  it('Zahlen werden zusammengezählt, Skill-Änderungen zusammengeführt', () => {
    const settings = combineOrderEffects([
      { damageTaken: 0.15, abilityPower: { viperBite: 0.6 } },
      { damageTaken: 0.15, abilityPower: { viperBite: -0.2 }, abilityWhen: { shadowStab: 'never' } },
    ]);
    expect(settings.damageTaken).toBeCloseTo(0.3);
    expect(settings.abilityPower.viperBite).toBeCloseTo(0.4);
    expect(settings.abilityWhen.shadowStab).toBe('never');
    expect(settings.damageDone).toBe(0);
    expect(settings.targetPriority).toBeNull();
  });

  it('ohne Wahl gilt "Ausgewogen", gewählte Optionen fließen in die Einstellungen', () => {
    const mage = new Hero(2, 'M', 'mage', 'uncommon', [], LOOKS);
    expect(mage.getOrderSettings().damageDone).toBe(0);
    mage.setOrder('stance', 'overload');
    mage.setOrder('spells', 'boss');
    const settings = mage.getOrderSettings();
    expect(settings.damageDone).toBeCloseTo(0.35);
    expect(settings.manaCost).toBeCloseTo(0.5);
    expect(settings.targetPriority).toBe('boss');
    expect(settings.abilityWhen.ashRain).toBe('never');
  });

  it('Anweisungen werden gespeichert und geladen', () => {
    const game = new Game(1);
    game.guild.gold = 10000;
    const candidate = game.guild.candidates[0];
    game.hireHero(candidate.id);
    game.setHeroOrder(candidate.id, 'stance', 'someOption');
    const loaded = Game.fromSaveData(JSON.parse(JSON.stringify(game.toSaveData())));
    expect(loaded.guild.heroes[0].orders.stance).toBe('someOption');
  });
});

describe('Anweisungen verändern den Kampf', () => {
  // Der Krieger ist der Tank: Bei "Bollwerk" steckt er weniger ein, bei "Wut" mehr
  function warriorDamageTaken(optionId) {
    const group = createTestGroup(3);
    group[0].setOrder('stance', optionId);
    const result = estimateChances({ heroes: group, bossId: 'grimfang', count: 40 });
    return result;
  }

  it('Bollwerk und Wut ergeben andere Siegchancen als Ausgewogen', () => {
    const balanced = warriorDamageTaken('balanced');
    const bulwark = warriorDamageTaken('bulwark');
    const fury = warriorDamageTaken('fury');
    // Nur prüfen, dass die Anweisung überhaupt etwas bewirkt (kein Balancing)
    const changed = bulwark.winRate !== balanced.winRate || fury.winRate !== balanced.winRate ||
      bulwark.averageRounds !== balanced.averageRounds || fury.averageRounds !== balanced.averageRounds;
    expect(changed).toBe(true);
  });
});
