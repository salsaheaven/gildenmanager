// ============================================================
// FOUNDINGSCREEN – Startbildschirm "Gründe deine Gilde" (Vollbild, nur bei einem neuen Spielstand)
//   - Gildenname eingeben
//   - für jeden der 5 Plätze (Tank, 2× Schadensmacher, Unterstützer, Heiler) eine Klasse antippen
//   - Anzeige, welche Rüstungsarten schon dabei sind (Platte, Leder, Stoff müssen alle vorkommen)
//   - "Los geht's" gründet die Gilde (Game.foundGuild), danach verschwindet der Bildschirm
// Plätze und Regeln stehen in data/startTeam.js, die Prüfung in systems/StartTeam.js.
// ============================================================

import { START_TEAM_SLOTS, START_TEAM_RULES } from '../data/startTeam.js';
import { ARMOR_TYPES } from '../data/items.js';
import { ABILITIES } from '../data/abilities.js';
import { getClassesForSlot, getMissingArmorTypes, checkStartTeam } from '../systems/StartTeam.js';
import { createSpriteCanvas } from './PixelArt.js';
import { Sound } from './Sound.js';

// Haut- und Haarfarbe für die Vorschaubilder (die echten Helden bekommen zufällige Farben)
const PREVIEW_LOOKS = { skin: '#f1c39b', hair: '#6b3f17' };

export class FoundingScreen {
  // onFounded = wird aufgerufen, wenn die Gilde gegründet ist
  constructor(game, onFounded) {
    this.game = game;
    this.onFounded = onFounded;
    this.chosenClassIds = START_TEAM_SLOTS.map(() => null); // gewählte Klasse pro Platz (null = noch keine)

    this.root = document.createElement('div');
    this.root.className = 'founding-screen';
    this.root.innerHTML = `
      <div class="founding-box">
        <h1>Gründe deine Gilde</h1>
        <label class="founding-name">
          Name der Gilde
          <input type="text" maxlength="${START_TEAM_RULES.maxGuildNameLength}" placeholder="${START_TEAM_RULES.defaultGuildName}">
        </label>
        <p class="hint">Wähle deine ersten fünf Helden. Alle Rüstungsarten müssen dabei sein, damit jede Beute jemandem passt.</p>
        <div class="founding-slots"></div>
        <div class="founding-footer">
          <div class="founding-armor"></div>
          <button class="founding-start-button">Los geht's!</button>
        </div>
      </div>
    `;
    document.body.appendChild(this.root);
    document.body.classList.add('overlay-open');

    this.root.querySelector('.founding-start-button').addEventListener('click', () => this.found());
    this.render();
  }

  render() {
    const slotsElement = this.root.querySelector('.founding-slots');
    slotsElement.innerHTML = '';
    START_TEAM_SLOTS.forEach((slot, slotIndex) => {
      slotsElement.appendChild(this.createSlot(slot, slotIndex));
    });
    this.renderArmorCheck();
    this.root.querySelector('.founding-start-button').disabled = checkStartTeam(this.chosenClassIds) !== 'ok';
  }

  // Ein Platz: Überschrift (z.B. "Tank") und die passenden Klassen zum Antippen
  createSlot(slot, slotIndex) {
    const slotElement = document.createElement('div');
    slotElement.className = 'founding-slot';
    slotElement.innerHTML = '<h3></h3><div class="founding-options"></div>';
    slotElement.querySelector('h3').textContent = (slotIndex + 1) + '. ' + slot.name;

    const options = slotElement.querySelector('.founding-options');
    for (const heroClass of getClassesForSlot(slotIndex)) {
      options.appendChild(this.createClassOption(heroClass, slotIndex));
    }
    return slotElement;
  }

  // Eine Klasse als Knopf: Bild, Name, Rüstungsart und Skills
  createClassOption(heroClass, slotIndex) {
    const button = document.createElement('button');
    button.className = 'founding-class';
    button.classList.toggle('chosen', this.chosenClassIds[slotIndex] === heroClass.id);
    button.style.setProperty('--class-color', heroClass.color);
    button.appendChild(createSpriteCanvas(heroClass.sprite, 3,
      { C: heroClass.color, h: PREVIEW_LOOKS.skin, H: PREVIEW_LOOKS.hair }));
    button.insertAdjacentHTML('beforeend', `
      <span class="founding-class-text">
        <b></b>
        <span class="founding-class-armor"></span>
        <span class="founding-class-skills"></span>
      </span>
    `);
    button.querySelector('b').textContent = heroClass.name;
    button.querySelector('.founding-class-armor').textContent = ARMOR_TYPES[heroClass.armorType].name;
    button.querySelector('.founding-class-skills').textContent =
      heroClass.abilities.map((abilityId) => ABILITIES[abilityId].name).join(' · ');
    button.addEventListener('click', () => {
      Sound.click();
      this.chosenClassIds[slotIndex] = heroClass.id;
      this.render();
    });
    return button;
  }

  // "Platte ✓ · Leder ✗ · Stoff ✓"
  renderArmorCheck() {
    const container = this.root.querySelector('.founding-armor');
    container.innerHTML = '';
    const missing = getMissingArmorTypes(this.chosenClassIds);
    for (const armorType of START_TEAM_RULES.requiredArmorTypes) {
      const chip = document.createElement('span');
      const present = !missing.includes(armorType);
      chip.className = 'founding-armor-chip' + (present ? ' present' : '');
      chip.textContent = ARMOR_TYPES[armorType].name + (present ? ' ✓' : ' fehlt');
      container.appendChild(chip);
    }
  }

  found() {
    const name = this.root.querySelector('.founding-name input').value;
    if (this.game.foundGuild(name, this.chosenClassIds) !== 'ok') {
      return;
    }
    Sound.levelUp();
    this.root.remove();
    document.body.classList.remove('overlay-open');
    this.onFounded();
  }
}
