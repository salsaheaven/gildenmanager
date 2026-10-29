// ============================================================
// LOOTBOXSCREEN – die Schatzkammer: Kisten öffnen, Händler (Verbrauchsgüter) und Vorratskammer
// (Das Inventar ist ein eigenes Vollbild-Fenster, siehe InventoryOverlay.)
//
// Ablauf beim Öffnen (das Herzstück der Motivation!):
//   1. Kiste wackelt (je besser die Kiste, desto länger)
//   2. Kiste springt auf und leuchtet in der Farbe des BESTEN Items darin
//   3. Items erscheinen nacheinander, das seltenste zuletzt
//   4. Bei Legendär: Bildschirm wackelt und blitzt
//   5. Boss-Items: Schild "Neu im Sammelbuch!" bzw. "Sammelbuch verbessert!", bei voller Seite ein Banner
// Ein Klick auf die Bühne überspringt die Animation.
// ============================================================

import { LOOT_BOXES, getLootBoxType } from '../data/lootBoxes.js';
import { CONSUMABLES, SUPPLY_SLOTS } from '../data/consumables.js';
import { formatItemValues } from './format.js';
import { BALANCING } from '../data/balancing.js';
import { createChestCanvas, createItemCanvas, createSpriteCanvas } from './PixelArt.js';
import { Sound } from './Sound.js';
import { showToast } from './Toast.js';

// Zeiten der Animation in Millisekunden
const FIRST_ITEM_DELAY = 450;
const TIME_BETWEEN_ITEMS = 500;

export class LootBoxScreen {
  // inventory = das InventoryOverlay. Frische Items werden dort versteckt, bis sie aufgedeckt sind.
  // collection = das CollectionOverlay (Sammelbuch), wird über einen Knopf geöffnet
  constructor(rootElement, game, inventory, collection) {
    this.root = rootElement;
    this.game = game;
    this.inventory = inventory;
    this.collection = collection;

    // Zustand der laufenden Öffnung
    this.isOpening = false;
    this.currentBoxType = null;
    this.currentItems = [];
    this.revealedCount = 0;
    this.timers = [];

    this.root.innerHTML = `
      <div class="lootbox-screen">
        <section class="panel box-panel">
          <button class="collection-button"></button>
          <h2>Deine Kisten</h2>
          <div class="box-list"></div>
          <div class="pity"></div>
          <h2>Händler</h2>
          <p class="hint shop-hint"></p>
          <h3>Immer da</h3>
          <div class="shop-list shop-always"></div>
          <h3>Heute im Angebot</h3>
          <div class="shop-list shop-daily"></div>
          <h3>Vorratskammer</h3>
          <div class="supply-storage"></div>
        </section>

        <section class="panel stage">
          <div class="stage-flash"></div>
          <div class="stage-rays"></div>
          <div class="stage-chest"></div>
          <div class="stage-items"></div>
          <div class="stage-hint"></div>
          <div class="stage-actions"></div>
          <div class="collection-banner" hidden></div>
        </section>
      </div>
    `;

    this.stage = this.root.querySelector('.stage');
    this.chestElement = this.root.querySelector('.stage-chest');
    this.itemsElement = this.root.querySelector('.stage-items');
    this.hintElement = this.root.querySelector('.stage-hint');
    this.actionsElement = this.root.querySelector('.stage-actions');
    this.bannerElement = this.root.querySelector('.collection-banner');
    this.root.querySelector('.collection-button').addEventListener('click', () => this.collection.open());

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
    const progress = this.game.guild.collection.getProgress();
    this.root.querySelector('.collection-button').textContent = '📖 Sammelbuch (' + progress.found + ' / ' + progress.total + ')';
    this.renderBoxList();
    this.renderShop();
    this.renderStorage();
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
      list.innerHTML = '<p class="empty">Keine Kisten. Schaffe einen Dungeon für eine Boss-Kiste!</p>';
    }
  }

  // Händler: Grundware (immer da) und das heutige Tagesangebot (wechselt jeden Tag)
  renderShop() {
    this.root.querySelector('.shop-hint').textContent = 'Tränke für einen Run. Jede Gruppe nimmt bis zu ' + SUPPLY_SLOTS +
      ' Vorräte mit (beim Einplanen im Dungeon oder im Tagesplan). Das Angebot wechselt jeden Tag.';
    const always = CONSUMABLES.filter((consumable) => consumable.stock === 'always');
    const daily = this.game.guild.dailyOffer.map((id) => CONSUMABLES.find((consumable) => consumable.id === id));
    this.fillShopList(this.root.querySelector('.shop-always'), always);
    this.fillShopList(this.root.querySelector('.shop-daily'), daily);
  }

  fillShopList(list, consumables) {
    list.innerHTML = '';
    for (const consumable of consumables) {
      const row = document.createElement('div');
      row.className = 'shop-entry';
      row.innerHTML = `
        <span class="supply-icon"></span>
        <span class="shop-text"><span class="box-name"></span><span class="shop-description"></span></span>
        <button class="buy-button"><span class="price">${consumable.price}</span></button>
      `;
      const icon = row.querySelector('.supply-icon');
      icon.textContent = consumable.icon;
      icon.style.color = consumable.color;
      row.querySelector('.box-name').textContent = consumable.name;
      row.querySelector('.shop-description').textContent = consumable.description;

      const buyButton = row.querySelector('.buy-button');
      buyButton.prepend(createSpriteCanvas('coin', 2));
      buyButton.disabled = !this.game.guild.canAfford(consumable.price);
      buyButton.addEventListener('click', () => {
        if (this.game.buySupply(consumable.id)) {
          Sound.coin();
          showToast(consumable.name + ' gekauft!', consumable.color);
        }
      });
      list.appendChild(row);
    }
  }

  // Was in der Vorratskammer liegt
  renderStorage() {
    const storage = this.root.querySelector('.supply-storage');
    storage.innerHTML = '';
    for (const consumable of CONSUMABLES) {
      const count = this.game.guild.countSupply(consumable.id);
      if (count === 0) {
        continue;
      }
      const chip = document.createElement('span');
      chip.className = 'supply-chip';
      chip.style.setProperty('--supply-color', consumable.color);
      chip.textContent = consumable.icon + ' ' + consumable.name + ' ×' + count;
      chip.title = consumable.description;
      storage.appendChild(chip);
    }
    if (storage.children.length === 0) {
      storage.innerHTML = '<p class="empty">Noch leer.</p>';
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
    this.hintElement.textContent = 'Wähle eine Kiste zum Öffnen';
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
    this.inventory.hideItems(items);
    this.renderBoxList();

    // Phase 1: Wackeln
    this.stage.classList.remove('opened', 'big-glow');
    this.itemsElement.innerHTML = '';
    this.actionsElement.innerHTML = '';
    this.hintElement.textContent = '';
    this.bannerElement.hidden = true;
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
    this.inventory.revealItem(item);
    Sound.itemReveal(item.getRarityRank());
    if (item.collectionStatus) {
      Sound.collectionEntry(item.collectionStatus === 'improved');
    }
    if (item.completedPage) {
      this.showPageBanner(item.completedPage);
    }

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
    rarityLabel.textContent = rarity.name + ' · Stufe ' + item.itemLevel;
    card.appendChild(rarityLabel);

    const stats = document.createElement('div');
    stats.className = 'card-stats';
    stats.textContent = formatItemValues(item);
    card.appendChild(stats);

    // Boss-Item: Was hat es im Sammelbuch bewirkt?
    if (item.collectionStatus) {
      const chip = document.createElement('div');
      chip.className = 'collection-chip ' + item.collectionStatus;
      chip.textContent = item.collectionStatus === 'new' ? 'Neu im Sammelbuch!' : 'Sammelbuch verbessert!';
      card.appendChild(chip);
    }
    return card;
  }

  // Großes Banner, wenn eine Sammelbuch-Seite gerade voll geworden ist
  showPageBanner(page) {
    this.bannerElement.innerHTML = '<div class="collection-banner-title">Seite vollständig!</div><div class="collection-banner-text"></div>';
    this.bannerElement.querySelector('.collection-banner-text').textContent =
      'Neuer Titel: „' + page.title + '“ · +' + Math.round(page.goldBonus * 100) + ' % Gold in diesem Dungeon';
    this.bannerElement.hidden = false;
    Sound.collectionPage();
    showToast('Sammelbuch: Titel „' + page.title + '“ freigeschaltet!', '#ffd23f');
  }

  finishOpening() {
    this.isOpening = false;
    this.timers = [];
    this.renderBoxList();
    this.renderActions();
  }

  // Knöpfe "Noch eine öffnen" (direkt weitermachen) und "Ins Inventar"
  renderActions() {
    this.actionsElement.innerHTML = '';
    const inventoryButton = document.createElement('button');
    inventoryButton.className = 'big-button';
    inventoryButton.textContent = 'Ins Inventar';
    inventoryButton.addEventListener('click', () => this.inventory.open());
    this.actionsElement.appendChild(inventoryButton);

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
