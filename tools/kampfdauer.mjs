// ============================================================
// KAMPFDAUER – Wie lange dauert ein Run in Runden und als Kampfszene?
//
// Aufruf:  node tools/kampfdauer.mjs [Runs]
// Die Sekunden gelten für Tempo 1x und werden genauso berechnet wie in der Szene
// (computeEncounterTimeline), plus die Pause zwischen den Begegnungen im Tagesabschluss.
// Gezeigt wird die Dauer mit Zeitraffer (so läuft die Szene) und zum Vergleich ohne.
// ============================================================

import { simulateRun } from '../src/systems/combat/CombatSimulator.js';
import { computeEncounterTimeline } from '../src/systems/combat/BattleTimeline.js';
import { DUNGEONS } from '../src/data/dungeons.js';
import { STANDARD_GROUP, createGroup } from './messhilfen.mjs';

const RUNS = Number(process.argv[2] || 100);
const PAUSE_BETWEEN_ENCOUNTERS = 1.2; // wie TRAVEL_SECONDS in DayEndOverlay.js

for (const dungeon of DUNGEONS) {
  // Gruppe auf der Stufe des Dungeons, grün ausgerüstet: ein typischer Run
  let rounds = 0;
  let seconds = 0;
  let secondsWithoutTimeLapse = 0;
  let wins = 0;
  for (let i = 0; i < RUNS; i++) {
    const group = createGroup(STANDARD_GROUP, dungeon.level, dungeon.level);
    const result = simulateRun({ heroes: group, dungeonId: dungeon.id, seed: 1 + i * 7919, recordLog: true });
    if (result.outcome === 'success') {
      wins++;
    }
    for (const encounter of result.encounters) {
      rounds += encounter.rounds;
      seconds += computeEncounterTimeline(encounter.log, encounter.encounterType).duration + PAUSE_BETWEEN_ENCOUNTERS;
      secondsWithoutTimeLapse += computeEncounterTimeline(encounter.log).duration + PAUSE_BETWEEN_ENCOUNTERS;
    }
  }
  console.log(dungeon.id.padEnd(13), 'Level', dungeon.level, '(grün):',
    'Ø', (rounds / RUNS).toFixed(1), 'Runden,',
    'Ø', (seconds / RUNS / 60).toFixed(1), 'Minuten bei 1x',
    '(ohne Zeitraffer ' + (secondsWithoutTimeLapse / RUNS / 60).toFixed(1) + '),',
    'Siege', Math.round((wins / RUNS) * 100) + ' %');
}
