// ============================================================
// ALCHEMYSYSTEM – Brauen im Alchemielabor der Gildenhalle
// Aus Kräutern (und etwas Staub oder Kristallen) wird eine Ware für die Vorratskammer.
// Welche Rezepte gehen, hängt von der Stufe des Labors ab (brewTier), höhere Stufen sparen Kräuter (brewCostFactor).
// Die Rezepte stehen in data/alchemy.js.
// ============================================================

import { BREW_RECIPES, getBrewRecipe } from '../data/alchemy.js';

// Welche Rezepte kann das Labor gerade brauen? (ohne Labor: keine)
export function getAvailableRecipes(guild) {
  const tier = guild.hall.getEffect('brewTier', 0);
  return BREW_RECIPES.filter((recipe) => recipe.tier <= tier);
}

// Was kostet ein Rezept? Das Labor macht nur die Kräuter billiger (gerundet, mindestens 1).
export function getBrewCost(guild, recipeId) {
  const recipe = getBrewRecipe(recipeId);
  const factor = guild.hall.getEffect('brewCostFactor', 1);
  const cost = { ...recipe.cost };
  cost.herbs = Math.max(1, Math.round(recipe.cost.herbs * factor));
  return cost;
}

// Kann gebraut werden? Gibt 'ok' oder einen Grund zurück: 'noLab' (Labor fehlt oder Stufe zu niedrig), 'notEnough'
export function checkBrew(guild, recipeId) {
  const recipe = getBrewRecipe(recipeId);
  if (guild.hall.getEffect('brewTier', 0) < recipe.tier) {
    return 'noLab';
  }
  if (!guild.hasMaterials(getBrewCost(guild, recipeId))) {
    return 'notEnough';
  }
  return 'ok';
}

// Braut einmal und legt die Ware in die Vorratskammer. Gibt 'ok' oder den Grund aus checkBrew zurück.
export function brew(guild, recipeId) {
  const check = checkBrew(guild, recipeId);
  if (check !== 'ok') {
    return check;
  }
  guild.spendMaterials(getBrewCost(guild, recipeId));
  guild.addSupply(getBrewRecipe(recipeId).consumableId);
  return 'ok';
}
