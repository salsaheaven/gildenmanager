// ============================================================
// SUPPLYADVICE – der Tränke-Ratgeber: Welche 2 Vorräte würden einer Gruppe in einem Dungeon am meisten helfen?
// Benutzt von der Risiko-Anzeige („Mit Wutelixier + Steinhaut: Machbar“) und von „Woran es lag“.
//
// In Frage kommen nur Waren, die man heute bekommt: aus der Vorratskammer oder beim Händler
// (Grundware und Tagesangebot). Bewertet wird mit "advice" aus data/consumables.js:
//   value         = allgemeine Stärke
//   helpsAgainst  = +2, wenn die Ware gegen eine der genannten Ursachen hilft
//   Schutztränke  = zählen nur, wenn ihre Schadensart im Dungeon bekannt ist (Erkunden)
// ============================================================

import { CONSUMABLES, SUPPLY_SLOTS } from '../data/consumables.js';
import { getKnownDamageTypes } from './DungeonKnowledge.js';

// Bonus, wenn eine Ware gegen eine der Ursachen hilft
const CAUSE_MATCH_BONUS = 2;

// Bekommt man diese Ware heute? (Vorratskammer oder Händler)
export function isSupplyObtainable(guild, consumable) {
  return guild.countSupply(consumable.id) > 0 || consumable.stock === 'always' || guild.dailyOffer.includes(consumable.id);
}

// Wie gut passt eine Ware zu diesem Dungeon? causeTypes = Ursachen-Arten aus "Woran es lag" (darf leer sein)
function scoreSupply(consumable, knownDamageTypes, causeTypes) {
  const resistanceTypes = Object.keys(consumable.effects.resistance || {});
  if (resistanceTypes.length > 0 && !resistanceTypes.some((type) => knownDamageTypes.includes(type))) {
    return 0; // Schutztrank gegen eine Schadensart, die hier (soweit bekannt) nicht vorkommt
  }
  let score = consumable.advice.value;
  for (const causeType of causeTypes) {
    if (consumable.advice.helpsAgainst.includes(causeType)) {
      score += CAUSE_MATCH_BONUS;
    }
  }
  return score;
}

// Die besten Vorräte für einen Run (höchstens SUPPLY_SLOTS ids, ohne doppelte).
// causeTypes = z.B. ['enrage'] aus einer Niederlage; leer = nur allgemeine Stärke
export function suggestSupplies(guild, dungeonId, causeTypes = []) {
  const knownDamageTypes = getKnownDamageTypes(guild, dungeonId);
  const scored = [];
  for (const consumable of CONSUMABLES) {
    if (consumable.use !== 'run' || !isSupplyObtainable(guild, consumable)) {
      continue;
    }
    const score = scoreSupply(consumable, knownDamageTypes, causeTypes);
    if (score > 0) {
      scored.push({ id: consumable.id, score });
    }
  }
  // Höchste Bewertung zuerst; bei Gleichstand bleibt die Reihenfolge aus consumables.js
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, SUPPLY_SLOTS).map((entry) => entry.id);
}
