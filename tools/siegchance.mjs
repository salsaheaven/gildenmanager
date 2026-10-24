// ============================================================
// SIEGCHANCE – Tabelle: Siegchance jedes Dungeons je Heldenlevel (ganzer Run)
//
// Aufruf:  node tools/siegchance.mjs [Runs pro Feld]
// Gemessen wird die Standardgruppe zweimal: ohne Ausrüstung und mit grüner Ausrüstung
// auf der Stufe des Dungeons. Jedes Feld: "Siege % / Runs mit Gefallenen %".
// Zum Vergleich mit den Zielwerten in CLAUDE.md (z.B. Bärenhöhle nackt mit Level 1 ~90 %).
// ============================================================

import { DUNGEONS } from '../src/data/dungeons.js';
import { STANDARD_GROUP, measureRuns } from './messhilfen.mjs';

const RUNS = Number(process.argv[2] || 300);
const LEVELS = [1, 2, 3, 4, 5, 6, 7];

for (const gearName of ['ohne Ausrüstung', 'grün, Stufe des Dungeons']) {
  console.log('\n== Standardgruppe, ' + gearName + ' (Siege / Runs mit Gefallenen) ==');
  for (const dungeon of DUNGEONS) {
    const itemLevel = gearName === 'ohne Ausrüstung' ? 0 : dungeon.level;
    const cells = [];
    for (const level of LEVELS) {
      const result = measureRuns({ classIds: STANDARD_GROUP, dungeonId: dungeon.id, level, itemLevel, runs: RUNS });
      cells.push('L' + level + ' ' + result.win + '/' + result.fall);
    }
    console.log(dungeon.id.padEnd(13), cells.join('  '));
  }
}
