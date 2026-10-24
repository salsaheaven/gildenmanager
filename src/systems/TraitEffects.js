// ============================================================
// TRAITEFFECTS – Eigenschaften, die nach einem Run wirken (nicht im Kampf)
//   "Gierig":     mehr Gold aus dem Run
//   "Glückspilz": ein zusätzliches Item in der Boss-Kiste
// Die Werte stehen in data/traits.js. Es zählt der beste Held der Gruppe,
// mehrere gleiche Eigenschaften stapeln sich nicht.
// ============================================================

// Gold-Bonus der Gruppe als Anteil (0.2 = +20 %), und wer ihn bringt
// Ergebnis: { bonus, heroName } (heroName = null, wenn niemand einen Bonus hat)
export function getGroupGoldBonus(heroes) {
  return getBestTraitValue(heroes, 'goldBonus');
}

// Zusätzliche Items für die Boss-Kiste, und wer sie bringt: { bonus, heroName }
export function getGroupExtraChestItems(heroes) {
  return getBestTraitValue(heroes, 'extraChestItems');
}

// Sucht unter allen Eigenschaften aller Helden den höchsten Wert für ein Feld (z.B. 'goldBonus')
function getBestTraitValue(heroes, fieldName) {
  let best = { bonus: 0, heroName: null };
  for (const hero of heroes) {
    for (const trait of hero.getTraits()) {
      const value = trait[fieldName] || 0;
      if (value > best.bonus) {
        best = { bonus: value, heroName: hero.name };
      }
    }
  }
  return best;
}
