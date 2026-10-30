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
// dailyWage        = Sold pro Tag (wird jeden Abend bei "Tag beenden" bezahlt)
// ============================================================

export const HERO_RARITIES = {
  // Bei 4 Bewerbern pro Tag heißt das ungefähr: an jedem zweiten Tag ein blauer,
  // etwa jede Woche ein epischer und nur alle 50 Tage ein legendärer Bewerber.
  uncommon:  { statMultiplier: 1.0,  growthMultiplier: 1.0,  traitCount: 1, recruitChance: 80,  hireCost: 40,  dailyWage: 3 },
  rare:      { statMultiplier: 1.05, growthMultiplier: 1.15, traitCount: 1, recruitChance: 16,  hireCost: 100, dailyWage: 6 },
  epic:      { statMultiplier: 1.1,  growthMultiplier: 1.3,  traitCount: 2, recruitChance: 3.5, hireCost: 250, dailyWage: 12 },
  legendary: { statMultiplier: 1.2,  growthMultiplier: 1.5,  traitCount: 3, recruitChance: 0.5, hireCost: 600, dailyWage: 25 },
};

// Was passiert, wenn der Sold nicht bezahlt werden kann (siehe systems/HeroTaskSystem.js, payWages)
export const WAGE_RULES = {
  // Wer seinen Sold nicht bekommt, ist unzufrieden und macht weniger Schaden (Wirkungen wie bei den Anweisungen).
  // Niemand verlässt deshalb die Gilde (entschieden 2026-10-30: Gold soll nebensächlich sein).
  unhappyEffects: { damageDone: -0.2 },
};

export function getHeroRarity(rarityId) {
  const heroRarity = HERO_RARITIES[rarityId];
  if (!heroRarity) {
    throw new Error('Unbekannte Helden-Seltenheit: ' + rarityId);
  }
  return heroRarity;
}
