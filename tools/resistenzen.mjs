// ============================================================
// RESISTENZEN – Wie viel bringen Resistenzen gegen die Schadensart eines Dungeons?
//
// Aufruf:  node tools/resistenzen.mjs [Runs pro Feld]
// Standardgruppe auf der Stufe des Dungeons mit grüner Ausrüstung aus dem vorigen Dungeon
// (das ist der Messpunkt "~85 %" aus zielwerte.mjs). Dann tragen alle Helden 1, 2 oder 3 Rüstungsteile
// mit Resistenz gegen die Schadensart des Dungeons, in der Höhe von Grün / Blau / Lila (rarities.js).
// Jedes Feld: "Siege % / Runs mit Gefallenen %".
// ============================================================

import { DUNGEONS, getDungeonDamageTypes } from '../src/data/dungeons.js';
import { getRarity } from '../src/data/rarities.js';
import { STANDARD_GROUP, measureRuns } from './messhilfen.mjs';

const RUNS = Number(process.argv[2] || 300);

for (let i = 1; i < DUNGEONS.length; i++) {
  const dungeon = DUNGEONS[i];
  const itemLevel = DUNGEONS[i - 1].level;
  for (const damageType of getDungeonDamageTypes(dungeon.id)) {
    const base = measureRuns({ classIds: STANDARD_GROUP, dungeonId: dungeon.id, level: dungeon.level, itemLevel, runs: RUNS });
    console.log('\n' + dungeon.id + ' (' + damageType + '), Level ' + dungeon.level + ', vorige Ausrüstung: ohne Resistenz ' +
      base.win + '/' + base.fall);
    for (const rarityId of ['uncommon', 'rare', 'epic']) {
      const percent = getRarity(rarityId).resistance;
      const cells = [];
      for (const pieces of [1, 2, 3]) {
        const result = measureRuns({
          classIds: STANDARD_GROUP, dungeonId: dungeon.id, level: dungeon.level, itemLevel, runs: RUNS,
          resistance: { damageType, pieces, percent },
        });
        cells.push(pieces + ' Teil(e) ' + result.win + '/' + result.fall);
      }
      console.log('  je ' + String(percent).padStart(2) + ' % (' + getRarity(rarityId).name + '):', cells.join('  |  '));
    }
  }
}
