// ============================================================
// DEFEATANALYSIS – "Woran es lag": wertet einen ganzen Run aus
// Zählt den Schaden an den Helden aus allen Begegnungen nach Quelle zusammen (siehe CauseTracker.js)
// und gibt die größten Ursachen mit ihrem Anteil zurück, dazu einen Tipp und kurze Hinweise.
// Texte und Anzahl stehen in data/defeatCauses.js.
// ============================================================

import { DEFEAT_ANALYSIS, CAUSE_TIPS, CAUSE_NOTES, UNKNOWN_CAUSE } from '../../data/defeatCauses.js';
import { getClassTip } from '../ClassTips.js';

// Lohnt sich die Auswertung? Bei einer Niederlage und bei einem Sieg mit Gefallenen.
export function needsDefeatAnalysis(runResult) {
  return runResult.outcome !== 'success' || runResult.heroes.some((hero) => !hero.alive);
}

// runResult = Ergebnis von simulateRun.
// hiddenMechanicNames = Mechaniken noch nicht erkundeter Bosse (siehe systems/DungeonKnowledge.js):
//   Sie erscheinen nur als "Etwas Unbekanntes" mit vagem Tipp (Texte in UNKNOWN_CAUSE).
// Gibt zurück: { causes: [{ name, type, share }], tip, classTip, notes: [Text] }
//   classTip = welche Klassen gegen die größte Ursache helfen würden (siehe systems/ClassTips.js), oder null
//   share = Anteil am gesamten Schaden an den Helden (0 bis 1)
export function analyzeRun(runResult, hiddenMechanicNames = []) {
  const bySource = {};
  const missedInterrupts = {};
  const outOfMana = [];
  const uncountered = {}; // Name → { count, mechanicType }
  for (const encounter of runResult.encounters) {
    const causes = encounter.causes;
    if (!causes) {
      continue;
    }
    for (const original of causes.damageBySource) {
      // Unerkundete Mechaniken werden zu einer gemeinsamen, vagen Ursache zusammengefasst
      const hidden = original.type === 'mechanic' && hiddenMechanicNames.includes(original.name);
      const source = hidden ? { ...original, key: 'unknown', name: UNKNOWN_CAUSE.name, hint: UNKNOWN_CAUSE.tip } : original;
      if (!bySource[source.key]) {
        bySource[source.key] = { ...source, damage: 0 };
      }
      bySource[source.key].damage += source.damage;
    }
    for (const name in causes.missedInterrupts) {
      // Unerkundete Zauber ohne Namen ("Ein unbekannter Zauber …")
      const key = hiddenMechanicNames.includes(name) ? UNKNOWN_CAUSE.name : name;
      missedInterrupts[key] = (missedInterrupts[key] || 0) + causes.missedInterrupts[name];
    }
    for (const name of causes.outOfMana) {
      if (!outOfMana.includes(name)) {
        outOfMana.push(name);
      }
    }
    for (const entry of causes.uncountered || []) {
      if (hiddenMechanicNames.includes(entry.name)) {
        continue;
      }
      if (!uncountered[entry.name]) {
        uncountered[entry.name] = { count: 0, mechanicType: entry.mechanicType };
      }
      uncountered[entry.name].count += entry.count;
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
  let classTip = null;
  if (top.length > 0) {
    tip = top[0].hint || CAUSE_TIPS[top[0].type] || null;
    // Unerkundete Mechaniken verraten nichts
    classTip = top[0].key === 'unknown' ? null : getClassTip(top[0]);
  }

  const notes = [];
  for (const name in missedInterrupts) {
    const text = name === UNKNOWN_CAUSE.name ? UNKNOWN_CAUSE.missedInterrupt : CAUSE_NOTES.missedInterrupt;
    notes.push(fillIn(text, { name: name, count: missedInterrupts[name] }));
  }
  for (const name of outOfMana) {
    notes.push(fillIn(CAUSE_NOTES.outOfMana, { name: name }));
  }
  // Panzer bzw. Wutanfall, den niemand beendet hat, mit den Klassen, die es könnten
  for (const name in uncountered) {
    const counterText = getClassTip({ type: 'mechanic', mechanicType: uncountered[name].mechanicType, interruptible: false });
    notes.push(fillIn(CAUSE_NOTES.uncountered, { name: name, count: uncountered[name].count, counter: counterText }));
  }

  return { causes: causes, tip: tip, classTip: classTip, notes: notes };
}

// Ersetzt {name}, {count} … in einem Text
function fillIn(text, values) {
  let result = text;
  for (const key in values) {
    result = result.replace('{' + key + '}', String(values[key]));
  }
  return result;
}
