// ============================================================
// COMBATLABSCREEN – das Kampf-Labor (Testbildschirm)
// Gruppe wählen (Testgruppe oder eigene Helden), Boss wählen, dann:
//   - "Kampf ansehen": ein einzelner Kampf als Szene, danach der vollständige Bericht
//   - "Siegchance berechnen": viele Kämpfe, daraus Siegchance und Risiko
// Nichts davon verändert den Spielstand.
// ============================================================

import { BOSSES, getBoss } from '../data/enemies.js';
import { getBossLevel } from '../data/dungeons.js';
import { scaleEnemyStats } from '../systems/combat/Battle.js';
import { simulateBattle } from '../systems/combat/CombatSimulator.js';
import { estimateChances } from '../systems/combat/ChanceEstimator.js';
import { createTestGroup, STANDARD_TEST_CLASSES } from '../systems/combat/TestGroup.js';
import { HERO_CLASSES, ROLE_NAMES } from '../data/heroClasses.js';
import { createHeroCanvas } from './PixelArt.js';
import { renderCombatReport } from './CombatReport.js';
import { BattleScene } from './BattleScene.js';
import { renderOrders } from './OrdersPanel.js';
import { Sound } from './Sound.js';

const MAX_GROUP_SIZE = 5;
const TEST_LEVELS = [1, 3, 5, 10, 20, 30];

export class CombatLabScreen {
  constructor(rootElement, game) {
    this.root = rootElement;
    this.game = game;

    this.mode = 'test';                // 'test' = Testgruppe, 'guild' = eigene Helden
    this.testLevel = 1;
    this.testClassIds = STANDARD_TEST_CLASSES.slice(); // Klassen der Testgruppe (5 Plätze)
    this.selectedHeroIds = new Set();  // gewählte eigene Helden
    this.bossId = 'grimfang';
    this.fightCounter = 0;             // sorgt dafür, dass jeder Kampf anders verläuft
    this.activeScene = null;           // die gerade laufende Kampfszene
    this.testOrders = {};              // Anweisungen der Testgruppe: Klasse → { Anweisung → Option }

    this.root.innerHTML = `
      <div class="lab-screen">
        <section class="panel lab-setup">
          <h2>Kampf-Labor</h2>
          <p class="hint">Probiere Gruppen gegen Bosse aus. Nichts hier verändert dein Spiel.</p>

          <h3>Gruppe</h3>
          <div class="button-row mode-buttons"></div>
          <div class="group-options"></div>
          <div class="group-preview"></div>

          <h3>Gegner</h3>
          <div class="boss-list"></div>
          <div class="boss-info"></div>

          <h3>Anweisungen</h3>
          <div class="orders-list"></div>

          <div class="lab-actions">
            <button class="big-button fight-button">Kampf ansehen</button>
            <button class="big-button estimate-button">Siegchance berechnen</button>
          </div>
        </section>

        <section class="panel lab-results">
          <div class="estimate-box"></div>
          <div class="report-box"><p class="hint">Starte links einen Kampf.</p></div>
        </section>
      </div>
    `;

    this.root.querySelector('.fight-button').addEventListener('click', () => this.runFight());
    this.root.querySelector('.estimate-button').addEventListener('click', () => this.runEstimate());

    game.on('changed', () => {
      if (this.mode === 'guild') {
        this.renderSetup();
      }
    });
    this.renderSetup();
  }

  // ---------- Auswahl ----------

  renderSetup() {
    this.renderModeButtons();
    this.renderGroupOptions();
    this.renderGroupPreview();
    this.renderBossList();
    this.renderOrderList();
    const hasGroup = this.getGroup().length > 0;
    this.root.querySelector('.fight-button').disabled = !hasGroup;
    this.root.querySelector('.estimate-button').disabled = !hasGroup;
  }

  // Kleiner Helfer: eine Reihe von Auswahlknöpfen bauen
  fillButtonRow(container, options, isActive, onClick) {
    container.innerHTML = '';
    for (const option of options) {
      const button = document.createElement('button');
      button.className = 'filter-button';
      button.textContent = option.label;
      button.classList.toggle('active', isActive(option.value));
      button.addEventListener('click', () => {
        Sound.click();
        onClick(option.value);
        this.renderSetup();
      });
      container.appendChild(button);
    }
  }

  renderModeButtons() {
    this.fillButtonRow(
      this.root.querySelector('.mode-buttons'),
      [{ label: 'Testgruppe', value: 'test' }, { label: 'Eigene Helden', value: 'guild' }],
      (value) => value === this.mode,
      (value) => { this.mode = value; },
    );
  }

  renderGroupOptions() {
    const container = this.root.querySelector('.group-options');
    container.innerHTML = '';

    if (this.mode === 'test') {
      const row = document.createElement('div');
      row.className = 'button-row';
      container.appendChild(row);
      this.fillButtonRow(
        row,
        TEST_LEVELS.map((level) => ({ label: 'Level ' + level, value: level })),
        (value) => value === this.testLevel,
        (value) => { this.testLevel = value; },
      );
      this.renderClassPickers(container);
      return;
    }

    // Eigene Helden: anklicken zum Aus- und Abwählen (höchstens 5)
    const heroes = this.game.guild.heroes;
    if (heroes.length === 0) {
      container.innerHTML = '<p class="empty">Du hast noch keine Helden. Heuere welche in der Taverne an!</p>';
      return;
    }
    for (const hero of heroes) {
      const button = document.createElement('button');
      button.className = 'lab-hero-toggle';
      button.style.setProperty('--rarity', hero.getRarity().color);
      button.classList.toggle('selected', this.selectedHeroIds.has(hero.id));
      button.appendChild(createHeroCanvas(hero, 2));
      button.insertAdjacentHTML('beforeend', '<span></span>');
      button.querySelector('span').textContent = hero.name + ' (' + hero.getClass().name + ')';
      button.addEventListener('click', () => {
        Sound.click();
        if (this.selectedHeroIds.has(hero.id)) {
          this.selectedHeroIds.delete(hero.id);
        } else if (this.selectedHeroIds.size < MAX_GROUP_SIZE) {
          this.selectedHeroIds.add(hero.id);
        }
        this.renderSetup();
      });
      container.appendChild(button);
    }
  }

  // Testgruppe: pro Platz eine Auswahlliste mit allen Klassen (nach Rolle sortiert)
  renderClassPickers(container) {
    const row = document.createElement('div');
    row.className = 'lab-class-pickers';
    container.appendChild(row);
    for (let slot = 0; slot < this.testClassIds.length; slot++) {
      const select = document.createElement('select');
      for (const role of Object.keys(ROLE_NAMES)) {
        const group = document.createElement('optgroup');
        group.label = ROLE_NAMES[role];
        for (const heroClass of HERO_CLASSES.filter((entry) => entry.role === role)) {
          const option = document.createElement('option');
          option.value = heroClass.id;
          option.textContent = heroClass.name;
          option.selected = heroClass.id === this.testClassIds[slot];
          group.appendChild(option);
        }
        select.appendChild(group);
      }
      select.addEventListener('change', () => {
        Sound.click();
        this.testClassIds[slot] = select.value;
        this.renderSetup();
      });
      row.appendChild(select);
    }
  }

  // Die Helden, die gerade kämpfen würden
  getGroup() {
    if (this.mode === 'test') {
      const group = createTestGroup(this.testLevel, 'uncommon', this.testClassIds);
      // Die Testgruppe wird jedes Mal neu erstellt, ihre Anweisungen merkt sich das Labor
      for (const hero of group) {
        hero.orders = { ...(this.testOrders[hero.classId] || {}) };
      }
      return group;
    }
    return this.game.guild.heroes.filter((hero) => this.selectedHeroIds.has(hero.id));
  }

  renderGroupPreview() {
    const preview = this.root.querySelector('.group-preview');
    preview.innerHTML = '';
    for (const hero of this.getGroup()) {
      preview.appendChild(createHeroCanvas(hero, 4));
    }
  }

  renderBossList() {
    this.fillButtonRow(
      this.root.querySelector('.boss-list'),
      BOSSES.map((boss) => ({ label: boss.name, value: boss.id })),
      (value) => value === this.bossId,
      (value) => { this.bossId = value; },
    );

    const boss = getBoss(this.bossId);
    const info = this.root.querySelector('.boss-info');
    info.innerHTML = '<div class="boss-title"></div><ul class="mechanic-list"></ul>';
    // Der Boss kämpft auf der Stufe seines Dungeons
    const level = getBossLevel(boss.id);
    const health = scaleEnemyStats(boss.stats, level).health;
    info.querySelector('.boss-title').textContent = boss.name + ' – ' + boss.title +
      ' (Stufe ' + level + ', ' + health + ' Leben' + (boss.enrageRound ? ', Raserei ab Runde ' + boss.enrageRound : '') + ')';
    for (const mechanic of boss.mechanics) {
      const line = document.createElement('li');
      line.innerHTML = '<b></b><span></span>';
      line.querySelector('b').textContent = mechanic.name;
      line.querySelector('span').textContent = mechanic.hint;
      info.querySelector('.mechanic-list').appendChild(line);
    }
  }

  renderOrderList() {
    renderOrders(this.root.querySelector('.orders-list'), this.getGroup(), (hero, orderId, optionId) => {
      if (this.mode === 'test') {
        this.testOrders[hero.classId] = { ...(this.testOrders[hero.classId] || {}), [orderId]: optionId };
      } else {
        // Eigene Helden merken sich ihre Anweisungen dauerhaft (wird gespeichert)
        this.game.setHeroOrder(hero.id, orderId, optionId);
      }
    });
  }

  // ---------- Kämpfe ----------

  // Kampf berechnen und als Szene abspielen. Am Ende erscheint der Bericht darunter.
  runFight() {
    this.fightCounter++;
    const group = this.getGroup();
    const result = simulateBattle({
      heroes: group,
      bossId: this.bossId,
      enemyLevel: getBossLevel(this.bossId),
      seed: Date.now() + this.fightCounter,
      recordLog: true,
    });

    const box = this.root.querySelector('.report-box');
    box.innerHTML = '<div class="scene-box"></div><div class="final-report"></div>';
    const scene = new BattleScene(box.querySelector('.scene-box'), result, group, () => {
      renderCombatReport(box.querySelector('.final-report'), result);
      if (result.isDummy || result.victory) {
        Sound.itemReveal(3);
      } else {
        Sound.shake(0.4);
      }
    });
    this.activeScene = scene;
  }

  // Wird in jedem Bild aus main.js aufgerufen (seconds = vergangene echte Zeit), damit die Szene läuft
  update(seconds) {
    if (this.activeScene) {
      this.activeScene.update(seconds);
    }
  }

  runEstimate() {
    const group = this.getGroup();
    const estimate = estimateChances({
      heroes: group,
      bossId: this.bossId,
      enemyLevel: getBossLevel(this.bossId),
      seed: Date.now(),
    });
    Sound.click();
    this.renderEstimate(estimate, group);
  }

  renderEstimate(estimate, group) {
    const box = this.root.querySelector('.estimate-box');
    const boss = getBoss(this.bossId);
    if (boss.isDummy) {
      box.innerHTML = `<div class="estimate-main">Ø ${Math.round(estimate.averageGroupDamagePerRound)} Schaden pro Runde (ganze Gruppe)</div>`;
      return;
    }

    const percent = Math.round(estimate.winRate * 100);
    let colorClass = 'bad';
    if (percent >= 80) {
      colorClass = 'good';
    } else if (percent >= 50) {
      colorClass = 'ok';
    }

    box.innerHTML = `
      <div class="estimate-main ${colorClass}">Siegchance: ${percent} %</div>
      <div class="estimate-sub">
        aus ${estimate.count} simulierten Kämpfen · Ø ${Math.round(estimate.averageRounds)} Runden ·
        in ${Math.round(estimate.fallenRate * 100)} % der Kämpfe fällt mindestens ein Held
      </div>
      <div class="estimate-falls"></div>
    `;
    const falls = box.querySelector('.estimate-falls');
    for (const hero of group) {
      const rate = Math.round(estimate.fallRateByHero[hero.id] * 100);
      const chip = document.createElement('span');
      chip.className = 'fall-chip';
      chip.textContent = hero.name + ': fällt in ' + rate + ' %';
      falls.appendChild(chip);
    }
  }
}
