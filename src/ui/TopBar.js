// ============================================================
// TOPBAR – die Leiste oben: Gildenname, Gold, aktueller Tag, Knopf "Tag beenden"
// ============================================================

import { createSpriteCanvas } from './PixelArt.js';
import { Sound } from './Sound.js';
import { getDayPlan } from '../systems/DayPlan.js';

export class TopBar {
  // onReset = Funktion, die aufgerufen wird, wenn ein neues Spiel gestartet werden soll
  constructor(rootElement, game, onReset) {
    this.root = rootElement;
    this.game = game;
    this.onReset = onReset;
    this.shownGold = null;
    this.shownDay = null;

    this.root.innerHTML = `
      <div class="guild-name"></div>
      <div class="gold"><span class="gold-icon"></span><span class="gold-amount"></span></div>
      <div class="day-counter"></div>
      <button class="end-day-button">
        <span class="end-day-label">Tag beenden ▶</span>
        <span class="end-day-plan"></span>
      </button>
      <div class="menu-buttons">
        <button class="mute-button"></button>
        <button class="reset-button">Neu</button>
      </div>
    `;

    this.root.querySelector('.gold-icon').appendChild(createSpriteCanvas('coin', 3));
    this.root.querySelector('.guild-name').textContent = game.guild.name;

    this.root.querySelector('.end-day-button').addEventListener('click', () => {
      Sound.click();
      this.game.endDay();
    });
    this.setupMenuButtons();

    game.on('changed', () => this.update());
    this.update();
  }

  setupMenuButtons() {
    const muteButton = this.root.querySelector('.mute-button');
    muteButton.addEventListener('click', () => {
      Sound.toggleMuted();
      Sound.click();
      this.update();
    });

    // Zweimal klicken, damit man nicht aus Versehen alles löscht
    const resetButton = this.root.querySelector('.reset-button');
    resetButton.addEventListener('click', () => {
      if (resetButton.classList.contains('confirm')) {
        this.onReset();
        return;
      }
      resetButton.classList.add('confirm');
      resetButton.textContent = 'Sicher?';
      setTimeout(() => {
        resetButton.classList.remove('confirm');
        resetButton.textContent = 'Neu';
      }, 3000);
    });
  }

  // Aktualisiert die Anzeigen (bei jeder Änderung am Spielstand)
  update() {
    const guild = this.game.guild;

    // Gold: kurz "hüpfen", wenn sich der Betrag ändert
    if (guild.gold !== this.shownGold) {
      this.bump(this.root.querySelector('.gold'), this.shownGold !== null);
      this.shownGold = guild.gold;
      this.root.querySelector('.gold-amount').textContent = guild.gold;
    }

    // Tag: hüpft ebenfalls, wenn ein neuer Tag beginnt
    if (this.game.day !== this.shownDay) {
      this.bump(this.root.querySelector('.day-counter'), this.shownDay !== null);
      this.shownDay = this.game.day;
      this.root.querySelector('.day-counter').textContent = 'Tag ' + this.game.day;
    }

    // Unter dem Knopf: was heute noch passiert (und wie viele Helden nichts zu tun haben)
    const runs = guild.expeditions.length;
    const freeHeroes = getDayPlan(guild).counts.rest;
    let planText = runs === 0 ? 'Keine Gruppe eingeplant' : (runs === 1 ? '1 Gruppe zieht los' : runs + ' Gruppen ziehen los');
    if (freeHeroes > 0) {
      planText += ' · ' + freeHeroes + ' frei';
    }
    this.root.querySelector('.end-day-plan').textContent = planText;
    this.root.querySelector('.end-day-button').classList.toggle('has-runs', runs > 0);

    this.root.querySelector('.mute-button').textContent = Sound.isMuted() ? 'Ton: aus' : 'Ton: an';
  }

  // Kleine Hüpf-Animation (nicht beim allerersten Anzeigen)
  bump(element, animate) {
    if (!animate) {
      return;
    }
    element.classList.remove('bump');
    void element.offsetWidth; // Trick, damit die Animation neu startet
    element.classList.add('bump');
  }
}
