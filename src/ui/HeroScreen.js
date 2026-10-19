// ============================================================
// HEROSCREEN – die Heldenübersicht
// Links: Liste aller Helden. Mitte: Details des gewählten Helden.
// Rechts: passende Ausrüstung aus dem Inventar.
// ============================================================

import { BALANCING } from '../data/balancing.js';
import { createHeroCanvas } from './PixelArt.js';
import { HeroDetailPanel } from './HeroDetailPanel.js';
import { EquipPanel } from './EquipPanel.js';
import { Sound } from './Sound.js';

export class HeroScreen {
  // onGoToTavern = Funktion, die zur Taverne wechselt (für den Hinweis bei leerer Gilde)
  constructor(rootElement, game, onGoToTavern) {
    this.root = rootElement;
    this.game = game;
    this.selectedHeroId = null;

    this.root.innerHTML = `
      <div class="hero-screen">
        <section class="panel roster">
          <h2>Helden <span class="roster-count"></span></h2>
          <div class="roster-list"></div>
        </section>
        <section class="panel hero-detail"></section>
        <section class="panel equip-panel"></section>
      </div>
    `;

    this.detailPanel = new HeroDetailPanel(this.root.querySelector('.hero-detail'), game, {
      onSlotClicked: (slot) => this.equipPanel.setSlotFilter(slot),
      onDismissed: () => {
        this.selectedHeroId = null;
        this.render();
      },
      onGoToTavern: onGoToTavern,
    });
    this.equipPanel = new EquipPanel(this.root.querySelector('.equip-panel'), game);

    game.on('changed', () => this.render());
    this.render();
  }

  render() {
    const heroes = this.game.guild.heroes;

    // Wenn noch kein Held gewählt ist (oder er weg ist), den ersten wählen
    if (!this.game.guild.findHero(this.selectedHeroId)) {
      this.selectedHeroId = heroes.length > 0 ? heroes[0].id : null;
    }

    this.root.querySelector('.roster-count').textContent = '(' + heroes.length + ' / ' + BALANCING.maxHeroes + ')';
    const list = this.root.querySelector('.roster-list');
    list.innerHTML = '';
    for (const hero of heroes) {
      list.appendChild(this.createRosterEntry(hero));
    }
    if (heroes.length === 0) {
      list.innerHTML = '<p class="empty">Noch keine Helden. Heuere welche in der Taverne an!</p>';
    }

    const selectedHero = this.game.guild.findHero(this.selectedHeroId);
    this.detailPanel.showHero(selectedHero);
    this.equipPanel.showHero(selectedHero);
  }

  createRosterEntry(hero) {
    const rarity = hero.getRarity();
    const entry = document.createElement('button');
    entry.className = 'roster-entry';
    entry.style.setProperty('--rarity', rarity.color);
    entry.classList.toggle('selected', hero.id === this.selectedHeroId);
    entry.appendChild(createHeroCanvas(hero, 3));
    entry.insertAdjacentHTML('beforeend', `
      <span class="roster-text">
        <span class="roster-name"></span>
        <span class="roster-sub">${hero.getClass().name} · Lv ${hero.level} · AW ${hero.getGearScore()}${this.game.guild.isHeroBusy(hero.id) ? ' · unterwegs' : ''}</span>
      </span>
    `);
    entry.querySelector('.roster-name').textContent = hero.name;

    // Grüner Pfeil, wenn im Inventar etwas Besseres für diesen Helden liegt
    if (this.hasUpgradeWaiting(hero)) {
      entry.insertAdjacentHTML('beforeend', '<span class="upgrade-arrow" title="Bessere Ausrüstung verfügbar">▲</span>');
    }

    entry.addEventListener('click', () => {
      Sound.click();
      this.selectedHeroId = hero.id;
      this.render();
    });
    return entry;
  }

  hasUpgradeWaiting(hero) {
    for (const item of this.game.guild.inventory) {
      if (hero.canEquip(item) && hero.getUpgradeValue(item) > 0) {
        return true;
      }
    }
    return false;
  }
}
