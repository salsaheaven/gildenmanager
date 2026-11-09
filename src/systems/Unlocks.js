// ============================================================
// UNLOCKS – schrittweises Freischalten (das Tutorial)
// Prüft die Bedingungen aus data/unlocks.js und merkt sich, was schon frei ist (guild.unlockedFeatures)
// und welche Hinweise der Spieler schon gesehen hat (guild.acknowledgedUnlocks).
// Geprüft wird nach jedem Tagesende, beim Kistenöffnen und beim Gründen der Gilde (siehe Game.updateUnlocks).
// Höchstens eine Freischaltung pro Tag; ihr Hinweis steht einen Tag lang im Aufgaben-Kasten.
// ============================================================

import { UNLOCKS } from '../data/unlocks.js';

// Ist EINE der Bedingungen erfüllt? day = aktueller Tag des Spiels
export function isConditionMet(guild, day, condition) {
  if (condition.day !== undefined && day >= condition.day) {
    return true;
  }
  if (condition.clears !== undefined && countAllClears(guild) >= condition.clears) {
    return true;
  }
  if (condition.heroLevel !== undefined && guild.heroes.some((hero) => hero.level >= condition.heroLevel)) {
    return true;
  }
  if (condition.bossItems !== undefined && guild.collection.getProgress().found >= condition.bossItems) {
    return true;
  }
  return false;
}

// Alle geschafften Runs zusammen
function countAllClears(guild) {
  let total = 0;
  for (const dungeonId in guild.dungeonClears) {
    total += guild.dungeonClears[dungeonId];
  }
  return total;
}

// Schaltet frei, was jetzt dran ist: höchstens EINE Freischaltung pro Tag (in der Reihenfolge aus data/unlocks.js),
// damit nicht alles auf einmal kommt. Was auch schon dran wäre, wartet auf die nächsten Tage.
// Gibt die ids zurück, die gerade neu dazugekommen sind (leer oder eine).
export function updateUnlocks(guild, day) {
  if (guild.lastUnlockDay === day) {
    return [];
  }
  for (const unlock of UNLOCKS) {
    if (!guild.unlockedFeatures.includes(unlock.id) && isConditionMet(guild, day, unlock.condition)) {
      guild.unlockedFeatures.push(unlock.id);
      guild.lastUnlockDay = day;
      return [unlock.id];
    }
  }
  return [];
}

// Freigeschaltet, aber der Hinweis wurde noch nicht angeschaut
export function getUnannouncedUnlocks(guild) {
  return guild.unlockedFeatures.filter((unlockId) => !guild.acknowledgedUnlocks.includes(unlockId));
}
