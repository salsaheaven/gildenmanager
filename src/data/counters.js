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
];

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
  return ids;
}

export function getCounter(counterId) {
  return COUNTERS.find((counter) => counter.id === counterId);
}
