// ============================================================
// DAYPLANSCREEN – der Tagesplan: Wer macht heute was?
//   - oben: Tag, Überblick (wie viele im Dungeon, verletzt, frei) und "Tag beenden"
//   - an Raid-Tagen (sobald der Raid offen ist) oben die Raid-Zeile: zieht los / reicht nicht / setzt aus
//   - Gruppen, die heute in einen Dungeon ziehen (mit Risiko-Einschätzung, aufklappbaren Anweisungen
//     und "Absagen"). Ändert man eine Anweisung, rechnet die Einschätzung sofort neu.
//   - Vorräte jeder Gruppe lassen sich hier noch tauschen
//   - alle Helden, die heute nicht kämpfen: freie Helden bekommen eine Aufgabe (Ausruhen, Training, Kräuter,
//     Erkunden mit Dungeon-Auswahl), Verletzte einen Knopf für Verbandszeug
//   - "Wie gestern" plant die Gruppen vom Vortag noch einmal ein
//   - Server: die neuesten Meldungen aus dem Ticker und eine aufklappbare Rangliste aller Gilden
// Die Aufgaben selbst stehen in data/heroTasks.js, die Rechnung in systems/DayPlan.js.
// ============================================================

import { t } from '../core/Language.js';
import { getDayPlan } from '../systems/DayPlan.js';
import { HERO_TASKS } from '../data/heroTasks.js';
import { getJobGold, getTrainingCost } from '../systems/HeroTaskSystem.js';
import { getDungeon } from '../data/dungeons.js';
import { RETREAT_RULES } from '../data/retreatRules.js';
import { createHeroCanvas } from './PixelArt.js';
import { describeInjury } from './DungeonScreen.js';
import { createCompactRiskBadge } from './RiskBadge.js';
import { createIconChip } from './UiIcons.js';
import { createInfoIcon } from './InfoTip.js';
import { renderOrders } from './OrdersPanel.js';
import { createNewsLine } from './NewsLine.js';
import { createSupplyPicker } from './SupplyPicker.js';
import { getConsumable } from '../data/consumables.js';
import { DUNGEONS } from '../data/dungeons.js';
import { Sound } from './Sound.js';
import { createTodoBox } from './TodoBox.js';
import { requestEndDay } from './EndDayCheck.js';
import { getRunTitle, createRunControls, createPausedGroupRows } from './StandingGroupControls.js';
import { getBoss } from '../data/enemies.js';

export class DayPlanScreen {
  // onGoTo(screenId) = zu einem anderen Reiter wechseln (z.B. 'dungeons' oder 'tavern')
  // onShowHero(heroId) = einen Helden im Heldenbildschirm zeigen (z.B. wegen neuer Ausrüstung)
  // lastReport = { has(), show() }: "Bericht von gestern" (die Zusammenfassung des letzten Abends)
  constructor(rootElement, game, onGoTo, onShowHero, lastReport) {
    this.root = rootElement;
    this.game = game;
    this.onGoTo = onGoTo;
    this.onShowHero = onShowHero;
    this.lastReport = lastReport;
    this.openOrders = new Set(); // ids der Gruppen, deren Anweisungen gerade aufgeklappt sind

    this.root.innerHTML = `
      <div class="day-plan-screen">
        <div class="todo-slot"></div>
        <section class="panel day-plan-header">
          <h2 class="day-plan-title"></h2>
          <div class="day-plan-counts"></div>
          <div class="day-plan-hint"></div>
          <div class="day-plan-wages hint"></div>
          <div class="day-plan-actions">
            <button class="go-dungeons-button">${t('dayPlan.planGroup')}</button>
            <button class="yesterday-button" hidden>${t('dayPlan.yesterday')}</button>
            <button class="big-button plan-end-day-button">${t('topBar.endDay')}</button>
          </div>
        </section>
        <section class="panel day-plan-server">
          <h2>${t('dayPlan.serverNews')}</h2>
          <div class="news-ticker"></div>
          <details class="leaderboard">
            <summary>${t('dayPlan.leaderboard')}</summary>
            <div class="leaderboard-list"></div>
          </details>
        </section>
        <section class="panel">
          <h2>${t('dayPlan.groups')}</h2>
          <div class="day-plan-runs"></div>
        </section>
        <section class="panel">
          <h2>${t('dayPlan.noFight')}</h2>
          <div class="day-plan-others"></div>
        </section>
      </div>
    `;

    this.root.querySelector('.go-dungeons-button').addEventListener('click', () => {
      Sound.click();
      // Ohne Helden geht es zur Taverne, sonst zu den Dungeons (siehe renderHeader)
      this.onGoTo(this.root.querySelector('.go-dungeons-button').dataset.target);
    });
    this.root.querySelector('.yesterday-button').addEventListener('click', () => {
      Sound.click();
      this.lastReport.show();
    });
    this.root.querySelector('.plan-end-day-button').addEventListener('click', () => {
      Sound.click();
      requestEndDay(this.game, this.onGoTo);
    });

    game.on('changed', () => this.render());
    this.render();
  }

  render() {
    const plan = getDayPlan(this.game.guild);
    // Ganz oben: "Was gibt es heute zu tun?" mit Sprüngen an die richtige Stelle
    const todoSlot = this.root.querySelector('.todo-slot');
    todoSlot.innerHTML = '';
    todoSlot.appendChild(createTodoBox(this.game, this.onGoTo));
    this.renderHeader(plan);
    this.root.querySelector('.yesterday-button').hidden = !this.lastReport.has();
    this.renderRuns();
    this.renderOthers(plan);
    this.renderServer();
  }

  // ---------- Server: Ticker und Rangliste ----------

  renderServer() {
    const ticker = this.root.querySelector('.news-ticker');
    ticker.innerHTML = '';
    const latest = this.game.guild.news.slice(0, TICKER_LINES);
    for (const news of latest) {
      ticker.appendChild(createNewsLine(news));
    }
    if (latest.length === 0) {
      ticker.innerHTML = '<p class="empty"></p>';
      ticker.querySelector('.empty').textContent = t('dayPlan.quiet');
    }

    const list = this.root.querySelector('.leaderboard-list');
    list.innerHTML = '';
    const board = this.game.getLeaderboard();
    board.forEach((entry, index) => {
      const row = document.createElement('div');
      row.className = 'leaderboard-row' + (entry.isPlayer ? ' player' : '');
      row.style.setProperty('--guild-color', entry.color);
      row.innerHTML = '<span class="leaderboard-rank"></span><span class="leaderboard-name"></span><span class="leaderboard-progress"></span>';
      row.querySelector('.leaderboard-rank').textContent = (index + 1) + '.';
      row.querySelector('.leaderboard-name').textContent = entry.name;
      // Im Raid-Rennen zählt der Raid-Fortschritt, sonst die Dungeons
      if (entry.raidBest > 0) {
        row.querySelector('.leaderboard-progress').textContent = t('dayPlan.raidProgress',
          { best: entry.raidBest, total: entry.raidBossCount, day: entry.raidBestDay });
      } else {
        row.querySelector('.leaderboard-progress').textContent = entry.best === 0
          ? t('dayPlan.noDungeonYet')
          : t('dayPlan.dungeonProgress', { best: entry.best, total: DUNGEONS.length, day: entry.bestDay });
      }
      list.appendChild(row);
    });
  }

  // ---------- Überblick ----------

  renderHeader(plan) {
    this.root.querySelector('.day-plan-title').textContent = t('dayPlan.title', { day: this.game.day }) +
      (this.game.areDungeonsClosedToday() ? t('dayPlan.raidDay') : '');

    const counts = this.root.querySelector('.day-plan-counts');
    counts.innerHTML = '';
    for (const taskId in HERO_TASKS) {
      // Nur Aufgaben zeigen, die heute jemand hat (sonst wird die Leiste zu lang)
      if (plan.counts[taskId] === 0 && taskId !== 'dungeon' && taskId !== 'rest') {
        continue;
      }
      const chip = createTaskChip(taskId);
      chip.textContent = HERO_TASKS[taskId].name + ': ' + plan.counts[taskId];
      counts.appendChild(chip);
    }

    // Kosten heute Abend (Sold + Trainer) als Münze mit Zahl, Einzelheiten in der Info-Blase
    const training = plan.counts.training * getTrainingCost(this.game.guild);
    const wages = this.root.querySelector('.day-plan-wages');
    wages.innerHTML = '';
    if (plan.entries.length > 0) {
      const costs = this.game.getDailyWages() + training;
      wages.appendChild(createIconChip('coin', '−' + costs, t('dayPlan.costsInfo', { wages: this.game.getDailyWages(), training })));
    }

    // Hinweis, was man als Nächstes tun könnte: kurz, die Erklärung in der Info-Blase
    const hint = this.root.querySelector('.day-plan-hint');
    hint.innerHTML = '';
    if (plan.entries.length === 0) {
      hint.textContent = t('dayPlan.noHeroes');
    } else if (plan.counts.rest > 0) {
      hint.appendChild(createIconChip('iconHero', t('dayPlan.idle', { count: plan.counts.rest }), t('dayPlan.idleInfo'), 'warn'));
    } else {
      hint.appendChild(createIconChip('iconHero', t('dayPlan.allBusy'), t('dayPlan.allBusyInfo'), 'ok'));
    }
    const goButton = this.root.querySelector('.go-dungeons-button');
    goButton.textContent = plan.entries.length === 0 ? t('dayPlan.toTavern') : t('dayPlan.planGroup');
    goButton.dataset.target = plan.entries.length === 0 ? 'tavern' : 'dungeons';
    goButton.classList.toggle('glow', plan.counts.rest > 0 || plan.entries.length === 0);
  }

  // ---------- Gruppen im Dungeon ----------

  // Raid-Zeile (nur an Raid-Tagen, sobald der Raid offen ist; sonst null)
  createRaidRow() {
    const game = this.game;
    if (!game.areDungeonsClosedToday()) {
      return null;
    }
    const plan = game.guild.raidPlan;
    const raid = game.getRaid();
    const row = document.createElement('div');
    row.className = 'run-row day-plan-raid';
    row.innerHTML = '<div class="run-head"><b class="run-name"></b><span class="run-status"></span></div><div class="run-controls"></div>';
    row.querySelector('.run-name').textContent = 'Raid · ' + raid.name;
    const status = row.querySelector('.run-status');
    const nextIndex = game.getNextRaidEncounterIndex();
    if (nextIndex === null) {
      status.textContent = t('dayPlan.raidAllDefeated');
    } else if (plan.lastFoughtDay === game.day) {
      status.textContent = t('dayPlan.raidDone');
    } else if (plan.skippedDay === game.day) {
      status.textContent = t('dayPlan.raidSkipped');
    } else if (plan.activeToday) {
      const nextBoss = raid.encounters.slice(nextIndex).find((encounter) => encounter.type === 'boss');
      status.textContent = t('dayPlan.raidGoes', { count: game.checkRaid().heroCount, boss: getBoss(nextBoss.bossId).name });
    } else {
      status.textContent = t('dayPlan.raidNotReady', { problems: game.checkRaid().problems.join(', ') });
      row.classList.add('raid-not-ready');
    }
    const controls = row.querySelector('.run-controls');
    const goButton = document.createElement('button');
    goButton.textContent = t('dayPlan.lineup');
    goButton.addEventListener('click', () => {
      Sound.click();
      this.onGoTo('raid');
    });
    controls.appendChild(goButton);
    return row;
  }

  renderRuns() {
    const list = this.root.querySelector('.day-plan-runs');
    list.innerHTML = '';
    // An Raid-Tagen zuerst der Raid
    const raidRow = this.createRaidRow();
    if (raidRow) {
      list.appendChild(raidRow);
    }
    // Gruppen, die heute nicht losziehen (ausgesetzt oder alle verletzt), stehen oben
    for (const row of createPausedGroupRows(this.game)) {
      list.appendChild(row);
    }
    if (raidRow && this.game.guild.expeditions.length === 0) {
      return;
    }
    if (this.game.guild.expeditions.length === 0 && this.game.guild.standingGroups.length === 0) {
      list.innerHTML = '<p class="empty"></p>';
      list.querySelector('.empty').textContent = t('dayPlan.noGroupToday');
      list.appendChild(createInfoIcon(t('dayPlan.noGroupInfo')));
      return;
    }
    for (const expedition of this.game.guild.expeditions) {
      const dungeon = getDungeon(expedition.dungeonId);
      const retreatRule = RETREAT_RULES.find((rule) => rule.id === expedition.retreatRuleId);
      const card = document.createElement('div');
      card.className = 'run-row day-plan-run';
      card.innerHTML = `
        <div class="run-head">
          <b class="run-name"></b>
          <span class="run-status"></span>
        </div>
        <div class="day-plan-heroes"></div>
      `;
      card.querySelector('.run-name').textContent = getRunTitle(this.game, expedition);
      // Stufe, Rückzug und Einschätzung als Symbole (Einzelheiten per Antippen / Maus drüber)
      const status = card.querySelector('.run-status');
      status.appendChild(createIconChip('iconSword', String(dungeon.level), t('dayPlan.levelInfo', { level: dungeon.level })));
      if (retreatRule && retreatRule.afterFallen !== null) {
        status.appendChild(createIconChip('iconSkull', String(retreatRule.afterFallen), t('dayPlan.retreatInfo', { name: retreatRule.name })));
      }

      const heroList = card.querySelector('.day-plan-heroes');
      const heroes = expedition.getHeroIds().map((heroId) => this.game.guild.findHero(heroId)).filter((hero) => hero);
      status.appendChild(createCompactRiskBadge(this.game, heroes, expedition.dungeonId, expedition.retreatRuleId, expedition.supplies));
      // Die Gruppe als kleine Kacheln in einer Zeile (antippen = zum Helden)
      heroList.classList.add('day-plan-hero-tiles');
      for (const hero of heroes) {
        heroList.appendChild(this.createHeroTile(hero));
      }
      heroList.after(this.createOrdersSection(expedition, heroes));
      heroList.after(this.createSupplySection(expedition));
      // Fehlende Mitglieder, Ersatz, Heute aussetzen, Auflösen (bzw. Absagen bei einmaligen Runs)
      card.appendChild(createRunControls(this.game, expedition));
      list.appendChild(card);
    }
  }

  // Kleine Kachel eines Helden der Gruppe: Bild, Vorname, Level; "neu" bei neuer Ausrüstung. Antippen = zum Helden.
  createHeroTile(hero) {
    const tile = document.createElement('button');
    tile.className = 'day-plan-hero-tile';
    tile.style.setProperty('--rarity', hero.getRarity().color);
    tile.title = hero.name + ' · ' + hero.getClass().name + ' · ' + t('common.lv') + ' ' + hero.level;
    tile.appendChild(createHeroCanvas(hero, 2));
    tile.insertAdjacentHTML('beforeend', '<span class="group-slot-name"></span><span class="hero-tile-level"></span>');
    tile.querySelector('.group-slot-name').textContent = hero.name.split(' ')[0];
    tile.querySelector('.hero-tile-level').textContent = 'Lv ' + hero.level;
    if (this.game.getSlotsWithNewGear(hero.id).length > 0) {
      tile.insertAdjacentHTML('beforeend', '<span class="new-gear-badge">' + t('common.new') + '</span>');
    }
    tile.addEventListener('click', () => {
      Sound.click();
      this.onShowHero(hero.id);
    });
    return tile;
  }

  // Vorräte der Gruppe: tauschen ist bis zum Tagesende möglich (kompakt: Trank-Symbol, Hinweis als ⓘ)
  createSupplySection(expedition) {
    const section = document.createElement('div');
    section.className = 'day-plan-supplies plan-row';
    section.appendChild(createIconChip('iconPotion', '', t('dayPlan.suppliesInfo')));
    section.appendChild(createSupplyPicker(this.game.guild, expedition.supplies, expedition.supplies, (next) => {
      Sound.click();
      this.game.setExpeditionSupplies(expedition.id, next);
    }, true));
    return section;
  }

  // Aufklappbare Anweisungen der Gruppe. Bleibt nach einer Änderung offen (die Seite wird dabei neu gebaut).
  createOrdersSection(expedition, heroes) {
    const section = document.createElement('details');
    section.className = 'day-plan-orders';
    section.open = this.openOrders.has(expedition.id);
    section.innerHTML = '<summary>' + t('common.orders') + '</summary><div class="orders-list"></div>';
    section.addEventListener('toggle', () => {
      if (section.open) {
        this.openOrders.add(expedition.id);
      } else {
        this.openOrders.delete(expedition.id);
      }
    });
    renderOrders(section.querySelector('.orders-list'), heroes, (hero, orderId, optionId) => {
      Sound.click();
      this.game.setHeroOrder(hero.id, orderId, optionId);
    });
    return section;
  }

  // ---------- Helden ohne Kampf ----------

  renderOthers(plan) {
    const list = this.root.querySelector('.day-plan-others');
    list.innerHTML = '';
    const others = plan.entries.filter((entry) => entry.taskId !== 'dungeon');
    if (others.length === 0) {
      list.innerHTML = '<p class="empty"></p>';
      list.querySelector('.empty').textContent = t('dayPlan.nobodyIdle');
      return;
    }
    for (const entry of others) {
      list.appendChild(this.createHeroRow(entry.hero, entry.taskId));
    }
  }

  // Eine Zeile: Bild, Name, Klasse, Level und (falls taskId gesetzt) das Aufgaben-Schild
  createHeroRow(hero, taskId) {
    const row = document.createElement('div');
    row.className = 'day-plan-hero';
    row.appendChild(createHeroCanvas(hero, 2));
    const text = document.createElement('span');
    text.className = 'day-plan-hero-text';
    text.innerHTML = '<b></b><span class="roster-sub"></span>';
    text.querySelector('b').textContent = hero.name.split(' ')[0];
    text.querySelector('.roster-sub').textContent = hero.getClass().name + ' · ' + t('common.lv') + ' ' + hero.level;
    text.title = hero.name;
    // Neue Ausrüstung für diesen Helden: antippen springt zu ihm in den Heldenbildschirm
    if (this.game.getSlotsWithNewGear(hero.id).length > 0) {
      const badge = document.createElement('button');
      badge.className = 'new-gear-badge new-gear-button';
      badge.textContent = t('common.new');
      badge.title = t('dayPlan.newGearInfo');
      badge.addEventListener('click', () => {
        Sound.click();
        this.onShowHero(hero.id);
      });
      text.appendChild(badge);
    }
    row.appendChild(text);
    if (taskId === 'injured') {
      const chip = createTaskChip(taskId);
      chip.textContent = describeInjury(hero);
      chip.title = HERO_TASKS[taskId].description;
      row.appendChild(chip);
      row.appendChild(this.createBandageButton(hero));
    } else if (taskId) {
      row.appendChild(this.createTaskPicker(hero));
    }
    return row;
  }

  // Auswahl der Aufgabe für einen freien Helden. Beim Erkunden zusätzlich: welcher Dungeon?
  createTaskPicker(hero) {
    const picker = document.createElement('span');
    picker.className = 'task-picker';
    picker.style.setProperty('--task-color', HERO_TASKS[hero.task.taskId].color);

    const select = document.createElement('select');
    for (const taskId in HERO_TASKS) {
      // Nicht wählbar, oder noch nicht freigeschaltet (z.B. Rohstoffe sammeln erst mit der Gildenhalle)
      const unlock = HERO_TASKS[taskId].unlock;
      if (!HERO_TASKS[taskId].choosable || (unlock && !this.game.isFeatureUnlocked(unlock) && hero.task.taskId !== taskId)) {
        continue;
      }
      const option = document.createElement('option');
      option.value = taskId;
      option.textContent = HERO_TASKS[taskId].name;
      select.appendChild(option);
    }
    select.value = hero.task.taskId;
    select.title = HERO_TASKS[hero.task.taskId].description;
    select.addEventListener('change', () => {
      Sound.click();
      // Erkunden braucht einen Dungeon: zuerst den höchsten freigeschalteten nehmen
      const dungeonId = select.value === 'scouting' ? this.getHighestUnlockedDungeonId() : null;
      this.game.setHeroTask(hero.id, select.value, dungeonId);
    });
    picker.appendChild(select);

    if (hero.task.taskId === 'scouting') {
      const dungeonSelect = document.createElement('select');
      for (const dungeon of DUNGEONS) {
        if (!this.game.isDungeonUnlocked(dungeon.id)) {
          continue;
        }
        const option = document.createElement('option');
        option.value = dungeon.id;
        // Wissensstand, z.B. "Sonnentempel (1/2)", damit man sieht, wo es noch etwas aufzudecken gibt
        const knowledge = this.game.getDungeonKnowledge(dungeon.id);
        option.textContent = dungeon.name + ' (' + knowledge.known + '/' + knowledge.total + ')';
        dungeonSelect.appendChild(option);
      }
      dungeonSelect.value = hero.task.dungeonId;
      dungeonSelect.addEventListener('change', () => {
        Sound.click();
        this.game.setHeroTask(hero.id, 'scouting', dungeonSelect.value);
      });
      picker.appendChild(dungeonSelect);
    }
    if (hero.task.taskId === 'jobs') {
      const hint = document.createElement('span');
      hint.className = 'task-hint';
      hint.textContent = t('dayPlan.jobGold', { gold: getJobGold(hero) });
      picker.appendChild(hint);
    }
    return picker;
  }

  getHighestUnlockedDungeonId() {
    const unlocked = DUNGEONS.filter((dungeon) => this.game.isDungeonUnlocked(dungeon.id));
    return unlocked[unlocked.length - 1].id;
  }

  // Verbandszeug: verkürzt die Verletzung um einen Tag (nur, wenn welches in der Vorratskammer liegt)
  createBandageButton(hero) {
    const bandages = getConsumable('bandages');
    const count = this.game.guild.countSupply(bandages.id);
    const button = document.createElement('button');
    button.className = 'bandage-button';
    button.textContent = t('dayPlan.bandage', { icon: bandages.icon, count });
    button.title = bandages.description + (count === 0 ? t('dayPlan.bandageMissing') : '');
    button.disabled = count === 0;
    button.addEventListener('click', () => {
      if (this.game.useSupplyOnHero(bandages.id, hero.id)) {
        Sound.coin();
      }
    });
    return button;
  }
}

// So viele Meldungen zeigt der Tagesplan
const TICKER_LINES = 4;

// Kleines farbiges Schild für eine Aufgabe
function createTaskChip(taskId) {
  const chip = document.createElement('span');
  chip.className = 'task-chip';
  chip.style.setProperty('--task-color', HERO_TASKS[taskId].color);
  return chip;
}
