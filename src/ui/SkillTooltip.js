// ============================================================
// SKILLTOOLTIP – kleines Fenster in der Kampfszene: Welche Skills hat dieser Held,
// und wann kann er sie wieder benutzen?
//
// Am PC erscheint es, wenn die Maus über einem Helden steht. Auf dem Handy tippt man den Helden an.
// Die Szene merkt sich, in welcher Runde ein Skill zuletzt benutzt wurde, und ruft refresh() auf,
// damit die Abklingzeiten während des Kampfes mitlaufen.
// ============================================================

import { getHeroClass } from '../data/heroClasses.js';
import { ABILITIES } from '../data/abilities.js';

export class SkillTooltip {
  // field = das Kampffeld (.scene-field), in dem das Fenster erscheint
  constructor(field) {
    this.field = field;
    this.unitId = null; // für welchen Kämpfer das Fenster gerade offen ist
    this.element = document.createElement('div');
    this.element.className = 'skill-tooltip';
    this.element.hidden = true;
    field.appendChild(this.element);
  }

  isOpenFor(unitId) {
    return this.unitId === unitId;
  }

  // Öffnet das Fenster neben einer Figur. state = siehe render()
  show(unitId, unitElement, state) {
    this.unitId = unitId;
    this.anchor = unitElement;
    this.render(state);
    this.element.hidden = false;
    this.placeNextTo(unitElement);
  }

  hide() {
    this.unitId = null;
    this.element.hidden = true;
  }

  // Inhalt neu aufbauen, falls das Fenster offen ist (z.B. nach jeder Aktion im Kampf)
  refresh(state) {
    if (this.unitId !== null) {
      this.render(state);
    }
  }

  // state = { name, classId, mana, round, usedRounds, manaCostFactor }
  //   usedRounds = Skill-id → Runde, in der der Skill zuletzt benutzt wurde
  //   manaCostFactor = Faktor auf die Mana-Kosten aus den Anweisungen (1 = unverändert)
  render(state) {
    const heroClass = getHeroClass(state.classId);
    let html = '<div class="tooltip-title"></div>';
    for (const abilityId of heroClass.abilities) {
      const ability = ABILITIES[abilityId];
      const manaCost = Math.round(ability.manaCost * (state.manaCostFactor || 1));
      const status = getSkillStatus(ability, state.usedRounds[abilityId], state.round, state.mana, manaCost);
      html += `
        <div class="tooltip-skill ${status.ready ? 'ready' : 'waiting'}">
          <div class="tooltip-skill-head">
            <b>${ability.name}</b>
            <span class="tooltip-status">${status.text}</span>
          </div>
          <div class="tooltip-desc">${ability.description}</div>
          <div class="tooltip-costs">${describeCosts(ability, manaCost)}</div>
        </div>
      `;
    }
    this.element.innerHTML = html;
    this.element.querySelector('.tooltip-title').textContent = state.name + ' · ' + heroClass.name;
  }

  // Rechts neben die Figur setzen, aber nie aus dem Kampffeld hinaus
  placeNextTo(unitElement) {
    const fieldBox = this.field.getBoundingClientRect();
    const unitBox = unitElement.getBoundingClientRect();
    // Auf dem Handy ist die Szene verkleinert: Bildschirm-Pixel in CSS-Pixel umrechnen
    const zoom = this.field.offsetWidth > 0 ? fieldBox.width / this.field.offsetWidth : 1;
    const width = this.element.offsetWidth;
    const height = this.element.offsetHeight;
    const fieldWidth = this.field.offsetWidth;
    const fieldHeight = this.field.offsetHeight;

    let left = (unitBox.right - fieldBox.left) / zoom + 6;
    if (left + width > fieldWidth - 4) {
      left = fieldWidth - 4 - width;
    }
    let top = (unitBox.top - fieldBox.top) / zoom - 20;
    if (top + height > fieldHeight - 4) {
      top = fieldHeight - 4 - height;
    }
    this.element.style.left = Math.max(4, left) + 'px';
    this.element.style.top = Math.max(4, top) + 'px';
  }
}

// Ist der Skill bereit? Sonst: Wie viele Runden noch?
// Ein Skill mit Abklingzeit 2, benutzt in Runde 5, ist ab Runde 8 wieder bereit
// (so zählt auch Combatant.startCooldown).
// manaCost = echte Kosten für diesen Helden (Anweisungen können sie ändern), sonst die normalen
export function getSkillStatus(ability, usedRound, currentRound, mana, manaCost = ability.manaCost) {
  if (usedRound !== undefined && ability.oncePerFight) {
    return { ready: false, text: 'schon benutzt' };
  }
  if (usedRound !== undefined && ability.cooldown > 0) {
    const roundsLeft = Math.min(ability.cooldown, usedRound + ability.cooldown + 1 - currentRound);
    if (roundsLeft > 0) {
      return { ready: false, text: 'noch ' + roundsLeft + (roundsLeft === 1 ? ' Runde' : ' Runden') };
    }
  }
  if (mana !== null && mana !== undefined && mana < manaCost) {
    return { ready: false, text: 'zu wenig Mana' };
  }
  return { ready: true, text: 'bereit' };
}

// "28 Mana · Abklingzeit 2 Runden"
function describeCosts(ability, manaCost) {
  const parts = [];
  if (manaCost > 0) {
    parts.push(manaCost + ' Mana');
  }
  if (ability.oncePerFight) {
    parts.push('einmal pro Kampf');
  } else if (ability.cooldown > 0) {
    parts.push('Abklingzeit ' + ability.cooldown + (ability.cooldown === 1 ? ' Runde' : ' Runden'));
  } else {
    parts.push('keine Abklingzeit');
  }
  return parts.join(' · ');
}
