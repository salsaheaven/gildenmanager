// ============================================================
// TESTGROUP – erstellt eine Gruppe zum Ausprobieren im Kampf-Labor
// (je ein Held pro gewünschter Klasse, ohne Ausrüstung, mit wählbarem Level)
// Diese Helden gehören nicht zur Gilde.
// ============================================================

import { Hero } from '../../entities/Hero.js';
import { getHeroClass } from '../../data/heroClasses.js';

// Die Standard-Gruppe: die fünf Start-Klassen
export const STANDARD_TEST_CLASSES = ['warrior', 'priest', 'runeweaver', 'mage', 'rogue'];

const TEST_LOOKS = { skin: '#f1c39b', hair: '#6b3f17' };

// classIds = welche Klassen mitkämpfen (Standard: die fünf Start-Klassen). Doppelte sind erlaubt.
export function createTestGroup(level = 1, rarityId = 'uncommon', classIds = null) {
  const chosen = classIds || STANDARD_TEST_CLASSES;
  const group = [];
  for (let i = 0; i < chosen.length; i++) {
    const classId = chosen[i];
    // Negative ids, damit sie nie mit echten Helden verwechselt werden
    const hero = new Hero(-(i + 1), 'Test-' + getHeroClass(classId).name, classId, rarityId, [], TEST_LOOKS);
    hero.level = level;
    group.push(hero);
  }
  return group;
}
