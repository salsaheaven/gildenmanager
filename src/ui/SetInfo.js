// ============================================================
// SETINFO – Anzeige der Klassen-Sets (siehe data/sets.js)
//   - createSetLine: Zeile unter einem Set-Teil, z.B. "Set: Ornat der Morgenröte (Priester)"
//   - createHeroSetView: Kasten am Helden mit seinem Set, wie viele Teile er trägt (2/3)
//     und welche Boni aktiv sind (grün) oder noch fehlen (grau)
// ============================================================

import { t } from '../core/Language.js';
import { SETS, getSet, getSetBonus, SET_BONUS_COUNTS, SET_SLOTS } from '../data/sets.js';
import { getHeroClass } from '../data/heroClasses.js';

// Zeile für ein Set-Teil (oder null, wenn das Item zu keinem Set gehört)
export function createSetLine(item) {
  if (!item.setId) {
    return null;
  }
  const set = getSet(item.setId);
  const line = document.createElement('div');
  line.className = 'set-line';
  line.textContent = t('parts.setLine', { set: set.name, className: getHeroClass(set.classId).name });
  return line;
}

// Kasten am Helden: Set seiner Klasse mit getragenen Teilen und Boni.
// Gibt null zurück, solange er kein Teil seines Sets trägt (dann ist es noch kein Thema).
export function createHeroSetView(hero) {
  const counts = hero.getSetCounts();
  const set = findSetOfClass(hero.classId);
  const count = set ? counts[set.id] || 0 : 0;
  if (!set || count === 0) {
    return null;
  }
  const box = document.createElement('div');
  box.className = 'hero-set';
  box.innerHTML = '<div class="hero-set-name"></div><ul class="hero-set-bonuses"></ul>';
  box.querySelector('.hero-set-name').textContent = set.name + ' ' + count + '/' + SET_SLOTS.length;
  const list = box.querySelector('.hero-set-bonuses');
  for (const needed of SET_BONUS_COUNTS) {
    const bonus = getSetBonus(set, needed);
    const entry = document.createElement('li');
    entry.className = count >= needed ? 'active' : 'inactive';
    entry.textContent = t('parts.setPieces', { count: needed, text: bonus.text });
    list.appendChild(entry);
  }
  return box;
}

// Das Set einer Klasse (jede Klasse hat genau eins, ein Test prüft das)
function findSetOfClass(classId) {
  return SETS.find((set) => set.classId === classId) || null;
}
