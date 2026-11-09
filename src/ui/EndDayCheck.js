// ============================================================
// ENDDAYCHECK – kurze Nachfrage bei "Tag beenden", wenn noch etwas offen ist, das etwas kostet
// (Helden ohne Aufgabe, Gruppen, denen jemand fehlt). Blockiert nie: "Trotzdem beenden" geht immer.
// Ist nichts offen, endet der Tag sofort ohne Nachfrage.
// Die offenen Punkte kommen aus systems/DailyTodo.js (getEndDayWarnings).
// ============================================================

import { t } from '../core/Language.js';
import { Sound } from './Sound.js';


// onGoTo(screenId) = zu einem Bildschirm springen
export function requestEndDay(game, onGoTo) {
  const warnings = game.getEndDayWarnings();
  if (warnings.length === 0) {
    game.endDay();
    return;
  }
  const overlay = document.createElement('div');
  overlay.className = 'end-day-check';
  overlay.innerHTML = `
    <div class="panel end-day-check-box">
      <h2>${t('endDayCheck.title')}</h2>
      <div class="end-day-check-list"></div>
      <div class="end-day-check-actions">
        <button class="end-day-check-cancel">${t('endDayCheck.back')}</button>
        <button class="big-button end-day-check-confirm">${t('endDayCheck.confirm')}</button>
      </div>
    </div>
  `;
  const list = overlay.querySelector('.end-day-check-list');
  for (const warning of warnings) {
    const button = document.createElement('button');
    button.className = 'todo-entry warning';
    button.textContent = t('endDayCheck.' + warning.id, { count: warning.count }) + ' ›';
    button.addEventListener('click', () => {
      Sound.click();
      overlay.remove();
      onGoTo(warning.screenId);
    });
    list.appendChild(button);
  }
  overlay.querySelector('.end-day-check-cancel').addEventListener('click', () => {
    Sound.click();
    overlay.remove();
  });
  overlay.querySelector('.end-day-check-confirm').addEventListener('click', () => {
    Sound.click();
    overlay.remove();
    game.endDay();
  });
  // Tippen neben den Kasten = zurück
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) {
      overlay.remove();
    }
  });
  document.body.appendChild(overlay);
}
