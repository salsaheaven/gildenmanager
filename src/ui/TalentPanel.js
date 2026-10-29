// ============================================================
// TALENTPANEL – die 3 Talentreihen eines Helden zum Auswählen
// Benutzt im Heldenbildschirm (echte Helden, Umskillen kostet Gold) und im Kampf-Labor (Testgruppe, kostenlos).
//   - gesperrte Reihe: "ab Level 15"
//   - freie Reihe: beide Talente antippbar, das gewählte leuchtet
//   - Doppelwahl (seltene Helden): Hinweis "beide wählbar"
// Die Regeln stehen in Hero.js (canChooseTalent), die Talente in data/talents.js.
// ============================================================

import { getTalentRows, TALENT_RULES } from '../data/talents.js';

// container = wohin, hero = der Held
// callbacks = { onChoose(hero, talentId), onReset(hero) (freiwillig), resetLabel (Text für den Knopf, freiwillig) }
export function renderTalents(container, hero, callbacks) {
  container.innerHTML = '';
  const free = hero.getFreeTalentPicks();
  if (free > 0) {
    const hint = document.createElement('div');
    hint.className = 'talent-free-hint';
    hint.textContent = free === 1 ? '1 Talent frei!' : free + ' Talente frei!';
    container.appendChild(hint);
  }

  getTalentRows(hero.classId).forEach((row, rowIndex) => {
    const rowElement = document.createElement('div');
    const unlocked = hero.isTalentRowUnlocked(rowIndex);
    rowElement.className = 'talent-row' + (unlocked ? '' : ' locked');
    const head = document.createElement('div');
    head.className = 'talent-row-head';
    const picks = hero.getTalentPicksAllowed(rowIndex);
    head.textContent = 'Reihe ' + (rowIndex + 1) + ' · ab Level ' + TALENT_RULES.rowLevels[rowIndex] +
      (picks === 2 ? ' · Doppelwahl: beide wählbar' : '');
    rowElement.appendChild(head);

    const options = document.createElement('div');
    options.className = 'talent-options';
    for (const talent of row) {
      const button = document.createElement('button');
      const chosen = hero.talentIds.includes(talent.id);
      const choosable = hero.canChooseTalent(talent.id);
      button.className = 'talent-option' + (chosen ? ' chosen' : '') + (choosable ? ' choosable' : '');
      button.disabled = !choosable;
      button.innerHTML = '<span class="talent-name"></span><span class="talent-description"></span>';
      button.querySelector('.talent-name').textContent = (chosen ? '✓ ' : '') + talent.name;
      button.querySelector('.talent-description').textContent = talent.description;
      button.addEventListener('click', () => callbacks.onChoose(hero, talent.id));
      options.appendChild(button);
    }
    rowElement.appendChild(options);
    container.appendChild(rowElement);
  });

  if (callbacks.onReset && hero.talentIds.length > 0) {
    const reset = document.createElement('button');
    reset.className = 'talent-reset-button';
    reset.textContent = callbacks.resetLabel || 'Talente zurücksetzen';
    reset.addEventListener('click', () => callbacks.onReset(hero));
    container.appendChild(reset);
  }
}
