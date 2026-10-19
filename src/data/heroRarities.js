// ============================================================
// HELDEN-SELTENHEIT
// Helden gibt es von Ungewöhnlich (grün) bis Legendär (orange).
// Farben und Namen kommen aus rarities.js.
//
// statMultiplier   = Faktor auf die Grundwerte (1.2 = 20 % stärker)
// growthMultiplier = Faktor auf das Wachstum pro Level
// traitCount       = wie viele Eigenschaften der Held hat
// recruitChance    = Prozent-Chance, dass ein Bewerber diese Seltenheit hat (zusammen 100)
// hireCost         = Gold zum Anheuern
// ============================================================

export const HERO_RARITIES = {
  uncommon:  { statMultiplier: 1.0,  growthMultiplier: 1.0,  traitCount: 1, recruitChance: 62, hireCost: 40 },
  rare:      { statMultiplier: 1.05, growthMultiplier: 1.15, traitCount: 1, recruitChance: 27, hireCost: 100 },
  epic:      { statMultiplier: 1.1,  growthMultiplier: 1.3,  traitCount: 2, recruitChance: 9,  hireCost: 250 },
  legendary: { statMultiplier: 1.2,  growthMultiplier: 1.5,  traitCount: 3, recruitChance: 2,  hireCost: 600 },
};

export function getHeroRarity(rarityId) {
  const heroRarity = HERO_RARITIES[rarityId];
  if (!heroRarity) {
    throw new Error('Unbekannte Helden-Seltenheit: ' + rarityId);
  }
  return heroRarity;
}
