// ============================================================
// ROLEOVERVIEW – Heldenübersicht nach Position (Tank, Heiler, Nahkampf, Fernkampf, Unterstützer)
//   - oben der Gruppen-Zähler: "2 Gruppen möglich · Für Gruppe 3 fehlen: 1 Heiler, 2 weitere Helden"
//     (gezählt werden nur freie Helden: nicht verletzt, heute noch nicht eingeplant)
//   - darunter eine Zeile pro Position mit kleinen Kacheln: Bild, Level und Zeichen
//     (neu = neue Ausrüstung, ★ = Talent frei, ✚ = verletzt, ☹ = unzufrieden; eingeplante Helden sind blasser)
// Tippt man eine Kachel an, wird onSelect(heroId) aufgerufen.
// renderRoleTiles zeichnet nur die Zeilen mit den Kacheln (ohne Zähler), z.B. für die Gruppenwahl beim Dungeon.
// Die Positionen und die Gruppenregel stehen in data/groupRules.js.
// ============================================================

import { POSITIONS, GROUP_RULES, getPositionName } from '../data/groupRules.js';
import { createHeroCanvas } from './PixelArt.js';
import { Sound } from './Sound.js';

// container = wohin die Übersicht gezeichnet wird, selectedHeroId = hervorgehobener Held
export function renderRoleOverview(container, game, selectedHeroId, onSelect) {
  container.innerHTML = '';
  container.appendChild(createGroupCounter(game));
  renderRoleTiles(container, game, {
    isSelected: (hero) => hero.id === selectedHeroId,
    isDisabled: () => false,
    onSelect: onSelect,
  });
}

// Zeilen pro Position mit Kacheln, angehängt an container.
// options = { isSelected(hero), isDisabled(hero), onSelect(heroId) }
export function renderRoleTiles(container, game, options) {
  const byPosition = game.getHeroesByPosition();
  for (const position of POSITIONS) {
    const heroes = byPosition[position.id];
    const row = document.createElement('div');
    row.className = 'role-row';
    row.innerHTML = '<div class="role-row-head"></div><div class="role-tiles"></div>';
    const freeCount = heroes.filter((hero) => !hero.isInjured() && !game.guild.isHeroBusy(hero.id)).length;
    row.querySelector('.role-row-head').textContent = position.name + ' (' + heroes.length + ')' +
      (freeCount < heroes.length ? ' · ' + freeCount + ' frei' : '');
    const tiles = row.querySelector('.role-tiles');
    for (const hero of heroes) {
      tiles.appendChild(createHeroTile(game, hero, options));
    }
    if (heroes.length === 0) {
      tiles.innerHTML = '<span class="hint">niemand</span>';
    }
    container.appendChild(row);
  }
}

// Kasten oben: wie viele Gruppen gehen, und was für die nächste fehlt
function createGroupCounter(game) {
  const result = game.countPossibleGroups();
  const box = document.createElement('div');
  box.className = 'group-counter' + (result.groups > 0 ? ' has-groups' : '');
  const groupsText = result.groups === 0 ? 'Keine vollständige Gruppe frei' :
    (result.groups === 1 ? '1 Gruppe möglich' : result.groups + ' Gruppen möglich');

  const missingParts = [];
  for (const positionId in GROUP_RULES.required) {
    if (result.missing[positionId]) {
      missingParts.push(result.missing[positionId] + ' ' + getPositionName(positionId));
    }
  }
  if (result.missing.any) {
    missingParts.push(result.missing.any + (result.missing.any === 1 ? ' weiterer Held' : ' weitere Helden'));
  }
  box.innerHTML = '<b class="group-counter-main"></b><span class="group-counter-missing hint"></span>';
  box.querySelector('.group-counter-main').textContent = groupsText;
  box.querySelector('.group-counter-missing').textContent =
    'Für Gruppe ' + (result.groups + 1) + ' fehlen: ' + missingParts.join(', ');
  box.title = 'Gezählt werden freie Helden (nicht verletzt, heute noch nicht eingeplant). ' +
    'Eine Gruppe braucht 1 Tank, 1 Heiler und 3 beliebige Helden.';
  return box;
}

// Eine Kachel: Bild, Vorname, Level und kleine Zeichen
function createHeroTile(game, hero, options) {
  const tile = document.createElement('button');
  tile.className = 'hero-tile';
  tile.style.setProperty('--rarity', hero.getRarity().color);
  tile.classList.toggle('selected', options.isSelected(hero));
  tile.disabled = options.isDisabled(hero);
  tile.classList.toggle('busy', game.guild.isHeroBusy(hero.id));
  tile.classList.toggle('injured', hero.isInjured());
  tile.title = hero.name + ' · ' + hero.getClass().name + ' · Lv ' + hero.level +
    (game.guild.isHeroBusy(hero.id) ? ' · heute im Dungeon' : '') + (hero.isInjured() ? ' · verletzt' : '');
  tile.appendChild(createHeroCanvas(hero, 3));
  tile.insertAdjacentHTML('beforeend', '<span class="hero-tile-name"></span><span class="hero-tile-level"></span><span class="hero-tile-marks"></span>');
  tile.querySelector('.hero-tile-name').textContent = hero.name.split(' ')[0];
  tile.querySelector('.hero-tile-level').textContent = 'Lv ' + hero.level;

  const marks = tile.querySelector('.hero-tile-marks');
  if (game.getSlotsWithNewGear(hero.id).length > 0) {
    marks.insertAdjacentHTML('beforeend', '<span class="new-gear-badge" title="Neue Ausrüstung verfügbar">neu</span>');
  }
  if (hero.getFreeTalentPicks() > 0) {
    marks.insertAdjacentHTML('beforeend', '<span class="talent-free-chip" title="Talent frei">★</span>');
  }
  if (hero.isInjured()) {
    marks.insertAdjacentHTML('beforeend', '<span class="mark-injured" title="Verletzt">✚</span>');
  }
  if (hero.isUnhappy()) {
    marks.insertAdjacentHTML('beforeend', '<span class="unhappy-chip" title="Unzufrieden">☹</span>');
  }

  tile.addEventListener('click', () => {
    Sound.click();
    options.onSelect(hero.id);
  });
  return tile;
}
