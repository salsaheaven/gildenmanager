// ============================================================
// STARTTEAM – prüft die Starttruppe, die der Spieler beim Gründen der Gilde wählt
//   - jeder Platz braucht eine Klasse mit der passenden Rolle (Tank, Schadensmacher …)
//   - alle Rüstungsarten (Platte, Leder, Stoff) müssen vorkommen
// Die Plätze und Regeln stehen in data/startTeam.js. Die Gilde gründet Game.foundGuild().
// ============================================================

import { START_TEAM_SLOTS, START_TEAM_RULES } from '../data/startTeam.js';
import { HERO_CLASSES, getHeroClass } from '../data/heroClasses.js';

// Welche Klassen passen auf diesen Platz? (Liste von Klassen aus heroClasses.js)
export function getClassesForSlot(slotIndex) {
  const role = START_TEAM_SLOTS[slotIndex].role;
  return HERO_CLASSES.filter((heroClass) => heroClass.role === role);
}

// Welche Rüstungsarten fehlen noch? classIds = gewählte Klasse pro Platz (null = noch keine)
export function getMissingArmorTypes(classIds) {
  const present = new Set();
  for (const classId of classIds) {
    if (classId) {
      present.add(getHeroClass(classId).armorType);
    }
  }
  return START_TEAM_RULES.requiredArmorTypes.filter((armorType) => !present.has(armorType));
}

// Prüft die ganze Starttruppe. Gibt 'ok' oder einen Grund zurück:
// 'wrongCount' (nicht genau 5 Klassen), 'emptySlot' (ein Platz ist leer),
// 'wrongRole' (Klasse passt nicht auf ihren Platz), 'missingArmor' (eine Rüstungsart fehlt)
export function checkStartTeam(classIds) {
  if (classIds.length !== START_TEAM_SLOTS.length) {
    return 'wrongCount';
  }
  for (let slotIndex = 0; slotIndex < classIds.length; slotIndex++) {
    const classId = classIds[slotIndex];
    if (!classId) {
      return 'emptySlot';
    }
    const fits = getClassesForSlot(slotIndex).some((heroClass) => heroClass.id === classId);
    if (!fits) {
      return 'wrongRole';
    }
  }
  if (getMissingArmorTypes(classIds).length > 0) {
    return 'missingArmor';
  }
  return 'ok';
}
