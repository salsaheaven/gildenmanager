// ============================================================
// GRUPPEN – Positionen der Helden und was eine vollständige Dungeon-Gruppe braucht
// Benutzt von der Heldenübersicht (Kacheln nach Position) und vom Gruppen-Zähler (systems/GroupCounter.js).
//
// Positionen: Die Rolle einer Klasse (data/heroClasses.js) teilt "Schaden" noch in Nahkampf (steht vorne)
// und Fernkampf (steht hinten). So entstehen 5 Positionen mit deutschen Namen.
// ============================================================

// Reihenfolge der Positionen in der Anzeige
export const POSITIONS = [
  { id: 'tank', name: 'Tank' },
  { id: 'healer', name: 'Heiler' },
  { id: 'melee', name: 'Nahkampf' },
  { id: 'ranged', name: 'Fernkampf' },
  { id: 'support', name: 'Unterstützer' },
];

// Eine vollständige Gruppe (entschieden 2026-10-30):
//   size     = so viele Helden insgesamt
//   required = so viele müssen diese Position haben; die übrigen Plätze darf jede Position füllen
export const GROUP_RULES = {
  size: 5,
  required: { tank: 1, healer: 1 },
};

// Position einer Klasse, z.B. 'melee' für den Schurken (Schaden, steht vorne)
export function getPositionId(heroClass) {
  if (heroClass.role === 'damage') {
    return heroClass.row === 'front' ? 'melee' : 'ranged';
  }
  return heroClass.role;
}

export function getPositionName(positionId) {
  return POSITIONS.find((position) => position.id === positionId).name;
}
