// ============================================================
// LEVELUPBANNER – großes "LEVEL UP!" in der Mitte des Bildschirms
// Steigen mehrere Helden auf einmal auf, kommen die Banner nacheinander.
// Ein Klick auf das Banner zeigt sofort das nächste.
// hold() hält Banner zurück (z.B. während der Tagesabschluss die Kämpfe zeigt), release() zeigt sie dann.
// ============================================================

import { createHeroCanvas } from './PixelArt.js';
import { Sound } from './Sound.js';

// So lange bleibt ein Banner stehen (Millisekunden)
const SHOW_TIME = 2200;

export class LevelUpBanner {
  constructor() {
    this.queue = [];     // wartende Level-Ups: { hero, newLevel }
    this.isShowing = false;
    this.isHeld = false;
    this.timer = null;

    this.root = document.createElement('div');
    this.root.className = 'level-up-banner';
    this.root.hidden = true;
    document.body.appendChild(this.root);

    this.root.addEventListener('click', () => this.showNext());
  }

  // Ein Level-Up anzeigen (oder hinten anstellen, wenn gerade eins läuft)
  show(hero, newLevel) {
    this.queue.push({ hero, newLevel });
    if (!this.isShowing && !this.isHeld) {
      this.showNext();
    }
  }

  // Banner vorerst nur sammeln, nicht zeigen
  hold() {
    this.isHeld = true;
  }

  // Gesammelte Banner jetzt zeigen
  release() {
    this.isHeld = false;
    if (!this.isShowing) {
      this.showNext();
    }
  }

  showNext() {
    clearTimeout(this.timer);
    const next = this.queue.shift();
    if (!next) {
      this.isShowing = false;
      this.root.hidden = true;
      return;
    }
    this.isShowing = true;
    this.root.hidden = false;
    this.root.style.setProperty('--rarity', next.hero.getRarity().color);
    this.root.innerHTML = `
      <div class="level-up-rays"></div>
      <div class="level-up-card">
        <div class="level-up-portrait"></div>
        <div class="level-up-title">Level Up!</div>
        <div class="level-up-text"></div>
      </div>
    `;
    this.root.querySelector('.level-up-portrait').appendChild(createHeroCanvas(next.hero, 6));
    this.root.querySelector('.level-up-text').textContent = next.hero.name + ' erreicht Level ' + next.newLevel + '!';
    Sound.levelUp();
    this.timer = setTimeout(() => this.showNext(), SHOW_TIME);
  }
}
