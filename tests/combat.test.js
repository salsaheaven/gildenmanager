// Tests für das Kampfsystem: Daten, Ablauf, Mechaniken und Siegchance.

import { describe, it, expect } from 'vitest';
import { simulateBattle } from '../src/systems/combat/CombatSimulator.js';
import { estimateChances } from '../src/systems/combat/ChanceEstimator.js';
import { createTestGroup } from '../src/systems/combat/TestGroup.js';
import { Combatant } from '../src/systems/combat/Combatant.js';
import { ABILITIES } from '../src/data/abilities.js';
import { BOSSES, MINIONS } from '../src/data/enemies.js';
import { SPRITES } from '../src/data/sprites.js';

const SKILL_TYPES = ['damage', 'heal', 'shield', 'buff', 'taunt', 'mana', 'cleanse', 'stun', 'interrupt', 'dot',
  'hot', 'revive', 'resetCooldowns'];
const MECHANIC_TYPES = ['tankBuster', 'groupCast', 'frontWave', 'summon', 'curse'];

describe('Kampf-Daten', () => {
  for (const abilityId in ABILITIES) {
    const ability = ABILITIES[abilityId];
    it(`Skill ${ability.name}: vollständig`, () => {
      expect(SKILL_TYPES).toContain(ability.type);
      expect(typeof ability.cooldown).toBe('number');
      expect(typeof ability.manaCost).toBe('number');
      expect(typeof ability.priority).toBe('number');
      expect(typeof ability.when).toBe('string');
    });
  }

  for (const boss of BOSSES) {
    it(`Boss ${boss.name}: Mechaniken gültig`, () => {
      expect(SPRITES[boss.sprite], 'Pixelbild').toBeDefined();
      for (const mechanic of boss.mechanics) {
        expect(MECHANIC_TYPES).toContain(mechanic.type);
        expect(mechanic.every).toBeGreaterThan(0);
        if (mechanic.type === 'summon') {
          expect(MINIONS[mechanic.minion]).toBeDefined();
        }
      }
    });
  }
});

it('alle Diener haben ein Pixelbild', () => {
  for (const minionId in MINIONS) {
    expect(SPRITES[MINIONS[minionId].sprite]).toBeDefined();
  }
});

describe('Combatant', () => {
  it('Schild fängt Schaden vor dem Leben ab', () => {
    const target = new Combatant({ id: 't', name: 'T', side: 'hero', stats: { health: 100, defense: 0 } });
    target.shield = 30;
    const result = target.takeDamage(50, true);
    expect(result.absorbed).toBe(30);
    expect(result.damage).toBe(20);
    expect(target.hp).toBe(80);
  });

  it('Rüstung verringert Schaden', () => {
    const naked = new Combatant({ id: 'a', name: 'A', side: 'hero', stats: { health: 1000, defense: 0 } });
    const armored = new Combatant({ id: 'b', name: 'B', side: 'hero', stats: { health: 1000, defense: 60 } });
    expect(armored.takeDamage(100).damage).toBeLessThan(naked.takeDamage(100).damage);
  });

  it('bei 0 Leben ist der Kämpfer gefallen', () => {
    const target = new Combatant({ id: 't', name: 'T', side: 'hero', stats: { health: 10, defense: 0 } });
    target.takeDamage(50, true);
    expect(target.alive).toBe(false);
    expect(target.hp).toBe(0);
  });
});

describe('CombatSimulator', () => {
  const group = createTestGroup(1);

  it('gleicher Seed ergibt denselben Kampf', () => {
    const a = simulateBattle({ heroes: group, bossId: 'grimfang', seed: 42, recordLog: true });
    const b = simulateBattle({ heroes: group, bossId: 'grimfang', seed: 42, recordLog: true });
    expect(a.rounds).toBe(b.rounds);
    expect(a.log).toEqual(b.log);
  });

  it('jeder Boss lässt sich ohne Fehler simulieren', () => {
    for (const boss of BOSSES) {
      const result = simulateBattle({ heroes: group, bossId: boss.id, seed: 7, recordLog: true });
      expect(result.rounds).toBeGreaterThan(0);
      expect(result.log.length).toBeGreaterThan(0);
    }
  });

  it('der Kampf verändert die echten Helden nicht', () => {
    const before = group.map((hero) => JSON.stringify(hero.toSaveData()));
    simulateBattle({ heroes: group, bossId: 'skarrix', seed: 3, recordLog: false });
    expect(group.map((hero) => JSON.stringify(hero.toSaveData()))).toEqual(before);
  });

  it('die Übungspuppe läuft genau die eingestellten Runden', () => {
    const result = simulateBattle({ heroes: group, bossId: 'trainingDummy', seed: 1, recordLog: false });
    expect(result.rounds).toBe(BOSSES.find((b) => b.id === 'trainingDummy').dummyRounds);
    expect(result.heroes.every((hero) => hero.alive)).toBe(true);
  });

  it('Skarrix ruft Diener, Morva wird vom Schurken unterbrochen', () => {
    const skarrix = simulateBattle({ heroes: group, bossId: 'skarrix', seed: 5, recordLog: true });
    expect(skarrix.log.some((entry) => entry.text.includes('Diener erscheinen'))).toBe(true);
    const morva = simulateBattle({ heroes: group, bossId: 'morva', seed: 5, recordLog: true });
    expect(morva.log.some((entry) => entry.text.includes('unterbricht'))).toBe(true);
  });
});

describe('ChanceEstimator', () => {
  it('Konter zählen: ohne Heiler sinkt die Siegchance stark', () => {
    const full = estimateChances({ heroes: createTestGroup(1), bossId: 'grimfang', count: 100 });
    const noHealer = estimateChances({
      heroes: createTestGroup(1, 'uncommon', ['warrior', 'mage', 'rogue']),
      bossId: 'grimfang', count: 100,
    });
    expect(full.winRate).toBeGreaterThan(noHealer.winRate + 0.3);
  });

  it('höheres Level erhöht die Siegchance', () => {
    const level1 = estimateChances({ heroes: createTestGroup(1), bossId: 'skarrix', count: 100 });
    const level5 = estimateChances({ heroes: createTestGroup(5), bossId: 'skarrix', count: 100 });
    expect(level5.winRate).toBeGreaterThan(level1.winRate);
  });
});
