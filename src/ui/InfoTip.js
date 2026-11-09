// ============================================================
// INFOTIP – kleine Info-Blase mit einer Erklärung
//   - am PC: erscheint, solange die Maus über dem Element ist
//   - auf dem Handy: erscheint beim Antippen, verschwindet beim nächsten Tippen irgendwo
// So können Erklärsätze vom Bildschirm verschwinden und sind trotzdem jederzeit abrufbar.
// Es gibt immer nur eine Blase gleichzeitig.
//
// attachInfo(element, text)  = Element bekommt eine Erklärung (Antippen zeigt sie, nicht für Knöpfe mit Aktion!)
// createInfoIcon(text)       = kleines ⓘ-Symbol mit Erklärung (z.B. neben einem Knopf, der selbst eine Aktion hat)
// ============================================================

import { createSpriteCanvas } from './PixelArt.js';

let bubble = null;        // die eine Blase (ein div am Ende der Seite)
let currentAnchor = null; // das Element, zu dem die Blase gerade gehört

// Erklärung an ein Element hängen
export function attachInfo(element, text) {
  element.classList.add('has-info');
  element.addEventListener('pointerenter', (event) => {
    if (event.pointerType === 'mouse') {
      showInfo(element, text);
    }
  });
  element.addEventListener('pointerleave', (event) => {
    if (event.pointerType === 'mouse') {
      hideInfo();
    }
  });
  element.addEventListener('click', (event) => {
    // Mit der Maus reicht das Drüberfahren; auf dem Handy öffnet bzw. schließt Antippen die Blase
    if (event.pointerType === 'mouse') {
      return;
    }
    event.stopPropagation();
    event.preventDefault();
    if (currentAnchor === element) {
      hideInfo();
    } else {
      showInfo(element, text);
    }
  });
  return element;
}

// Kleines ⓘ-Symbol mit einer Erklärung
export function createInfoIcon(text) {
  const icon = document.createElement('span');
  icon.className = 'info-icon';
  icon.appendChild(createSpriteCanvas('iconInfo', 2));
  return attachInfo(icon, text);
}

// Blase über (bzw. unter) dem Element zeigen, immer ganz im Bildschirm
function showInfo(anchor, text) {
  if (!bubble) {
    bubble = document.createElement('div');
    bubble.className = 'info-bubble';
    document.body.appendChild(bubble);
    // Tippen irgendwo anders oder Scrollen schließt die Blase
    document.addEventListener('pointerdown', (event) => {
      if (currentAnchor && !currentAnchor.contains(event.target)) {
        hideInfo();
      }
    }, true);
    window.addEventListener('scroll', () => hideInfo(), true);
  }
  currentAnchor = anchor;
  bubble.textContent = text;
  bubble.hidden = false;

  const margin = 8;
  const box = anchor.getBoundingClientRect();
  const width = bubble.offsetWidth;
  const height = bubble.offsetHeight;
  let left = box.left + box.width / 2 - width / 2;
  left = Math.max(margin, Math.min(left, window.innerWidth - width - margin));
  let top = box.top - height - 6;
  if (top < margin) {
    top = box.bottom + 6; // kein Platz darüber: darunter zeigen
  }
  bubble.style.left = left + 'px';
  bubble.style.top = top + 'px';
}

export function hideInfo() {
  if (bubble) {
    bubble.hidden = true;
  }
  currentAnchor = null;
}
