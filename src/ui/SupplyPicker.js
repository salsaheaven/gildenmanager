// ============================================================
// SUPPLYPICKER – die Vorrats-Plätze einer Gruppe (Auswahllisten), darunter die Wirkung der gewählten Waren
// Benutzt im Dungeon-Bildschirm (beim Einplanen) und im Tagesplan (für schon geplante Gruppen).
// Zur Auswahl stehen nur Waren, die in der Vorratskammer liegen (bzw. die diese Gruppe schon mitnimmt).
// ============================================================

import { CONSUMABLES, SUPPLY_SLOTS } from '../data/consumables.js';

// guild    = die Gilde (Vorratskammer)
// chosen   = aktuell gewählte Waren (Liste von ids)
// reserved = Waren, die diese Gruppe schon aus der Kammer genommen hat (geplante Gruppe), sonst []
// onChange = Funktion(neueListe), wird bei jeder Änderung aufgerufen
export function createSupplyPicker(guild, chosen, reserved, onChange) {
  const element = document.createElement('div');
  element.className = 'supply-picker';

  const runSupplies = CONSUMABLES.filter((consumable) => consumable.use === 'run');
  // Wie viele Stück dieser Ware kann die Gruppe insgesamt nehmen?
  const available = (consumableId) =>
    guild.countSupply(consumableId) + reserved.filter((id) => id === consumableId).length;

  const slots = document.createElement('div');
  slots.className = 'supply-slots';
  for (let slot = 0; slot < SUPPLY_SLOTS; slot++) {
    const select = document.createElement('select');
    const empty = document.createElement('option');
    empty.value = '';
    empty.textContent = '– leer –';
    select.appendChild(empty);

    // In den anderen Plätzen gewählt (zählt gegen den Bestand)
    const others = chosen.filter((id, index) => index !== slot);
    for (const consumable of runSupplies) {
      const free = available(consumable.id) - others.filter((id) => id === consumable.id).length;
      if (free <= 0 && chosen[slot] !== consumable.id) {
        continue;
      }
      const option = document.createElement('option');
      option.value = consumable.id;
      option.textContent = consumable.icon + ' ' + consumable.name + ' (' + free + ')';
      select.appendChild(option);
    }
    select.value = chosen[slot] || '';
    select.addEventListener('change', () => {
      const next = [];
      for (let index = 0; index < SUPPLY_SLOTS; index++) {
        const value = index === slot ? select.value : chosen[index];
        if (value) {
          next.push(value);
        }
      }
      onChange(next);
    });
    slots.appendChild(select);
  }
  element.appendChild(slots);

  // Wirkung der gewählten Waren, oder ein Hinweis, wenn die Vorratskammer leer ist
  const effects = document.createElement('div');
  effects.className = 'supply-effects';
  for (const consumableId of chosen) {
    const consumable = CONSUMABLES.find((entry) => entry.id === consumableId);
    const line = document.createElement('div');
    line.style.color = consumable.color;
    line.textContent = consumable.icon + ' ' + consumable.description;
    effects.appendChild(line);
  }
  if (chosen.length === 0) {
    const hasAny = runSupplies.some((consumable) => available(consumable.id) > 0);
    effects.textContent = hasAny ? 'Keine Vorräte gewählt.' : 'Die Vorratskammer ist leer. Tränke gibt es beim Händler in der Schatzkammer.';
    effects.classList.add('hint');
  }
  element.appendChild(effects);
  return element;
}

// Kurze Liste der Waren für Texte, z.B. "❤ Heiltränke, ✦ Manatränke" (leer: "")
export function describeSupplies(supplyIds) {
  return supplyIds.map((id) => {
    const consumable = CONSUMABLES.find((entry) => entry.id === id);
    return consumable.icon + ' ' + consumable.name;
  }).join(', ');
}
