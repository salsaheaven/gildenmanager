// ============================================================
// LOCKBUTTON – Knopf "Sperren" an einem Item (Ausrüstungsliste und Inventar)
// Ein gesperrtes Item (🔒) tauscht "Bestes anlegen" bzw. "Bestes ausrüsten" nicht aus,
// und man kann es nicht verkaufen oder zerlegen. Von Hand an- und ablegen geht weiterhin.
// Die Regel steht in Game.toggleItemLock und Game.equipBestItems.
// createLockBadge = kleines 🔒 für Kacheln und Ausrüstungsplätze.
// ============================================================

import { Sound } from './Sound.js';
import { showToast } from './Toast.js';

// Knopf zum Sperren und Entsperren. Nach dem Klick zeichnet sich die Oberfläche über game.on('changed') neu.
export function createLockButton(game, item) {
  const button = document.createElement('button');
  button.className = 'lock-button';
  button.classList.toggle('locked', item.locked);
  button.textContent = item.locked ? '🔒 Gesperrt' : '🔓 Sperren';
  button.title = item.locked
    ? 'Gesperrt: „Bestes anlegen“ tauscht es nicht aus, Verkaufen und Zerlegen gehen nicht. Tippen zum Entsperren.'
    : 'Sperren: „Bestes anlegen“ tauscht es dann nicht mehr aus, und es kann nicht verkauft oder zerlegt werden.';
  button.addEventListener('click', () => {
    Sound.click();
    const locked = game.toggleItemLock(item.id);
    if (locked !== null) {
      showToast(item.getDisplayName() + (locked ? ' ist gesperrt' : ' ist entsperrt'), item.getRarity().color);
    }
  });
  return button;
}

// Kleines Schloss-Zeichen (oder null, wenn das Item nicht gesperrt ist)
export function createLockBadge(item) {
  if (!item || !item.locked) {
    return null;
  }
  const badge = document.createElement('span');
  badge.className = 'lock-badge';
  badge.title = 'Gesperrt';
  badge.textContent = '🔒';
  return badge;
}
