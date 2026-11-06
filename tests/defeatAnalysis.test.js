// Tests für "Woran es lag" (CauseTracker + DefeatAnalysis).

import { describe, it, expect } from 'vitest';
import { CauseTracker } from '../src/systems/combat/CauseTracker.js';
import { analyzeRun, needsDefeatAnalysis } from '../src/systems/combat/DefeatAnalysis.js';
import { simulateRun } from '../src/systems/combat/CombatSimulator.js';
import { createTestGroup } from '../src/systems/combat/TestGroup.js';
import { Game } from '../src/core/Game.js';
import { CAUSE_TIPS } from '../src/data/defeatCauses.js';

// Ein Run-Ergebnis von Hand, mit zwei Begegnungen
function fakeRun() {
  const first = new CauseTracker();
  first.addDamage({ key: 'minion:wolf', name: 'Höhlenwolf', type: 'minion' }, 100);
  const second = new CauseTracker();
  second.addDamage({ key: 'mechanic:hieb', name: 'Prankenhieb', type: 'mechanic', hint: 'Schilde helfen.' }, 250);
  second.addDamage({ key: 'attack:bear', name: 'Angriffe von Grimmzahn', type: 'attack' }, 120);
  second.addDamage({ key: 'enrage:bear', name: 'Raserei von Grimmzahn', type: 'enrage' }, 30);
  second.addDamage({ key: 'minion:wolf', name: 'Höhlenwolf', type: 'minion' }, 0); // zählt nicht
  second.addMissedInterrupt('Schattenwoge');
  second.addMissedInterrupt('Schattenwoge');
  second.addOutOfMana('Priesterin Ada');
  second.addOutOfMana('Priesterin Ada');
  return {
    outcome: 'defeat',
    heroes: [{ alive: false }],
    encounters: [{ causes: first.toResult() }, { causes: second.toResult() }],
  };
}

describe('Woran es lag', () => {
  it('zählt den Schaden aller Begegnungen zusammen und zeigt die größten 3 mit Anteil', () => {
    const analysis = analyzeRun(fakeRun());
    expect(analysis.causes.map((cause) => cause.name)).toEqual(['Prankenhieb', 'Angriffe von Grimmzahn', 'Höhlenwolf']);
    expect(analysis.causes[0].share).toBeCloseTo(250 / 500);
    expect(analysis.causes[2].share).toBeCloseTo(100 / 500);
  });

  it('Tipp: der eigene Tipp der größten Mechanik, sonst der allgemeine Tipp ihrer Art', () => {
    expect(analyzeRun(fakeRun()).tip).toBe('Schilde helfen.');
    const tracker = new CauseTracker();
    tracker.addDamage({ key: 'enrage:x', name: 'Raserei von X', type: 'enrage' }, 10);
    const analysis = analyzeRun({ outcome: 'defeat', heroes: [], encounters: [{ causes: tracker.toResult() }] });
    expect(analysis.tip).toBe(CAUSE_TIPS.enrage);
  });

  it('Hinweise: verpasste Unterbrechungen gezählt, Mana-Mangel nur einmal pro Held', () => {
    const notes = analyzeRun(fakeRun()).notes;
    expect(notes).toHaveLength(2);
    expect(notes[0]).toContain('Schattenwoge');
    expect(notes[0]).toContain('2×');
    expect(notes[1]).toContain('Priesterin Ada');
  });

  it('nur bei Niederlage oder Gefallenen nötig', () => {
    expect(needsDefeatAnalysis({ outcome: 'success', heroes: [{ alive: true }] })).toBe(false);
    expect(needsDefeatAnalysis({ outcome: 'success', heroes: [{ alive: false }] })).toBe(true);
    expect(needsDefeatAnalysis({ outcome: 'defeat', heroes: [{ alive: true }] })).toBe(true);
  });

  it('ein echter verlorener Run hat Ursachen, die zusammen höchstens 100 % ergeben', () => {
    // Nackte Gruppe auf Level 1 in den Brutnestern: verliert sicher
    const result = simulateRun({ heroes: createTestGroup(1), dungeonId: 'broodNests', seed: 3 });
    expect(result.outcome).not.toBe('success');
    const analysis = analyzeRun(result);
    expect(analysis.causes.length).toBeGreaterThan(0);
    const total = analysis.causes.reduce((sum, cause) => sum + cause.share, 0);
    expect(total).toBeLessThanOrEqual(1.0001);
    expect(analysis.tip).toBeTruthy();
  });

  it('Morva: ohne Schurken wird die Schattenwoge als verpasst gemeldet', () => {
    const group = createTestGroup(3, 'uncommon', ['warrior', 'priest', 'runeweaver', 'mage', 'mage']);
    const result = simulateRun({ heroes: group, dungeonId: 'ruinedChapel', seed: 5 });
    const boss = result.encounters.find((encounter) => encounter.bossId === 'morva');
    expect(boss).toBeDefined();
    expect(boss.causes.missedInterrupts['Schattenwoge']).toBeGreaterThan(0);
  });

  it('der Bericht im Spiel enthält die Auswertung, wenn der Run scheitert', () => {
    const game = new Game(4);
    game.guild.gold = 10000;
    const candidate = game.guild.candidates[0];
    game.hireHero(candidate.id);
    // Ein einzelner Held allein in der Bärenhöhle verliert
    game.startExpedition('bearCave', [candidate.id], 'never');
    game.endDay();
    const report = game.guild.reports[0];
    expect(report.outcome).not.toBe('success');
    expect(report.analysis.causes.length).toBeGreaterThan(0);
  });
});

describe('Klassen-Tipps ("Helfen würde")', () => {
  it('nennt für Mechaniken mit Konter die Klassen aus der Konter-Tabelle', async () => {
    const { getClassTip, getAreaDamageClassIds } = await import('../src/systems/ClassTips.js');
    expect(getClassTip({ type: 'mechanic', mechanicType: 'groupCast', interruptible: true }))
      .toBe('Unterbrechen: Schurke (per Talent auch Jäger, Magier)');
    expect(getClassTip({ type: 'mechanic', mechanicType: 'shell' })).toContain('Panzer brechen: Samurai, Barbar, Mönch');
    expect(getClassTip({ type: 'mechanic', mechanicType: 'frenzy' })).toContain('Wutanfall dämpfen');
    expect(getAreaDamageClassIds()).toContain('mage');
    expect(getClassTip({ type: 'minion' })).toContain('Magier');
  });

  it('ein nicht gebrochener Panzer steht als Hinweis mit den passenden Klassen da', async () => {
    const { createTestGroup } = await import('../src/systems/combat/TestGroup.js');
    const { simulateRun } = await import('../src/systems/combat/CombatSimulator.js');
    const { analyzeRun } = await import('../src/systems/combat/DefeatAnalysis.js');
    const heroes = createTestGroup(6, 'uncommon', ['warrior', 'priest', 'runeweaver', 'mage', 'rogue']);
    const result = simulateRun({ heroes, dungeonId: 'broodNests', seed: 3, recordLog: false });
    const analysis = analyzeRun(result, []);
    if (result.encounters.length === 3) {
      expect(analysis.notes.some((note) => note.includes('Chitinpanzer') && note.includes('Samurai'))).toBe(true);
    }
    expect(analysis.classTip).not.toBe(null);
  });
});
