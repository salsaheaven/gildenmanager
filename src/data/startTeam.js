// ============================================================
// STARTTRUPPE – mit welchen Helden eine neue Gilde beginnt
// Beim Start ("Neu") wählt der Spieler für jeden Platz eine Klasse (Startbildschirm "Gründe deine Gilde").
// Die Regeln prüft systems/StartTeam.js.
// ============================================================

// Die 5 Plätze der Starttruppe: Jeder Platz verlangt eine Rolle (siehe role in heroClasses.js)
export const START_TEAM_SLOTS = [
  { role: 'tank', name: 'Tank' },
  { role: 'damage', name: 'Schadensmacher' },
  { role: 'damage', name: 'Schadensmacher' },
  { role: 'support', name: 'Unterstützer' },
  { role: 'healer', name: 'Heiler' },
];

export const START_TEAM_RULES = {
  // Diese Rüstungsarten müssen in der Starttruppe vorkommen (damit jede Beute jemandem passt)
  requiredArmorTypes: ['plate', 'leather', 'cloth'],
  // Seltenheit der Start-Helden (siehe heroRarities.js)
  rarityId: 'uncommon',
  // Name, wenn der Spieler keinen eingibt, und die längste erlaubte Länge
  defaultGuildName: 'Die Unbesiegbaren',
  maxGuildNameLength: 24,
};
