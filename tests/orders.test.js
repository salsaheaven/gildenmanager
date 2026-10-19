// Tests für die Kampf-Anweisungen der Helden.

import { describe, it, expect } from 'vitest';
import { HERO_ORDERS } from '../src/data/heroOrders.js';
import { HERO_CLASSES, getHeroClass } from '../src/data/heroClasses.js';
import { Hero } from '../src/entities/Hero.js';
import { Game } from '../src/core/Game.js';
import { createTestGroup } from '../src/systems/combat/TestGroup.js';
import { estimateChances } from '../src/systems/combat/ChanceEstimator.js';

const LOOKS = { skin: '#f1c39b', hair: '#6b3f17' };

describe('Anweisungs-Daten', () => {
  for (const classId in HERO_ORDERS) {
    it(`${classId}: Klasse existiert, Optionen verweisen auf eigene Skills`, () => {
      const heroClass = getHeroClass(classId);
      for (const order of HERO_ORDERS[classId]) {
        expect(order.options.length).toBeGreaterThanOrEqual(2);
        for (const option of order.options) {
          for (const abilityId in option.effects.abilityWhen || {}) {
            expect(heroClass.abilities, option.label).toContain(abilityId);
          }
        }
      }
    });
  }

  it('jede Start-Klasse hat Anweisungen', () => {
    for (const heroClass of HERO_CLASSES) {
      expect(HERO_ORDERS[heroClass.id], heroClass.name).toBeDefined();
    }
  });

  it('alle Anweisungen lassen sich im Kampf benutzen (keine unbekannten Bedingungen)', () => {
    for (const classId in HERO_ORDERS) {
      for (const order of HERO_ORDERS[classId]) {
        for (const option of order.options) {
          const group = createTestGroup(1);
          for (const hero of group) {
            if (hero.classId === classId) {
              hero.setOrder(order.id, option.id);
            }
          }
          for (const bossId of ['grimfang', 'morva', 'skarrix']) {
            expect(() => estimateChances({ heroes: group, bossId, tacticId: 'balanced', count: 3 })).not.toThrow();
          }
        }
      }
    }
  });
});

describe('Hero-Anweisungen', () => {
  it('ohne Wahl gilt die erste Option, gewählte Optionen fließen in die Einstellungen', () => {
    const priest = new Hero(1, 'P', 'priest', 'uncommon', [], LOOKS);
    expect(priest.getOrderSettings().healThreshold).toBeUndefined();
    priest.setOrder('healThreshold', 'early');
    expect(priest.getOrderSettings().healThreshold).toBe(0.8);

    const mage = new Hero(2, 'M', 'mage', 'uncommon', [], LOOKS);
    mage.setOrder('frostUse', 'asap');
    mage.setOrder('targetPriority', 'boss');
    const settings = mage.getOrderSettings();
    expect(settings.abilityWhen.iceWreath).toBe('ready');
    expect(settings.targetPriority).toBe('boss');
  });

  it('Anweisungen werden gespeichert und geladen', () => {
    const game = new Game(1);
    game.guild.gold = 10000;
    const candidate = game.guild.candidates[0];
    game.hireHero(candidate.id);
    game.setHeroOrder(candidate.id, 'someOrder', 'someOption');
    const loaded = Game.fromSaveData(JSON.parse(JSON.stringify(game.toSaveData())));
    expect(loaded.guild.heroes[0].orders.someOrder).toBe('someOption');
  });

  it('Anweisungen verändern den Kampf: später Heilen ist gegen Skarrix schlechter als frühes', () => {
    const early = createTestGroup(1);
    const late = createTestGroup(1);
    early.find((h) => h.classId === 'priest').setOrder('healThreshold', 'early');
    late.find((h) => h.classId === 'priest').setOrder('healThreshold', 'late');
    const earlyChance = estimateChances({ heroes: early, bossId: 'skarrix', tacticId: 'balanced', count: 150 });
    const lateChance = estimateChances({ heroes: late, bossId: 'skarrix', tacticId: 'balanced', count: 150 });
    expect(earlyChance.winRate).toBeGreaterThan(lateChance.winRate + 0.3);
  });
});
