// ============================================================
// TRAITCHIP – kleines Kästchen, das eine Eigenschaft eines Helden zeigt.
// Beim Drüberfahren mit der Maus erscheint die Beschreibung.
// ============================================================

export function createTraitChip(trait) {
  const chip = document.createElement('span');
  chip.className = 'trait-chip';
  chip.textContent = trait.name;
  chip.title = trait.description;
  return chip;
}
