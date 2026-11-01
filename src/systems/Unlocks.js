// ============================================================
// UNLOCKS – schrittweises Freischalten (das Tutorial)
// Prüft die Bedingungen aus data/unlocks.js und merkt sich, was schon frei ist (guild.unlockedFeatures)
// und welche Hinweise der Spieler schon gesehen hat (guild.acknowledgedUnlocks).
// Geprüft wird nach jedem Tagesende, beim Kistenöffnen und beim Gründen der Gilde (siehe Game.updateUnlocks).
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

// Schaltet frei, was jetzt dran ist. Gibt die ids zurück, die gerade neu dazugekommen sind.
export function updateUnlocks(guild, day) {
  const added = [];
  for (const unlock of UNLOCKS) {
    if (!guild.unlockedFeatures.includes(unlock.id) && isConditionMet(guild, day, unlock.condition)) {
      guild.unlockedFeatures.push(unlock.id);
      added.push(unlock.id);
    }
  }
  return added;
}

// Freigeschaltet, aber der Hinweis wurde noch nicht angeschaut
export function getUnannouncedUnlocks(guild) {
  return guild.unlockedFeatures.filter((unlockId) => !guild.acknowledgedUnlocks.includes(unlockId));
}
