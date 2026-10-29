// ============================================================
// COLLECTIONBOOK – das Sammelbuch der Gilde (gehört zum Spielstand)
// Merkt sich für jedes Boss-Item die beste Seltenheit, in der es je gefunden wurde.
// Es bleibt eingetragen, auch wenn man das Item verkauft.
// Eine Seite ist voll, wenn jedes ihrer Boss-Items mindestens einmal gefunden wurde. Volle Seiten
// schalten einen Gildentitel frei und geben mehr Gold in ihrem Dungeon (siehe data/collectionBook.js).
// ============================================================

import { COLLECTION_PAGES, SHINY_RARITY, getCollectionPage, getPageItems, getAllCollectionItems } from '../data/collectionBook.js';
import { getRarityRank } from '../data/rarities.js';

export class CollectionBook {
  constructor() {
    this.found = {};          // Boss-Item-id → beste gefundene Seltenheit, z.B. { chitinShield: 'epic' }
    this.selectedTitle = null; // gewählter Gildentitel (oder null = keiner)
  }

  // Trägt ein Item ein. Gibt zurück, was passiert ist:
  //   { status: 'new' | 'improved' | null, completedPage: Seite oder null }
  //   'new' = zum ersten Mal gefunden, 'improved' = seltener als bisher, null = nichts Neues (oder kein Boss-Item)
  //   completedPage = diese Seite ist durch das Item gerade voll geworden
  record(item) {
    if (!item.bossItemId) {
      return { status: null, completedPage: null };
    }
    const before = this.found[item.bossItemId];
    let status = null;
    if (before === undefined) {
      status = 'new';
    } else if (getRarityRank(item.rarityId) > getRarityRank(before)) {
      status = 'improved';
    }
    if (status === null) {
      return { status: null, completedPage: null };
    }

    const page = this.findPageOf(item.bossItemId);
    const wasComplete = page !== null && this.isPageComplete(page);
    this.found[item.bossItemId] = item.rarityId;
    const completedPage = page !== null && !wasComplete && this.isPageComplete(page) ? page : null;
    return { status, completedPage };
  }

  // Beste gefundene Seltenheit eines Boss-Items (oder null = noch nie gefunden)
  getBestRarity(bossItemId) {
    return this.found[bossItemId] || null;
  }

  // Auf welcher Seite steht dieses Boss-Item?
  findPageOf(bossItemId) {
    for (const page of COLLECTION_PAGES) {
      if (getPageItems(page).some((entry) => entry.id === bossItemId)) {
        return page;
      }
    }
    return null;
  }

  // Alle Items der Seite mindestens einmal gefunden?
  isPageComplete(page) {
    return getPageItems(page).every((entry) => this.found[entry.id] !== undefined);
  }

  // Alle Items der Seite mindestens in der Glanz-Seltenheit (Lila) gefunden?
  isPageShiny(page) {
    return getPageItems(page).every((entry) =>
      this.found[entry.id] !== undefined && getRarityRank(this.found[entry.id]) >= getRarityRank(SHINY_RARITY));
  }

  // Wie viele Items einer Seite sind schon gefunden?
  countFoundOnPage(page) {
    return getPageItems(page).filter((entry) => this.found[entry.id] !== undefined).length;
  }

  // Fortschritt über das ganze Buch: { found, total }
  getProgress() {
    const all = getAllCollectionItems();
    return { found: all.filter((entry) => this.found[entry.id] !== undefined).length, total: all.length };
  }

  // Titel aller vollen Seiten (in der Reihenfolge der Seiten)
  getUnlockedTitles() {
    return COLLECTION_PAGES.filter((page) => this.isPageComplete(page)).map((page) => page.title);
  }

  // Wählt einen Titel (nur freigeschaltete). null = keinen Titel tragen. Gibt true zurück, wenn es geklappt hat.
  selectTitle(title) {
    if (title !== null && !this.getUnlockedTitles().includes(title)) {
      return false;
    }
    this.selectedTitle = title;
    return true;
  }

  // Gold-Bonus eines Dungeons (0, solange seine Seite nicht voll ist)
  getGoldBonus(dungeonId) {
    const page = getCollectionPage(dungeonId);
    if (page === null || !this.isPageComplete(page)) {
      return 0;
    }
    return page.goldBonus;
  }

  // ---------- Speichern ----------

  toSaveData() {
    return { found: this.found, selectedTitle: this.selectedTitle };
  }

  static fromSaveData(data) {
    const book = new CollectionBook();
    book.found = data.found;
    book.selectedTitle = data.selectedTitle;
    return book;
  }
}
