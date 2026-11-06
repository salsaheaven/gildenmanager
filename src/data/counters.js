// ============================================================
// KONTER – wer welche Boss-Mechanik kontern kann (für die Tipps im Dungeonführer)
// Der Spezialist kann es fest über seine Klasse, weitere Klassen über ein Talent
// (siehe "Konter verteilen" in KONZEPT.md und die Konter-Talente in data/talents.js).
//
// id        = Art des Konters
// name      = Anzeige im Dungeonführer
// classIds  = Klassen, die es fest können
// talents   = Klassen, die es mit einem Talent können: { classId, talentId }
// Welche Mechanik welchen Konter braucht, steht in getCounterIds.
//
// Panzer brechen und Wutanfall dämpfen wirken über Punkte (COUNTER_POINTS): Der Panzer bzw. Wutanfall des Bosses
// hat breakPoints Punkte. Ein Spezialist bringt specialist Punkte, ein Held mit Konter-Talent talent Punkte.
//   Panzer brechen: Jeder Treffer eines solchen Helden am Boss zieht seine Punkte ab.
//   Wutanfall dämpfen: Der Held nutzt seinen Zug, um den Boss zu beruhigen (zieht seine Punkte ab).
// So reicht ein Spezialist allein, mit Talent braucht es zwei Helden oder zwei Züge.
// ============================================================

export const COUNTERS = [
  {
    id: 'interrupt', name: 'Unterbrechen',
    classIds: ['rogue'],
    talents: [{ classId: 'hunter', talentId: 'hunInterruptNet' }, { classId: 'mage', talentId: 'magCounterIce' }],
  },
  {
    id: 'cleanse', name: 'Fluch lösen',
    classIds: ['runeweaver'],
    talents: [{ classId: 'priest', talentId: 'priPurifyingSpark' }, { classId: 'shaman', talentId: 'shaCleansingTotem' }],
  },
  {
    id: 'block', name: 'Abfangen',
    classIds: ['runeweaver', 'warrior'],
    talents: [{ classId: 'paladin', talentId: 'palGuardianShield' }, { classId: 'druid', talentId: 'druBarkskin' }],
  },
  {
    id: 'breakShell', name: 'Panzer brechen',
    classIds: ['samurai', 'barbarian', 'monk'],
    talents: [{ classId: 'warrior', talentId: 'warShellBreaker' }, { classId: 'paladin', talentId: 'palShellBreaker' }],
  },
  {
    id: 'calm', name: 'Wutanfall dämpfen',
    classIds: ['bard', 'chronomancer', 'warlock'],
    talents: [{ classId: 'shaman', talentId: 'shaCalmingTotem' }, { classId: 'druid', talentId: 'druSoothe' }],
  },
];

// Punkte für Panzer brechen und Wutanfall dämpfen (siehe oben)
export const COUNTER_POINTS = { specialist: 2, talent: 1 };

// Welche Konter passen zu einer Boss-Mechanik? (ids aus COUNTERS)
export function getCounterIds(mechanic) {
  const ids = [];
  if (mechanic.interruptible) {
    ids.push('interrupt');
  }
  if (mechanic.type === 'curse') {
    ids.push('cleanse');
  }
  if (mechanic.type === 'tankBuster') {
    ids.push('block');
  }
  if (mechanic.type === 'shell') {
    ids.push('breakShell');
  }
  if (mechanic.type === 'frenzy') {
    ids.push('calm');
  }
  return ids;
}

export function getCounter(counterId) {
  return COUNTERS.find((counter) => counter.id === counterId);
}
