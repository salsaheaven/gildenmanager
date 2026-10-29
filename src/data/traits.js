// ============================================================
// EIGENSCHAFTEN
// Jeder Held bekommt zufällige Eigenschaften (wie viele, hängt von seiner Seltenheit ab).
//
// statBonus       = Prozent-Änderung der Werte: 0.1 = +10 %, -0.1 = −10 %
// goldBonus       = mehr Gold aus dem Run (0.2 = +20 %), wenn der Held mitkämpft
// extraChestItems = so viele Items mehr in der Boss-Kiste, wenn der Held mitkämpft
// goldBonus und extraChestItems stapeln sich nicht: Zwei Gierige bringen nicht mehr als einer.
// ============================================================

export const TRAITS = [
  { id: 'brave',    name: 'Mutig',        description: '+10 % Angriff',               statBonus: { attack: 0.1 } },
  { id: 'tough',    name: 'Zäh',          description: '+15 % Leben',                 statBonus: { health: 0.15 } },
  { id: 'wise',     name: 'Weise',        description: '+15 % Mana',                  statBonus: { mana: 0.15 } },
  { id: 'gifted',   name: 'Begabt',       description: '+10 % Magie',                 statBonus: { magic: 0.1 } },
  { id: 'sturdy',   name: 'Standfest',    description: '+10 % Rüstung',               statBonus: { defense: 0.1 } },
  { id: 'hothead',  name: 'Hitzkopf',     description: '+20 % Angriff, −10 % Rüstung', statBonus: { attack: 0.2, defense: -0.1 } },
  { id: 'fragile',  name: 'Zerbrechlich', description: '+15 % Magie, −10 % Leben',    statBonus: { magic: 0.15, health: -0.1 } },
  { id: 'greedy',   name: 'Gierig',       description: '+20 % Gold aus dem Dungeon, wenn er mitkämpft, und aus Aufträgen', statBonus: {}, goldBonus: 0.2 },
  { id: 'lucky',    name: 'Glückspilz',   description: '+1 Item in der Boss-Kiste, wenn er mitkämpft',  statBonus: {}, extraChestItems: 1 },
];

export function getTrait(traitId) {
  for (const trait of TRAITS) {
    if (trait.id === traitId) {
      return trait;
    }
  }
  throw new Error('Unbekannte Eigenschaft: ' + traitId);
}
