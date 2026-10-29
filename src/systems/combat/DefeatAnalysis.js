// ============================================================
// DEFEATANALYSIS – "Woran es lag": wertet einen ganzen Run aus
// Zählt den Schaden an den Helden aus allen Begegnungen nach Quelle zusammen (siehe CauseTracker.js)
// und gibt die größten Ursachen mit ihrem Anteil zurück, dazu einen Tipp und kurze Hinweise.
// Texte und Anzahl stehen in data/defeatCauses.js.
// ============================================================

import { DEFEAT_ANALYSIS, CAUSE_TIPS, CAUSE_NOTES } from '../../data/defeatCauses.js';

// Lohnt sich die Auswertung? Bei einer Niederlage und bei einem Sieg mit Gefallenen.
export function needsDefeatAnalysis(runResult) {
  return runResult.outcome !== 'success' || runResult.heroes.some((hero) => !hero.alive);
}

// runResult = Ergebnis von simulateRun.
// Gibt zurück: { causes: [{ name, type, share }], tip, notes: [Text] }
//   share = Anteil am gesamten Schaden an den Helden (0 bis 1)
export function analyzeRun(runResult) {
  const bySource = {};
  const missedInterrupts = {};
  const outOfMana = [];
  for (const encounter of runResult.encounters) {
    const causes = encounter.causes;
    if (!causes) {
      continue;
    }
    for (const source of causes.damageBySource) {
      if (!bySource[source.key]) {
        bySource[source.key] = { ...source, damage: 0 };
      }
      bySource[source.key].damage += source.damage;
    }
    for (const name in causes.missedInterrupts) {
      missedInterrupts[name] = (missedInterrupts[name] || 0) + causes.missedInterrupts[name];
    }
    for (const name of causes.outOfMana) {
      if (!outOfMana.includes(name)) {
        outOfMana.push(name);
      }
    }
  }

  const sources = Object.values(bySource);
  const total = sources.reduce((sum, source) => sum + source.damage, 0);
  sources.sort((a, b) => b.damage - a.damage);
  const top = sources.slice(0, DEFEAT_ANALYSIS.topCount);

  const causes = top.map((source) => ({
    name: source.name,
    type: source.type,
    share: total > 0 ? source.damage / total : 0,
  }));

  // Tipp zur größten Ursache: der eigene Tipp der Mechanik, sonst der allgemeine für diese Art
  let tip = null;
  if (top.length > 0) {
    tip = top[0].hint || CAUSE_TIPS[top[0].type] || null;
  }

  const notes = [];
  for (const name in missedInterrupts) {
    notes.push(fillIn(CAUSE_NOTES.missedInterrupt, { name: name, count: missedInterrupts[name] }));
  }
  for (const name of outOfMana) {
    notes.push(fillIn(CAUSE_NOTES.outOfMana, { name: name }));
  }

  return { causes: causes, tip: tip, notes: notes };
}

// Ersetzt {name}, {count} … in einem Text
function fillIn(text, values) {
  let result = text;
  for (const key in values) {
    result = result.replace('{' + key + '}', String(values[key]));
  }
  return result;
}
