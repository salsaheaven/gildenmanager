// ============================================================
// DAYPLANSCREEN – der Tagesplan: Wer macht heute was?
//   - oben: Tag, Überblick (wie viele im Dungeon, verletzt, frei) und "Tag beenden"
//   - Gruppen, die heute in einen Dungeon ziehen (mit "Absagen")
//   - alle Helden, die heute nicht kämpfen (verletzt oder ohne Aufgabe)
// Die Aufgaben selbst stehen in data/heroTasks.js, die Rechnung in systems/DayPlan.js.
// ============================================================

import { getDayPlan } from '../systems/DayPlan.js';
import { HERO_TASKS } from '../data/heroTasks.js';
import { getDungeon } from '../data/dungeons.js';
import { RETREAT_RULES } from '../data/retreatRules.js';
import { createHeroCanvas } from './PixelArt.js';
import { describeInjury } from './DungeonScreen.js';
import { Sound } from './Sound.js';

export class DayPlanScreen {
  // onGoTo(screenId) = zu einem anderen Reiter wechseln (z.B. 'dungeons' oder 'tavern')
  constructor(rootElement, game, onGoTo) {
    this.root = rootElement;
    this.game = game;
    this.onGoTo = onGoTo;

    this.root.innerHTML = `
      <div class="day-plan-screen">
        <section class="panel day-plan-header">
          <h2 class="day-plan-title"></h2>
          <div class="day-plan-counts"></div>
          <div class="day-plan-hint"></div>
          <div class="day-plan-actions">
            <button class="go-dungeons-button">Gruppe einplanen</button>
            <button class="big-button plan-end-day-button">Tag beenden ▶</button>
          </div>
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
  }

  // ---------- Überblick ----------

  renderHeader(plan) {
    this.root.querySelector('.day-plan-title').textContent = 'Tagesplan – Tag ' + this.game.day;

    const counts = this.root.querySelector('.day-plan-counts');
    counts.innerHTML = '';
    for (const taskId in HERO_TASKS) {
      const chip = createTaskChip(taskId);
      chip.textContent = HERO_TASKS[taskId].name + ': ' + plan.counts[taskId];
      counts.appendChild(chip);
    }

    // Hinweis, was man als Nächstes tun könnte
    const hint = this.root.querySelector('.day-plan-hint');
    if (plan.entries.length === 0) {
      hint.textContent = 'Du hast noch keine Helden. In der Taverne warten Bewerber.';
    } else if (plan.counts.rest > 0) {
      hint.textContent = plan.counts.rest === 1
        ? '1 Held hat heute nichts zu tun. Schick ihn in einen Dungeon!'
        : plan.counts.rest + ' Helden haben heute nichts zu tun. Schick sie in einen Dungeon!';
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
      for (const heroId of expedition.getHeroIds()) {
        const hero = this.game.guild.findHero(heroId);
        if (hero) {
          heroList.appendChild(this.createHeroRow(hero, null));
        }
      }
      card.querySelector('.cancel-button').addEventListener('click', () => {
        Sound.click();
        this.game.cancelExpedition(expedition.id);
      });
      list.appendChild(card);
    }
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
    if (taskId) {
      const chip = createTaskChip(taskId);
      chip.textContent = taskId === 'injured' ? describeInjury(hero) : HERO_TASKS[taskId].name;
      chip.title = HERO_TASKS[taskId].description;
      row.appendChild(chip);
    }
    return row;
  }
}

// Kleines farbiges Schild für eine Aufgabe
function createTaskChip(taskId) {
  const chip = document.createElement('span');
  chip.className = 'task-chip';
  chip.style.setProperty('--task-color', HERO_TASKS[taskId].color);
  return chip;
}
