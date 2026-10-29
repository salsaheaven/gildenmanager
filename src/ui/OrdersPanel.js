// ============================================================
// ORDERSPANEL – Anweisungen für Helden einstellen (Auswahllisten)
// Wird im Kampf-Labor, im Tagesplan (für die ganze Gruppe) und im Heldenbildschirm (für einen Helden) benutzt.
// Unter jeder Auswahl stehen Vorteil (grün) und Nachteil (rot) der gewählten Option.
// ============================================================

import { getOrdersForClass } from '../data/heroOrders.js';
import { createHeroCanvas } from './PixelArt.js';

// heroes   = Liste der Helden
// onChange = Funktion(hero, orderId, optionId), wird bei jeder Änderung aufgerufen
// showHeroNames = false, wenn nur ein einzelner Held gezeigt wird (Heldenbildschirm)
export function renderOrders(container, heroes, onChange, showHeroNames = true) {
  container.innerHTML = '';

  for (const hero of heroes) {
    const orders = getOrdersForClass(hero.classId);
    if (orders.length === 0) {
      continue;
    }

    const block = document.createElement('div');
    block.className = 'orders-block';

    if (showHeroNames) {
      const header = document.createElement('div');
      header.className = 'orders-hero';
      header.appendChild(createHeroCanvas(hero, 2));
      header.insertAdjacentHTML('beforeend', '<span></span>');
      header.querySelector('span').textContent = hero.name;
      block.appendChild(header);
    }

    for (const order of orders) {
      const row = document.createElement('label');
      row.className = 'order-row';
      row.innerHTML = '<span class="order-name"></span><select></select>';
      row.querySelector('.order-name').textContent = order.name;

      const select = row.querySelector('select');
      const chosen = hero.getChosenOption(order);
      for (const option of order.options) {
        const element = document.createElement('option');
        element.value = option.id;
        element.textContent = option.label;
        element.selected = option.id === chosen.id;
        select.appendChild(element);
      }
      select.addEventListener('change', () => onChange(hero, order.id, select.value));
      block.appendChild(row);
      block.appendChild(createEffectsLine(chosen));
    }
    container.appendChild(block);
  }
}

// Zeile unter der Auswahl: "+ Vorteil" in Grün und "− Nachteil" in Rot
function createEffectsLine(option) {
  const line = document.createElement('div');
  line.className = 'order-effects';
  if (!option.pro && !option.contra) {
    line.textContent = 'keine Vor- und Nachteile';
    return line;
  }
  const pro = document.createElement('span');
  pro.className = 'stat-change up';
  pro.textContent = '+ ' + option.pro;
  const contra = document.createElement('span');
  contra.className = 'stat-change down';
  contra.textContent = '− ' + option.contra;
  line.append(pro, contra);
  return line;
}
