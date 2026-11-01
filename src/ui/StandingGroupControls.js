// ============================================================
// STANDINGGROUPCONTROLS – Anzeige und Knöpfe für stehende Gruppen (Tagesplan und Dungeon-Bildschirm)
//   - getRunTitle: "Gruppe A · Die Bärenhöhle" (einmalige Runs nur mit dem Dungeon-Namen)
//   - createRunControls: wer heute fehlt, "Ersatz einsetzen", "Heute aussetzen", "Auflösen"
//     (einmalige Runs nur "Absagen")
//   - createPausedGroupRows: Gruppen, die heute nicht losziehen (ausgesetzt oder alle verletzt),
//     mit "Wieder einplanen" und "Auflösen"
// Die Regeln stehen in systems/StandingGroups.js, die Aktionen in Game.
// ============================================================

import { getDungeon } from '../data/dungeons.js';
import { getPositionName } from '../data/groupRules.js';
import { Sound } from './Sound.js';
import { showToast } from './Toast.js';

// Überschrift eines geplanten Runs
export function getRunTitle(game, expedition) {
  const dungeonName = getDungeon(expedition.dungeonId).name;
  const group = game.findStandingGroup(expedition.standingGroupId);
  return group ? group.name + ' · ' + dungeonName : dungeonName;
}

// Zeile mit fehlenden Mitgliedern und Knöpfen unter einem geplanten Run
export function createRunControls(game, expedition) {
  const container = document.createElement('div');
  container.className = 'run-controls';
  const group = game.findStandingGroup(expedition.standingGroupId);

  if (!group) {
    container.appendChild(createButton('Absagen', () => game.cancelExpedition(expedition.id)));
    return container;
  }

  // Wer fehlt heute? z.B. "Fehlt heute: Liora (Heiler, verletzt)"
  const missing = game.getMissingMembers(group.id);
  if (missing.length > 0) {
    const line = document.createElement('div');
    line.className = 'group-missing-line';
    line.textContent = 'Fehlt heute: ' + missing.map((entry) =>
      entry.hero.name + ' (' + getPositionName(entry.positionId) + ', verletzt)').join(', ');
    container.appendChild(line);
    if (expedition.getHeroIds().length < 5) {
      container.appendChild(createButton('Ersatz einsetzen', () => {
        const substitute = game.addSubstitute(group.id);
        if (substitute) {
          showToast(substitute.name + ' springt heute in ' + group.name + ' ein.', '#1eff00');
        } else {
          showToast('Kein passender freier Held für den Ersatz.', '#ff6b6b');
        }
      }));
    }
  }
  container.appendChild(createButton('Heute aussetzen', () => game.skipStandingGroupToday(group.id)));
  container.appendChild(createDisbandButton(game, group));
  return container;
}

// Gruppen, die heute nicht losziehen: "Gruppe B · Die Bärenhöhle: setzt heute aus"
export function createPausedGroupRows(game) {
  const rows = [];
  for (const group of game.guild.standingGroups) {
    if (game.getTodaysExpedition(group.id)) {
      continue;
    }
    const row = document.createElement('div');
    row.className = 'run-row paused-group';
    const allInjured = group.heroIds.every((heroId) => {
      const hero = game.guild.findHero(heroId);
      return !hero || hero.isInjured();
    });
    row.innerHTML = '<div class="run-head"><b class="run-name"></b><span class="run-status"></span></div><div class="run-controls"></div>';
    row.querySelector('.run-name').textContent = group.name + ' · ' + getDungeon(group.dungeonId).name;
    row.querySelector('.run-status').textContent = allInjured ? 'alle verletzt, zieht heute nicht los' : 'setzt heute aus';
    const controls = row.querySelector('.run-controls');
    if (!allInjured) {
      controls.appendChild(createButton('Wieder einplanen', () => {
        if (!game.planStandingGroup(group.id)) {
          showToast('Heute kann niemand aus ' + group.name + ' los.', '#ff6b6b');
        }
        game.emit('changed');
      }));
    }
    controls.appendChild(createDisbandButton(game, group));
    rows.push(row);
  }
  return rows;
}

function createButton(label, onClick) {
  const button = document.createElement('button');
  button.textContent = label;
  button.addEventListener('click', () => {
    Sound.click();
    onClick();
  });
  return button;
}

// Zweimal tippen, damit man eine Gruppe nicht aus Versehen auflöst
function createDisbandButton(game, group) {
  const button = document.createElement('button');
  button.className = 'disband-button';
  button.textContent = 'Auflösen';
  button.addEventListener('click', () => {
    Sound.click();
    if (button.classList.contains('confirm')) {
      game.disbandStandingGroup(group.id);
      showToast(group.name + ' ist aufgelöst.', '#9d9d9d');
      return;
    }
    button.classList.add('confirm');
    button.textContent = 'Wirklich auflösen?';
  });
  return button;
}
