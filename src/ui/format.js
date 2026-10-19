// ============================================================
// FORMAT – kleine Helfer, um Zahlen und Werte als Text anzuzeigen
// ============================================================

import { STAT_NAMES } from '../data/items.js';

// { attack: 9, health: 20 } → "+9 Angriff  +20 Leben"
export function formatStats(stats) {
  const parts = [];
  for (const statName in stats) {
    if (stats[statName] !== 0) {
      parts.push('+' + stats[statName] + ' ' + STAT_NAMES[statName]);
    }
  }
  return parts.join('  ');
}

// 83 → "1:23"
export function formatTime(seconds) {
  const wholeSeconds = Math.max(0, Math.ceil(seconds));
  const minutes = Math.floor(wholeSeconds / 60);
  const rest = wholeSeconds % 60;
  return minutes + ':' + String(rest).padStart(2, '0');
}

// 5 → "+5", -3 → "−3", 0 → "±0"
export function formatDifference(value) {
  if (value > 0) {
    return '+' + value;
  }
  if (value < 0) {
    return '−' + Math.abs(value);
  }
  return '±0';
}
