// ============================================================
// BATTLETIMELINE – wann passiert was? (in Sekunden der Kampfszene)
// Ein Kampf ist vorberechnet. Hier bekommt jeder Eintrag des Kampfberichts einen Zeitpunkt.
// Daraus ergibt sich, wie lange die Kampfszene dauert. Benutzt von der Kampfszene und tools/kampfdauer.mjs.
//
// Zeitraffer: Nicht jede Runde ist spannend. Jede Runde bekommt einen Tempo-Faktor:
//   - Trash: schnell (trashSpeed), außer in Runden, in denen ein Held fällt
//   - Bosskampf: ruhige Runden schnell (quietRoundSpeed), wichtige Runden normal
//     wichtig = Ankündigung, ausgelöste Mechanik, Raserei oder ein Held fällt
// Die Zahlen stehen unter "pacing" in data/combatRules.js.
// ============================================================

import { COMBAT_RULES } from '../../data/combatRules.js';

// Zeitpunkte aller Einträge eines Kampfes.
// encounterType = 'trash' oder 'boss' (aus dem Ergebnis der Begegnung). Ohne Angabe: kein Zeitraffer.
// Gibt { times, speeds, duration } zurück. speeds[i] = Tempo-Faktor der Runde von Eintrag i (1 = normal).
export function computeEncounterTimeline(log, encounterType = null) {
  const pacing = COMBAT_RULES.pacing;
  const roundSpeeds = getRoundSpeeds(log, encounterType);
  const times = [];
  const speeds = [];
  let time = pacing.startDelay;
  let currentRound = 0;

  for (const entry of log) {
    const speed = roundSpeeds[entry.round] || 1;
    if (entry.round !== currentRound) {
      currentRound = entry.round;
      time += pacing.roundPause / speed;
    }
    times.push(time);
    speeds.push(speed);
    if (entry.kind === 'action') {
      time += pacing.actionLead / speed;
    } else if (entry.hits || entry.labels || entry.spawn || entry.cast) {
      time += pacing.effectTime / speed;
    } else {
      time += pacing.infoTime / speed;
    }
  }
  return { times: times, speeds: speeds, duration: time + pacing.endDelay };
}

// Tempo-Faktor jeder Runde: Runde → Faktor
function getRoundSpeeds(log, encounterType) {
  const pacing = COMBAT_RULES.pacing;
  const importantRounds = {};
  const fallRounds = {};
  for (const entry of log) {
    if (entry.heroFallen) {
      fallRounds[entry.round] = true;
      importantRounds[entry.round] = true;
    }
    if (entry.cast || entry.kind === 'mechanic' || entry.kind === 'warning') {
      importantRounds[entry.round] = true;
    }
  }

  const speeds = {};
  for (const entry of log) {
    const round = entry.round;
    if (encounterType === 'trash') {
      speeds[round] = fallRounds[round] ? 1 : pacing.trashSpeed;
    } else if (encounterType === 'boss') {
      speeds[round] = importantRounds[round] ? 1 : pacing.quietRoundSpeed;
    } else {
      speeds[round] = 1;
    }
  }
  return speeds;
}
