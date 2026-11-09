// ============================================================
// UIICONS – kleine Symbole mit Zahl oder Wort (statt langer Textketten), mit Erklärung per Info-Blase
// Die Pixel-Bilder stehen in data/sprites.js (iconSword, iconShield …).
//
// createIconChip(spriteName, text, info, state)
//   spriteName = Pixel-Symbol, text = was daneben steht (z.B. "10" oder "2/5"),
//   info       = Erklärung (Antippen auf dem Handy, Maus drüber am PC), freiwillig
//   state      = freiwillig: 'ok' (grün), 'missing' (rot), 'warn' (orange) oder '' (normal)
// Symbole für Positionen und Konter: POSITION_ICONS, COUNTER_ICONS
// ============================================================

import { createSpriteCanvas } from './PixelArt.js';
import { attachInfo } from './InfoTip.js';

// Symbol pro Position (siehe data/groupRules.js)
export const POSITION_ICONS = {
  tank: 'iconShield',
  healer: 'iconHeal',
  melee: 'iconSword',
  ranged: 'iconArrow',
  support: 'iconStar',
};

// Symbol pro Konter (siehe data/counters.js)
export const COUNTER_ICONS = {
  interrupt: 'iconStop',
  cleanse: 'iconSparkle',
  block: 'iconShield',
  breakShell: 'iconHammer',
  calm: 'iconNote',
};

export function createIconChip(spriteName, text = '', info = null, state = '') {
  const chip = document.createElement('span');
  chip.className = 'icon-chip' + (state ? ' ' + state : '');
  chip.appendChild(createSpriteCanvas(spriteName, 2));
  if (text !== '') {
    const label = document.createElement('span');
    label.className = 'icon-chip-text';
    label.textContent = text;
    chip.appendChild(label);
  }
  if (info) {
    attachInfo(chip, info);
  }
  return chip;
}
