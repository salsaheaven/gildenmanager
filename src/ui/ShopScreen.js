// ============================================================
// SHOPSCREEN – der Händler (Abschnitt "Gilde"): Verbrauchsgüter kaufen, dazu die Vorratskammer
//   - Grundware, die es immer gibt (Heiltränke, Manatränke, Verbandszeug)
//   - das Tagesangebot (3 wechselnde Waren)
//   - die Vorratskammer: was die Gilde schon hat (gekauft oder im Alchemielabor gebraut)
// Die Waren stehen in data/consumables.js.
// ============================================================

import { CONSUMABLES, SUPPLY_SLOTS } from '../data/consumables.js';
import { createSpriteCanvas } from './PixelArt.js';
import { Sound } from './Sound.js';
import { showToast } from './Toast.js';

export class ShopScreen {
  constructor(rootElement, game) {
    this.root = rootElement;
    this.game = game;
    this.root.innerHTML = `
      <section class="panel shop-screen">
        <h2>Händler</h2>
        <p class="hint shop-hint"></p>
        <h3>Immer da</h3>
        <div class="shop-list shop-always"></div>
        <h3>Heute im Angebot</h3>
        <div class="shop-list shop-daily"></div>
        <h3>Vorratskammer</h3>
        <div class="supply-storage"></div>
      </section>
    `;
    game.on('changed', () => this.render());
    this.render();
  }

  render() {
    this.renderShop();
    this.renderStorage();
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
}
