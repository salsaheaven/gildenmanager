// ============================================================
// HERODETAILPANEL – zeigt alles über einen Helden:
// Bild, Name, Klasse, Eigenschaften, Werte, Skills und die 6 Ausrüstungsplätze.
// Klick auf einen Ausrüstungsplatz filtert rechts die passende Ausrüstung.
// ============================================================

import { ROLE_NAMES, ROW_NAMES } from '../data/heroClasses.js';
import { ABILITIES } from '../data/abilities.js';
import { SLOT_NAMES, STAT_NAMES } from '../data/items.js';
import { EQUIPMENT_SLOTS } from '../entities/Hero.js';
import { createHeroCanvas, createItemCanvas } from './PixelArt.js';
import { createTraitChip } from './TraitChip.js';
import { Sound } from './Sound.js';
import { showToast } from './Toast.js';
import { renderOrders } from './OrdersPanel.js';

export class HeroDetailPanel {
  // callbacks = { onSlotClicked(slot), onDismissed(), onGoToTavern() }
  constructor(rootElement, game, callbacks) {
    this.root = rootElement;
    this.game = game;
    this.callbacks = callbacks;
    this.hero = null;
  }

  showHero(hero) {
    this.hero = hero;
    if (!hero) {
      this.root.innerHTML = `
        <p class="empty">Wähle links einen Helden aus.</p>
        <button class="go-tavern-button">Zur Taverne</button>
      `;
      this.root.querySelector('.go-tavern-button').addEventListener('click', () => this.callbacks.onGoToTavern());
      return;
    }

    const heroClass = hero.getClass();
    const rarity = hero.getRarity();
    this.root.style.setProperty('--rarity', rarity.color);
    this.root.innerHTML = `
      <div class="detail-top">
        <div class="detail-portrait"></div>
        <div class="detail-info">
          <div class="detail-hero-name"></div>
          <div class="detail-hero-rarity">${rarity.name}</div>
          <div class="detail-hero-class">${heroClass.name} · ${ROLE_NAMES[heroClass.role]} · steht ${ROW_NAMES[heroClass.row]}</div>
          <div class="detail-level">
            <span>Level ${hero.level}</span>
            <div class="bar" title="Erfahrung gibt es für gewonnene Begegnungen in Dungeons"><div class="bar-fill xp-fill" style="width: ${Math.round(hero.getXpProgress() * 100)}%"></div></div>
          </div>
          <div class="detail-xp">${hero.isMaxLevel() ? 'Höchstes Level erreicht!' : hero.xp + ' / ' + hero.getXpForNextLevel() + ' EP'}</div>
          <div class="detail-injury"></div>
          <div class="trait-list"></div>
        </div>
      </div>

      <div class="detail-columns">
        <div>
          <h3>Werte</h3>
          <table class="stat-table"></table>
          <div class="gear-score">Ausrüstungswert: <b>${hero.getGearScore()}</b></div>
        </div>
        <div>
          <h3>Skills</h3>
          <ul class="skill-list"></ul>
        </div>
      </div>

      <h3>Ausrüstung</h3>
      <div class="equipment-grid"></div>

      <h3>Anweisungen für den Kampf</h3>
      <div class="hero-orders"></div>

      <div class="detail-actions">
        <button class="dismiss-button">Entlassen</button>
      </div>
    `;

    this.root.querySelector('.detail-portrait').appendChild(createHeroCanvas(hero, 9));
    this.root.querySelector('.detail-hero-name').textContent = hero.name;
    if (hero.isInjured()) {
      const days = hero.injuryDays === 1 ? '1 Tag' : hero.injuryDays + ' Tage';
      this.root.querySelector('.detail-injury').textContent = 'Verletzt, noch ' + days + ' – kann nicht in Dungeons';
    }

    const traitList = this.root.querySelector('.trait-list');
    for (const trait of hero.getTraits()) {
      traitList.appendChild(createTraitChip(trait));
    }

    this.renderStats();
    this.renderSkills();
    this.renderEquipment();
    renderOrders(this.root.querySelector('.hero-orders'), [hero], (changedHero, orderId, optionId) => {
      this.game.setHeroOrder(changedHero.id, orderId, optionId);
    }, false);
    this.setupDismissButton();
  }

  // Tabelle: fertiger Wert, dazu in Grün der Bonus durch Ausrüstung und Eigenschaften
  renderStats() {
    const table = this.root.querySelector('.stat-table');
    const baseStats = this.hero.getBaseStats();
    const stats = this.hero.getStats();
    for (const statName in stats) {
      const bonus = stats[statName] - Math.round(baseStats[statName]);
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${STAT_NAMES[statName]}</td>
        <td class="stat-value">${stats[statName]}</td>
        <td class="stat-bonus" title="Bonus durch Ausrüstung und Eigenschaften">${bonus > 0 ? '(+' + bonus + ')' : ''}</td>
      `;
      table.appendChild(row);
    }
  }

  renderSkills() {
    const list = this.root.querySelector('.skill-list');
    for (const abilityId of this.hero.getClass().abilities) {
      const ability = ABILITIES[abilityId];
      const line = document.createElement('li');
      line.innerHTML = '<b></b><span></span>';
      line.querySelector('b').textContent = ability.name;
      line.querySelector('span').textContent = ability.description;
      list.appendChild(line);
    }
  }

  // Die 6 Plätze. Klick auf einen Platz zeigt rechts passende Items.
  // Klick auf das kleine x nimmt das Item ab.
  renderEquipment() {
    const grid = this.root.querySelector('.equipment-grid');
    for (const slot of EQUIPMENT_SLOTS) {
      const item = this.hero.equipment[slot];
      const slotElement = document.createElement('div');
      slotElement.className = 'equipment-slot';
      slotElement.innerHTML = `<div class="slot-icon"></div><div class="slot-label">${SLOT_NAMES[slot]}</div>`;

      if (item) {
        slotElement.style.setProperty('--rarity', item.getRarity().color);
        slotElement.classList.add('filled');
        slotElement.title = item.name;
        slotElement.querySelector('.slot-icon').appendChild(createItemCanvas(item, 3));

        const removeButton = document.createElement('button');
        removeButton.className = 'unequip-button';
        removeButton.textContent = 'x';
        removeButton.title = 'Ablegen';
        removeButton.addEventListener('click', (event) => {
          event.stopPropagation();
          Sound.click();
          this.game.unequipItem(this.hero.id, slot);
        });
        slotElement.appendChild(removeButton);
      }

      slotElement.addEventListener('click', () => {
        Sound.click();
        this.callbacks.onSlotClicked(slot);
      });
      grid.appendChild(slotElement);
    }
  }

  // Zweimal klicken, damit man nicht aus Versehen einen Helden verliert
  setupDismissButton() {
    const button = this.root.querySelector('.dismiss-button');
    if (this.game.guild.isHeroBusy(this.hero.id)) {
      button.disabled = true;
      button.textContent = 'Heute eingeplant';
      return;
    }
    button.addEventListener('click', () => {
      if (button.classList.contains('confirm')) {
        const name = this.hero.name;
        this.game.dismissHero(this.hero.id);
        showToast(name + ' hat die Gilde verlassen.', '#9d9d9d');
        this.callbacks.onDismissed();
        return;
      }
      button.classList.add('confirm');
      button.textContent = 'Wirklich entlassen?';
    });
  }
}
