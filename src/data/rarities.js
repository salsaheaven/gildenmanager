// ============================================================
// SELTENHEITEN
// Hier steht alles über die Seltenheitsstufen der Items.
// Die Reihenfolge ist wichtig: von schlecht (oben) nach gut (unten).
//
// id             = interner Name (nicht ändern, wird im Spielstand gespeichert)
// name           = Anzeigename im Spiel
// color          = Farbe der Schrift und des Rahmens
// statMultiplier = Faktor für die Werte (1.0 = normal, 2.0 = doppelt so stark)
// sellValue      = Gold beim Verkaufen
// ============================================================

export const RARITIES = [
  { id: 'poor',      name: 'Schrott',      color: '#9d9d9d', statMultiplier: 0.6, sellValue: 1 },
  { id: 'common',    name: 'Gewöhnlich',   color: '#ffffff', statMultiplier: 1.0, sellValue: 3 },
  { id: 'uncommon',  name: 'Ungewöhnlich', color: '#1eff00', statMultiplier: 1.3, sellValue: 8 },
  { id: 'rare',      name: 'Selten',       color: '#0070dd', statMultiplier: 1.7, sellValue: 20 },
  { id: 'epic',      name: 'Episch',       color: '#a335ee', statMultiplier: 2.3, sellValue: 60 },
  { id: 'legendary', name: 'Legendär',     color: '#ff8000', statMultiplier: 3.2, sellValue: 200 },
];

// Hilfsfunktion: Seltenheit anhand der id finden, z.B. getRarity('epic')
export function getRarity(rarityId) {
  for (const rarity of RARITIES) {
    if (rarity.id === rarityId) {
      return rarity;
    }
  }
  throw new Error('Unbekannte Seltenheit: ' + rarityId);
}

// Hilfsfunktion: Position in der Liste (0 = Schrott, 5 = Legendär).
// Damit kann man Seltenheiten vergleichen: höher = besser.
export function getRarityRank(rarityId) {
  for (let i = 0; i < RARITIES.length; i++) {
    if (RARITIES[i].id === rarityId) {
      return i;
    }
  }
  throw new Error('Unbekannte Seltenheit: ' + rarityId);
}
