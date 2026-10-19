// ============================================================
// TOPBAR – die Leiste oben: Gildenname, Gold, Uhr, Kurier, Geschwindigkeit
// ============================================================

import { BALANCING } from '../data/balancing.js';
import { createSpriteCanvas } from './PixelArt.js';
import { Sound } from './Sound.js';

export class TopBar {
  // onReset = Funktion, die aufgerufen wird, wenn ein neues Spiel gestartet werden soll
  constructor(rootElement, game, onReset) {
    this.root = rootElement;
    this.game = game;
    this.onReset = onReset;
    this.shownGold = null;

    this.root.innerHTML = `
      <div class="guild-name"></div>
      <div class="gold"><span class="gold-icon"></span><span class="gold-amount"></span></div>
      <div class="clock">
        <span class="clock-day"></span>
        <span class="clock-time"></span>
        <span class="pause-label">PAUSE</span>
      </div>
      <div class="courier" title="Der Gildenkurier bringt regelmäßig eine Kiste">
        <span>Kurier</span>
        <div class="bar"><div class="bar-fill courier-fill"></div></div>
      </div>
      <div class="speed-buttons"></div>
      <div class="menu-buttons">
        <button class="mute-button"></button>
        <button class="reset-button">Neu</button>
      </div>
    `;

    this.root.querySelector('.gold-icon').appendChild(createSpriteCanvas('coin', 3));
    this.root.querySelector('.guild-name').textContent = game.guild.name;

    this.createSpeedButtons();
    this.setupMenuButtons();

    // Leertaste = Pause. preventDefault verhindert, dass die Leertaste
    // zusätzlich den zuletzt geklickten Knopf noch einmal drückt.
    document.addEventListener('keydown', (event) => {
      if (event.code === 'Space') {
        event.preventDefault();
        if (!event.repeat) {
          this.game.clock.togglePause();
          this.update();
        }
      }
    });
    document.addEventListener('keyup', (event) => {
      if (event.code === 'Space') {
        event.preventDefault();
      }
    });

    this.update();
  }

  createSpeedButtons() {
    const container = this.root.querySelector('.speed-buttons');

    const pauseButton = document.createElement('button');
    pauseButton.textContent = 'II';
    pauseButton.title = 'Pause (Leertaste)';
    pauseButton.dataset.speed = 'pause';
    pauseButton.addEventListener('click', () => {
      Sound.click();
      this.game.clock.togglePause();
      this.update();
    });
    container.appendChild(pauseButton);

    for (const speed of BALANCING.speeds) {
      const button = document.createElement('button');
      button.textContent = speed + 'x';
      button.dataset.speed = String(speed);
      button.addEventListener('click', () => {
        Sound.click();
        this.game.clock.setSpeed(speed);
        this.update();
      });
      container.appendChild(button);
    }
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

  // Wird in jedem Bild aufgerufen und aktualisiert die Anzeigen
  update() {
    const clock = this.game.clock;
    const guild = this.game.guild;

    // Gold: kurz "hüpfen", wenn sich der Betrag ändert
    if (guild.gold !== this.shownGold) {
      const goldElement = this.root.querySelector('.gold');
      if (this.shownGold !== null) {
        goldElement.classList.remove('bump');
        void goldElement.offsetWidth; // Trick, damit die Animation neu startet
        goldElement.classList.add('bump');
      }
      this.shownGold = guild.gold;
      this.root.querySelector('.gold-amount').textContent = guild.gold;
    }

    this.root.querySelector('.clock-day').textContent = 'Tag ' + clock.getDay();
    this.root.querySelector('.clock-time').textContent = clock.getTimeText();
    this.root.querySelector('.clock').classList.toggle('paused', clock.paused);
    this.root.querySelector('.courier-fill').style.width = this.game.getCourierProgress() * 100 + '%';

    // Aktiven Geschwindigkeits-Knopf hervorheben
    for (const button of this.root.querySelectorAll('.speed-buttons button')) {
      let isActive;
      if (button.dataset.speed === 'pause') {
        isActive = clock.paused;
      } else {
        isActive = !clock.paused && Number(button.dataset.speed) === clock.speed;
      }
      button.classList.toggle('active', isActive);
    }

    this.root.querySelector('.mute-button').textContent = Sound.isMuted() ? 'Ton: aus' : 'Ton: an';
  }
}
