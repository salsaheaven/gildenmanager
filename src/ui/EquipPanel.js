// ============================================================
// EQUIPPANEL – rechte Seite im Heldenbildschirm:
// alle Items aus dem Inventar, die der gewählte Held tragen kann,
// mit Vergleich zum aktuell getragenen Item (grün = besser).
// ============================================================

import { SLOT_NAMES } from '../data/items.js';
import { EQUIPMENT_SLOTS } from '../entities/Hero.js';
import { createItemCanvas } from './PixelArt.js';
import { formatStats, formatDifference } from './format.js';
import { Sound } from './Sound.js';
import { showToast } from './Toast.js';

export class EquipPanel {
  constructor(rootElement, game) {
    this.root = rootElement;
    this.game = game;
    this.hero = null;
    this.slotFilter = null; // null = alle Plätze anzeigen

    this.root.innerHTML = `
      <h2>Ausrüstung anlegen</h2>
      <button class="big-button equip-best-button">Bestes anlegen</button>
      <div class="slot-filters"></div>
      <div class="equip-list"></div>
    `;

    this.root.querySelector('.equip-best-button').addEventListener('click', () => {
      if (!this.hero) {
        return;
      }
      const count = this.game.equipBestItems(this.hero.id);
      if (count > 0) {
        Sound.itemReveal(2);
        showToast(this.hero.name + ': ' + count + ' Teile angelegt!', '#1eff00');
      }
    });

    this.renderFilters();
  }

  showHero(hero) {
    this.hero = hero;
    this.render();
  }

  setSlotFilter(slot) {
    this.slotFilter = this.slotFilter === slot ? null : slot;
    this.renderFilters();
    this.render();
  }

  renderFilters() {
    const container = this.root.querySelector('.slot-filters');
    container.innerHTML = '';
    const options = [null, ...EQUIPMENT_SLOTS];
    for (const slot of options) {
      const button = document.createElement('button');
      button.className = 'filter-button';
      button.textContent = slot === null ? 'Alle' : SLOT_NAMES[slot];
      button.classList.toggle('active', slot === this.slotFilter);
      button.addEventListener('click', () => {
        Sound.click();
        this.slotFilter = slot;
        this.renderFilters();
        this.render();
      });
      container.appendChild(button);
    }
  }

  // Passende Items, die größten Verbesserungen zuerst
  getMatchingItems() {
    const items = this.game.guild.inventory.filter((item) => {
      if (!this.hero.canEquip(item)) {
        return false;
      }
      return this.slotFilter === null || item.getSlot() === this.slotFilter;
    });
    items.sort((a, b) => this.hero.getUpgradeValue(b) - this.hero.getUpgradeValue(a));
    return items;
  }

  render() {
    const list = this.root.querySelector('.equip-list');
    const bestButton = this.root.querySelector('.equip-best-button');
    list.innerHTML = '';

    if (!this.hero) {
      bestButton.disabled = true;
      return;
    }

    // Wer im Dungeon ist, hat seine Ausrüstung dabei und kann sie nicht wechseln
    if (this.game.guild.isHeroBusy(this.hero.id)) {
      bestButton.disabled = true;
      list.innerHTML = '<p class="empty">' + this.hero.name + ' ist gerade in einem Dungeon unterwegs.</p>';
      return;
    }

    const items = this.getMatchingItems();
    bestButton.disabled = !items.some((item) => this.hero.getUpgradeValue(item) > 0);

    for (const item of items) {
      list.appendChild(this.createItemRow(item));
    }
    if (items.length === 0) {
      list.innerHTML = '<p class="empty">Keine passenden Items. Öffne Kisten in der Schatzkammer!</p>';
    }
  }

  createItemRow(item) {
    const rarity = item.getRarity();
    const difference = this.hero.getUpgradeValue(item);

    const row = document.createElement('button');
    row.className = 'equip-row';
    row.style.setProperty('--rarity', rarity.color);
    row.appendChild(createItemCanvas(item, 3));
    row.insertAdjacentHTML('beforeend', `
      <span class="equip-text">
        <span class="equip-name"></span>
        <span class="equip-stats"></span>
      </span>
      <span class="equip-diff"></span>
    `);
    row.querySelector('.equip-name').textContent = item.name;
    row.querySelector('.equip-stats').textContent = SLOT_NAMES[item.getSlot()] + ' · ' + formatStats(item.stats);

    const diffElement = row.querySelector('.equip-diff');
    diffElement.textContent = formatDifference(difference);
    if (difference > 0) {
      diffElement.classList.add('better');
    } else if (difference < 0) {
      diffElement.classList.add('worse');
    }

    row.addEventListener('click', () => {
      if (this.game.equipItem(this.hero.id, item.id)) {
        Sound.itemReveal(Math.min(item.getRarityRank(), 3));
      }
    });
    return row;
  }
}
