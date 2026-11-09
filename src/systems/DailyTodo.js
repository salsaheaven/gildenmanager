// ============================================================
// DAILYTODO – "Was gibt es heute zu tun?": nur Dinge, die eine Entscheidung brauchen
// Jeder Eintrag sagt, worum es geht (id), wie viele es sind (count) und wo man es erledigt (screenId).
// Ganz oben stehen neu freigeschaltete Teile des Spiels: { id: 'unlock', unlockId, count: 1, screenId } (Tutorial).
// Einträge zu noch gesperrten Teilen fallen weg (z.B. Bewerber, solange die Taverne gesperrt ist).
// Die Texte macht die Oberfläche (ui/TodoBox.js). Reihenfolge = Wichtigkeit.
//   groupMissing = stehende Gruppen, die heute losziehen, denen aber jemand fehlt (verletzt, noch kein Ersatz) → Tagesplan
//   boxes      = ungeöffnete Kisten                         → Beute
//   newGear    = Helden mit neuer, passender Ausrüstung     → Helden
//   talents    = Helden mit freiem Talent                   → Helden
//   building   = gestern ist ein Gebäude fertig geworden    → Gildenhalle
//   upkeep     = Unterhalt nicht bezahlt, Gebäude wirken nicht → Gildenhalle
//   unhappy    = Helden ohne Sold (unzufrieden)            → Helden
//   groups     = so viele vollständige Gruppen könnten noch los → Dungeons
//   newDungeon = ein offener Dungeon, der noch nie versucht wurde und zu dem keine Gruppe zieht → Dungeons
//                ({ dungeonId } = der erste davon, für den Text)
//   candidate  = ein epischer oder legendärer Bewerber      → Taverne
// ============================================================

import { getSlotsWithNewGear } from './NewGear.js';
import { countPossibleGroups } from './GroupCounter.js';
import { getMissingMembers } from './StandingGroups.js';
import { getDayPlan } from './DayPlan.js';
import { getUnannouncedUnlocks } from './Unlocks.js';
import { getUnlock } from '../data/unlocks.js';
import { DUNGEONS } from '../data/dungeons.js';

// Ab diesem Rang ist ein Bewerber eine Meldung wert (4 = Episch, siehe rarities.js)
const NOTABLE_CANDIDATE_RANK = 4;

// lastDaySummary = Zusammenfassung des letzten Tagesendes (oder null am ersten Tag)
export function getDailyTodos(guild, lastDaySummary) {
  const todos = [];
  const add = (id, count, screenId) => {
    if (count > 0) {
      todos.push({ id, count, screenId });
    }
  };

  // Neu freigeschaltet (Hinweis noch nicht angeschaut)
  for (const unlockId of getUnannouncedUnlocks(guild)) {
    todos.push({ id: 'unlock', unlockId, count: 1, screenId: getUnlock(unlockId).screenId });
  }
  const unlocked = (unlockId) => guild.unlockedFeatures.includes(unlockId);

  add('groupMissing', countGroupsWithMissingMembers(guild), 'plan');
  // Ein neuer Dungeon ist offen, aber noch nie versucht (sonst merkt man es leicht nicht)
  const newDungeons = findNewDungeons(guild);
  if (newDungeons.length > 0) {
    todos.push({ id: 'newDungeon', count: newDungeons.length, screenId: 'dungeons', dungeonId: newDungeons[0].id });
  }
  // Heute ist Raid-Tag, aber die Raid-Aufstellung reicht nicht (zu wenige Helden, Tanks oder Heiler)
  add('raidNotReady', guild.raidPlan.notReadyToday ? 1 : 0, 'raid');
  add('boxes', guild.boxes.length, 'treasury');
  add('newGear', guild.heroes.filter((hero) => getSlotsWithNewGear(guild, hero).length > 0).length, 'heroes');
  if (unlocked('talents')) {
    add('talents', guild.heroes.filter((hero) => hero.getFreeTalentPicks() > 0).length, 'heroes');
  }
  if (unlocked('guildHall')) {
    add('building', lastDaySummary && lastDaySummary.finishedBuilding ? 1 : 0, 'hall');
    add('upkeep', guild.hall.upkeepPaid ? 0 : 1, 'hall');
  }
  add('unhappy', guild.heroes.filter((hero) => hero.isUnhappy()).length, 'heroes');
  // An Raid-Tagen gibt es keine Dungeons: dann auch keinen Hinweis auf mögliche Gruppen
  if (!guild.raidPlan.dungeonsClosedToday) {
    add('groups', countPossibleGroups(guild).groups, 'dungeons');
  }
  if (unlocked('tavern')) {
    add('candidate', guild.candidates.filter((candidate) => candidate.getRarityRank() >= NOTABLE_CANDIDATE_RANK).length, 'tavern');
  }
  return todos;
}

// Offene Dungeons, die noch nie versucht wurden und zu denen keine stehende Gruppe zieht.
// Erst ab dem zweiten Dungeon (den ersten zeigt "Gruppe könnte noch los").
function findNewDungeons(guild) {
  return DUNGEONS.filter((dungeon) => {
    if (dungeon.unlockAfter === null || guild.getClears(dungeon.unlockAfter) === 0) {
      return false;
    }
    const attempted = (guild.dungeonAttempts[dungeon.id] || 0) > 0;
    const groupGoes = guild.standingGroups.some((group) => group.dungeonId === dungeon.id);
    return !attempted && !groupGoes;
  });
}

// Stehende Gruppen, die heute losziehen, denen aber mehr Mitglieder fehlen, als Ersatz eingesprungen ist.
// (Zieht eine Gruppe gar nicht los, weil alle verletzt sind, gibt es keinen Ersatz: Das zeigt der Tagesplan.)
function countGroupsWithMissingMembers(guild) {
  let count = 0;
  for (const group of guild.standingGroups) {
    const expedition = guild.expeditions.find((entry) => entry.standingGroupId === group.id);
    const missing = getMissingMembers(guild, group).length;
    if (!expedition || missing === 0) {
      continue;
    }
    const substitutes = expedition.heroIds.filter((heroId) => !group.heroIds.includes(heroId)).length;
    if (missing > substitutes) {
      count++;
    }
  }
  return count;
}

// Offene Punkte, die etwas kosten, wenn man den Tag jetzt beendet (für die Nachfrage bei "Tag beenden").
// Ungeöffnete Kisten fehlen bewusst: Sie warten einfach bis morgen.
//   idleHeroes   = Helden, die sich nur ausruhen (ein Tag ohne Nutzen)
//   groupMissing = losziehende Gruppen, denen jemand fehlt (ohne Ersatz)
// Gibt eine Liste von { id, count, screenId } zurück (leer = nichts Wichtiges offen).
export function getEndDayWarnings(guild) {
  const warnings = [];
  const idle = getDayPlan(guild).counts.rest || 0;
  if (idle > 0) {
    warnings.push({ id: 'idleHeroes', count: idle, screenId: 'plan' });
  }
  const missing = countGroupsWithMissingMembers(guild);
  if (missing > 0) {
    warnings.push({ id: 'groupMissing', count: missing, screenId: 'plan' });
  }
  if (guild.raidPlan.notReadyToday) {
    warnings.push({ id: 'raidNotReady', count: 1, screenId: 'raid' });
  }
  return warnings;
}
