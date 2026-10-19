// ============================================================
// INVENTORYPANEL – zeigt alle Items der Gilde als Raster.
// Klick auf ein Item zeigt Details und einen Verkaufen-Knopf.
// ============================================================

import { getRarity } from '../data/rarities.js';
import { STAT_NAMES, SLOT_NAMES } from '../data/items.js';
import { createItemCanvas } from './PixelArt.js';
import { Sound } from './Sound.js';
import { showToast } from './Toast.js';

export class InventoryPanel {
  constructor(rootElement, game) {
    this.root = rootElement;
    this.game = game;
    this.selectedItemId = null;
    this.hiddenItemIds = new Set(); // Items, die gerade noch in der Kiste "stecken"
    this.newItemIds = new Set();    // frisch gefundene Items bekommen einen Punkt

    this.root.innerHTML = `
      <h2>Inventar <span class="inventory-count"></span></h2>
      <div class="inventory-grid"></div>
      <div class="item-details"></div>
      <button class="sell-junk-button"></button>
    `;

    this.root.querySelector('.sell-junk-button').addEventListener('click', () => {
      const gold = this.game.sellAllOfRarity('poor');
      if (gold > 0) {
        Sound.coin();
        showToast('Schrott verkauft: +' + gold + ' Gold');
      }
    });

    game.on('changed', () => this.render());
    this.render();
  }

  // Items verstecken, bis sie in der Kiste aufgedeckt wurden
  hideItems(items) {
    for (const item of items) {
      this.hiddenItemIds.add(item.id);
    }
    this.render();
  }

  revealItem(item) {
    this.hiddenItemIds.delete(item.id);
    this.newItemIds.add(item.id);
    this.render();
  }

  // Beste Items zuerst: nach Seltenheit, dann nach Stärke
  getSortedItems() {
    const visible = this.game.guild.inventory.filter((item) => !this.hiddenItemIds.has(item.id));
    visible.sort((a, b) => {
      if (b.getRarityRank() !== a.getRarityRank()) {
        return b.getRarityRank() - a.getRarityRank();
      }
      return b.getPower() - a.getPower();
    });
    return visible;
  }

  render() {
    const items = this.getSortedItems();
    this.root.querySelector('.inventory-count').textContent = '(' + items.length + ')';

    const grid = this.root.querySelector('.inventory-grid');
    grid.innerHTML = '';
    for (const item of items) {
      grid.appendChild(this.createSlot(item));
    }
    if (items.length === 0) {
      grid.innerHTML = '<p class="empty">Noch leer. Öffne eine Kiste!</p>';
    }

    this.renderDetails();
    this.renderSellJunkButton(items);
  }

  createSlot(item) {
    const slot = document.createElement('button');
    slot.className = 'inventory-slot rarity-' + item.rarityId;
    slot.style.setProperty('--rarity', item.getRarity().color);
    slot.title = item.name;
    slot.appendChild(createItemCanvas(item, 3));

    if (this.newItemIds.has(item.id)) {
      const dot = document.createElement('span');
      dot.className = 'new-dot';
      slot.appendChild(dot);
    }
    if (item.id === this.selectedItemId) {
      slot.classList.add('selected');
    }

    slot.addEventListener('click', () => {
      Sound.click();
      this.selectedItemId = item.id;
      this.newItemIds.delete(item.id);
      this.render();
    });
    return slot;
  }

  renderDetails() {
    const details = this.root.querySelector('.item-details');
    const item = this.game.guild.findItem(this.selectedItemId);

    if (!item || this.hiddenItemIds.has(item.id)) {
      details.innerHTML = '<p class="hint">Klicke ein Item an.</p>';
      return;
    }

    const rarity = item.getRarity();
    details.innerHTML = `
      <div class="detail-name" style="color: ${rarity.color}"></div>
      <div class="detail-sub">${rarity.name} · ${SLOT_NAMES[item.getSlot()]}</div>
      <ul class="detail-stats"></ul>
      <div class="detail-power">Stärke: ${item.getPower()}</div>
      <button class="sell-button">Verkaufen (${item.getSellValue()} Gold)</button>
    `;
    details.querySelector('.detail-name').textContent = item.name;

    const statList = details.querySelector('.detail-stats');
    for (const statName in item.stats) {
      const line = document.createElement('li');
      line.textContent = '+' + item.stats[statName] + ' ' + STAT_NAMES[statName];
      statList.appendChild(line);
    }

    details.querySelector('.sell-button').addEventListener('click', () => {
      const gold = this.game.sellItem(item.id);
      Sound.coin();
      showToast(item.name + ' verkauft: +' + gold + ' Gold', rarity.color);
      this.selectedItemId = null;
      this.render();
    });
  }

  renderSellJunkButton(items) {
    const button = this.root.querySelector('.sell-junk-button');
    const junk = items.filter((item) => item.rarityId === 'poor');
    const goldValue = junk.length * getRarity('poor').sellValue;
    button.textContent = 'Schrott verkaufen (' + junk.length + ' = ' + goldValue + ' Gold)';
    button.disabled = junk.length === 0;
  }
}
