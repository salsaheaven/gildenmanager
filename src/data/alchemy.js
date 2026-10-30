// ============================================================
// ALCHEMIE – Brau-Rezepte im Alchemielabor
// Kräuter (von der Aufgabe "Kräuter sammeln") werden zu Waren für die Vorratskammer gebraut.
// Die Logik steht in systems/AlchemySystem.js.
//
// id         = interner Name des Rezepts
// consumableId = welche Ware herauskommt (siehe data/consumables.js)
// tier       = welche Stufe des Alchemielabors nötig ist (brewTier in data/buildings.js)
// cost       = Material pro Brauen { herbs, dust, crystal } (das Labor macht Kräuter billiger: brewCostFactor)
//
// Brauen kostet kein Gold. Zahlen grob gesetzt, gebalanced wird am Ende.
// ============================================================

export const BREW_RECIPES = [
  // Stufe 1: Grundware
  { id: 'brewHealing', consumableId: 'healingPotions', tier: 1, cost: { herbs: 4 } },
  { id: 'brewMana', consumableId: 'manaPotions', tier: 1, cost: { herbs: 4 } },
  { id: 'brewBandages', consumableId: 'bandages', tier: 1, cost: { herbs: 3 } },
  // Stufe 2: Schutztränke gegen eine Schadensart
  { id: 'brewShadowWard', consumableId: 'shadowWard', tier: 2, cost: { herbs: 5, dust: 2 } },
  { id: 'brewAcidWard', consumableId: 'acidWard', tier: 2, cost: { herbs: 5, dust: 2 } },
  { id: 'brewFrostWard', consumableId: 'frostWard', tier: 2, cost: { herbs: 5, dust: 2 } },
  { id: 'brewFireWard', consumableId: 'fireWard', tier: 2, cost: { herbs: 5, dust: 2 } },
  { id: 'brewLightWard', consumableId: 'lightWard', tier: 2, cost: { herbs: 5, dust: 2 } },
  // Stufe 3: starke Elixiere
  { id: 'brewFury', consumableId: 'furyElixir', tier: 3, cost: { herbs: 7, crystal: 1 } },
  { id: 'brewStoneskin', consumableId: 'stoneskin', tier: 3, cost: { herbs: 7, crystal: 1 } },
];

export function getBrewRecipe(recipeId) {
  const recipe = BREW_RECIPES.find((entry) => entry.id === recipeId);
  if (!recipe) {
    throw new Error('Unbekanntes Rezept: ' + recipeId);
  }
  return recipe;
}
