// ============================================================
// ANWEISUNGEN – Was bewirkt jede Anweisung, in verschiedenen Gruppen?
//
// Aufruf:  node tools/anweisungen.mjs [Runs pro Feld]
// Für jede Gruppe und jeden Dungeon wird zuerst ein Messpunkt gesucht (Level + Ausrüstung),
// an dem die Standard-Einstellung etwa 60 % schafft. Nur dort kann eine Anweisung in beide
// Richtungen wirken (bei 100 % kann nichts besser werden, bei 0 % nichts schlechter).
// Dann wird jede andere Option einzeln dagegen gemessen, mit denselben Zufallszahlen.
// Faustregel: Unterschiede bis etwa ±4 Punkte sind Zufall.
// ============================================================

import { DUNGEONS } from '../src/data/dungeons.js';
import { HERO_ORDERS } from '../src/data/heroOrders.js';
import { measureRuns, signed } from './messhilfen.mjs';

const RUNS = Number(process.argv[2] || 400);
const GROUPS = {
  'Standard': ['warrior', 'priest', 'runeweaver', 'mage', 'rogue'],
  'ohne Schurke': ['warrior', 'priest', 'runeweaver', 'mage', 'mage'],
  'ohne Runenwirker': ['warrior', 'priest', 'mage', 'rogue', 'rogue'],
};
const TARGET_WIN = 60;

// Sucht Level (1–8) und Ausrüstung (keine / grün zwei Stufen tiefer / grün auf Stufe),
// bei denen die Siegchance am nächsten an TARGET_WIN liegt
function findMeasuringPoint(classIds, dungeon) {
  let best = null;
  for (let level = 1; level <= 8; level++) {
    for (const itemLevel of [0, Math.max(1, dungeon.level - 2), dungeon.level]) {
      const result = measureRuns({ classIds, dungeonId: dungeon.id, level, itemLevel, runs: RUNS });
      const distance = Math.abs(result.win - TARGET_WIN);
      if (best === null || distance < best.distance) {
        best = { level, itemLevel, result, distance };
      }
    }
  }
  return best;
}

const overview = {}; // "klasse.anweisung=option" → Liste der Abweichungen
for (const groupName in GROUPS) {
  const classIds = GROUPS[groupName];
  console.log('\n######## ' + groupName + ' (' + classIds.join(', ') + ')');
  for (const dungeon of DUNGEONS) {
    const point = findMeasuringPoint(classIds, dungeon);
    const base = point.result;
    console.log('\n' + dungeon.id + ': Level ' + point.level + ', Ausrüstung ' + (point.itemLevel || 'keine') +
      ' → Standard: ' + base.win + ' % Siege, ' + base.fall + ' % mit Gefallenen');
    if (point.distance > 25) {
      console.log('  (kein guter Messpunkt gefunden, Werte nur eingeschränkt aussagekräftig)');
    }
    for (const classId of new Set(classIds)) {
      for (const order of HERO_ORDERS[classId] || []) {
        for (const option of order.options.slice(1)) {
          const result = measureRuns({
            classIds, dungeonId: dungeon.id, level: point.level, itemLevel: point.itemLevel, runs: RUNS,
            orders: { [classId]: { [order.id]: option.id } },
          });
          const key = classId + '.' + order.id + '=' + option.id;
          console.log('  ' + key.padEnd(34) + ' Siege ' + signed(result.win - base.win).padStart(4) +
            '   Gefallene ' + signed(result.fall - base.fall).padStart(4));
          (overview[key] ||= []).push(groupName + '/' + dungeon.id + ' ' + signed(result.win - base.win));
        }
      }
    }
  }
}

console.log('\n######## Übersicht: Abweichung der Siege gegenüber der Standard-Option (Prozentpunkte)');
for (const key in overview) {
  console.log(key.padEnd(34), overview[key].join(' | '));
}
