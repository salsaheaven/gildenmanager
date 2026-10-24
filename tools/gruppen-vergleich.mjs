// ============================================================
// GRUPPEN-VERGLEICH – Wie stark hängt der Erfolg von der Klassenmischung ab?
//
// Aufruf:  node tools/gruppen-vergleich.mjs [Runs pro Feld]
// Mehrere Gruppen (auch mit doppelten Klassen) ohne Ausrüstung, je Dungeon auf mehreren Levels.
// Kürzel: K = Krieger, P = Priester, R = Runenwirker, M = Magier, S = Schurke
// ============================================================

import { DUNGEONS } from '../src/data/dungeons.js';
import { measureRuns } from './messhilfen.mjs';

const RUNS = Number(process.argv[2] || 300);
const SHORT_NAMES = { K: 'warrior', P: 'priest', R: 'runeweaver', M: 'mage', S: 'rogue' };
const GROUPS = ['KPRMS', 'KPMMS', 'KPMSS', 'KPRMM', 'KPRSS', 'KPSSS'];

for (const dungeon of DUNGEONS) {
  for (const level of [dungeon.level - 1, dungeon.level, dungeon.level + 1]) {
    if (level < 1) {
      continue;
    }
    const cells = [];
    for (const groupName of GROUPS) {
      const classIds = groupName.split('').map((letter) => SHORT_NAMES[letter]);
      const result = measureRuns({ classIds, dungeonId: dungeon.id, level, runs: RUNS });
      cells.push(groupName + ' ' + String(result.win).padStart(3) + ' %');
    }
    console.log((dungeon.id + ' L' + level).padEnd(17), cells.join(' | '));
  }
}
