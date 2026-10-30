// ============================================================
// HEROSCREEN – die Heldenübersicht
// Links: Liste aller Helden. Mitte: Details des gewählten Helden.
// Rechts: Ausrüstungsliste für den Platz, auf den man in der Mitte getippt hat.
// ============================================================

import { createHeroCanvas } from './PixelArt.js';
import { HeroDetailPanel } from './HeroDetailPanel.js';
import { EquipPanel } from './EquipPanel.js';
import { Sound } from './Sound.js';

export class HeroScreen {
  // onGoToTavern = Funktion, die zur Taverne wechselt (für den Hinweis bei leerer Gilde)
  // inventory    = das InventoryOverlay (für die "neu"-Markierung in der Ausrüstungsliste)
  constructor(rootElement, game, onGoToTavern, inventory) {
    this.root = rootElement;
    this.game = game;
    this.selectedHeroId = null;
    this.selectedSlot = null; // Ausrüstungsplatz, dessen Liste rechts gezeigt wird

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
      onSlotClicked: (slot) => {
        this.selectedSlot = slot;
        this.render();
        // Auf dem Handy steht die Ausrüstungsliste weit unten: dorthin scrollen
        if (window.innerWidth <= 700) {
          this.root.querySelector('.equip-panel').scrollIntoView({ behavior: 'smooth' });
        }
      },
      onDismissed: () => {
        this.selectedHeroId = null;
        this.render();
      },
      onGoToTavern: onGoToTavern,
    });
    this.equipPanel = new EquipPanel(this.root.querySelector('.equip-panel'), game, inventory);

    game.on('changed', () => this.render());
    this.render();
  }

  render() {
    const heroes = this.game.guild.heroes;

    // Wenn noch kein Held gewählt ist (oder er weg ist), den ersten wählen
    if (!this.game.guild.findHero(this.selectedHeroId)) {
      this.selectedHeroId = heroes.length > 0 ? heroes[0].id : null;
    }

    this.root.querySelector('.roster-count').textContent = '(' + heroes.length + ' / ' + this.game.guild.getMaxHeroes() + ')';
    const list = this.root.querySelector('.roster-list');
    list.innerHTML = '';
    for (const hero of heroes) {
      list.appendChild(this.createRosterEntry(hero));
    }
    if (heroes.length === 0) {
      list.innerHTML = '<p class="empty">Noch keine Helden. Heuere welche in der Taverne an!</p>';
    }

    const selectedHero = this.game.guild.findHero(this.selectedHeroId);
    this.detailPanel.showHero(selectedHero, this.selectedSlot);
    this.equipPanel.show(selectedHero, this.selectedSlot);
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
        <span class="roster-sub">${hero.getClass().name} · Lv ${hero.level} · AW ${hero.getGearScore()}${this.game.guild.isHeroBusy(hero.id) ? ' · heute im Dungeon' : ''}${hero.isInjured() ? ' · verletzt' : ''}${hero.isUnhappy() ? ' · <span class="unhappy-chip">unzufrieden</span>' : ''}${hero.getFreeTalentPicks() > 0 ? ' · <span class="talent-free-chip">Talent frei!</span>' : ''}</span>
      </span>
    `);
    entry.querySelector('.roster-name').textContent = hero.name;

    entry.addEventListener('click', () => {
      Sound.click();
      this.selectedHeroId = hero.id;
      this.render();
    });
    return entry;
  }
}
