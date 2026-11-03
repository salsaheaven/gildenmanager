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

// Der Standard-Raid: 4 Gruppen à 5, jede mit eigenem Heiler, dazu 2 Tanks (in Gruppe 1 und 2)
export const STANDARD_TEST_RAID = [
  ['warrior', 'priest', 'mage', 'rogue', 'hunter'],
  ['paladin', 'druid', 'warlock', 'samurai', 'bard'],
  ['barbarian', 'runeweaver', 'mage', 'hunter', 'shaman'],
  ['rogue', 'priest', 'warlock', 'samurai', 'chronomancer'],
];

// classIds = welche Klassen mitkämpfen (Standard: die fünf Start-Klassen). Doppelte sind erlaubt.
// idOffset / nameSuffix = für Raids, damit Helden verschiedener Gruppen unterscheidbar sind
export function createTestGroup(level = 1, rarityId = 'uncommon', classIds = null, idOffset = 0, nameSuffix = '') {
  const chosen = classIds || STANDARD_TEST_CLASSES;
  const group = [];
  for (let i = 0; i < chosen.length; i++) {
    const classId = chosen[i];
    // Negative ids, damit sie nie mit echten Helden verwechselt werden
    const name = 'Test-' + getHeroClass(classId).name + nameSuffix;
    const hero = new Hero(-(idOffset + i + 1), name, classId, rarityId, [], TEST_LOOKS);
    hero.level = level;
    group.push(hero);
  }
  return group;
}

// Ein Test-Raid: eine Liste von Gruppen (Standard: STANDARD_TEST_RAID).
// Die Helden heißen z.B. "Test-Magier 3" (3 = Gruppe 3) und haben alle verschiedene ids.
export function createTestRaid(level = 1, rarityId = 'uncommon', groupClassIds = null) {
  const chosen = groupClassIds || STANDARD_TEST_RAID;
  return chosen.map((classIds, groupIndex) =>
    createTestGroup(level, rarityId, classIds, groupIndex * 10, ' ' + (groupIndex + 1)));
}
