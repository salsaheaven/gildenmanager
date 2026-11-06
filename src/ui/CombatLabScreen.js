// ============================================================
// COMBATLABSCREEN – das Kampf-Labor (Testbildschirm)
// Gruppe wählen (Testgruppe, eigene Helden oder Test-Raid), Boss wählen, dann:
//   - "Kampf ansehen": ein einzelner Kampf als Szene, danach der vollständige Bericht
//   - "Siegchance berechnen": viele Kämpfe, daraus Siegchance und Risiko
// Test-Raid: 4 Gruppen à 5 Testhelden gegen einen Raid-Boss (data/raidBosses.js).
//   Anweisungen und Talente gelten pro Klasse, wie bei der Testgruppe eingestellt.
// Nichts davon verändert den Spielstand.
// ============================================================

import { renderTalents } from './TalentPanel.js';
import { BOSSES, getBoss } from '../data/enemies.js';
import { RAID_BOSSES } from '../data/raidBosses.js';
import { getBossLevel } from '../data/dungeons.js';
import { scaleEnemyStats } from '../systems/combat/Battle.js';
import { simulateBattle, simulateRaid } from '../systems/combat/CombatSimulator.js';
import { estimateChances } from '../systems/combat/ChanceEstimator.js';
import { createTestGroup, createTestRaid, STANDARD_TEST_CLASSES, STANDARD_TEST_RAID } from '../systems/combat/TestGroup.js';
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

    this.mode = 'test';                // 'test' = Testgruppe, 'guild' = eigene Helden, 'raid' = Test-Raid
    this.testLevel = 1;
    this.testClassIds = STANDARD_TEST_CLASSES.slice(); // Klassen der Testgruppe (5 Plätze)
    this.selectedHeroIds = new Set();  // gewählte eigene Helden
    this.raidClassIds = STANDARD_TEST_RAID.map((group) => group.slice()); // Klassen des Test-Raids (4 × 5)
    this.bossId = 'grimfang';
    this.raidBossId = RAID_BOSSES[0].id; // gewählter Raid-Boss (eigene Wahl, damit der Dungeon-Boss erhalten bleibt)
    this.fightCounter = 0;             // sorgt dafür, dass jeder Kampf anders verläuft
    this.activeScene = null;           // die gerade laufende Kampfszene
    this.testOrders = {};              // Anweisungen der Testgruppe: Klasse → { Anweisung → Option }
    this.testTalents = {};             // Talente der Testgruppe: Klasse → Liste von Talent-ids (kostenlos änderbar)

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

          <p class="hint raid-settings-hint" hidden>Im Test-Raid gelten die Anweisungen und Talente,
            die du bei der Testgruppe für eine Klasse gewählt hast.</p>
          <div class="lab-group-settings">
            <h3>Anweisungen</h3>
            <div class="orders-list"></div>

            <h3>Talente</h3>
            <div class="lab-talents"></div>
          </div>

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
    // Im Test-Raid wären es 20 Helden: Anweisungen und Talente kommen dann von der Testgruppe
    const isRaid = this.mode === 'raid';
    this.root.querySelector('.lab-group-settings').hidden = isRaid;
    this.root.querySelector('.raid-settings-hint').hidden = !isRaid;
    if (!isRaid) {
      this.renderOrderList();
      this.renderTalentList();
    }
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
      [{ label: 'Testgruppe', value: 'test' }, { label: 'Eigene Helden', value: 'guild' }, { label: 'Test-Raid', value: 'raid' }],
      (value) => value === this.mode,
      (value) => { this.mode = value; },
    );
  }

  renderGroupOptions() {
    const container = this.root.querySelector('.group-options');
    container.innerHTML = '';

    if (this.mode === 'test' || this.mode === 'raid') {
      const row = document.createElement('div');
      row.className = 'button-row';
      container.appendChild(row);
      this.fillButtonRow(
        row,
        TEST_LEVELS.map((level) => ({ label: 'Level ' + level, value: level })),
        (value) => value === this.testLevel,
        (value) => { this.testLevel = value; },
      );
      if (this.mode === 'test') {
        this.renderClassPickers(container, this.testClassIds);
      } else {
        // Test-Raid: eine Zeile Auswahllisten pro Gruppe
        this.raidClassIds.forEach((classIds, groupIndex) => {
          const label = document.createElement('div');
          label.className = 'lab-raid-group-label';
          label.textContent = 'Gruppe ' + (groupIndex + 1);
          container.appendChild(label);
          this.renderClassPickers(container, classIds);
        });
      }
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

  // Pro Platz eine Auswahlliste mit allen Klassen (nach Rolle sortiert).
  // classIds = die Liste, die geändert wird (Testgruppe oder eine Gruppe des Test-Raids)
  renderClassPickers(container, classIds) {
    const row = document.createElement('div');
    row.className = 'lab-class-pickers';
    container.appendChild(row);
    for (let slot = 0; slot < classIds.length; slot++) {
      const select = document.createElement('select');
      for (const role of Object.keys(ROLE_NAMES)) {
        const group = document.createElement('optgroup');
        group.label = ROLE_NAMES[role];
        for (const heroClass of HERO_CLASSES.filter((entry) => entry.role === role)) {
          const option = document.createElement('option');
          option.value = heroClass.id;
          option.textContent = heroClass.name;
          option.selected = heroClass.id === classIds[slot];
          group.appendChild(option);
        }
        select.appendChild(group);
      }
      select.addEventListener('change', () => {
        Sound.click();
        classIds[slot] = select.value;
        this.renderSetup();
      });
      row.appendChild(select);
    }
  }

  // Die Helden, die gerade kämpfen würden (im Test-Raid alle 20 in einer Liste)
  getGroup() {
    if (this.mode === 'test') {
      const group = createTestGroup(this.testLevel, 'uncommon', this.testClassIds);
      this.applyTestSettings(group);
      return group;
    }
    if (this.mode === 'raid') {
      return this.getRaidGroups().flat();
    }
    return this.game.guild.heroes.filter((hero) => this.selectedHeroIds.has(hero.id));
  }

  // Test-Raid: 4 Gruppen à 5 Testhelden
  getRaidGroups() {
    const groups = createTestRaid(this.testLevel, 'uncommon', this.raidClassIds);
    for (const group of groups) {
      this.applyTestSettings(group);
    }
    return groups;
  }

  // Testhelden werden jedes Mal neu erstellt: Anweisungen und Talente pro Klasse merkt sich das Labor
  applyTestSettings(heroes) {
    for (const hero of heroes) {
      hero.orders = { ...(this.testOrders[hero.classId] || {}) };
      // Nur Talente behalten, die auf dem Test-Level erlaubt sind
      for (const talentId of this.testTalents[hero.classId] || []) {
        hero.chooseTalent(talentId);
      }
    }
  }

  // Der gewählte Gegner (im Test-Raid ein Raid-Boss)
  getBossId() {
    return this.mode === 'raid' ? this.raidBossId : this.bossId;
  }

  // Stufe des Gegners: Dungeon-Bosse kämpfen auf der Stufe ihres Dungeons, Raid-Bosse auf ihrer eigenen
  getEnemyLevel() {
    const boss = getBoss(this.getBossId());
    return boss.isRaidBoss ? boss.level : getBossLevel(boss.id);
  }

  renderGroupPreview() {
    const preview = this.root.querySelector('.group-preview');
    preview.innerHTML = '';
    if (this.mode === 'raid') {
      // Eine Zeile pro Gruppe, kleinere Bilder
      for (const group of this.getRaidGroups()) {
        const row = document.createElement('div');
        row.className = 'lab-raid-preview-row';
        for (const hero of group) {
          row.appendChild(createHeroCanvas(hero, 2));
        }
        preview.appendChild(row);
      }
      return;
    }
    for (const hero of this.getGroup()) {
      preview.appendChild(createHeroCanvas(hero, 4));
    }
  }

  renderBossList() {
    const isRaid = this.mode === 'raid';
    this.fillButtonRow(
      this.root.querySelector('.boss-list'),
      (isRaid ? RAID_BOSSES : BOSSES).map((boss) => ({ label: boss.name, value: boss.id })),
      (value) => value === this.getBossId(),
      (value) => {
        if (isRaid) {
          this.raidBossId = value;
        } else {
          this.bossId = value;
        }
      },
    );

    const boss = getBoss(this.getBossId());
    const info = this.root.querySelector('.boss-info');
    info.innerHTML = '<div class="boss-title"></div><ul class="mechanic-list"></ul>';
    const level = this.getEnemyLevel();
    const health = scaleEnemyStats(boss.stats, level).health;
    info.querySelector('.boss-title').textContent = boss.name + ' – ' + boss.title +
      ' (Stufe ' + level + ', ' + health + ' Leben' + (boss.enrageRound ? ', Raserei ab Runde ' + boss.enrageRound : '') + ')';
    // Raid-Bosse: Mechaniken aller Phasen
    const mechanics = boss.mechanics.concat(...(boss.phases || []).map((phase) => phase.mechanics));
    for (const mechanic of mechanics) {
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

  // Talente: in der Testgruppe kostenlos, eigene Helden wie im Heldenbildschirm (Umskillen kostet dort Gold)
  renderTalentList() {
    const container = this.root.querySelector('.lab-talents');
    container.innerHTML = '';
    for (const hero of this.getGroup()) {
      const block = document.createElement('div');
      block.className = 'lab-talent-block';
      block.innerHTML = '<div class="orders-hero"><span></span></div><div class="lab-talent-rows"></div>';
      block.querySelector('.orders-hero span').textContent = hero.name;
      if (this.mode === 'test') {
        renderTalents(block.querySelector('.lab-talent-rows'), hero, {
          onChoose: (changedHero, talentId) => {
            Sound.click();
            this.testTalents[changedHero.classId] = (this.testTalents[changedHero.classId] || []).concat(talentId);
            this.renderSetup();
          },
          onReset: (changedHero) => {
            Sound.click();
            this.testTalents[changedHero.classId] = [];
            this.renderSetup();
          },
        });
      } else {
        renderTalents(block.querySelector('.lab-talent-rows'), hero, {
          onChoose: (changedHero, talentId) => this.game.chooseHeroTalent(changedHero.id, talentId),
        });
      }
      container.appendChild(block);
    }
    if (container.children.length === 0) {
      container.innerHTML = '<p class="hint">Wähle zuerst Helden aus.</p>';
    }
  }

  // ---------- Kämpfe ----------

  // Kampf berechnen und als Szene abspielen. Am Ende erscheint der Bericht darunter.
  runFight() {
    this.fightCounter++;
    const options = {
      bossId: this.getBossId(),
      enemyLevel: this.getEnemyLevel(),
      seed: Date.now() + this.fightCounter,
      recordLog: true,
    };
    let group;
    let result;
    if (this.mode === 'raid') {
      options.groups = this.getRaidGroups();
      group = options.groups.flat();
      result = simulateRaid(options);
    } else {
      group = this.getGroup();
      options.heroes = group;
      result = simulateBattle(options);
    }

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
    const options = { bossId: this.getBossId(), enemyLevel: this.getEnemyLevel(), seed: Date.now() };
    let group;
    if (this.mode === 'raid') {
      options.groups = this.getRaidGroups();
      group = options.groups.flat();
    } else {
      group = this.getGroup();
      options.heroes = group;
    }
    const estimate = estimateChances(options);
    Sound.click();
    this.renderEstimate(estimate, group);
  }

  renderEstimate(estimate, group) {
    const box = this.root.querySelector('.estimate-box');
    const boss = getBoss(this.getBossId());
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
