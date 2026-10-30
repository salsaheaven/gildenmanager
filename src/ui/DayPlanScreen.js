// ============================================================
// DAYPLANSCREEN – der Tagesplan: Wer macht heute was?
//   - oben: Tag, Überblick (wie viele im Dungeon, verletzt, frei) und "Tag beenden"
//   - Gruppen, die heute in einen Dungeon ziehen (mit Risiko-Einschätzung, aufklappbaren Anweisungen
//     und "Absagen"). Ändert man eine Anweisung, rechnet die Einschätzung sofort neu.
//   - Vorräte jeder Gruppe lassen sich hier noch tauschen
//   - alle Helden, die heute nicht kämpfen: freie Helden bekommen eine Aufgabe (Ausruhen, Training, Kräuter,
//     Erkunden mit Dungeon-Auswahl), Verletzte einen Knopf für Verbandszeug
//   - "Wie gestern" plant die Gruppen vom Vortag noch einmal ein
//   - Server: die neuesten Meldungen aus dem Ticker und eine aufklappbare Rangliste aller Gilden
// Die Aufgaben selbst stehen in data/heroTasks.js, die Rechnung in systems/DayPlan.js.
// ============================================================

import { getDayPlan } from '../systems/DayPlan.js';
import { HERO_TASKS } from '../data/heroTasks.js';
import { getJobGold, getTrainingCost } from '../systems/HeroTaskSystem.js';
import { getDungeon } from '../data/dungeons.js';
import { RETREAT_RULES } from '../data/retreatRules.js';
import { createHeroCanvas } from './PixelArt.js';
import { describeInjury } from './DungeonScreen.js';
import { createRiskBadge } from './RiskBadge.js';
import { renderOrders } from './OrdersPanel.js';
import { createNewsLine } from './NewsLine.js';
import { createSupplyPicker } from './SupplyPicker.js';
import { getConsumable } from '../data/consumables.js';
import { DUNGEONS } from '../data/dungeons.js';
import { showToast } from './Toast.js';
import { Sound } from './Sound.js';

export class DayPlanScreen {
  // onGoTo(screenId) = zu einem anderen Reiter wechseln (z.B. 'dungeons' oder 'tavern')
  constructor(rootElement, game, onGoTo) {
    this.root = rootElement;
    this.game = game;
    this.onGoTo = onGoTo;
    this.openOrders = new Set(); // ids der Gruppen, deren Anweisungen gerade aufgeklappt sind

    this.root.innerHTML = `
      <div class="day-plan-screen">
        <section class="panel day-plan-header">
          <h2 class="day-plan-title"></h2>
          <div class="day-plan-counts"></div>
          <div class="day-plan-hint"></div>
          <div class="day-plan-wages hint"></div>
          <div class="day-plan-actions">
            <button class="repeat-button">↻ Wie gestern</button>
            <button class="go-dungeons-button">Gruppe einplanen</button>
            <button class="big-button plan-end-day-button">Tag beenden ▶</button>
          </div>
        </section>
        <section class="panel day-plan-server">
          <h2>Neues vom Server</h2>
          <div class="news-ticker"></div>
          <details class="leaderboard">
            <summary>Rangliste</summary>
            <div class="leaderboard-list"></div>
          </details>
        </section>
        <section class="panel">
          <h2>Im Dungeon</h2>
          <div class="day-plan-runs"></div>
        </section>
        <section class="panel">
          <h2>Ohne Kampf</h2>
          <div class="day-plan-others"></div>
        </section>
      </div>
    `;

    this.root.querySelector('.go-dungeons-button').addEventListener('click', () => {
      Sound.click();
      // Ohne Helden geht es zur Taverne, sonst zu den Dungeons (siehe renderHeader)
      this.onGoTo(this.root.querySelector('.go-dungeons-button').dataset.target);
    });
    this.root.querySelector('.repeat-button').addEventListener('click', () => {
      const planned = this.game.repeatYesterday();
      if (planned > 0) {
        Sound.boxArrived();
        showToast(planned === 1 ? '1 Gruppe wie gestern eingeplant' : planned + ' Gruppen wie gestern eingeplant', '#ffd23f');
      } else {
        Sound.click();
        showToast('Keine Gruppe von gestern kann heute los.', '#ff6b6b');
      }
    });
    this.root.querySelector('.plan-end-day-button').addEventListener('click', () => {
      Sound.click();
      this.game.endDay();
    });

    game.on('changed', () => this.render());
    this.render();
  }

  render() {
    const plan = getDayPlan(this.game.guild);
    this.renderHeader(plan);
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
      ticker.innerHTML = '<p class="empty">Noch ist es ruhig auf dem Server.</p>';
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
      row.querySelector('.leaderboard-progress').textContent = entry.best === 0
        ? 'noch kein Dungeon'
        : entry.best + ' / ' + DUNGEONS.length + ' Dungeons · zuletzt Tag ' + entry.bestDay;
      list.appendChild(row);
    });
  }

  // ---------- Überblick ----------

  renderHeader(plan) {
    this.root.querySelector('.day-plan-title').textContent = 'Tagesplan – Tag ' + this.game.day;

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

    // Sold und Trainer-Kosten heute Abend
    const training = plan.counts.training * getTrainingCost(this.game.guild);
    this.root.querySelector('.day-plan-wages').textContent = plan.entries.length === 0 ? '' :
      'Heute Abend: Sold ' + this.game.getDailyWages() + ' Gold' + (training > 0 ? ' · Training ' + training + ' Gold' : '');
    // "Wie gestern" nur, wenn es gestern Gruppen gab und heute noch keine geplant ist
    const repeatButton = this.root.querySelector('.repeat-button');
    repeatButton.hidden = this.game.guild.lastDayPlan.length === 0 || this.game.guild.expeditions.length > 0;

    // Hinweis, was man als Nächstes tun könnte
    const hint = this.root.querySelector('.day-plan-hint');
    if (plan.entries.length === 0) {
      hint.textContent = 'Du hast noch keine Helden. In der Taverne warten Bewerber.';
    } else if (plan.counts.rest > 0) {
      hint.textContent = plan.counts.rest === 1
        ? '1 Held ruht sich nur aus. Schick ihn in einen Dungeon oder gib ihm unten eine Aufgabe!'
        : plan.counts.rest + ' Helden ruhen sich nur aus. Schick sie in einen Dungeon oder gib ihnen unten eine Aufgabe!';
    } else {
      hint.textContent = 'Alle Helden haben eine Aufgabe. Zeit, den Tag zu beenden!';
    }
    const goButton = this.root.querySelector('.go-dungeons-button');
    goButton.textContent = plan.entries.length === 0 ? 'Zur Taverne' : 'Gruppe einplanen';
    goButton.dataset.target = plan.entries.length === 0 ? 'tavern' : 'dungeons';
    goButton.classList.toggle('glow', plan.counts.rest > 0 || plan.entries.length === 0);
  }

  // ---------- Gruppen im Dungeon ----------

  renderRuns() {
    const list = this.root.querySelector('.day-plan-runs');
    list.innerHTML = '';
    if (this.game.guild.expeditions.length === 0) {
      list.innerHTML = '<p class="empty">Heute zieht keine Gruppe los.</p>';
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
        <div class="run-buttons"><button class="cancel-button">Absagen</button></div>
      `;
      card.querySelector('.run-name').textContent = dungeon.name;
      card.querySelector('.run-status').textContent = 'Stufe ' + dungeon.level +
        (retreatRule ? ' · Rückzug: ' + retreatRule.name : '');

      const heroList = card.querySelector('.day-plan-heroes');
      const heroes = expedition.getHeroIds().map((heroId) => this.game.guild.findHero(heroId)).filter((hero) => hero);
      for (const hero of heroes) {
        heroList.appendChild(this.createHeroRow(hero, null));
      }
      heroList.before(createRiskBadge(heroes, expedition.dungeonId, expedition.retreatRuleId, expedition.supplies,
        this.game.isDungeonScouted(expedition.dungeonId), this.game.hasDefeatForecast()));
      heroList.after(this.createOrdersSection(expedition, heroes));
      heroList.after(this.createSupplySection(expedition));
      card.querySelector('.cancel-button').addEventListener('click', () => {
        Sound.click();
        this.game.cancelExpedition(expedition.id);
      });
      list.appendChild(card);
    }
  }

  // Vorräte der Gruppe: tauschen ist bis zum Tagesende möglich
  createSupplySection(expedition) {
    const section = document.createElement('div');
    section.className = 'day-plan-supplies';
    section.innerHTML = '<span class="day-plan-supplies-label">Vorräte</span>';
    section.appendChild(createSupplyPicker(this.game.guild, expedition.supplies, expedition.supplies, (next) => {
      Sound.click();
      this.game.setExpeditionSupplies(expedition.id, next);
    }));
    return section;
  }

  // Aufklappbare Anweisungen der Gruppe. Bleibt nach einer Änderung offen (die Seite wird dabei neu gebaut).
  createOrdersSection(expedition, heroes) {
    const section = document.createElement('details');
    section.className = 'day-plan-orders';
    section.open = this.openOrders.has(expedition.id);
    section.innerHTML = '<summary>Anweisungen für diesen Dungeon</summary><div class="orders-list"></div>';
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
      list.innerHTML = '<p class="empty">Niemand. Alle Helden kämpfen heute.</p>';
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
    text.querySelector('b').textContent = hero.name;
    text.querySelector('.roster-sub').textContent = hero.getClass().name + ' · Lv ' + hero.level;
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
      if (!HERO_TASKS[taskId].choosable) {
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
        option.textContent = dungeon.name + (this.game.isDungeonScouted(dungeon.id) ? ' ✓' : '');
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
      hint.textContent = '≈ ' + getJobGold(hero) + ' Gold';
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
    button.textContent = bandages.icon + ' Verband (' + count + ')';
    button.title = bandages.description + (count === 0 ? '. Gibt es beim Händler in der Schatzkammer.' : '');
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
