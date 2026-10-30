// ============================================================
// NEWGEAR – "Neue Ausrüstung verfügbar": Welche Plätze eines Helden sollen markiert sein?
// Ein Platz ist markiert, wenn im Inventar ein Item liegt, das der Held dort tragen kann
// und das der Spieler in der Liste dieses Platzes noch nicht gesehen hat.
// Öffnet der Spieler die Liste, gilt alles darin als gesehen (markSlotSeen).
// Die Markierung sagt nichts darüber, ob das Item besser ist: Das entscheidet der Spieler.
// Gemerkt wird das pro Held in hero.seenItemIds.
// ============================================================

import { EQUIPMENT_SLOTS } from '../entities/Hero.js';

// Alle Items im Inventar, die der Held in diesem Platz tragen kann
export function getMatchingItems(guild, hero, slot) {
  return guild.inventory.filter((item) => item.getSlot() === slot && hero.canEquip(item));
}

// Die passenden Items, die in der Liste dieses Platzes noch nicht gesehen wurden
export function getNewItemsForSlot(guild, hero, slot) {
  const seen = hero.seenItemIds[slot] || [];
  return getMatchingItems(guild, hero, slot).filter((item) => !seen.includes(item.id));
}

// Plätze mit neuer Ausrüstung, z.B. ['head', 'ring'] (leer = nichts Neues)
export function getSlotsWithNewGear(guild, hero) {
  return EQUIPMENT_SLOTS.filter((slot) => getNewItemsForSlot(guild, hero, slot).length > 0);
}

// Der Spieler hat die Liste dieses Platzes gesehen: Alles, was jetzt passt, ist nicht mehr neu.
// (Ersetzt die alte Liste, so bleiben keine ids von verkauften oder zerlegten Items übrig.)
export function markSlotSeen(guild, hero, slot) {
  hero.seenItemIds[slot] = getMatchingItems(guild, hero, slot).map((item) => item.id);
}

// Ein einzelnes Item gilt für diesen Helden als gesehen (z.B. das Teil, das er gerade abgelegt hat)
export function markItemSeen(hero, slot, itemId) {
  if (!hero.seenItemIds[slot]) {
    hero.seenItemIds[slot] = [];
  }
  if (!hero.seenItemIds[slot].includes(itemId)) {
    hero.seenItemIds[slot].push(itemId);
  }
}
