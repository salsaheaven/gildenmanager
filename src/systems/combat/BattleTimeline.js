// ============================================================
// BATTLETIMELINE – wann passiert was? (in Spielsekunden)
// Ein Kampf ist vorberechnet. Hier bekommt jeder Eintrag des Kampfberichts einen Zeitpunkt.
// Daraus ergibt sich, wie lange ein Kampf bzw. ein ganzer Dungeon-Run dauert.
// Benutzt von der Kampfszene (Anzeige) und von Expedition (Fortschritt im Spiel).
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

// Zeitplan eines ganzen Runs: Begegnungen hintereinander, dazwischen Wegzeit.
// Gibt { segments: [{ start, end, timeline }], totalTime } zurück.
export function computeRunTimeline(runResult, travelSeconds) {
  const segments = [];
  let time = 0;
  for (let i = 0; i < runResult.encounters.length; i++) {
    if (i > 0) {
      time += travelSeconds;
    }
    const timeline = computeEncounterTimeline(runResult.encounters[i].log);
    segments.push({ start: time, end: time + timeline.duration, timeline: timeline });
    time += timeline.duration;
  }
  return { segments: segments, totalTime: time };
}

// Wo steht der Run nach "elapsed" Spielsekunden?
// Gibt { encounterIndex, localTime, traveling, round } zurück.
// traveling = true: die Gruppe ist gerade auf dem Weg zur nächsten Begegnung (encounterIndex = die nächste)
export function findRunPosition(runResult, runTimeline, elapsed) {
  const segments = runTimeline.segments;
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    if (elapsed < segment.start) {
      return { encounterIndex: i, localTime: 0, traveling: true, round: 0 };
    }
    if (elapsed < segment.end) {
      const localTime = elapsed - segment.start;
      return { encounterIndex: i, localTime: localTime, traveling: false, round: roundAt(runResult.encounters[i].log, segment.timeline, localTime) };
    }
  }
  const last = segments.length - 1;
  return { encounterIndex: last, localTime: segments[last].end - segments[last].start, traveling: false, round: Infinity };
}

// Welche Kampfrunde läuft zu diesem Zeitpunkt?
function roundAt(log, timeline, localTime) {
  let round = 0;
  for (let i = 0; i < log.length; i++) {
    if (timeline.times[i] > localTime) {
      break;
    }
    round = log[i].round;
  }
  return round;
}
