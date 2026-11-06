// ============================================================
// COUNTERPOINTS – wie viel ein Held gegen Panzer und Wutanfall eines Bosses ausrichtet
// Spezialisten (feste Klassen in data/counters.js) bringen COUNTER_POINTS.specialist Punkte,
// ein Held mit Konter-Talent (counterPoints in data/talents.js) COUNTER_POINTS.talent, alle anderen 0.
// Benutzt in AbilityEffects (Panzer brechen) und CombatSimulator (Wutanfall dämpfen).
// ============================================================

import { COUNTERS, COUNTER_POINTS } from '../../data/counters.js';

// counterId = 'breakShell' oder 'calm'
export function getCounterPoints(combatant, counterId) {
  const counter = COUNTERS.find((entry) => entry.id === counterId);
  if (!counter || !combatant.classId || combatant.isPet) {
    return 0;
  }
  if (counter.classIds.includes(combatant.classId)) {
    return COUNTER_POINTS.specialist;
  }
  const fromTalent = combatant.orderSettings && combatant.orderSettings.counterPoints[counterId];
  return fromTalent ? COUNTER_POINTS.talent : 0;
}

// Der Panzer bzw. Wutanfall auf einem Kämpfer (oder null)
export function findCounterEffect(combatant, kind) {
  return combatant.effects.find((effect) => effect.counterKind === kind) || null;
}
