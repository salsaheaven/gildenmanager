// ============================================================
// ANWEISUNGEN – Was bewirkt jede Anweisung, in verschiedenen Gruppen und Dungeons?
//
// Aufruf:  node tools/anweisungen.mjs [Runs pro Feld] [Dungeon-id]
// Beispiel: node tools/anweisungen.mjs 200 bearCave   (nur die Bärenhöhle, schneller)
//
// Die Gruppen decken zusammen alle 15 Klassen ab. Für jede Gruppe und jeden Dungeon wird zuerst ein
// Messpunkt gesucht (Level + Ausrüstung), an dem "Ausgewogen" etwa 60 % schafft. Nur dort kann eine
// Anweisung in beide Richtungen wirken (bei 100 % kann nichts besser werden, bei 0 % nichts schlechter).
// Dann wird jedes Extrem einzeln dagegen gemessen, mit denselben Zufallszahlen.
// Faustregel: Unterschiede bis etwa ±4 Punkte sind Zufall.
//
// Ziel für das Endbalancing (Design-Grundsatz in CLAUDE.md): Jedes Extrem soll irgendwo die beste
// Wahl sein und irgendwo schaden. Die Übersicht am Ende markiert Optionen, die nie oder immer helfen.
// ============================================================

import { DUNGEONS } from '../src/data/dungeons.js';
import { HERO_ORDERS } from '../src/data/heroOrders.js';
import { measureRuns, signed } from './messhilfen.mjs';

const RUNS = Number(process.argv[2] || 300);
const ONLY_DUNGEON = process.argv[3] || null;
// Jede Gruppe: Tank, Heiler und drei weitere. Zusammen kommt jede Klasse mindestens einmal vor.
const GROUPS = {
  'Standard': ['warrior', 'priest', 'runeweaver', 'mage', 'rogue'],
  'Gruppe B': ['paladin', 'druid', 'samurai', 'hunter', 'bard'],
  'Gruppe C': ['monk', 'priest', 'barbarian', 'warlock', 'shaman'],
  'Gruppe D': ['warrior', 'runeweaver', 'mage', 'hunter', 'chronomancer'],
};
const TARGET_WIN = 60;
const NOISE = 4; // Abweichungen bis zu so vielen Punkten gelten als Zufall

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

const dungeons = DUNGEONS.filter((dungeon) => ONLY_DUNGEON === null || dungeon.id === ONLY_DUNGEON);
const overview = {}; // "klasse.anweisung=option" → Liste der Abweichungen (Siege in Prozentpunkten)
for (const groupName in GROUPS) {
  const classIds = GROUPS[groupName];
  console.log('\n######## ' + groupName + ' (' + classIds.join(', ') + ')');
  for (const dungeon of dungeons) {
    const point = findMeasuringPoint(classIds, dungeon);
    const base = point.result;
    console.log('\n' + dungeon.id + ': Level ' + point.level + ', Ausrüstung ' + (point.itemLevel || 'keine') +
      ' → Ausgewogen: ' + base.win + ' % Siege, ' + base.fall + ' % mit Gefallenen');
    if (point.distance > 25) {
      console.log('  (kein guter Messpunkt gefunden, Werte nur eingeschränkt aussagekräftig)');
    }
    for (const classId of new Set(classIds)) {
      for (const order of HERO_ORDERS[classId] || []) {
        // Die erste Option ist "Ausgewogen" = die Messlatte
        for (const option of order.options.slice(1)) {
          const result = measureRuns({
            classIds, dungeonId: dungeon.id, level: point.level, itemLevel: point.itemLevel, runs: RUNS,
            orders: { [classId]: { [order.id]: option.id } },
          });
          const key = classId + '.' + order.id + '=' + option.id;
          const change = result.win - base.win;
          console.log('  ' + key.padEnd(36) + ' Siege ' + signed(change).padStart(4) +
            '   Gefallene ' + signed(result.fall - base.fall).padStart(4));
          (overview[key] ||= []).push({ where: groupName + '/' + dungeon.id, change });
        }
      }
    }
  }
}

// Bewertung einer Option über alle Messungen:
//   "situativ"   = hilft irgendwo und schadet irgendwo (so soll es sein)
//   "nie besser" = hilft nirgends deutlich
//   "immer gut"  = schadet nirgends deutlich (vermutlich zu stark)
function rate(entries) {
  const helps = entries.some((entry) => entry.change > NOISE);
  const hurts = entries.some((entry) => entry.change < -NOISE);
  if (helps && hurts) {
    return 'situativ';
  }
  if (helps) {
    return 'immer gut';
  }
  if (hurts) {
    return 'nie besser';
  }
  return 'kaum Wirkung';
}

console.log('\n######## Übersicht: Abweichung der Siege gegenüber "Ausgewogen" (Prozentpunkte)');
const ratings = {};
for (const key in overview) {
  const rating = rate(overview[key]);
  ratings[rating] = (ratings[rating] || 0) + 1;
  console.log(key.padEnd(36), rating.padEnd(12), overview[key].map((entry) => entry.where + ' ' + signed(entry.change)).join(' | '));
}
console.log('\nZusammenfassung:', Object.keys(ratings).map((rating) => rating + ': ' + ratings[rating]).join(' · '));
