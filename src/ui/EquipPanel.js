// ============================================================
// EQUIPPANEL – rechte Seite im Heldenbildschirm: die Ausrüstungsliste für EINEN Platz.
// Sie erscheint, wenn man links auf einen Ausrüstungsplatz tippt (belegt oder leer).
//   - oben: was der Held in diesem Platz gerade trägt
//   - darunter: alle passenden Items aus dem Inventar, höchstes Item-Level zuerst
//   - pro Item der Unterschied zu dem angelegten Teil, Wert für Wert (z.B. "+3 Angriff · −2 Rüstung")
// Bewusst ohne "bestes Item" und ohne Gesamtnote: Welches Teil besser passt, entscheidet der Spieler.
// ============================================================

import { SLOT_NAMES } from '../data/items.js';
import { createItemCanvas } from './PixelArt.js';
import { formatStats, describeItemKind, describeClassArmor, describeStatDifferences } from './format.js';
import { compareByItemLevel } from './InventoryOverlay.js';
import { Sound } from './Sound.js';

export class EquipPanel {
  // inventory = das InventoryOverlay (weiß, welche Items "neu" sind)
  constructor(rootElement, game, inventory) {
    this.root = rootElement;
    this.game = game;
    this.inventory = inventory;
    this.hero = null;
    this.slot = null; // gewählter Ausrüstungsplatz, null = noch keiner
  }

  // slot = gewählter Platz (bleibt beim Wechsel des Helden erhalten, so kann man Helden vergleichen)
  show(hero, slot) {
    this.hero = hero;
    this.slot = slot;
    this.render();
  }

  render() {
    if (!this.hero) {
      this.root.innerHTML = '';
      return;
    }
    if (!this.slot) {
      this.root.innerHTML = `
        <h2>Ausrüstung</h2>
        <p class="hint">Tippe links auf einen Ausrüstungsplatz, um passende Items aus dem Inventar zu sehen.</p>
        <p class="hint equip-armor-hint"></p>
      `;
      this.root.querySelector('.equip-armor-hint').textContent = describeClassArmor(this.hero.getClass()) + '. Ringe passen allen.';
      return;
    }

    const currentItem = this.hero.equipment[this.slot];
    this.root.innerHTML = `
      <h2></h2>
      <p class="hint equip-armor-hint"></p>
      <div class="equip-current"></div>
      <div class="equip-list"></div>
    `;
    this.root.querySelector('h2').textContent = SLOT_NAMES[this.slot] + ' für ' + this.hero.name;
    this.root.querySelector('.equip-armor-hint').textContent = describeClassArmor(this.hero.getClass()) + '. Ringe passen allen.';
    this.renderCurrentItem(this.root.querySelector('.equip-current'), currentItem);

    const list = this.root.querySelector('.equip-list');
    const items = this.getMatchingItems();
    for (const item of items) {
      list.appendChild(this.createItemRow(item, currentItem));
    }
    if (items.length === 0) {
      list.innerHTML = '<p class="empty">Keine passenden Items im Inventar. Öffne Kisten in der Schatzkammer!</p>';
    }
  }

  // "Angelegt: …" mit den Werten des getragenen Items, oder "Angelegt: nichts"
  renderCurrentItem(container, currentItem) {
    if (!currentItem) {
      container.innerHTML = '<span class="equip-current-label">Angelegt:</span> <span class="hint">nichts</span>';
      return;
    }
    container.innerHTML = '<span class="equip-current-label">Angelegt:</span> <b></b><div class="equip-stats"></div>';
    const name = container.querySelector('b');
    name.textContent = currentItem.name;
    name.style.color = currentItem.getRarity().color;
    container.querySelector('.equip-stats').textContent =
      describeItemKind(currentItem) + ' · Stufe ' + currentItem.itemLevel + ' · ' + formatStats(currentItem.stats);
  }

  // Alle Items für den gewählten Platz, die der Held tragen darf: höchstes Item-Level zuerst
  getMatchingItems() {
    const items = this.game.guild.inventory.filter((item) =>
      item.getSlot() === this.slot && this.hero.canEquip(item) && !this.inventory.isHidden(item.id));
    items.sort(compareByItemLevel);
    return items;
  }

  createItemRow(item, currentItem) {
    const row = document.createElement('button');
    row.className = 'equip-row';
    row.style.setProperty('--rarity', item.getRarity().color);
    row.appendChild(createItemCanvas(item, 3));
    row.insertAdjacentHTML('beforeend', `
      <span class="equip-text">
        <span class="equip-name"></span>
        <span class="equip-stats"></span>
        <span class="equip-compare"></span>
      </span>
    `);
    row.querySelector('.equip-name').textContent = item.name;
    if (this.inventory.isNew(item.id)) {
      row.querySelector('.equip-name').insertAdjacentHTML('beforeend', ' <span class="new-chip">neu</span>');
    }
    row.querySelector('.equip-stats').textContent = describeItemKind(item) + ' · Stufe ' + item.itemLevel + ' · ' + formatStats(item.stats);

    // Unterschied zum angelegten Teil, Wert für Wert (grün = mehr, rot = weniger)
    const compare = row.querySelector('.equip-compare');
    const differences = describeStatDifferences(item, currentItem);
    if (differences.length === 0) {
      compare.textContent = 'gleiche Werte wie angelegt';
    }
    for (const difference of differences) {
      const part = document.createElement('span');
      part.className = 'stat-change ' + difference.change;
      part.textContent = difference.text;
      compare.appendChild(part);
    }

    row.addEventListener('click', () => {
      if (this.game.equipItem(this.hero.id, item.id)) {
        this.inventory.markSeen(item.id);
        Sound.itemReveal(Math.min(item.getRarityRank(), 3));
      }
    });
    return row;
  }
}
