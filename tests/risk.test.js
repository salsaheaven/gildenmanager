// Tests für die Risiko-Einschätzung vor einem Dungeon-Run

import { describe, it, expect } from 'vitest';
import { RISK_LEVELS, FALL_LEVELS, getRiskLevel, getFallLevel } from '../src/data/riskLevels.js';
import { estimateRunChances } from '../src/systems/combat/ChanceEstimator.js';
import { createTestGroup } from '../src/systems/combat/TestGroup.js';

describe('Risiko-Stufen', () => {
  it('jede Siegchance bekommt genau eine Stufe, die Grenzen stimmen', () => {
    expect(getRiskLevel(1).id).toBe('safe');
    expect(getRiskLevel(0.9).id).toBe('safe');
    expect(getRiskLevel(0.89).id).toBe('doable');
    expect(getRiskLevel(0.5).id).toBe('risky');
    expect(getRiskLevel(0.1).id).toBe('hopeless');
    expect(getRiskLevel(0).id).toBe('hopeless');
    expect(getFallLevel(0).id).toBe('rarely');
    expect(getFallLevel(0.3).id).toBe('sometimes');
    expect(getFallLevel(1).id).toBe('often');
  });

  it('Stufen sind von oben nach unten sortiert und enden bei 0', () => {
    for (let i = 1; i < RISK_LEVELS.length; i++) {
      expect(RISK_LEVELS[i].minWinRate).toBeLessThan(RISK_LEVELS[i - 1].minWinRate);
    }
    expect(RISK_LEVELS[RISK_LEVELS.length - 1].minWinRate).toBe(0);
    expect(FALL_LEVELS[FALL_LEVELS.length - 1].minFallRate).toBe(0);
  });
});

describe('Einschätzung eines ganzen Runs', () => {
  it('starke Gruppe in der Bärenhöhle ist sicher, schwache in den Brutnestern aussichtslos', () => {
    const strong = estimateRunChances({ heroes: createTestGroup(5), dungeonId: 'bearCave', retreatRuleId: 'never', count: 30 });
    expect(getRiskLevel(strong.winRate).id).toBe('safe');
    const weak = estimateRunChances({ heroes: createTestGroup(1), dungeonId: 'broodNests', retreatRuleId: 'never', count: 30 });
    expect(getRiskLevel(weak.winRate).id).toBe('hopeless');
  });

  it('gleiche Gruppe = gleiche Einschätzung (feste Seeds)', () => {
    const a = estimateRunChances({ heroes: createTestGroup(2), dungeonId: 'ruinedChapel', retreatRuleId: 'never', count: 20 });
    const b = estimateRunChances({ heroes: createTestGroup(2), dungeonId: 'ruinedChapel', retreatRuleId: 'never', count: 20 });
    expect(a).toEqual(b);
  });
});
