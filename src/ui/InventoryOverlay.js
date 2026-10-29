// ============================================================
// INVENTORYOVERLAY – das Inventar als Vollbild-Fenster
// Wird über den Knopf "Inventar" in der Reiterleiste geöffnet, von jedem Bildschirm aus.
// Oben: Kategorien (Alle, Waffe, Nebenhand, Kopf …). Darunter alle Items als Raster.
// Klick auf ein Item zeigt Details und einen Verkaufen-Knopf.
// Schließen mit dem X oder der Escape-Taste.
// ============================================================

import { getRarity } from '../data/rarities.js';
import { STAT_NAMES, SLOT_NAMES } from '../data/items.js';
import { DAMAGE_TYPES } from '../data/damageTypes.js';
import { EQUIPMENT_SLOTS } from '../entities/Hero.js';
import { createItemCanvas } from './PixelArt.js';
import { describeItemKind, describeSuitableClasses } from './format.js';
import { Sound } from './Sound.js';
import { showToast } from './Toast.js';

export class InventoryOverlay {
  // onNewItemsChanged = Funktion, die bei neuen/gesehenen Items aufgerufen wird
  // (bekommt die Anzahl neuer Items, z.B. für das Abzeichen am Inventar-Knopf)
  constructor(game, onNewItemsChanged) {
    this.game = game;
    this.onNewItemsChanged = onNewItemsChanged;
    this.isOpen = false;
    this.category = null;           // null = alle Kategorien, sonst ein Ausrüstungsplatz wie 'weapon'
    this.selectedItemId = null;
    this.hiddenItemIds = new Set(); // Items, die gerade noch in der Kiste "stecken"
    this.newItemIds = new Set();    // frisch gefundene Items bekommen einen Punkt

    this.root = document.createElement('div');
    this.root.className = 'inventory-overlay';
    this.root.hidden = true;
    this.root.innerHTML = `
      <div class="inventory-header">
        <h2>Inventar <span class="inventory-count"></span></h2>
        <button class="close-button" title="Schließen (Esc)">✕</button>
      </div>
      <div class="inventory-categories"></div>
      <div class="inventory-body">
        <div class="inventory-grid"></div>
        <div class="inventory-side">
          <div class="item-details"></div>
          <button class="sell-junk-button"></button>
        </div>
      </div>
    `;
    document.body.appendChild(this.root);

    this.root.querySelector('.close-button').addEventListener('click', () => this.close());

    this.root.querySelector('.sell-junk-button').addEventListener('click', () => {
      const gold = this.game.sellAllOfRarity('poor');
      if (gold > 0) {
        Sound.coin();
        showToast('Schrott verkauft: +' + gold + ' Gold');
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });

    game.on('changed', () => this.render());
  }

  open() {
    this.isOpen = true;
    this.root.hidden = false;
    document.body.classList.add('overlay-open'); // Seite dahinter nicht mitscrollen
    this.render();
  }

  close() {
    Sound.click();
    this.isOpen = false;
    this.root.hidden = true;
    document.body.classList.remove('overlay-open');
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
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

  // Für andere Bildschirme (z.B. die Ausrüstungsliste im Heldenbildschirm):
  // Ist das Item frisch gefunden und noch nicht angesehen?
  isNew(itemId) {
    return this.newItemIds.has(itemId);
  }

  // Steckt das Item noch in einer Kiste, die gerade geöffnet wird?
  isHidden(itemId) {
    return this.hiddenItemIds.has(itemId);
  }

  // Das Item wurde angesehen oder angelegt: nicht mehr "neu"
  markSeen(itemId) {
    if (this.newItemIds.delete(itemId)) {
      this.render();
    }
  }

  // Alle sichtbaren Items: höchstes Item-Level zuerst, bei gleichem Level die seltensten zuerst
  getVisibleItems() {
    const visible = this.game.guild.inventory.filter((item) => !this.hiddenItemIds.has(item.id));
    visible.sort(compareByItemLevel);
    return visible;
  }

  // Nur die Items der gewählten Kategorie
  getItemsInCategory(items, category) {
    if (category === null) {
      return items;
    }
    return items.filter((item) => item.getSlot() === category);
  }

  render() {
    // Verkaufte oder angelegte Items sind nicht mehr "neu"
    for (const itemId of this.newItemIds) {
      if (!this.game.guild.findItem(itemId)) {
        this.newItemIds.delete(itemId);
      }
    }
    this.onNewItemsChanged(this.newItemIds.size);

    // Geschlossen muss nichts gezeichnet werden
    if (!this.isOpen) {
      return;
    }

    const items = this.getVisibleItems();
    this.root.querySelector('.inventory-count').textContent = '(' + items.length + ')';
    this.renderCategories(items);

    const shownItems = this.getItemsInCategory(items, this.category);
    const grid = this.root.querySelector('.inventory-grid');
    grid.innerHTML = '';
    for (const item of shownItems) {
      grid.appendChild(this.createSlot(item));
    }
    if (items.length === 0) {
      grid.innerHTML = '<p class="empty">Noch leer. Öffne eine Kiste in der Schatzkammer!</p>';
    } else if (shownItems.length === 0) {
      grid.innerHTML = '<p class="empty">In dieser Kategorie liegt nichts.</p>';
    }

    this.renderDetails();
    this.renderSellJunkButton(items);
  }

  // Knöpfe für die Kategorien, jeweils mit Anzahl und Punkt für neue Items
  renderCategories(items) {
    const container = this.root.querySelector('.inventory-categories');
    container.innerHTML = '';
    const categories = [null, ...EQUIPMENT_SLOTS];
    for (const category of categories) {
      const itemsInCategory = this.getItemsInCategory(items, category);
      const hasNew = itemsInCategory.some((item) => this.newItemIds.has(item.id));

      const button = document.createElement('button');
      button.className = 'category-button';
      button.classList.toggle('active', category === this.category);
      const name = category === null ? 'Alle' : SLOT_NAMES[category];
      button.textContent = name + ' ' + itemsInCategory.length;
      if (hasNew) {
        button.insertAdjacentHTML('beforeend', '<span class="new-dot"></span>');
      }
      button.addEventListener('click', () => {
        Sound.click();
        this.category = category;
        this.render();
      });
      container.appendChild(button);
    }
  }

  createSlot(item) {
    const slot = document.createElement('button');
    slot.className = 'inventory-slot rarity-' + item.rarityId;
    slot.style.setProperty('--rarity', item.getRarity().color);
    slot.title = item.name;
    slot.appendChild(createItemCanvas(item, 3));
    // Kleine Zahl unten links: die Stufe (Item-Level)
    slot.insertAdjacentHTML('beforeend', '<span class="item-level">' + item.itemLevel + '</span>');

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
      details.innerHTML = '<p class="hint">Tippe ein Item an.</p>';
      return;
    }

    const rarity = item.getRarity();
    details.innerHTML = `
      <div class="detail-name" style="color: ${rarity.color}"></div>
      <div class="detail-sub">${rarity.name} · ${describeItemKind(item)} · Stufe ${item.itemLevel}</div>
      <div class="detail-for">${describeSuitableClasses(item)}</div>
      <ul class="detail-stats"></ul>
      <button class="sell-button">Verkaufen (${item.getSellValue()} Gold)</button>
    `;
    details.querySelector('.detail-name').textContent = item.name;

    const statList = details.querySelector('.detail-stats');
    const itemStats = item.getStats();
    for (const statName in itemStats) {
      const line = document.createElement('li');
      line.textContent = '+' + itemStats[statName] + ' ' + STAT_NAMES[statName];
      statList.appendChild(line);
    }
    for (const damageTypeId in item.resistances) {
      const line = document.createElement('li');
      line.className = 'detail-resistance';
      line.style.color = DAMAGE_TYPES[damageTypeId].color;
      line.textContent = '+' + item.resistances[damageTypeId] + ' % ' + DAMAGE_TYPES[damageTypeId].name + '-Resistenz';
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

// Sortierung für Item-Listen: höchstes Item-Level zuerst, dann die seltensten
export function compareByItemLevel(a, b) {
  if (b.itemLevel !== a.itemLevel) {
    return b.itemLevel - a.itemLevel;
  }
  return b.getRarityRank() - a.getRarityRank();
}
