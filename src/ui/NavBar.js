// ============================================================
// NAVBAR – die Leiste mit den 5 Abschnitten (Heute, Helden, Dungeons, Beute, Gilde)
// und darunter die Unterreiter des gewählten Abschnitts (z.B. Helden: Übersicht | Taverne).
// Auf dem Handy steht die Abschnitts-Leiste unten am Bildschirm (siehe main.css).
// Abzeichen ("3", "!", "★") hängen an einem Bildschirm. Der Abschnitt zeigt das erste Abzeichen seiner Bildschirme.
// Ein Abschnitt kann zusätzlich Knöpfe haben, die ein Fenster öffnen statt einen Bildschirm (z.B. Inventar).
// Noch nicht freigeschaltete Bildschirme und Knöpfe sind ausgeblendet (setHidden), ein Abschnitt ohne Sichtbares ebenfalls.
// ============================================================

import { Sound } from './Sound.js';

export class NavBar {
  // sectionRoot = Leiste der Abschnitte, subRoot = Leiste der Unterreiter
  // sections = [{ id, name, screens: [{ id, name }] }], onSelect(screenId) = Bildschirm wechseln
  constructor(sectionRoot, subRoot, sections, onSelect) {
    this.sectionRoot = sectionRoot;
    this.subRoot = subRoot;
    this.sections = sections;
    this.onSelect = onSelect;
    this.badges = {};        // Bildschirm-id → Text des Abzeichens
    this.extraButtons = {};  // Abschnitt-id → [{ id, name, onClick }]
    this.activeScreenId = null;
    this.hiddenIds = [];     // ausgeblendete Bildschirme und Extra-Knöpfe (noch nicht freigeschaltet)
    this.sectionButtons = {};

    for (const section of sections) {
      const button = document.createElement('button');
      button.className = 'nav-tab';
      button.innerHTML = '<span class="nav-name"></span><span class="nav-badge" hidden></span>';
      button.querySelector('.nav-name').textContent = section.name;
      button.addEventListener('click', () => {
        Sound.click();
        // Ein Abschnitt öffnet seinen ersten Bildschirm (bleibt, wenn man schon darin ist)
        if (this.getSectionOf(this.activeScreenId) !== section) {
          this.onSelect(this.getVisibleScreens(section)[0].id);
        }
      });
      this.sectionRoot.appendChild(button);
      this.sectionButtons[section.id] = button;
    }
  }

  // Zu welchem Abschnitt gehört ein Bildschirm? (null, wenn zu keinem, z.B. das Kampf-Labor)
  getSectionOf(screenId) {
    return this.sections.find((section) => section.screens.some((screen) => screen.id === screenId)) || null;
  }

  // Ein Knopf in den Unterreitern eines Abschnitts, der kein Bildschirm ist (z.B. "Inventar" öffnet ein Fenster)
  addExtraButton(sectionId, id, name, onClick) {
    if (!this.extraButtons[sectionId]) {
      this.extraButtons[sectionId] = [];
    }
    this.extraButtons[sectionId].push({ id, name, onClick });
    this.render();
  }

  setActive(screenId) {
    this.activeScreenId = screenId;
    this.render();
  }

  // Blendet Bildschirme und Extra-Knöpfe aus (ids), z.B. ['tavern', 'hall'] solange sie gesperrt sind
  setHidden(ids) {
    this.hiddenIds = ids;
    this.render();
  }

  // Sichtbare Bildschirme und Extra-Knöpfe eines Abschnitts
  getVisibleScreens(section) {
    return section.screens.filter((screen) => !this.hiddenIds.includes(screen.id));
  }

  getVisibleExtras(section) {
    return (this.extraButtons[section.id] || []).filter((extra) => !this.hiddenIds.includes(extra.id));
  }

  // text = was im Abzeichen steht (z.B. "3" oder "!"). Leer = Abzeichen ausblenden.
  setBadge(id, text) {
    this.badges[id] = text || '';
    this.render();
  }

  render() {
    const activeSection = this.getSectionOf(this.activeScreenId);

    // Abschnitte: aktiv markieren, Abzeichen = erstes Abzeichen eines Bildschirms oder Extra-Knopfs darin
    for (const section of this.sections) {
      const button = this.sectionButtons[section.id];
      button.classList.toggle('active', section === activeSection);
      button.hidden = this.getVisibleScreens(section).length === 0;
      const ids = this.getVisibleScreens(section).map((screen) => screen.id).concat(this.getVisibleExtras(section).map((extra) => extra.id));
      const badgeText = ids.map((id) => this.badges[id]).find((text) => text) || '';
      setBadgeElement(button.querySelector('.nav-badge'), badgeText);
    }

    // Unterreiter des aktiven Abschnitts (nur, wenn es mehr als einen Eintrag gibt)
    this.subRoot.innerHTML = '';
    if (!activeSection) {
      this.subRoot.hidden = true;
      return;
    }
    const screens = this.getVisibleScreens(activeSection);
    const extras = this.getVisibleExtras(activeSection);
    this.subRoot.hidden = screens.length + extras.length <= 1;
    for (const screen of screens) {
      const button = this.createSubButton(screen.name, this.badges[screen.id]);
      button.classList.toggle('active', screen.id === this.activeScreenId);
      button.addEventListener('click', () => {
        Sound.click();
        this.onSelect(screen.id);
      });
      this.subRoot.appendChild(button);
    }
    for (const extra of extras) {
      const button = this.createSubButton(extra.name, this.badges[extra.id]);
      button.classList.add('sub-extra');
      button.addEventListener('click', () => {
        Sound.click();
        extra.onClick();
      });
      this.subRoot.appendChild(button);
    }
  }

  createSubButton(name, badgeText) {
    const button = document.createElement('button');
    button.className = 'sub-tab';
    button.innerHTML = '<span class="nav-name"></span><span class="nav-badge" hidden></span>';
    button.querySelector('.nav-name').textContent = name;
    setBadgeElement(button.querySelector('.nav-badge'), badgeText);
    return button;
  }
}

function setBadgeElement(element, text) {
  element.hidden = !text;
  element.textContent = text || '';
}
