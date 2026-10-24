// ============================================================
// GRUPPEN-VERGLEICH – Wie stark hängt der Erfolg von der Klassenmischung ab?
//
// Aufruf:  node tools/gruppen-vergleich.mjs [Runs pro Feld]
// Mehrere Gruppen (auch mit doppelten Klassen), jeweils eine Stufe unter und auf der Stufe des Dungeons.
// Ausrüstung: grün aus dem vorherigen Dungeon (wie im echten Spielverlauf), im ersten Dungeon keine.
// Jedes Feld: "Siege % / Runs mit Gefallenen %".
// Kürzel: K = Krieger, P = Priester, R = Runenwirker, M = Magier, S = Schurke
// ============================================================

import { DUNGEONS } from '../src/data/dungeons.js';
import { measureRuns } from './messhilfen.mjs';

const RUNS = Number(process.argv[2] || 300);
const SHORT_NAMES = { K: 'warrior', P: 'priest', R: 'runeweaver', M: 'mage', S: 'rogue' };
const GROUPS = ['KPRMS', 'KPMMS', 'KPMSS', 'KPRMM', 'KPRSS', 'KPSSS', 'KPPMS', 'KRRMS'];

console.log('Gruppe:'.padEnd(24), GROUPS.map((name) => name.padEnd(9)).join(' | '));
for (let i = 0; i < DUNGEONS.length; i++) {
  const dungeon = DUNGEONS[i];
  const itemLevel = i === 0 ? 0 : DUNGEONS[i - 1].level;
  for (const level of [dungeon.level - 1, dungeon.level]) {
    if (level < 1) {
      continue;
    }
    const cells = [];
    for (const groupName of GROUPS) {
      const classIds = groupName.split('').map((letter) => SHORT_NAMES[letter]);
      const result = measureRuns({ classIds, dungeonId: dungeon.id, level, itemLevel, runs: RUNS });
      cells.push((result.win + '/' + result.fall).padEnd(9));
    }
    console.log((dungeon.id + ' L' + level + ' IL' + (itemLevel || '-')).padEnd(24), cells.join(' | '));
  }
}
