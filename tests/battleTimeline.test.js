// Tests für die Zeitrechnung der Kampfszene (Zeitraffer).

import { describe, it, expect } from 'vitest';
import { computeEncounterTimeline } from '../src/systems/combat/BattleTimeline.js';
import { simulateRun } from '../src/systems/combat/CombatSimulator.js';
import { createTestGroup } from '../src/systems/combat/TestGroup.js';
import { COMBAT_RULES } from '../src/data/combatRules.js';

// Ein kleiner Kampfbericht: Runde 1 ruhig, Runde 2 mit Mechanik, Runde 3 mit gefallenem Helden
const LOG = [
  { round: 1, kind: 'action', text: '' },
  { round: 1, kind: 'damage', text: 'Treffer', hits: [{}] },
  { round: 2, kind: 'mechanic', text: 'Prankenhieb!', cast: { state: 'end' } },
  { round: 3, kind: 'damage', text: 'Treffer', hits: [{}] },
  { round: 3, kind: 'death', text: 'Held fällt!', heroFallen: true },
];

describe('Zeitraffer', () => {
  it('ohne Begegnungs-Art läuft alles normal', () => {
    const timeline = computeEncounterTimeline(LOG);
    expect(timeline.speeds).toEqual([1, 1, 1, 1, 1]);
  });

  it('Bosskampf: ruhige Runden schnell, Mechanik und Gefallene normal', () => {
    const timeline = computeEncounterTimeline(LOG, 'boss');
    const quiet = COMBAT_RULES.pacing.quietRoundSpeed;
    expect(timeline.speeds).toEqual([quiet, quiet, 1, 1, 1]);
  });

  it('Trash: alles schnell, außer der Runde, in der ein Held fällt', () => {
    const timeline = computeEncounterTimeline(LOG, 'trash');
    const fast = COMBAT_RULES.pacing.trashSpeed;
    expect(timeline.speeds).toEqual([fast, fast, fast, 1, 1]);
  });

  it('mit Zeitraffer ist ein echter Run kürzer, die Zeitpunkte bleiben in der richtigen Reihenfolge', () => {
    const result = simulateRun({ heroes: createTestGroup(3), dungeonId: 'bearCave', seed: 11, recordLog: true });
    let normal = 0;
    let fast = 0;
    for (const encounter of result.encounters) {
      const timeline = computeEncounterTimeline(encounter.log, encounter.encounterType);
      normal += computeEncounterTimeline(encounter.log).duration;
      fast += timeline.duration;
      for (let i = 1; i < timeline.times.length; i++) {
        expect(timeline.times[i]).toBeGreaterThanOrEqual(timeline.times[i - 1]);
      }
    }
    expect(fast).toBeLessThan(normal);
  });
});
