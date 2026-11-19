// Tests für Raid 2 und die Klassen-Sets: Schleier der Nacht und die Encounter-Boni der 3er-Sets.

import { describe, it, expect } from 'vitest';
import { createTestGroup, STANDARD_TEST_RAID } from '../src/systems/combat/TestGroup.js';
import { createHeroCombatant, simulateRaid } from '../src/systems/combat/CombatSimulator.js';
import { getRaid } from '../src/data/raids.js';
import { SETS, ROLE_BONUSES } from '../src/data/sets.js';
import { LootSystem } from '../src/systems/LootSystem.js';
import { Random } from '../src/core/Random.js';
import { getItemTemplate } from '../src/data/items.js';

const lootSystem = new LootSystem(new Random(5));

// Legt einem Helden "pieces" Teile seines eigenen Klassen-Sets an (Kopf, Brust, Füße)
function giveSetPieces(hero, pieces) {
  const set = SETS.find((entry) => entry.classId === hero.classId);
  ['head', 'chest', 'feet'].slice(0, pieces).forEach((slot, index) => {
    const item = lootSystem.createItem('epic', 9000 - hero.id * 10 + index, 30, getItemTemplate(set.templates[slot]));
    item.setId = set.id;
    hero.equipment[slot] = item;
  });
}

describe('Schleier der Nacht', () => {
  it('Raid 2 hat einen Schleier, Raid 1 nicht', () => {
    expect(getRaid('nightThrone').veil).toBeTruthy();
    expect(getRaid('ashHalls').veil).toBeFalsy();
  });

  it('fehlende Set-Teile werden gezählt', () => {
    const hero = createTestGroup(30)[0];
    expect(hero.getMissingSetPieces()).toBe(3);
    giveSetPieces(hero, 2);
    expect(hero.getOwnSetPieceCount()).toBe(2);
    expect(hero.getMissingSetPieces()).toBe(1);
  });

  it('ohne Sets macht der Raid im Nachtthron weniger Schaden als mit vollen Sets', () => {
    // Beide Male dieselben Set-Teile: einmal als Set-Teil, einmal ohne Set-Kennung (gleiche Werte, nur kein Set)
    const plain = STANDARD_TEST_RAID.map((classIds, index) => createTestGroup(30, 'epic', classIds, index * 10));
    const geared = STANDARD_TEST_RAID.map((classIds, index) => createTestGroup(30, 'epic', classIds, index * 10));
    plain.flat().forEach((hero) => {
      giveSetPieces(hero, 3);
      ['head', 'chest', 'feet'].forEach((slot) => { hero.equipment[slot].setId = null; });
    });
    geared.flat().forEach((hero) => giveSetPieces(hero, 3));
    const options = { bossId: 'hrimvald', raidId: 'nightThrone', seed: 3, enemyLevel: 30 };
    const totalDamage = (result) => result.heroes.reduce((sum, hero) => sum + hero.damageDone, 0);
    const plainResult = simulateRaid({ ...options, groups: plain });
    const gearedResult = simulateRaid({ ...options, groups: geared });
    expect(totalDamage(gearedResult) / gearedResult.rounds).toBeGreaterThan(totalDamage(plainResult) / plainResult.rounds);
  });
});

describe('Encounter-Boni der 3er-Sets', () => {
  it('jede Rolle hat im 3er-Bonus einen Encounter-Bonus', () => {
    expect(ROLE_BONUSES.tank[3].effects.tankStackReduction).toBeGreaterThan(0);
    expect(ROLE_BONUSES.healer[3].effects.healingAfterGroupHit).toBeGreaterThan(0);
    expect(ROLE_BONUSES.damage[3].effects.damageVsMinionsAndShell).toBeGreaterThan(0);
    expect(ROLE_BONUSES.support[3].effects.curseDamageTaken).toBeLessThan(0);
  });

  it('Tank mit vollem Set: Tank-Stapel wirken halb so stark', () => {
    const tank = createTestGroup(30).find((hero) => hero.classId === 'warrior');
    const plain = createHeroCombatant(tank);
    giveSetPieces(tank, 3);
    const withSet = createHeroCombatant(tank);
    for (const combatant of [plain, withSet]) {
      combatant.tankStacks = 4;
      combatant.tankStackValue = 0.1;
    }
    // ohne Set: Stapel +40 %; mit Set: Stapel +20 % und −10 % erlittener Schaden
    expect(plain.getDamageTakenFactor()).toBeCloseTo(1.4);
    expect(withSet.getDamageTakenFactor()).toBeCloseTo(0.9 * 1.2);
  });

  it('Schadens-Set: mehr Schaden gegen Diener', () => {
    const mage = createTestGroup(30).find((hero) => hero.classId === 'mage');
    giveSetPieces(mage, 3);
    const combatant = createHeroCombatant(mage);
    const minion = { isMinion: true, hasBuff: () => false };
    const boss = { isMinion: false, hasBuff: () => false };
    expect(combatant.getDamageDoneFactorAgainst(minion)).toBeGreaterThan(combatant.getDamageDoneFactorAgainst(boss));
  });
});
