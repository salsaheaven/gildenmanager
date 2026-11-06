// ============================================================
// INVENTORYOVERLAY – das Inventar als Vollbild-Fenster
// Wird über den Knopf "Inventar" in der Reiterleiste geöffnet, von jedem Bildschirm aus.
// Oben: Kategorien (Alle, Waffe, Nebenhand, Kopf …). Darunter alle Items als Raster.
// Klick auf ein Item zeigt Details mit Verkaufen, Zerlegen und Verbessern.
// Oben steht der Materialbestand (Arkanstaub, Kristalle), unten "Schrott verkaufen" und "Schrott zerlegen"
// (Schrott = Weiß und Grau, ohne Boss-Items und gesperrte Items).
// "Mehrere auswählen": Items antippen (✓), dann alle markierten verkaufen oder zerlegen (Massen-Verkauf).
// "Automatisch": Schrott aus neuen Kisten gleich verkaufen oder zerlegen (Einstellung wird gespeichert).
// Schließen mit dem X oder der Escape-Taste.
// ============================================================

import { STAT_NAMES, SLOT_NAMES } from '../data/items.js';
import { DAMAGE_TYPES } from '../data/damageTypes.js';
import { EQUIPMENT_SLOTS } from '../entities/Hero.js';
import { createItemCanvas } from './PixelArt.js';
import { describeItemKind, describeSuitableClasses } from './format.js';
import { Sound } from './Sound.js';
import { showToast } from './Toast.js';
import { describeMaterials, createUpgradeButton, applyUpgradeGlow } from './UpgradeControls.js';
import { createReforgeControls, createSetReforgeControls } from './CraftingControls.js';
import { createSetLine } from './SetInfo.js';
import { createLockButton, createLockBadge } from './LockButton.js';
import { getSalvageYield } from '../systems/CraftingSystem.js';

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
    this.selectMode = false;        // Mehrfachauswahl an? (Massen-Verkauf und -Zerlegen)
    this.selectedIds = new Set();   // in der Mehrfachauswahl markierte Items

    this.root = document.createElement('div');
    this.root.className = 'inventory-overlay';
    this.root.hidden = true;
    this.root.innerHTML = `
      <div class="inventory-header">
        <h2>Inventar <span class="inventory-count"></span></h2>
        <span class="inventory-materials" title="Material zum Verbessern, Schmieden und Brauen. Staub, Kristalle und Rohstoffe gibt es durchs Zerlegen, Rohstoffe und Kräuter auch über Tagesaufgaben."></span>
        <button class="close-button" title="Schließen (Esc)">✕</button>
      </div>
      <div class="inventory-categories"></div>
      <div class="button-row inventory-select-row">
        <button class="select-mode-button">Mehrere auswählen</button>
      </div>
      <div class="inventory-body">
        <div class="inventory-grid"></div>
        <div class="inventory-side">
          <div class="item-details"></div>
          <div class="junk-buttons">
            <button class="sell-junk-button"></button>
            <button class="salvage-junk-button"></button>
          </div>
          <div class="auto-junk">
            <div class="hint">Schrott (Weiß und Grau) aus neuen Kisten automatisch:</div>
            <div class="button-row auto-junk-buttons"></div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(this.root);

    this.root.querySelector('.close-button').addEventListener('click', () => this.close());

    this.root.querySelector('.sell-junk-button').addEventListener('click', () => {
      const result = this.game.sellItems(this.game.getJunkItems().map((item) => item.id));
      if (result.count > 0) {
        Sound.coin();
        showToast('Schrott verkauft: ' + result.count + ' Items, +' + result.gold + ' Gold');
      }
    });

    this.root.querySelector('.salvage-junk-button').addEventListener('click', () => {
      const result = this.game.salvageItems(this.game.getJunkItems().map((item) => item.id));
      if (result.count > 0) {
        Sound.salvage();
        showToast('Schrott zerlegt: ' + result.count + ' Items, +' + describeMaterials(result.materials));
      }
    });

    this.root.querySelector('.select-mode-button').addEventListener('click', () => {
      Sound.click();
      this.selectMode = !this.selectMode;
      this.selectedIds.clear();
      this.render();
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
    this.root.querySelector('.inventory-materials').textContent = describeMaterials(this.game.guild.materials, true);
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

    this.root.querySelector('.select-mode-button').textContent = this.selectMode ? 'Fertig' : 'Mehrere auswählen';
    this.root.querySelector('.select-mode-button').classList.toggle('active', this.selectMode);
    if (this.selectMode) {
      this.renderSelection(shownItems);
    } else {
      this.renderDetails();
    }
    this.renderJunkButtons(items);
    this.renderAutoJunk();
  }

  // ---------- Mehrfachauswahl (Massen-Verkauf und -Zerlegen) ----------

  // Statt der Details: Anzahl, Knöpfe zum Markieren, Verkaufen und Zerlegen
  renderSelection(shownItems) {
    // Nicht mehr vorhandene Items fallen aus der Auswahl
    for (const itemId of this.selectedIds) {
      if (!this.game.guild.findItem(itemId)) {
        this.selectedIds.delete(itemId);
      }
    }
    const selected = [...this.selectedIds].map((itemId) => this.game.guild.findItem(itemId));
    let gold = 0;
    const materials = {};
    for (const item of selected) {
      gold += item.getSellValue();
      const yieldOfItem = getSalvageYield(item);
      for (const materialId in yieldOfItem) {
        materials[materialId] = (materials[materialId] || 0) + yieldOfItem[materialId];
      }
    }
    const details = this.root.querySelector('.item-details');
    details.innerHTML = `
      <div class="detail-name">${selected.length} ausgewählt</div>
      <p class="hint">Tippe Items an, um sie zu markieren. Gesperrte Items (🔒) lassen sich nicht auswählen.</p>
      <div class="button-row">
        <button class="select-all-button">Alle hier markieren</button>
        <button class="select-weak-button">Bis Grün markieren</button>
        <button class="select-none-button">Auswahl aufheben</button>
      </div>
      <div class="detail-actions">
        <button class="mass-sell-button">Verkaufen (${gold} Gold)</button>
        <button class="mass-salvage-button salvage-button"></button>
      </div>
    `;
    details.querySelector('.mass-salvage-button').textContent = 'Zerlegen (' + (describeMaterials(materials) || '✧ 0') + ')';
    details.querySelector('.mass-sell-button').disabled = selected.length === 0;
    details.querySelector('.mass-salvage-button').disabled = selected.length === 0;
    const selectable = (item) => !item.locked;
    details.querySelector('.select-all-button').addEventListener('click', () => {
      Sound.click();
      shownItems.filter(selectable).forEach((item) => this.selectedIds.add(item.id));
      this.render();
    });
    details.querySelector('.select-weak-button').addEventListener('click', () => {
      Sound.click();
      // "Bis Grün" = Grau, Weiß und Grün, ohne Boss-Items
      shownItems.filter((item) => selectable(item) && !item.bossItemId && item.getRarityRank() <= 2)
        .forEach((item) => this.selectedIds.add(item.id));
      this.render();
    });
    details.querySelector('.select-none-button').addEventListener('click', () => {
      Sound.click();
      this.selectedIds.clear();
      this.render();
    });
    details.querySelector('.mass-sell-button').addEventListener('click', () => {
      const result = this.game.sellItems([...this.selectedIds]);
      this.selectedIds.clear();
      Sound.coin();
      showToast(result.count + ' Items verkauft: +' + result.gold + ' Gold', '#ffd23f');
    });
    details.querySelector('.mass-salvage-button').addEventListener('click', () => {
      const result = this.game.salvageItems([...this.selectedIds]);
      this.selectedIds.clear();
      Sound.salvage();
      showToast(result.count + ' Items zerlegt: +' + describeMaterials(result.materials), '#c9b8ff');
    });
  }

  // Einstellung "automatisch verkaufen/zerlegen" für Schrott aus neuen Kisten
  renderAutoJunk() {
    const container = this.root.querySelector('.auto-junk-buttons');
    container.innerHTML = '';
    for (const option of [{ id: 'off', label: 'Aus' }, { id: 'sell', label: 'Verkaufen' }, { id: 'salvage', label: 'Zerlegen' }]) {
      const button = document.createElement('button');
      button.className = 'filter-button' + (option.id === 'salvage' ? ' auto-junk-salvage' : '');
      button.textContent = option.label;
      button.classList.toggle('active', this.game.guild.autoJunk === option.id);
      button.addEventListener('click', () => {
        Sound.click();
        this.game.setAutoJunk(option.id);
      });
      container.appendChild(button);
    }
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
    slot.title = item.getDisplayName();
    slot.appendChild(createItemCanvas(item, 3));
    applyUpgradeGlow(slot, item);
    // Kleine Zahl unten links: die Stufe (Item-Level)
    slot.insertAdjacentHTML('beforeend', '<span class="item-level">' + item.itemLevel + '</span>');
    const lockBadge = createLockBadge(item);
    if (lockBadge) {
      slot.appendChild(lockBadge);
    }

    if (this.newItemIds.has(item.id)) {
      const dot = document.createElement('span');
      dot.className = 'new-dot';
      slot.appendChild(dot);
    }
    if (this.selectMode) {
      slot.classList.toggle('mass-selected', this.selectedIds.has(item.id));
      slot.classList.toggle('mass-locked', item.locked);
    } else if (item.id === this.selectedItemId) {
      slot.classList.add('selected');
    }

    slot.addEventListener('click', () => {
      Sound.click();
      this.newItemIds.delete(item.id);
      // Mehrfachauswahl: markieren bzw. wieder abwählen (gesperrte nicht)
      if (this.selectMode) {
        if (item.locked) {
          return;
        }
        if (this.selectedIds.has(item.id)) {
          this.selectedIds.delete(item.id);
        } else {
          this.selectedIds.add(item.id);
        }
        this.render();
        return;
      }
      this.selectedItemId = item.id;
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
      <div class="detail-actions">
        <button class="sell-button">Verkaufen (${item.getSellValue()} Gold)</button>
        <button class="salvage-button"></button>
      </div>
      <p class="hint detail-upgrade-hint"></p>
    `;
    details.querySelector('.detail-name').textContent = item.getDisplayName();
    const setLine = createSetLine(item);
    if (setLine) {
      details.querySelector('.detail-for').after(setLine);
    }
    details.querySelector('.salvage-button').textContent = 'Zerlegen (' + describeMaterials(getSalvageYield(item)) + ')';
    details.querySelector('.detail-actions').appendChild(createUpgradeButton(this.game, item, details));
    details.querySelector('.detail-actions').appendChild(createLockButton(this.game, item));
    // Gesperrte Items kann man nicht verkaufen oder zerlegen
    if (item.locked) {
      details.querySelector('.sell-button').disabled = true;
      details.querySelector('.salvage-button').disabled = true;
    }
    const reforgeControls = createReforgeControls(this.game, item);
    if (reforgeControls) {
      details.querySelector('.detail-upgrade-hint').after(reforgeControls);
    }
    // Set-Teile: in ein anderes Set umschmieden (Raid-Zutat)
    const setReforgeControls = createSetReforgeControls(this.game, item);
    if (setReforgeControls) {
      details.querySelector('.detail-upgrade-hint').after(setReforgeControls);
    }
    details.querySelector('.detail-upgrade-hint').textContent = item.locked
      ? 'Gesperrt: Zum Verkaufen oder Zerlegen erst entsperren.'
      : item.upgradeLevel > 0
      ? 'Verkaufen und Zerlegen bringen nur den Grundwert, die Verbesserung geht verloren.'
      : 'Jede Stufe gibt +6 % auf alle Werte. Ab +6 kann es fehlschlagen.';

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
      showToast(item.getDisplayName() + ' verkauft: +' + gold + ' Gold', rarity.color);
      this.selectedItemId = null;
      this.render();
    });

    details.querySelector('.salvage-button').addEventListener('click', () => {
      this.selectedItemId = null;
      const materials = this.game.salvageItem(item.id);
      Sound.salvage();
      showToast(item.getDisplayName() + ' zerlegt: +' + describeMaterials(materials), rarity.color);
    });
  }

  // Allen grauen Schrott auf einmal verkaufen (Gold) oder zerlegen (Staub)
  renderJunkButtons(items) {
    const junk = items.filter((item) => this.game.isJunk(item));
    const sellButton = this.root.querySelector('.sell-junk-button');
    const goldValue = junk.reduce((sum, item) => sum + item.getSellValue(), 0);
    sellButton.textContent = 'Schrott verkaufen (' + junk.length + ' = ' + goldValue + ' Gold)';
    sellButton.disabled = junk.length === 0;

    const salvageButton = this.root.querySelector('.salvage-junk-button');
    const total = {};
    for (const item of junk) {
      const materials = getSalvageYield(item);
      for (const materialId in materials) {
        total[materialId] = (total[materialId] || 0) + materials[materialId];
      }
    }
    salvageButton.textContent = 'Schrott zerlegen (' + junk.length + ' = ' + (describeMaterials(total) || '✧ 0') + ')';
    salvageButton.disabled = junk.length === 0;
  }
}

// Sortierung für Item-Listen: höchstes Item-Level zuerst, dann die seltensten
export function compareByItemLevel(a, b) {
  if (b.itemLevel !== a.itemLevel) {
    return b.itemLevel - a.itemLevel;
  }
  return b.getRarityRank() - a.getRarityRank();
}
