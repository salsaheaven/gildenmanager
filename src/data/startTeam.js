// ============================================================
// STARTTRUPPE – mit welchen Helden eine neue Gilde beginnt
// Jede neue Gilde startet mit derselben Truppe (entschieden 2026-11-03, vorher frei wählbar):
// Krieger (Tank, Platte), Priester (Heiler, Stoff), Runenwirker (Heiler mit Schilden, Stoff), Magier (Fernkampf, Stoff),
// Schurke (Nahkampf, Leder). Sie schafft die Bärenhöhle auch ohne Ausrüstung meist (Verletzte möglich),
// deckt die frühen Konter ab (Unterbrechen, Fluch lösen, Schilde) und hat alle Rüstungsarten,
// damit jede Beute jemandem passt. Ein Test prüft beides.
// ============================================================

export const START_TEAM_CLASSES = ['warrior', 'priest', 'runeweaver', 'mage', 'rogue'];

export const START_TEAM_RULES = {
  // Diese Rüstungsarten müssen in der Starttruppe vorkommen (prüft ein Test)
  requiredArmorTypes: ['plate', 'leather', 'cloth'],
  // Seltenheit der Start-Helden (siehe heroRarities.js)
  rarityId: 'uncommon',
  // Name, wenn der Spieler keinen eingibt, und die längste erlaubte Länge
  defaultGuildName: 'Die Unbesiegbaren',
  maxGuildNameLength: 24,
};
