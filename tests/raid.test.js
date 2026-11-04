// Tests für den Raid-Kampf (4 Gruppen à 5 Helden gegen einen Raid-Boss):
// Heilung bleibt in der eigenen Gruppe, Tankwechsel bei Stapeln, Gruppenschlag trifft eine Gruppe,
// Phasenwechsel, und normale Bosskämpfe bleiben unverändert.

import { describe, it, expect } from 'vitest';
import { simulateRaid, simulateBattle } from '../src/systems/combat/CombatSimulator.js';
import { createTestRaid, createTestGroup } from '../src/systems/combat/TestGroup.js';
import { RAID_BOSSES } from '../src/data/raidBosses.js';
import { BOSSES, MINIONS, MECHANIC_TYPE_TEXTS, getBoss } from '../src/data/enemies.js';
import { SPRITES } from '../src/data/sprites.js';
import { computeEncounterTimeline } from '../src/systems/combat/BattleTimeline.js';

const BOSS_ID = 'raidTestColossus';

function raidResult(seed = 7, groups = null) {
  return simulateRaid({ groups: groups || createTestRaid(1), bossId: BOSS_ID, seed: seed, recordLog: true });
}

// Kämpfer-id → Nummer seiner Gruppe (0 bis 3), aus der Startaufstellung des Kampfes
function groupOfId(result) {
  const map = {};
  for (const combatant of result.startingCombatants) {
    if (combatant.side === 'hero' && !combatant.isPet) {
      map[combatant.id] = combatant.groupIndex;
    }
  }
  return map;
}

describe('Raid-Daten', () => {
  for (const boss of RAID_BOSSES) {
    it(`${boss.name}: gültig`, () => {
      expect(boss.isRaidBoss).toBe(true);
      expect(SPRITES[boss.sprite]).toBeDefined();
      expect(getBoss(boss.id)).toBe(boss);
      expect(BOSSES).not.toContain(boss);
      const allMechanics = boss.mechanics.concat(...(boss.phases || []).map((phase) => phase.mechanics));
      for (const mechanic of allMechanics) {
        expect(MECHANIC_TYPE_TEXTS[mechanic.type], mechanic.type).toBeDefined();
        expect(mechanic.every).toBeGreaterThan(0);
        if (mechanic.type === 'summon') {
          expect(MINIONS[mechanic.minion]).toBeDefined();
        }
      }
      for (const phase of boss.phases || []) {
        expect(phase.belowHpPercent).toBeGreaterThan(0);
        expect(phase.belowHpPercent).toBeLessThan(1);
      }
    });
  }
});

describe('Raid-Kampf', () => {
  it('läuft ohne Fehler und gleicher Seed ergibt denselben Kampf', () => {
    const a = raidResult(3);
    const b = raidResult(3);
    expect(a.rounds).toBeGreaterThan(0);
    expect(a.log).toEqual(b.log);
  });

  it('alle 20 Helden haben verschiedene ids und die richtige Gruppe', () => {
    const result = raidResult(3);
    const heroes = result.startingCombatants.filter((c) => c.side === 'hero' && !c.isPet);
    expect(heroes.length).toBe(20);
    expect(new Set(heroes.map((c) => c.id)).size).toBe(20);
    for (let groupIndex = 0; groupIndex < 4; groupIndex++) {
      expect(heroes.filter((c) => c.groupIndex === groupIndex).length).toBe(5);
    }
  });

  it('Heilung bleibt in der eigenen Gruppe', () => {
    const result = raidResult(5);
    const groupOf = groupOfId(result);
    const healers = result.startingCombatants.filter((c) => c.side === 'hero' && /Priester|Druide|Runenwirker/.test(c.name));
    let checked = 0;
    for (const entry of result.log) {
      if (entry.kind !== 'heal' || !entry.hits) {
        continue;
      }
      const healer = healers.find((c) => entry.text.startsWith(c.name + ':'));
      if (!healer) {
        continue;
      }
      for (const hit of entry.hits) {
        if (groupOf[hit.targetId] !== undefined) {
          expect(groupOf[hit.targetId], entry.text).toBe(healer.groupIndex);
          checked++;
        }
      }
    }
    expect(checked).toBeGreaterThan(0);
  });

  it('Tankwechsel passiert mit zwei Tanks', () => {
    const result = raidResult(7);
    expect(result.log.some((entry) => entry.text.startsWith('Tankwechsel:'))).toBe(true);
  });

  it('ohne zweiten Tank gibt es eine Warnung statt eines Wechsels', () => {
    const groups = createTestRaid(5, 'uncommon', [
      ['warrior', 'priest', 'mage', 'rogue', 'hunter'],
      ['mage', 'druid', 'warlock', 'samurai', 'bard'],
    ]);
    const result = raidResult(7, groups);
    expect(result.log.some((entry) => entry.text.startsWith('Tankwechsel:'))).toBe(false);
    expect(result.log.some((entry) => entry.text.startsWith('Kein zweiter Tank'))).toBe(true);
  });

  it('Erdstoß trifft nur die angesagte Gruppe', () => {
    const result = raidResult(7);
    const groupOf = groupOfId(result);
    const strikes = result.log.filter((entry) => entry.text.includes('Erdstoß trifft Gruppe'));
    expect(strikes.length).toBeGreaterThan(0);
    for (const strike of strikes) {
      const groupIndex = Number(strike.text.match(/Gruppe (\d)/)[1]) - 1;
      // Die Treffer direkt nach der Ansage gehen alle an Helden dieser Gruppe
      let i = result.log.indexOf(strike) + 1;
      let hits = 0;
      while (i < result.log.length && result.log[i].text.includes(' trifft') && result.log[i].hits) {
        for (const hit of result.log[i].hits) {
          expect(groupOf[hit.targetId], result.log[i].text).toBe(groupIndex);
          hits++;
        }
        i++;
      }
      expect(hits).toBeGreaterThan(0);
    }
  });

  it('unter 50 % Leben beginnt Phase 2 mit Steinwächtern', () => {
    const result = simulateRaid({ groups: createTestRaid(20), bossId: BOSS_ID, seed: 7, recordLog: true });
    const phaseIndex = result.log.findIndex((entry) => entry.text.includes('Phase 2!'));
    expect(phaseIndex).toBeGreaterThan(-1);
    const summonIndex = result.log.findIndex((entry) => entry.text.includes('Steinwächter erwachen'));
    expect(summonIndex).toBeGreaterThan(phaseIndex);
  });

  it('normale Bosskämpfe bleiben gleich (alle in Gruppe 0)', () => {
    const result = simulateBattle({ heroes: createTestGroup(5), bossId: 'morva', seed: 11, recordLog: true });
    expect(result.startingCombatants.filter((c) => c.side === 'hero').every((c) => c.groupIndex === 0)).toBe(true);
  });

  it('die Ankündigung des Gruppenschlags nennt die Gruppe (für die Szene)', () => {
    const result = raidResult(7);
    expect(result.isRaid).toBe(true);
    const start = result.log.find((entry) => entry.cast && entry.cast.state === 'start' && entry.cast.name.startsWith('Erdstoß'));
    expect(start.cast.groupIndex).toBeGreaterThanOrEqual(0);
    expect(start.cast.name).toBe('Erdstoß auf Gruppe ' + (start.cast.groupIndex + 1));
  });

  it('im Raid laufen die Einzelschritte schneller', () => {
    const result = raidResult(7);
    const normal = computeEncounterTimeline(result.log, 'boss', false).duration;
    const raid = computeEncounterTimeline(result.log, 'boss', true).duration;
    expect(raid).toBeLessThan(normal);
  });
});
