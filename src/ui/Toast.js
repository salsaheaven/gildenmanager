// ============================================================
// TOAST – kurze Nachricht, die oben rechts erscheint und wieder verschwindet
// ============================================================

// Höchstens so viele Nachrichten gleichzeitig, damit sie nichts verdecken
const MAX_TOASTS = 4;

// action = freiwillig { label, onClick }: ein Knopf in der Nachricht (z.B. "Rückgängig").
// Mit Knopf bleibt die Nachricht länger stehen, damit man ihn erreicht.
export function showToast(text, color = '#ffd23f', action = null) {
  const container = document.getElementById('toasts');
  while (container.children.length >= MAX_TOASTS) {
    container.firstChild.remove();
  }
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.style.borderColor = color;
  toast.textContent = text;
  if (action) {
    const button = document.createElement('button');
    button.className = 'toast-action';
    button.textContent = action.label;
    button.addEventListener('click', () => {
      action.onClick();
      toast.remove();
    });
    toast.appendChild(button);
  }
  container.appendChild(toast);

  // Nach 3 Sekunden (mit Knopf nach 6) ausblenden, danach entfernen
  const visibleMs = action ? 6000 : 3000;
  setTimeout(() => toast.classList.add('toast-hide'), visibleMs);
  setTimeout(() => toast.remove(), visibleMs + 500);
}
