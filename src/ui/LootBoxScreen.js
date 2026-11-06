// ============================================================
// LOOTBOXSCREEN – die Schatzkammer: Kisten öffnen (Abschnitt "Beute")
// (Das Inventar und das Sammelbuch sind eigene Vollbild-Fenster, der Händler ist im Abschnitt "Gilde", siehe ShopScreen.)
//
// Ablauf beim Öffnen (das Herzstück der Motivation!):
//   1. Kiste wackelt (je besser die Kiste, desto länger)
//   2. Kiste springt auf und leuchtet in der Farbe des BESTEN Items darin
//   3. Items erscheinen nacheinander, das seltenste zuletzt
//   4. Bei Legendär: Bildschirm wackelt und blitzt
//   5. Boss-Items: Schild "Neu im Sammelbuch!" bzw. "Sammelbuch verbessert!", bei voller Seite ein Banner
// Ein Klick auf die Bühne überspringt die Animation.
//   6. Danach: Zerlegen direkt im Ergebnis. Items antippen (markiert ✓), dann "Markierte zerlegen".
//      "Schwache markieren" markiert alles unter Episch (ohne Boss-Items und gesperrte Items).
// ============================================================

import { LOOT_BOXES, getLootBoxType } from '../data/lootBoxes.js';
import { formatItemValues } from './format.js';
import { BALANCING } from '../data/balancing.js';
import { createChestCanvas, createItemCanvas } from './PixelArt.js';
import { Sound } from './Sound.js';
import { showToast } from './Toast.js';
import { describeMaterials } from './UpgradeControls.js';
import { getSalvageYield } from '../systems/CraftingSystem.js';
import { getRarityRank } from '../data/rarities.js';

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

  // ---------- Linke Seite: eigene Kisten, Pity ----------

  renderSidePanel() {
    const progress = this.game.guild.collection.getProgress();
    this.root.querySelector('.collection-button').textContent = '📖 Sammelbuch (' + progress.found + ' / ' + progress.total + ')';
    this.renderBoxList();
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

  // Deutet an, dass bald etwas Gutes kommt (Vorfreude!), aber bewusst ohne genaue Zahlen.
  // Die Texte stehen in data/balancing.js unter pityHints.
  // Ist der Raid offen, gibt es eine zweite Zeile für Legendär aus Raid-Kisten (eigenes Pity).
  renderPity() {
    const pity = this.root.querySelector('.pity');
    const hint = getPityHint(this.game.guild.itemsSinceEpic / BALANCING.pityEpicAfterItems);
    pity.className = 'pity pity-level-' + hint.level;
    pity.innerHTML = '<span class="pity-rune">✦</span><span class="pity-text"></span>';
    pity.querySelector('.pity-text').textContent = hint.text;

    if (this.game.isRaidUnlocked()) {
      const raidHint = getPityHint(this.game.guild.raidChestsSinceLegendary / BALANCING.raidLegendaryPityAfter);
      const line = document.createElement('div');
      line.className = 'pity-raid pity-level-' + raidHint.level;
      line.textContent = 'Raid-Kisten (Legendär): ' + raidHint.text;
      pity.appendChild(line);
    }
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
    // Automatisch verkaufte/zerlegte Items liegen nicht mehr im Inventar
    if (!item.autoJunked) {
      this.inventory.revealItem(item);
    }
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
    card.dataset.itemId = item.id;
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

    // Schrott, der automatisch verwertet wurde (Einstellung im Inventar)
    if (item.autoJunked) {
      card.classList.add('auto-junked');
      const stamp = document.createElement('div');
      stamp.className = 'auto-junk-stamp';
      stamp.textContent = item.autoJunked === 'sell' ? 'verkauft' : 'zerlegt';
      card.appendChild(stamp);
    }

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

  // ---------- Zerlegen im Ergebnis ----------

  // Nach dem Öffnen: Karten lassen sich zum Zerlegen markieren (nicht bei gesperrten Items)
  enableSalvageSelection() {
    this.salvageIds = new Set();
    for (const card of this.itemsElement.querySelectorAll('.item-card')) {
      const item = this.game.guild.findItem(Number(card.dataset.itemId));
      if (!item || item.locked) {
        continue;
      }
      card.classList.add('salvage-selectable');
      card.addEventListener('click', () => {
        Sound.click();
        if (this.salvageIds.has(item.id)) {
          this.salvageIds.delete(item.id);
        } else {
          this.salvageIds.add(item.id);
        }
        this.updateSalvageMarks();
      });
    }
  }

  // Häkchen an den markierten Karten und der Text auf dem Knopf (mit dem Material, das es gibt)
  updateSalvageMarks() {
    for (const card of this.itemsElement.querySelectorAll('.item-card')) {
      card.classList.toggle('salvage-marked', this.salvageIds.has(Number(card.dataset.itemId)));
    }
    const button = this.actionsElement.querySelector('.salvage-result-button');
    if (!button) {
      return;
    }
    const total = {};
    for (const itemId of this.salvageIds) {
      const item = this.game.guild.findItem(itemId);
      if (!item) {
        continue;
      }
      const materials = getSalvageYield(item);
      for (const materialId in materials) {
        total[materialId] = (total[materialId] || 0) + materials[materialId];
      }
    }
    button.disabled = this.salvageIds.size === 0;
    button.textContent = this.salvageIds.size === 0
      ? 'Antippen zum Markieren, dann zerlegen'
      : this.salvageIds.size + ' zerlegen (' + describeMaterials(total) + ')';
  }

  // Knöpfe zum Zerlegen unter dem Ergebnis
  renderSalvageActions() {
    const row = document.createElement('div');
    row.className = 'button-row salvage-result-row';
    const markButton = document.createElement('button');
    markButton.className = 'salvage-mark-weak-button';
    markButton.textContent = 'Schwache markieren';
    markButton.title = 'Markiert alle Items unter Episch, außer Boss-Items und gesperrten Items';
    markButton.addEventListener('click', () => {
      Sound.click();
      for (const item of this.currentItems) {
        const stillThere = this.game.guild.findItem(item.id);
        if (stillThere && !item.locked && !item.bossItemId && getRarityRank(item.rarityId) < getRarityRank('epic')) {
          this.salvageIds.add(item.id);
        }
      }
      this.updateSalvageMarks();
    });
    const salvageButton = document.createElement('button');
    salvageButton.className = 'salvage-result-button';
    salvageButton.addEventListener('click', () => this.salvageMarked());
    row.append(markButton, salvageButton);
    this.actionsElement.prepend(row);
    this.updateSalvageMarks();
  }

  // Zerlegt alle markierten Items und blendet ihre Karten aus
  salvageMarked() {
    const total = {};
    let count = 0;
    for (const itemId of this.salvageIds) {
      const materials = this.game.salvageItem(itemId);
      if (!materials) {
        continue;
      }
      count++;
      for (const materialId in materials) {
        total[materialId] = (total[materialId] || 0) + materials[materialId];
      }
      const card = this.itemsElement.querySelector('.item-card[data-item-id="' + itemId + '"]');
      if (card) {
        card.classList.add('salvaged');
      }
    }
    this.salvageIds.clear();
    if (count > 0) {
      Sound.salvage();
      showToast(count + (count === 1 ? ' Item' : ' Items') + ' zerlegt: +' + describeMaterials(total), '#c9b8ff');
    }
    this.updateSalvageMarks();
  }

  finishOpening() {
    // Automatische Verwertung melden
    if (this.currentItems && this.currentItems.autoJunk && this.currentItems.autoJunk.count > 0) {
      const auto = this.currentItems.autoJunk;
      showToast('Schrott automatisch ' + (auto.mode === 'sell' ? 'verkauft: +' + auto.gold + ' Gold' :
        'zerlegt: +' + describeMaterials(auto.materials)) + ' (' + auto.count + ' Items)', '#9d9d9d');
    }
    // Raid-Kisten: die Raid-Zutaten dazu melden
    if (this.currentItems && this.currentItems.ingredients) {
      showToast('+' + describeMaterials(this.currentItems.ingredients) + ' Aschenessenz (zum Umschmieden von Set-Teilen)', '#ff8000');
    }
    this.isOpening = false;
    this.timers = [];
    this.renderBoxList();
    this.renderActions();
    // Zerlegen im Ergebnis (erst, wenn Zerlegen freigeschaltet ist)
    if (this.game.isFeatureUnlocked('crafting')) {
      this.enableSalvageSelection();
      this.renderSalvageActions();
    }
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

// Stimmung zum Pity-Stand (progress = 0 bis 1): bewusst ungenau, Texte in data/balancing.js (pityHints)
function getPityHint(progress) {
  let hint = BALANCING.pityHints[0];
  for (const candidate of BALANCING.pityHints) {
    if (progress >= candidate.fromProgress) {
      hint = candidate;
    }
  }
  return hint;
}
