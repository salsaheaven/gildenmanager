// ============================================================
// COLLECTIONOVERLAY – das Sammelbuch als Vollbild-Fenster (Knopf in der Schatzkammer)
// Eine Seite pro Dungeon mit seinen Boss-Items:
//   - gefunden: Bild in der besten gefundenen Seltenheit, Sterne (Blau ★, Lila ★★, Orange ★★★)
//   - noch nicht gefunden: dunkler Umriss mit "???"
// Volle Seiten sind golden und nennen ihren Titel und Gold-Bonus. Ganz in Lila glänzt die Seite.
// Oben wählt man einen freigeschalteten Gildentitel aus.
// Schließen mit dem X oder der Escape-Taste.
// ============================================================

import { COLLECTION_PAGES, getPageItems } from '../data/collectionBook.js';
import { getDungeon } from '../data/dungeons.js';
import { getRarity, getRarityRank } from '../data/rarities.js';
import { Item } from '../entities/Item.js';
import { createItemCanvas } from './PixelArt.js';
import { Sound } from './Sound.js';

// Sterne je Seltenheit (Boss-Items gibt es erst ab Blau)
const STARS = { rare: '★', epic: '★★', legendary: '★★★' };

export class CollectionOverlay {
  constructor(game) {
    this.game = game;
    this.isOpen = false;

    this.root = document.createElement('div');
    this.root.className = 'inventory-overlay collection-overlay';
    this.root.hidden = true;
    this.root.innerHTML = `
      <div class="inventory-header">
        <h2>Sammelbuch <span class="collection-count"></span></h2>
        <button class="close-button" title="Schließen (Esc)">✕</button>
      </div>
      <label class="collection-title-row">
        <span>Gildentitel</span>
        <select class="collection-title-select"></select>
      </label>
      <div class="collection-pages"></div>
    `;
    document.body.appendChild(this.root);

    this.root.querySelector('.close-button').addEventListener('click', () => this.close());
    this.root.querySelector('.collection-title-select').addEventListener('change', (event) => {
      Sound.click();
      const value = event.target.value;
      this.game.selectGuildTitle(value === '' ? null : value);
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });

    game.on('changed', () => this.render());
  }

  open() {
    Sound.click();
    this.isOpen = true;
    this.root.hidden = false;
    document.body.classList.add('overlay-open');
    this.render();
  }

  close() {
    Sound.click();
    this.isOpen = false;
    this.root.hidden = true;
    document.body.classList.remove('overlay-open');
  }

  render() {
    if (!this.isOpen) {
      return;
    }
    const book = this.game.guild.collection;
    const progress = book.getProgress();
    this.root.querySelector('.collection-count').textContent = progress.found + ' / ' + progress.total;
    this.renderTitleSelect();

    const pages = this.root.querySelector('.collection-pages');
    pages.innerHTML = '';
    for (const page of COLLECTION_PAGES) {
      pages.appendChild(this.createPage(book, page));
    }
  }

  // Auswahl aller verdienten Titel (volle Sammelbuch-Seiten und eigene Server-Firsts)
  renderTitleSelect() {
    const titles = this.game.getAvailableTitles();
    const select = this.root.querySelector('.collection-title-select');
    select.innerHTML = '';
    const none = document.createElement('option');
    none.value = '';
    none.textContent = 'kein Titel';
    select.appendChild(none);
    for (const title of titles) {
      const option = document.createElement('option');
      option.value = title;
      option.textContent = title;
      select.appendChild(option);
    }
    select.value = this.game.guild.selectedTitle || '';
    select.disabled = titles.length === 0;
  }

  // Eine Seite: Dungeon-Name, Fortschritt, Items, bei voller Seite Titel und Bonus
  createPage(book, page) {
    const items = getPageItems(page);
    const complete = book.isPageComplete(page);
    const element = document.createElement('section');
    element.className = 'collection-page' + (complete ? ' complete' : '') + (book.isPageShiny(page) ? ' shiny' : '');
    element.innerHTML = `
      <div class="collection-page-head">
        <b class="collection-page-name"></b>
        <span class="collection-page-count"></span>
      </div>
      <div class="collection-items"></div>
      <div class="collection-reward"></div>
    `;
    element.querySelector('.collection-page-name').textContent = getDungeon(page.dungeonId).name;
    element.querySelector('.collection-page-count').textContent = book.countFoundOnPage(page) + ' / ' + items.length;

    const list = element.querySelector('.collection-items');
    for (const entry of items) {
      list.appendChild(this.createEntry(book, entry));
    }

    const bonusPercent = Math.round(page.goldBonus * 100);
    element.querySelector('.collection-reward').textContent = complete
      ? 'Titel „' + page.title + '“ · +' + bonusPercent + ' % Gold in diesem Dungeon'
      : 'Volle Seite: Titel „' + page.title + '“ und +' + bonusPercent + ' % Gold';
    return element;
  }

  // Ein Boss-Item: gefunden (Bild, Name, Sterne) oder noch nicht ("???")
  createEntry(book, entry) {
    const bestRarity = book.getBestRarity(entry.id);
    const element = document.createElement('div');
    element.className = 'collection-entry';
    // Ein Item nur fürs Bild, in der besten gefundenen Seltenheit
    const previewItem = new Item(0, entry.templateId, bestRarity || entry.minRarity, entry.name, {});
    element.appendChild(createItemCanvas(previewItem, 4));
    element.insertAdjacentHTML('beforeend', '<span class="collection-entry-name"></span><span class="collection-stars"></span>');

    if (bestRarity === null) {
      element.classList.add('missing');
      element.querySelector('.collection-entry-name').textContent = '???';
      return element;
    }
    const rarity = getRarity(bestRarity);
    element.style.setProperty('--rarity', rarity.color);
    element.querySelector('.collection-entry-name').textContent = entry.name;
    const stars = element.querySelector('.collection-stars');
    stars.textContent = STARS[bestRarity] || '';
    stars.title = 'Beste gefundene Seltenheit: ' + rarity.name;
    if (getRarityRank(bestRarity) >= getRarityRank('epic')) {
      element.classList.add('shiny');
    }
    return element;
  }
}
