// ============================================================
// TOAST – kurze Nachricht, die oben rechts erscheint und wieder verschwindet
// ============================================================

export function showToast(text, color = '#ffd23f') {
  const container = document.getElementById('toasts');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.style.borderColor = color;
  toast.textContent = text;
  container.appendChild(toast);

  // Nach 3 Sekunden ausblenden, danach entfernen
  setTimeout(() => toast.classList.add('toast-hide'), 3000);
  setTimeout(() => toast.remove(), 3500);
}
