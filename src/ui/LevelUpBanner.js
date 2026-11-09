// ============================================================
// LEVELUPBANNER – großes "LEVEL UP!" in der Mitte des Bildschirms
// Steigen mehrere Helden auf einmal auf, zeigt EIN Banner alle zusammen.
// Ein Klick auf das Banner schließt es.
// hold() hält Banner zurück (z.B. während der Tagesabschluss die Kämpfe zeigt), release() zeigt sie dann.
// ============================================================

import { createHeroCanvas } from './PixelArt.js';
import { Sound } from './Sound.js';

// So lange bleibt ein Banner stehen (Millisekunden)
const SHOW_TIME = 2200;
// Höchstens so viele Porträts auf einem Banner
const MAX_PORTRAITS = 6;

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

  // Zeigt alle wartenden Level-Ups auf EINEM Banner (bei mehreren: Porträts nebeneinander, Namen in einer Zeile)
  showNext() {
    clearTimeout(this.timer);
    const batch = this.queue.splice(0);
    if (batch.length === 0) {
      this.isShowing = false;
      this.root.hidden = true;
      return;
    }
    this.isShowing = true;
    this.root.hidden = false;
    // Farbe: die seltenste Heldin bzw. der seltenste Held im Banner
    const rarest = batch.reduce((best, entry) => entry.hero.getRarityRank() > best.hero.getRarityRank() ? entry : best, batch[0]);
    this.root.style.setProperty('--rarity', rarest.hero.getRarity().color);
    this.root.innerHTML = `
      <div class="level-up-rays"></div>
      <div class="level-up-card">
        <div class="level-up-portrait"></div>
        <div class="level-up-title">Level Up!</div>
        <div class="level-up-text"></div>
      </div>
    `;
    const portrait = this.root.querySelector('.level-up-portrait');
    const scale = batch.length === 1 ? 6 : 3;
    for (const entry of batch.slice(0, MAX_PORTRAITS)) {
      portrait.appendChild(createHeroCanvas(entry.hero, scale));
    }
    // Ist (z.B. durch eine neue Talentreihe) ein Talent frei? Dann gleich darauf hinweisen
    const talentFree = batch.some((entry) => entry.hero.getFreeTalentPicks() > 0);
    let text;
    if (batch.length === 1) {
      text = batch[0].hero.name + ' erreicht Level ' + batch[0].newLevel + '!';
    } else {
      text = batch.length + ' Helden steigen auf: ' +
        batch.map((entry) => entry.hero.name.split(' ')[0] + ' ' + entry.newLevel).join(', ');
    }
    this.root.querySelector('.level-up-text').textContent = text + (talentFree ? ' Talent frei!' : '');
    Sound.levelUp();
    this.timer = setTimeout(() => this.showNext(), SHOW_TIME);
  }
}
