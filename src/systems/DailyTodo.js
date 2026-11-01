// ============================================================
// DAILYTODO – "Was gibt es heute zu tun?": nur Dinge, die eine Entscheidung brauchen
// Jeder Eintrag sagt, worum es geht (id), wie viele es sind (count) und wo man es erledigt (screenId).
// Die Texte macht die Oberfläche (ui/TodoBox.js). Reihenfolge = Wichtigkeit.
//   groupMissing = stehende Gruppen, die heute losziehen, denen aber jemand fehlt (verletzt, noch kein Ersatz) → Tagesplan
//   boxes      = ungeöffnete Kisten                         → Beute
//   newGear    = Helden mit neuer, passender Ausrüstung     → Helden
//   talents    = Helden mit freiem Talent                   → Helden
//   building   = gestern ist ein Gebäude fertig geworden    → Gildenhalle
//   upkeep     = Unterhalt nicht bezahlt, Gebäude wirken nicht → Gildenhalle
//   unhappy    = Helden ohne Sold (unzufrieden)            → Helden
//   groups     = so viele vollständige Gruppen könnten noch los → Dungeons
//   candidate  = ein epischer oder legendärer Bewerber      → Taverne
// ============================================================

import { getSlotsWithNewGear } from './NewGear.js';
import { countPossibleGroups } from './GroupCounter.js';
import { getMissingMembers } from './StandingGroups.js';

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

  add('groupMissing', countGroupsWithMissingMembers(guild), 'plan');
  add('boxes', guild.boxes.length, 'treasury');
  add('newGear', guild.heroes.filter((hero) => getSlotsWithNewGear(guild, hero).length > 0).length, 'heroes');
  add('talents', guild.heroes.filter((hero) => hero.getFreeTalentPicks() > 0).length, 'heroes');
  add('building', lastDaySummary && lastDaySummary.finishedBuilding ? 1 : 0, 'hall');
  add('upkeep', guild.hall.upkeepPaid ? 0 : 1, 'hall');
  add('unhappy', guild.heroes.filter((hero) => hero.isUnhappy()).length, 'heroes');
  add('groups', countPossibleGroups(guild).groups, 'dungeons');
  add('candidate', guild.candidates.filter((candidate) => candidate.getRarityRank() >= NOTABLE_CANDIDATE_RANK).length, 'tavern');
  return todos;
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
