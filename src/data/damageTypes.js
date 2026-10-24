// ============================================================
// SCHADENSARTEN – jeder Angriff hat eine (siehe KONZEPT.md, "Schadensarten und Resistenzen")
//
// name  = Anzeige, z.B. im Kampfbericht "(Säure)"
// color = Farbe der Schadenszahlen in der Kampfszene
// Rüstung mindert jeden Schaden. Resistenzen (später auf Beute) mindern zusätzlich
// den Schaden einer Art, höchstens um maxResistance Prozent.
// Körperlicher Schaden ist der Normalfall und hat keine Resistenz.
// ============================================================

export const DAMAGE_TYPES = {
  physical: { name: 'Körperlich', color: '#ffffff' },
  shadow:   { name: 'Schatten',   color: '#c08cff' },
  light:    { name: 'Licht',      color: '#fff3b0' },
  fire:     { name: 'Feuer',      color: '#ff8a3a' },
  ice:      { name: 'Eis',        color: '#8fd8ff' },
  acid:     { name: 'Säure',      color: '#9cff3a' },
  water:    { name: 'Wasser',     color: '#4a8cff' },
};

// Höchste Resistenz pro Held und Schadensart, in Prozent
export const MAX_RESISTANCE = 50;

// Gegen diese Schadensarten gibt es Resistenzen auf Beute (alles außer körperlich)
export const RESISTANCE_TYPES = Object.keys(DAMAGE_TYPES).filter((damageTypeId) => damageTypeId !== 'physical');

export function getDamageType(damageTypeId) {
  const damageType = DAMAGE_TYPES[damageTypeId];
  if (!damageType) {
    throw new Error('Unbekannte Schadensart: ' + damageTypeId);
  }
  return damageType;
}
