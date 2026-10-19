// ============================================================
// TESTGROUP – erstellt eine Standard-Gruppe zum Ausprobieren im Kampf-Labor
// (je ein Held der Start-Klassen, ohne Ausrüstung, mit wählbarem Level)
// Diese Helden gehören nicht zur Gilde.
// ============================================================

import { Hero } from '../../entities/Hero.js';

const TEST_HEROES = [
  { classId: 'warrior',    name: 'Test-Krieger' },
  { classId: 'priest',     name: 'Test-Priester' },
  { classId: 'runeweaver', name: 'Test-Runenwirker' },
  { classId: 'mage',       name: 'Test-Magier' },
  { classId: 'rogue',      name: 'Test-Schurke' },
];

const TEST_LOOKS = { skin: '#f1c39b', hair: '#6b3f17' };

// classIds = optional: nur diese Klassen (z.B. ohne Heiler, um etwas auszuprobieren)
export function createTestGroup(level = 1, rarityId = 'uncommon', classIds = null) {
  const group = [];
  for (let i = 0; i < TEST_HEROES.length; i++) {
    const entry = TEST_HEROES[i];
    if (classIds && !classIds.includes(entry.classId)) {
      continue;
    }
    // Negative ids, damit sie nie mit echten Helden verwechselt werden
    const hero = new Hero(-(i + 1), entry.name, entry.classId, rarityId, [], TEST_LOOKS);
    hero.level = level;
    group.push(hero);
  }
  return group;
}
