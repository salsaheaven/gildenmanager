// ============================================================
// TOPBAR – die Leiste oben: Gildenname (mit Titel aus dem Sammelbuch), Gold, aktueller Tag, Knopf "Tag beenden"
// ============================================================

import { t, getLanguage, LANGUAGES } from '../core/Language.js';
import { createSpriteCanvas } from './PixelArt.js';
import { Sound } from './Sound.js';
import { getDayPlan } from '../systems/DayPlan.js';
import { requestEndDay } from './EndDayCheck.js';

export class TopBar {
  // onReset = Funktion, die aufgerufen wird, wenn ein neues Spiel gestartet werden soll
  // onGoTo  = zu einem Bildschirm springen (aus der Nachfrage bei "Tag beenden")
  // onLanguageChange(language) = andere Sprache wählen (speichert und lädt neu, siehe main.js)
  constructor(rootElement, game, onReset, onGoTo, onLanguageChange) {
    this.root = rootElement;
    this.game = game;
    this.onReset = onReset;
    this.onLanguageChange = onLanguageChange;
    this.shownGold = null;
    this.shownDay = null;

    this.root.innerHTML = `
      <div class="guild-name"><span class="guild-name-text"></span><span class="guild-title"></span></div>
      <div class="gold"><span class="gold-icon"></span><span class="gold-amount"></span><span class="gold-wages"></span></div>
      <div class="day-counter"></div>
      <button class="end-day-button">
        <span class="end-day-label">${t('topBar.endDay')}</span>
        <span class="end-day-plan"></span>
      </button>
      <div class="menu-buttons">
        <button class="mute-button"></button>
        <button class="language-button"></button>
        <button class="reset-button">${t('topBar.reset')}</button>
      </div>
    `;

    this.root.querySelector('.gold-icon').appendChild(createSpriteCanvas('coin', 3));

    this.root.querySelector('.end-day-button').addEventListener('click', () => {
      Sound.click();
      // Fragt kurz nach, wenn noch etwas offen ist (blockiert nie)
      requestEndDay(this.game, onGoTo);
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

    // Sprache: zeigt die andere Sprache an (DE ↔ EN); Umschalten speichert und lädt die Seite neu
    const languageButton = this.root.querySelector('.language-button');
    const otherLanguage = getLanguage() === 'de' ? 'en' : 'de';
    languageButton.textContent = LANGUAGES[otherLanguage];
    languageButton.title = t('topBar.languageInfo');
    languageButton.addEventListener('click', () => {
      Sound.click();
      this.onLanguageChange(otherLanguage);
    });

    // Zweimal klicken, damit man nicht aus Versehen alles löscht
    const resetButton = this.root.querySelector('.reset-button');
    resetButton.addEventListener('click', () => {
      if (resetButton.classList.contains('confirm')) {
        this.onReset();
        return;
      }
      resetButton.classList.add('confirm');
      resetButton.textContent = t('topBar.resetConfirm');
      setTimeout(() => {
        resetButton.classList.remove('confirm');
        resetButton.textContent = t('topBar.reset');
      }, 3000);
    });
  }

  // Aktualisiert die Anzeigen (bei jeder Änderung am Spielstand)
  update() {
    // Der Name kann sich ändern (beim Gründen der Gilde), deshalb hier und nicht nur beim Start
    this.root.querySelector('.guild-name-text').textContent = this.game.guild.name;
    const guild = this.game.guild;
    const title = guild.selectedTitle;
    this.root.querySelector('.guild-title').textContent = title ? ' · ' + title : '';

    // Gold: kurz "hüpfen", wenn sich der Betrag ändert
    if (guild.gold !== this.shownGold) {
      this.bump(this.root.querySelector('.gold'), this.shownGold !== null);
      this.shownGold = guild.gold;
      this.root.querySelector('.gold-amount').textContent = guild.gold;
    }

    // Sold und Unterhalt, die heute Abend fällig werden
    const wages = this.game.getDailyWages();
    const upkeep = this.game.getDailyUpkeep();
    const costs = wages + upkeep;
    this.root.querySelector('.gold-wages').textContent = costs > 0 ? t('topBar.perDay', { costs }) : '';
    this.root.querySelector('.gold-wages').title = t('topBar.costsInfo', { wages, upkeep });

    // Tag: hüpft ebenfalls, wenn ein neuer Tag beginnt
    if (this.game.day !== this.shownDay) {
      this.bump(this.root.querySelector('.day-counter'), this.shownDay !== null);
      this.shownDay = this.game.day;
      this.root.querySelector('.day-counter').textContent = t('topBar.day', { day: this.game.day });
    }

    // Unter dem Knopf: was heute noch passiert (und wie viele Helden nichts zu tun haben)
    const runs = guild.expeditions.length;
    const freeHeroes = getDayPlan(guild).counts.rest; // nur wer sich ausruht, gilt als "frei"
    let planText = runs === 0 ? t('topBar.noGroup') : t('topBar.groupsGo', { count: runs });
    // An Raid-Tagen: der Raid statt der Gruppen
    if (guild.raidPlan.activeToday) {
      planText = t('topBar.raidGoes');
    } else if (guild.raidPlan.notReadyToday) {
      planText = t('topBar.raidNotReady');
    }
    if (freeHeroes > 0) {
      planText += t('topBar.free', { count: freeHeroes });
    }
    this.root.querySelector('.end-day-plan').textContent = planText;
    this.root.querySelector('.end-day-button').classList.toggle('has-runs', runs > 0 || guild.raidPlan.activeToday);

    this.root.querySelector('.mute-button').textContent = Sound.isMuted() ? t('topBar.soundOff') : t('topBar.soundOn');
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
