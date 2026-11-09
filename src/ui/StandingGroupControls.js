// ============================================================
// STANDINGGROUPCONTROLS – Anzeige und Knöpfe für stehende Gruppen (Tagesplan und Dungeon-Bildschirm)
//   - getRunTitle: "Gruppe A · Die Bärenhöhle" (einmalige Runs nur mit dem Dungeon-Namen)
//   - createRunControls: wer heute fehlt, "Ersatz einsetzen", "Bestes ausrüsten", "Heute aussetzen", "Auflösen"
//     (einmalige Runs nur "Absagen")
//   - createPausedGroupRows: Gruppen, die heute nicht losziehen (ausgesetzt oder alle verletzt),
//     mit "Wieder einplanen", "Bestes ausrüsten" und "Auflösen"
//   "Bestes ausrüsten" legt allen Mitgliedern das Beste aus dem Inventar an (gesperrte Items bleiben dran)
// Die Regeln stehen in systems/StandingGroups.js, die Aktionen in Game.
// ============================================================

import { t } from '../core/Language.js';
import { getDungeon } from '../data/dungeons.js';
import { getPositionName } from '../data/groupRules.js';
import { Sound } from './Sound.js';
import { showToast } from './Toast.js';
import { announceEquipBest } from './HeroDetailPanel.js';

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
    container.appendChild(createButton(t('parts.cancelRun'), () => game.cancelExpedition(expedition.id)));
    return container;
  }

  // Wer fehlt heute? z.B. "Fehlt heute: Liora (Heiler, verletzt)"
  const missing = game.getMissingMembers(group.id);
  if (missing.length > 0) {
    const line = document.createElement('div');
    line.className = 'group-missing-line';
    line.textContent = t('parts.missingToday', { list: missing.map((entry) =>
      t('parts.injuredMember', { name: entry.hero.name, position: getPositionName(entry.positionId) })).join(', ') });
    container.appendChild(line);
    if (expedition.getHeroIds().length < 5) {
      container.appendChild(createButton(t('parts.substitute'), () => {
        const substitute = game.addSubstitute(group.id);
        if (substitute) {
          showToast(t('parts.substituteIn', { name: substitute.name, group: group.name }), '#1eff00');
        } else {
          showToast(t('parts.noSubstitute'), '#ff6b6b');
        }
      }));
    }
  }
  // Wer heute mitgeht (mit Ersatz), wird ausgerüstet
  container.appendChild(createEquipBestButton(game, group.name, expedition.getHeroIds()));
  const skip = createButton(t('parts.skip'), () => game.skipStandingGroupToday(group.id));
  skip.title = t('parts.skipInfo');
  container.appendChild(skip);
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
    row.querySelector('.run-status').textContent = allInjured ? t('parts.allInjured') : t('parts.sittingOut');
    const controls = row.querySelector('.run-controls');
    if (!allInjured) {
      controls.appendChild(createButton(t('parts.replan'), () => {
        if (!game.planStandingGroup(group.id)) {
          showToast(t('parts.nobodyCanGo', { group: group.name }), '#ff6b6b');
        }
        game.emit('changed');
      }));
    }
    controls.appendChild(createEquipBestButton(game, group.name, group.heroIds));
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

// "Bestes ausrüsten": Die Mitglieder bekommen nacheinander das Beste aus dem Inventar (wer zuerst steht, zuerst).
// Die Rückmeldung hat "Rückgängig".
function createEquipBestButton(game, groupName, heroIds) {
  const button = document.createElement('button');
  button.className = 'equip-group-button';
  button.textContent = t('common.equip');
  button.title = t('parts.equipInfo');
  button.addEventListener('click', () => {
    const snapshot = game.getEquipmentSnapshot(heroIds);
    const count = game.equipBestForGroup(heroIds);
    announceEquipBest(game, count, groupName, snapshot);
    game.emit('changed');
  });
  return button;
}

// Zweimal tippen, damit man eine Gruppe nicht aus Versehen auflöst
function createDisbandButton(game, group) {
  const button = document.createElement('button');
  button.className = 'disband-button';
  button.textContent = t('parts.disband');
  button.addEventListener('click', () => {
    Sound.click();
    if (button.classList.contains('confirm')) {
      game.disbandStandingGroup(group.id);
      showToast(t('parts.disbanded', { group: group.name }), '#9d9d9d');
      return;
    }
    button.classList.add('confirm');
    button.textContent = t('parts.disbandConfirm');
  });
  return button;
}
