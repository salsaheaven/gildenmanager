// ============================================================
// BATTLETIMELINE – wann passiert was? (in Sekunden der Kampfszene)
// Ein Kampf ist vorberechnet. Hier bekommt jeder Eintrag des Kampfberichts einen Zeitpunkt.
// Daraus ergibt sich, wie lange die Kampfszene dauert. Benutzt von der Kampfszene.
// ============================================================

import { COMBAT_RULES } from '../../data/combatRules.js';

// Zeitpunkte aller Einträge eines Kampfes. Gibt { times, duration } zurück.
export function computeEncounterTimeline(log) {
  const pacing = COMBAT_RULES.pacing;
  const times = [];
  let time = pacing.startDelay;
  let currentRound = 0;

  for (const entry of log) {
    if (entry.round !== currentRound) {
      currentRound = entry.round;
      time += pacing.roundPause;
    }
    times.push(time);
    if (entry.kind === 'action') {
      time += pacing.actionLead;
    } else if (entry.hits || entry.labels || entry.spawn || entry.cast) {
      time += pacing.effectTime;
    } else {
      time += pacing.infoTime;
    }
  }
  return { times: times, duration: time + pacing.endDelay };
}
