// ============================================================
// TAKTIKEN – wählt der Spieler vor dem Kampf
//
// healThreshold        = Heiler heilen, wenn jemand unter diesen Anteil Leben fällt
// damageMultiplier     = Faktor auf den Schaden der Gruppe
// selfDefenseThreshold = der Tank benutzt seine Verteidigung, wenn er unter diesen Anteil fällt
// ============================================================

export const TACTICS = [
  {
    id: 'cautious',
    name: 'Vorsichtig',
    description: 'Früh heilen, weniger Schaden. Sicherer, aber langsamer.',
    healThreshold: 0.75,
    damageMultiplier: 0.9,
    selfDefenseThreshold: 0.6,
  },
  {
    id: 'balanced',
    name: 'Ausgewogen',
    description: 'Der goldene Mittelweg.',
    healThreshold: 0.6,
    damageMultiplier: 1.0,
    selfDefenseThreshold: 0.45,
  },
  {
    id: 'aggressive',
    name: 'Aggressiv',
    description: 'Voller Angriff, spät heilen. Schneller, aber riskant.',
    healThreshold: 0.45,
    damageMultiplier: 1.12,
    selfDefenseThreshold: 0.3,
  },
];

export function getTactic(tacticId) {
  for (const tactic of TACTICS) {
    if (tactic.id === tacticId) {
      return tactic;
    }
  }
  throw new Error('Unbekannte Taktik: ' + tacticId);
}
