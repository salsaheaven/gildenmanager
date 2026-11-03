// ============================================================
// FOUNDINGSCREEN – Startbildschirm "Gründe deine Gilde" (Vollbild, nur bei einem neuen Spielstand)
//   - Gildenname eingeben
//   - die 5 Helden der festen Starttruppe ansehen (Bild, Klasse, Position, Rüstungsart)
//   - "Los geht's" gründet die Gilde (Game.foundGuild), danach verschwindet der Bildschirm
// Die Starttruppe steht in data/startTeam.js (für alle gleich).
// ============================================================

import { START_TEAM_CLASSES, START_TEAM_RULES } from '../data/startTeam.js';
import { getHeroClass } from '../data/heroClasses.js';
import { getPositionId, getPositionName } from '../data/groupRules.js';
import { ARMOR_TYPES } from '../data/items.js';
import { createSpriteCanvas } from './PixelArt.js';
import { Sound } from './Sound.js';

// Haut- und Haarfarbe für die Vorschaubilder (die echten Helden bekommen zufällige Farben)
const PREVIEW_LOOKS = { skin: '#f1c39b', hair: '#6b3f17' };

export class FoundingScreen {
  // onFounded = wird aufgerufen, wenn die Gilde gegründet ist
  constructor(game, onFounded) {
    this.game = game;
    this.onFounded = onFounded;

    this.root = document.createElement('div');
    this.root.className = 'founding-screen';
    this.root.innerHTML = `
      <div class="founding-box">
        <h1>Gründe deine Gilde</h1>
        <label class="founding-name">
          Name der Gilde
          <input type="text" maxlength="${START_TEAM_RULES.maxGuildNameLength}" placeholder="${START_TEAM_RULES.defaultGuildName}">
        </label>
        <p class="hint">Diese fünf Helden schließen sich dir an. Weitere Helden findest du später in der Taverne.</p>
        <div class="founding-team"></div>
        <div class="founding-footer">
          <button class="big-button founding-start-button">Los geht's!</button>
        </div>
      </div>
    `;
    const team = this.root.querySelector('.founding-team');
    for (const classId of START_TEAM_CLASSES) {
      team.appendChild(createHeroPreview(getHeroClass(classId)));
    }
    document.body.appendChild(this.root);
    document.body.classList.add('overlay-open');

    this.root.querySelector('.founding-start-button').addEventListener('click', () => this.found());
  }

  found() {
    const name = this.root.querySelector('.founding-name input').value;
    if (this.game.foundGuild(name) !== 'ok') {
      return;
    }
    Sound.levelUp();
    this.root.remove();
    document.body.classList.remove('overlay-open');
    this.onFounded();
  }
}

// Ein Held der Starttruppe: Bild, Klasse, Position und Rüstungsart
function createHeroPreview(heroClass) {
  const card = document.createElement('div');
  card.className = 'founding-hero';
  card.style.setProperty('--class-color', heroClass.color);
  card.appendChild(createSpriteCanvas(heroClass.sprite, 3, { C: heroClass.color, h: PREVIEW_LOOKS.skin, H: PREVIEW_LOOKS.hair }));
  card.insertAdjacentHTML('beforeend', '<span class="founding-hero-text"><b></b><span class="hint"></span></span>');
  card.querySelector('b').textContent = heroClass.name;
  card.querySelector('.hint').textContent = getPositionName(getPositionId(heroClass)) + ' · ' + ARMOR_TYPES[heroClass.armorType].name;
  return card;
}
