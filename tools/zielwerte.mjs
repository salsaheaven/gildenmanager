// ============================================================
// ZIELWERTE – vergleicht die Siegchancen mit den Zielwerten aus KONZEPT.md ("Schwierigkeit")
//
// Aufruf:  node tools/zielwerte.mjs [Runs pro Feld]
// Standardgruppe, ganzer Dungeon. Ausrüstung immer grün, passend zur Klasse.
//   erster Dungeon: nackt auf Level 1                                  Ziel ~90 %
//   jeder Dungeon:  Level = Stufe, Ausrüstung der eigenen Stufe         Ziel ~95 %
//   ab Dungeon 2:   Level = Stufe, Ausrüstung aus dem vorigen Dungeon   Ziel ~85 %
//                   eine Stufe darunter, Ausrüstung aus dem vorigen     Ziel ~50 %
// ============================================================

import { DUNGEONS } from '../src/data/dungeons.js';
import { STANDARD_GROUP, measureRuns } from './messhilfen.mjs';

const RUNS = Number(process.argv[2] || 300);

// Alle Messpunkte mit Ziel. Wird auch von anderen Werkzeugen benutzt.
export function getTargetChecks() {
  const checks = [];
  for (let i = 0; i < DUNGEONS.length; i++) {
    const dungeon = DUNGEONS[i];
    if (i === 0) {
      checks.push({ dungeon, label: 'nackt, Level 1', level: 1, itemLevel: 0, target: 90 });
    } else {
      const previousLevel = DUNGEONS[i - 1].level;
      checks.push({ dungeon, label: 'Level ' + (dungeon.level - 1) + ', vorige Ausr.', level: dungeon.level - 1, itemLevel: previousLevel, target: 50 });
      checks.push({ dungeon, label: 'Level ' + dungeon.level + ', vorige Ausr.', level: dungeon.level, itemLevel: previousLevel, target: 85 });
    }
    checks.push({ dungeon, label: 'Level ' + dungeon.level + ', eigene Ausr.', level: dungeon.level, itemLevel: dungeon.level, target: 95 });
  }
  return checks;
}

// Misst alle Punkte. Ergebnis: Liste mit { ...check, win, fall }
export function measureTargets(runs) {
  return getTargetChecks().map((check) => {
    const result = measureRuns({
      classIds: STANDARD_GROUP, dungeonId: check.dungeon.id, level: check.level, itemLevel: check.itemLevel, runs,
    });
    return { ...check, win: result.win, fall: result.fall };
  });
}

// Nur ausgeben, wenn die Datei direkt aufgerufen wird (nicht beim Import)
if (import.meta.url === 'file://' + process.argv[1]) {
  let totalDistance = 0;
  for (const row of measureTargets(RUNS)) {
    const distance = row.win - row.target;
    totalDistance += Math.abs(distance);
    console.log(row.dungeon.id.padEnd(13), row.label.padEnd(24), 'Siege', String(row.win).padStart(3) + ' %',
      ' Ziel', String(row.target).padStart(3) + ' %', ' Abweichung', (distance >= 0 ? '+' : '') + distance,
      '  Runs mit Gefallenen', row.fall + ' %');
  }
  console.log('Summe der Abweichungen:', totalDistance);
}
