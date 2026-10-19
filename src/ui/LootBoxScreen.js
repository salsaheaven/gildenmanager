// ============================================================
// LOOTBOXSCREEN – die Schatzkammer: Kisten öffnen, kaufen, Inventar
//
// Ablauf beim Öffnen (das Herzstück der Motivation!):
//   1. Kiste wackelt (je besser die Kiste, desto länger)
//   2. Kiste springt auf und leuchtet in der Farbe des BESTEN Items darin
//   3. Items erscheinen nacheinander, das seltenste zuletzt
//   4. Bei Legendär: Bildschirm wackelt und blitzt
// Ein Klick auf die Bühne überspringt die Animation.
// ============================================================

import { LOOT_BOXES, getLootBoxType } from '../data/lootBoxes.js';
import { STAT_NAMES } from '../data/items.js';
import { BALANCING } from '../data/balancing.js';
import { createChestCanvas, createItemCanvas, createSpriteCanvas } from './PixelArt.js';
import { InventoryPanel } from './InventoryPanel.js';
import { Sound } from './Sound.js';
import { showToast } from './Toast.js';

// Zeiten der Animation in Millisekunden
const FIRST_ITEM_DELAY = 450;
const TIME_BETWEEN_ITEMS = 500;

export class LootBoxScreen {
  constructor(rootElement, game) {
    this.root = rootElement;
    this.game = game;

    // Zustand der laufenden Öffnung
    this.isOpening = false;
    this.currentBoxType = null;
    this.currentItems = [];
    this.revealedCount = 0;
    this.timers = [];

    this.root.innerHTML = `
      <div class="lootbox-screen">
        <section class="panel box-panel">
          <h2>Deine Kisten</h2>
          <div class="box-list"></div>
          <h2>Händler</h2>
          <div class="shop-list"></div>
          <div class="pity"></div>
        </section>

        <section class="panel stage">
          <div class="stage-flash"></div>
          <div class="stage-rays"></div>
          <div class="stage-chest"></div>
          <div class="stage-items"></div>
          <div class="stage-hint"></div>
          <div class="stage-actions"></div>
        </section>

        <section class="panel inventory-panel"></section>
      </div>
    `;

    this.stage = this.root.querySelector('.stage');
    this.chestElement = this.root.querySelector('.stage-chest');
    this.itemsElement = this.root.querySelector('.stage-items');
    this.hintElement = this.root.querySelector('.stage-hint');
    this.actionsElement = this.root.querySelector('.stage-actions');

    this.inventoryPanel = new InventoryPanel(this.root.querySelector('.inventory-panel'), game);

    // Klick auf die Bühne während des Öffnens = Animation überspringen
    this.stage.addEventListener('click', (event) => {
      if (this.isOpening && !event.target.closest('button')) {
        this.skipAnimation();
      }
    });

    game.on('changed', () => this.renderSidePanel());
    this.renderSidePanel();
    this.showIdle();
  }

  // ---------- Linke Seite: eigene Kisten, Händler, Pity ----------

  renderSidePanel() {
    this.renderBoxList();
    this.renderShop();
    this.renderPity();
  }

  renderBoxList() {
    const list = this.root.querySelector('.box-list');
    list.innerHTML = '';

    for (const boxType of LOOT_BOXES) {
      const count = this.game.guild.countBoxes(boxType.id);
      if (count === 0) {
        continue;
      }
      const button = document.createElement('button');
      button.className = 'box-entry';
      button.appendChild(createChestCanvas(boxType, 3));
      button.insertAdjacentHTML('beforeend', `
        <span class="box-name"></span>
        <span class="box-count">x${count}</span>
      `);
      button.querySelector('.box-name').textContent = boxType.name;
      button.disabled = this.isOpening;
      button.addEventListener('click', () => this.startOpening(boxType.id));
      list.appendChild(button);
    }

    if (list.children.length === 0) {
      list.innerHTML = '<p class="empty">Keine Kisten. Warte auf den Kurier oder kaufe welche!</p>';
    }
  }

  renderShop() {
    const list = this.root.querySelector('.shop-list');
    list.innerHTML = '';

    for (const boxType of LOOT_BOXES) {
      // Boss-Kisten gibt es nur aus Dungeons
      if (boxType.price === null) {
        continue;
      }
      const row = document.createElement('div');
      row.className = 'shop-entry';
      row.appendChild(createChestCanvas(boxType, 2));
      row.insertAdjacentHTML('beforeend', `
        <span class="box-name"></span>
        <button class="buy-button"><span class="price">${boxType.price}</span></button>
      `);
      row.querySelector('.box-name').textContent = boxType.name;

      const buyButton = row.querySelector('.buy-button');
      buyButton.prepend(createSpriteCanvas('coin', 2));
      buyButton.disabled = !this.game.guild.canAfford(boxType.price);
      buyButton.addEventListener('click', () => {
        if (this.game.buyBox(boxType.id)) {
          Sound.coin();
          showToast(boxType.name + ' gekauft!', boxType.mainColor);
        }
      });
      list.appendChild(row);
    }
  }

  // Deutet an, dass bald etwas Gutes kommt (Vorfreude!), aber bewusst ohne genaue Zahlen.
  // Die Texte stehen in data/balancing.js unter pityHints.
  renderPity() {
    const pity = this.root.querySelector('.pity');
    const progress = this.game.guild.itemsSinceEpic / BALANCING.pityEpicAfterItems;

    let hint = BALANCING.pityHints[0];
    for (const candidate of BALANCING.pityHints) {
      if (progress >= candidate.fromProgress) {
        hint = candidate;
      }
    }

    pity.className = 'pity pity-level-' + hint.level;
    pity.innerHTML = '<span class="pity-rune">✦</span><span class="pity-text"></span>';
    pity.querySelector('.pity-text').textContent = hint.text;
  }

  // ---------- Bühne in der Mitte ----------

  showIdle() {
    this.stage.classList.remove('opened', 'big-glow');
    this.chestElement.innerHTML = '';
    this.itemsElement.innerHTML = '';
    this.actionsElement.innerHTML = '';
    // Eine Holzkiste als Deko, damit die Bühne nicht leer ist
    this.chestElement.appendChild(createChestCanvas(getLootBoxType('wood'), 10));
    this.chestElement.classList.add('idle');
    this.hintElement.textContent = 'Wähle links eine Kiste zum Öffnen';
  }

  startOpening(boxTypeId) {
    if (this.isOpening) {
      return;
    }
    const items = this.game.openBox(boxTypeId);
    if (!items) {
      return;
    }

    this.isOpening = true;
    this.currentBoxType = getLootBoxType(boxTypeId);
    this.currentItems = items;
    this.revealedCount = 0;
    this.inventoryPanel.hideItems(items);
    this.renderBoxList();

    // Phase 1: Wackeln
    this.stage.classList.remove('opened', 'big-glow');
    this.itemsElement.innerHTML = '';
    this.actionsElement.innerHTML = '';
    this.hintElement.textContent = '';
    this.chestElement.classList.remove('idle');
    this.chestElement.innerHTML = '';
    this.chestElement.appendChild(createChestCanvas(this.currentBoxType, 10));
    this.chestElement.style.setProperty('--shake-time', this.currentBoxType.shakeTime + 's');
    this.chestElement.classList.add('shaking');
    Sound.shake(this.currentBoxType.shakeTime);

    this.later(this.currentBoxType.shakeTime * 1000, () => this.burstOpen());
  }

  // Phase 2: Kiste springt auf. Das Leuchten verrät schon die beste Seltenheit!
  burstOpen() {
    const bestItem = this.currentItems[this.currentItems.length - 1];
    const bestRarity = bestItem.getRarity();

    this.chestElement.classList.remove('shaking');
    this.chestElement.innerHTML = '';
    this.chestElement.appendChild(createChestCanvas(this.currentBoxType, 10, true, bestRarity.color));

    this.stage.style.setProperty('--glow', bestRarity.color);
    this.stage.classList.add('opened');
    if (bestItem.getRarityRank() >= 4) {
      this.stage.classList.add('big-glow');
    }
    Sound.boxOpen(bestItem.getRarityRank());

    // Phase 3: Items nacheinander zeigen
    for (let i = 0; i < this.currentItems.length; i++) {
      this.later(FIRST_ITEM_DELAY + i * TIME_BETWEEN_ITEMS, () => this.revealNextItem());
    }
    this.later(FIRST_ITEM_DELAY + this.currentItems.length * TIME_BETWEEN_ITEMS, () => this.finishOpening());
  }

  revealNextItem() {
    const item = this.currentItems[this.revealedCount];
    this.revealedCount++;

    this.itemsElement.appendChild(this.createItemCard(item));
    this.inventoryPanel.revealItem(item);
    Sound.itemReveal(item.getRarityRank());

    // Phase 4: Legendär = großes Spektakel
    if (item.rarityId === 'legendary') {
      this.stage.classList.remove('legendary-flash');
      void this.stage.offsetWidth; // Animation neu starten
      this.stage.classList.add('legendary-flash');
      document.body.classList.remove('screen-shake');
      void document.body.offsetWidth;
      document.body.classList.add('screen-shake');
      showToast('LEGENDÄR! ' + item.name, item.getRarity().color);
    }
  }

  createItemCard(item) {
    const rarity = item.getRarity();
    const card = document.createElement('div');
    card.className = 'item-card rarity-' + item.rarityId;
    card.style.setProperty('--rarity', rarity.color);
    card.appendChild(createItemCanvas(item, 5));

    const name = document.createElement('div');
    name.className = 'card-name';
    name.textContent = item.name;
    card.appendChild(name);

    const rarityLabel = document.createElement('div');
    rarityLabel.className = 'card-rarity';
    rarityLabel.textContent = rarity.name;
    card.appendChild(rarityLabel);

    const stats = document.createElement('div');
    stats.className = 'card-stats';
    const parts = [];
    for (const statName in item.stats) {
      parts.push('+' + item.stats[statName] + ' ' + STAT_NAMES[statName]);
    }
    stats.textContent = parts.join('  ');
    card.appendChild(stats);

    return card;
  }

  finishOpening() {
    this.isOpening = false;
    this.timers = [];
    this.renderBoxList();
    this.renderActions();
  }

  // Knopf "Noch eine öffnen", damit man direkt weitermachen kann
  renderActions() {
    this.actionsElement.innerHTML = '';
    const remaining = this.game.guild.countBoxes(this.currentBoxType.id);
    if (remaining > 0) {
      const againButton = document.createElement('button');
      againButton.className = 'big-button';
      againButton.textContent = 'Noch eine ' + this.currentBoxType.name + ' öffnen (' + remaining + ')';
      againButton.addEventListener('click', () => this.startOpening(this.currentBoxType.id));
      this.actionsElement.appendChild(againButton);
    }
  }

  // Alles sofort zeigen
  skipAnimation() {
    for (const timer of this.timers) {
      clearTimeout(timer);
    }
    this.timers = [];
    if (this.chestElement.classList.contains('shaking')) {
      this.burstOpen();
      for (const timer of this.timers) {
        clearTimeout(timer);
      }
      this.timers = [];
    }
    while (this.revealedCount < this.currentItems.length) {
      this.revealNextItem();
    }
    this.finishOpening();
  }

  // Führt eine Funktion später aus und merkt sich den Timer (zum Überspringen)
  later(milliseconds, callback) {
    this.timers.push(setTimeout(callback, milliseconds));
  }
}
