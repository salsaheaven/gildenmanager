// ============================================================
// NAVBAR – die Reiter unter der oberen Leiste (Schatzkammer, Helden, Taverne)
// Kleine Abzeichen zeigen, wo etwas Neues wartet.
// ============================================================

import { Sound } from './Sound.js';

export class NavBar {
  // tabs = Liste von { id, name }, onSelect = Funktion, die beim Klick aufgerufen wird
  constructor(rootElement, tabs, onSelect) {
    this.root = rootElement;
    this.buttons = {};

    for (const tab of tabs) {
      const button = document.createElement('button');
      button.className = 'nav-tab';
      button.innerHTML = '<span class="nav-name"></span><span class="nav-badge" hidden></span>';
      button.querySelector('.nav-name').textContent = tab.name;
      button.addEventListener('click', () => {
        Sound.click();
        onSelect(tab.id);
      });
      this.root.appendChild(button);
      this.buttons[tab.id] = button;
    }
  }

  setActive(tabId) {
    for (const id in this.buttons) {
      this.buttons[id].classList.toggle('active', id === tabId);
    }
  }

  // text = was im Abzeichen steht (z.B. "3" oder "!"). Leer = Abzeichen ausblenden.
  setBadge(tabId, text) {
    const badge = this.buttons[tabId].querySelector('.nav-badge');
    badge.hidden = !text;
    badge.textContent = text || '';
  }
}
