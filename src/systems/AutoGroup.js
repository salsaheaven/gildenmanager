// ============================================================
// AUTOGROUP – "Auto-Gruppe": füllt die leeren Plätze einer Gruppe mit passenden freien Helden
// Schon gewählte Helden bleiben drin. Reihenfolge beim Auffüllen:
//   1. fehlende Pflicht-Positionen (Tank, Heiler, siehe data/groupRules.js)
//   2. Konter für bekannte Mechaniken des Dungeons, die noch niemand in der Gruppe abdeckt
//      (nur erkundete Bosse zählen, siehe DungeonKnowledge.js; wer was kontert: data/counters.js)
//   3. die übrigen Plätze
// Innerhalb jeder Stufe gewinnt der Held mit dem höchsten Level, bei Gleichstand der höhere Ausrüstungswert.
// "Frei" heißt: nicht verletzt, heute nicht eingeplant und in keiner stehenden Gruppe.
// ============================================================

import { GROUP_RULES, getPositionId } from '../data/groupRules.js';
import { COUNTERS, getCounterIds } from '../data/counters.js';
import { getDungeon } from '../data/dungeons.js';
import { getBoss } from '../data/enemies.js';
import { isEncounterKnown } from './DungeonKnowledge.js';

// Helden, die die Auto-Gruppe nehmen darf
export function getAutoGroupCandidates(guild) {
  const inStandingGroup = (heroId) => guild.standingGroups.some((group) => group.heroIds.includes(heroId));
  return guild.heroes.filter((hero) => !hero.isInjured() && !guild.isHeroBusy(hero.id) && !inStandingGroup(hero.id));
}

// Welche Konter brauchen die bekannten Mechaniken dieses Dungeons? (ids aus data/counters.js)
export function getNeededCounterIds(guild, dungeonId) {
  const needed = [];
  getDungeon(dungeonId).encounters.forEach((encounter, index) => {
    if (encounter.type !== 'boss' || !isEncounterKnown(guild, dungeonId, index)) {
      return;
    }
    for (const mechanic of getBoss(encounter.bossId).mechanics) {
      for (const counterId of getCounterIds(mechanic)) {
        if (!needed.includes(counterId)) {
          needed.push(counterId);
        }
      }
    }
  });
  return needed;
}

// Kann dieser Held den Konter? (fest über seine Klasse oder über ein gewähltes Konter-Talent)
export function heroProvidesCounter(hero, counter) {
  if (counter.classIds.includes(hero.classId)) {
    return true;
  }
  return counter.talents.some((entry) => entry.classId === hero.classId && hero.talentIds.includes(entry.talentId));
}

// Bessere Helden zuerst: höheres Level, dann höherer Ausrüstungswert
function compareHeroes(a, b) {
  if (b.level !== a.level) {
    return b.level - a.level;
  }
  return b.getGearScore() - a.getGearScore();
}

// Vorschlag für die ganze Gruppe: die gewählten Helden plus die aufgefüllten (Liste von Helden-ids).
// selectedHeroIds = die schon gewählten Helden (bleiben drin, in ihrer Reihenfolge)
export function suggestAutoGroup(guild, dungeonId, selectedHeroIds) {
  const group = selectedHeroIds.map((heroId) => guild.findHero(heroId)).filter((hero) => hero);
  const pool = getAutoGroupCandidates(guild).filter((hero) => !selectedHeroIds.includes(hero.id));
  pool.sort(compareHeroes);

  // Nimmt den besten Helden aus dem Pool, der die Bedingung erfüllt
  const take = (condition) => {
    const index = pool.findIndex(condition);
    if (index === -1 || group.length >= GROUP_RULES.size) {
      return false;
    }
    group.push(pool[index]);
    pool.splice(index, 1);
    return true;
  };
  const countPosition = (positionId) => group.filter((hero) => getPositionId(hero.getClass()) === positionId).length;
  const neededCounters = COUNTERS.filter((counter) => getNeededCounterIds(guild, dungeonId).includes(counter.id));
  const missingCounters = () => neededCounters.filter((counter) => !group.some((hero) => heroProvidesCounter(hero, counter)));

  // 1. Pflicht-Positionen; wer dabei auch einen fehlenden Konter mitbringt, hat Vorrang
  for (const positionId in GROUP_RULES.required) {
    while (countPosition(positionId) < GROUP_RULES.required[positionId]) {
      const ofPosition = (hero) => getPositionId(hero.getClass()) === positionId;
      const bringsCounter = (hero) => missingCounters().some((counter) => heroProvidesCounter(hero, counter));
      if (!take((hero) => ofPosition(hero) && bringsCounter(hero)) && !take(ofPosition)) {
        break;
      }
    }
  }
  // 2. Fehlende Konter
  for (const counter of missingCounters()) {
    take((hero) => heroProvidesCounter(hero, counter));
  }
  // 3. Rest auffüllen
  while (take(() => true)) {
    // take füllt, bis die Gruppe voll oder niemand mehr frei ist
  }
  return group.map((hero) => hero.id);
}

// Konter-Stand einer Gruppe für die Anzeige "Konter ✓/✗" (Risiko live):
// Welche Konter brauchen die bekannten Mechaniken, und kann sie jemand in der Gruppe?
// Ergebnis: { counters: [{ id, name, covered }], unknownBosses } (unknownBosses = noch nicht erkundete Bosse)
export function getCounterStatus(guild, dungeonId, heroes) {
  const needed = getNeededCounterIds(guild, dungeonId);
  const counters = COUNTERS.filter((counter) => needed.includes(counter.id)).map((counter) => ({
    id: counter.id,
    name: counter.name,
    covered: heroes.some((hero) => heroProvidesCounter(hero, counter)),
  }));
  let unknownBosses = 0;
  getDungeon(dungeonId).encounters.forEach((encounter, index) => {
    if (encounter.type === 'boss' && !isEncounterKnown(guild, dungeonId, index)) {
      unknownBosses++;
    }
  });
  return { counters: counters, unknownBosses: unknownBosses };
}
