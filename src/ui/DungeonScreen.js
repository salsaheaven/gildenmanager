// ============================================================
// DUNGEONSCREEN – Dungeons auswählen, Gruppe losschicken, Runs verfolgen
//   Links:  alle Dungeons (gesperrte grau)
//   Rechts: der gewählte Dungeon mit Begegnungen, Gruppe, Taktik, Rückzugsregel, Anweisungen
//   Unten:  laufende Runs (Fortschritt, Zuschauen, Rückzug) und Berichte
// ============================================================

import { DUNGEONS, getDungeon } from '../data/dungeons.js';
import { getBoss, MINIONS } from '../data/enemies.js';
import { TACTICS } from '../data/tactics.js';
import { RETREAT_RULES } from '../data/retreatRules.js';
import { getLootBoxType } from '../data/lootBoxes.js';
import { BALANCING } from '../data/balancing.js';
import { COMBAT_RULES } from '../data/combatRules.js';
import { createHeroCanvas, createSpriteCanvas, createChestCanvas } from './PixelArt.js';
import { renderOrders } from './OrdersPanel.js';
import { RunViewer } from './RunViewer.js';
import { Sound } from './Sound.js';
import { showToast } from './Toast.js';

const GROUP_SIZE = 5;

export class DungeonScreen {
  constructor(rootElement, game) {
    this.root = rootElement;
    this.game = game;
    this.dungeonId = DUNGEONS[0].id;
    this.selectedHeroIds = new Set();
    this.tacticId = 'balanced';
    this.retreatRuleId = 'never';

    this.root.innerHTML = `
      <div class="dungeon-screen">
        <section class="panel dungeon-list"><h2>Dungeons</h2><div class="dungeon-cards"></div></section>
        <section class="panel dungeon-setup"></section>
        <section class="panel run-panel">
          <h2>Unterwegs</h2>
          <div class="run-list"></div>
          <div class="run-viewer"></div>
          <h2>Berichte</h2>
          <div class="report-list"></div>
        </section>
      </div>
    `;

    this.viewer = new RunViewer(this.root.querySelector('.run-viewer'), game);

    game.on('changed', () => this.render());
    game.on('expeditionFinished', (report) => {
      if (this.viewer.isWatching(report.expeditionId)) {
        this.viewer.showReport(report);
      }
    });
    this.render();
  }

  render() {
    // Gewählte Helden, die inzwischen unterwegs, verletzt oder weg sind, abwählen
    for (const heroId of this.selectedHeroIds) {
      const hero = this.game.guild.findHero(heroId);
      if (!hero || this.game.guild.isHeroBusy(heroId) || hero.isInjured()) {
        this.selectedHeroIds.delete(heroId);
      }
    }
    this.renderDungeonCards();
    this.renderSetup();
    this.renderRuns();
    this.renderReports();
  }

  // Wird in jedem Bild aufgerufen: Fortschrittsbalken und Zuschauer
  update() {
    for (const expedition of this.game.guild.expeditions) {
      const row = this.root.querySelector('.run-row[data-id="' + expedition.id + '"]');
      if (row) {
        row.querySelector('.run-fill').style.width = expedition.getProgress() * 100 + '%';
        row.querySelector('.run-status').textContent = this.describePosition(expedition);
      }
    }
    this.viewer.update();
  }

  // ---------- Dungeon-Liste ----------

  renderDungeonCards() {
    const container = this.root.querySelector('.dungeon-cards');
    container.innerHTML = '';
    for (const dungeon of DUNGEONS) {
      const unlocked = this.game.isDungeonUnlocked(dungeon.id);
      const clears = this.game.guild.getClears(dungeon.id);
      const card = document.createElement('button');
      card.className = 'dungeon-card';
      card.classList.toggle('selected', dungeon.id === this.dungeonId);
      card.classList.toggle('locked', !unlocked);
      card.innerHTML = `
        <span class="dungeon-name"></span>
        <span class="dungeon-sub"></span>
      `;
      card.querySelector('.dungeon-name').textContent = dungeon.name;
      card.querySelector('.dungeon-sub').textContent = unlocked
        ? 'Stufe ' + dungeon.level + ' · Empf. AW ' + dungeon.recommendedGearScore + (clears > 0 ? ' · geschafft: ' + clears + '×' : ' · noch nie geschafft')
        : 'Gesperrt: erst ' + getDungeon(dungeon.unlockAfter).name + ' schaffen';
      card.addEventListener('click', () => {
        Sound.click();
        this.dungeonId = dungeon.id;
        this.render();
      });
      container.appendChild(card);
    }
  }

  // ---------- Gewählter Dungeon ----------

  renderSetup() {
    const dungeon = getDungeon(this.dungeonId);
    const unlocked = this.game.isDungeonUnlocked(dungeon.id);
    const panel = this.root.querySelector('.dungeon-setup');
    panel.innerHTML = `
      <h2></h2>
      <p class="hint dungeon-description"></p>
      <div class="encounter-list"></div>
      <div class="reward-line"></div>
      <h3>Gruppe (bis zu ${GROUP_SIZE} Helden)</h3>
      <div class="group-picker"></div>
      <div class="group-check"></div>
      <h3>Taktik</h3>
      <div class="button-row tactic-buttons"></div>
      <h3>Rückzug</h3>
      <div class="button-row retreat-buttons"></div>
      <p class="hint">Der Rückzug dauert ${COMBAT_RULES.retreatRounds} Runden, in denen der Gegner weiter angreift. Danach gibt es keine Beute.</p>
      <h3>Anweisungen</h3>
      <div class="orders-list"></div>
      <div class="lab-actions"><button class="big-button start-button">Losziehen!</button></div>
    `;
    panel.querySelector('h2').textContent = dungeon.name;
    panel.querySelector('.dungeon-description').textContent = dungeon.description;

    this.renderEncounters(panel.querySelector('.encounter-list'), dungeon);
    this.renderReward(panel.querySelector('.reward-line'), dungeon);
    this.renderGroupPicker(panel.querySelector('.group-picker'));
    this.renderGroupCheck(panel.querySelector('.group-check'), dungeon);
    this.fillButtonRow(panel.querySelector('.tactic-buttons'), TACTICS.map((t) => ({ label: t.name, value: t.id })),
      (value) => value === this.tacticId, (value) => { this.tacticId = value; });
    this.fillButtonRow(panel.querySelector('.retreat-buttons'), RETREAT_RULES.map((r) => ({ label: r.name, value: r.id })),
      (value) => value === this.retreatRuleId, (value) => { this.retreatRuleId = value; });

    const group = this.getSelectedHeroes();
    renderOrders(panel.querySelector('.orders-list'), group, (hero, orderId, optionId) => {
      this.game.setHeroOrder(hero.id, orderId, optionId);
    });
    if (group.length === 0) {
      panel.querySelector('.orders-list').innerHTML = '<p class="hint">Wähle zuerst Helden aus.</p>';
    }

    const startButton = panel.querySelector('.start-button');
    startButton.disabled = !unlocked || group.length === 0;
    startButton.addEventListener('click', () => this.start());
  }

  // Begegnungen mit Bildern. Boss-Mechaniken kennt man erst nach dem ersten Versuch.
  renderEncounters(container, dungeon) {
    const attempted = this.game.guild.getAttempts(dungeon.id) > 0;
    dungeon.encounters.forEach((encounter, index) => {
      const row = document.createElement('div');
      row.className = 'encounter-row';
      const icons = document.createElement('div');
      icons.className = 'encounter-icons';
      const text = document.createElement('div');
      text.className = 'encounter-text';

      if (encounter.type === 'boss') {
        const boss = getBoss(encounter.bossId);
        icons.appendChild(createSpriteCanvas(boss.sprite, 3));
        const mechanics = boss.mechanics.map((m) => attempted ? m.name + ': ' + m.hint : m.name).join(' · ');
        text.innerHTML = '<b></b><span></span>';
        text.querySelector('b').textContent = (index + 1) + '. Boss: ' + boss.name + ' – ' + boss.title;
        text.querySelector('span').textContent = attempted ? mechanics : mechanics + ' (Tipps nach dem ersten Versuch)';
      } else {
        for (const enemyId of encounter.enemies) {
          const enemy = MINIONS[enemyId];
          icons.appendChild(createSpriteCanvas(enemy.sprite, 2, enemy.colors || {}));
        }
        text.innerHTML = '<b></b><span></span>';
        text.querySelector('b').textContent = (index + 1) + '. ' + encounter.name;
        text.querySelector('span').textContent = encounter.enemies.length + ' Gegner: ' +
          [...new Set(encounter.enemies.map((id) => MINIONS[id].name))].join(', ');
      }
      row.appendChild(icons);
      row.appendChild(text);
      container.appendChild(row);
    });
  }

  renderReward(container, dungeon) {
    const chest = getLootBoxType(dungeon.rewards.chest);
    container.innerHTML = '<span>Belohnung:</span>';
    container.appendChild(createSpriteCanvas('coin', 2));
    container.insertAdjacentHTML('beforeend', '<span>' + dungeon.rewards.gold + '</span>');
    container.appendChild(createChestCanvas(chest, 2));
    const name = document.createElement('span');
    name.textContent = chest.name + ' (Items der Stufe ' + dungeon.level + ')';
    container.appendChild(name);
  }

  renderGroupPicker(container) {
    const heroes = this.game.guild.heroes;
    if (heroes.length === 0) {
      container.innerHTML = '<p class="empty">Noch keine Helden. Heuere welche in der Taverne an!</p>';
      return;
    }
    for (const hero of heroes) {
      const busy = this.game.guild.isHeroBusy(hero.id);
      const injured = hero.isInjured();
      const button = document.createElement('button');
      button.className = 'lab-hero-toggle';
      button.style.setProperty('--rarity', hero.getRarity().color);
      button.classList.toggle('selected', this.selectedHeroIds.has(hero.id));
      button.disabled = busy || injured;
      button.appendChild(createHeroCanvas(hero, 2));
      button.insertAdjacentHTML('beforeend', '<span></span>');
      button.querySelector('span').textContent = hero.name + ' (' + hero.getClass().name + ', Lv ' + hero.level + ', AW ' + hero.getGearScore() + ')' +
        (busy ? ' – unterwegs' : '') + (injured ? ' – verletzt bis ' + this.getHealTime(hero) : '');
      button.addEventListener('click', () => {
        Sound.click();
        if (this.selectedHeroIds.has(hero.id)) {
          this.selectedHeroIds.delete(hero.id);
        } else if (this.selectedHeroIds.size < GROUP_SIZE) {
          this.selectedHeroIds.add(hero.id);
        }
        this.render();
      });
      container.appendChild(button);
    }
  }

  // Uhrzeit, zu der ein verletzter Held wieder fit ist
  getHealTime(hero) {
    const clock = this.game.clock;
    return clock.getTimeTextAt(clock.totalGameSeconds + hero.injurySeconds);
  }

  getSelectedHeroes() {
    return this.game.guild.heroes.filter((hero) => this.selectedHeroIds.has(hero.id));
  }

  // Hinweise statt Siegchance: Level, Ausrüstungswert und fehlende Rollen
  renderGroupCheck(container, dungeon) {
    const group = this.getSelectedHeroes();
    if (group.length === 0) {
      container.innerHTML = '';
      return;
    }
    const averageGear = Math.round(group.reduce((sum, hero) => sum + hero.getGearScore(), 0) / group.length);
    const averageLevel = Math.round(group.reduce((sum, hero) => sum + hero.level, 0) / group.length * 10) / 10;
    const roles = group.map((hero) => hero.getClass().role);
    const warnings = [];
    if (!roles.includes('tank')) {
      warnings.push('Kein Tank in der Gruppe!');
    }
    if (!roles.includes('healer')) {
      warnings.push('Kein Heiler in der Gruppe!');
    }
    if (group.length < GROUP_SIZE) {
      warnings.push('Nur ' + group.length + ' von ' + GROUP_SIZE + ' Helden.');
    }

    const levelClass = averageLevel >= dungeon.level ? 'good' : 'bad';
    const gearClass = averageGear >= dungeon.recommendedGearScore ? 'good' : 'bad';
    container.innerHTML =
      '<div class="gear-check ' + levelClass + '">Ø Level: ' + averageLevel + ' (Stufe des Dungeons: ' + dungeon.level + ')</div>' +
      '<div class="gear-check ' + gearClass + '">Ø Ausrüstungswert: ' + averageGear +
      ' (empfohlen: ' + dungeon.recommendedGearScore + ')</div>';
    for (const warning of warnings) {
      container.insertAdjacentHTML('beforeend', '<div class="group-warning">⚠ ' + warning + '</div>');
    }
  }

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
        this.render();
      });
      container.appendChild(button);
    }
  }

  start() {
    const heroIds = [...this.selectedHeroIds];
    const result = this.game.startExpedition(this.dungeonId, heroIds, this.tacticId, this.retreatRuleId);
    if (result !== 'ok') {
      showToast('Das geht gerade nicht.', '#ff6b6b');
      return;
    }
    Sound.boxArrived();
    showToast('Die Gruppe zieht los: ' + getDungeon(this.dungeonId).name + '!', '#ffd23f');
    const newest = this.game.guild.expeditions[this.game.guild.expeditions.length - 1];
    this.selectedHeroIds.clear();
    this.render();
    this.viewer.watch(newest.id);
  }

  // ---------- Laufende Runs ----------

  describePosition(expedition) {
    const position = expedition.getPosition();
    const dungeon = getDungeon(expedition.dungeonId);
    const encounterCount = dungeon.encounters.length;
    const retreat = expedition.manualRetreat ? ' (Rückzug befohlen)' : '';
    if (position.traveling) {
      return 'Unterwegs zu Begegnung ' + (position.encounterIndex + 1) + ' von ' + encounterCount + retreat;
    }
    const encounterResult = expedition.getResult().encounters[position.encounterIndex];
    const round = Number.isFinite(position.round) ? ' – Runde ' + position.round : '';
    return 'Begegnung ' + (position.encounterIndex + 1) + '/' + encounterCount + ': ' + encounterResult.encounterName + round + retreat;
  }

  renderRuns() {
    const list = this.root.querySelector('.run-list');
    list.innerHTML = '';
    if (this.game.guild.expeditions.length === 0) {
      list.innerHTML = '<p class="empty">Gerade ist keine Gruppe unterwegs.</p>';
    }
    for (const expedition of this.game.guild.expeditions) {
      const dungeon = getDungeon(expedition.dungeonId);
      const row = document.createElement('div');
      row.className = 'run-row';
      row.dataset.id = expedition.id;
      row.classList.toggle('watched', this.viewer.isWatching(expedition.id));
      row.innerHTML = `
        <div class="run-head">
          <b class="run-name"></b>
          <span class="run-status"></span>
        </div>
        <div class="bar"><div class="bar-fill run-fill"></div></div>
        <div class="run-buttons">
          <button class="watch-button">Zuschauen</button>
          <button class="retreat-button">Rückzug!</button>
          <button class="quick-button">Sofort beenden</button>
        </div>
      `;
      row.querySelector('.run-name').textContent = dungeon.name;
      row.querySelector('.run-status').textContent = this.describePosition(expedition);

      row.querySelector('.watch-button').addEventListener('click', () => {
        Sound.click();
        this.viewer.watch(expedition.id);
        this.renderRuns();
      });

      // Rückzug: zweimal klicken
      const retreatButton = row.querySelector('.retreat-button');
      retreatButton.disabled = expedition.manualRetreat !== null;
      retreatButton.addEventListener('click', () => {
        if (!retreatButton.classList.contains('confirm')) {
          retreatButton.classList.add('confirm');
          retreatButton.textContent = 'Wirklich zurückziehen?';
          return;
        }
        if (this.game.orderRetreat(expedition.id)) {
          Sound.warning();
          showToast('Rückzug befohlen!', '#ff6b6b');
        }
      });

      const quickButton = row.querySelector('.quick-button');
      const canQuick = this.game.canQuickFinish(expedition.dungeonId);
      quickButton.disabled = !canQuick;
      quickButton.title = canQuick ? 'Kampf nicht ansehen, sofort das Ergebnis'
        : 'Erst nach ' + BALANCING.quickFinishAfterClears + ' Erfolgen in diesem Dungeon';
      quickButton.addEventListener('click', () => this.game.finishExpeditionNow(expedition.id));

      list.appendChild(row);
    }
  }

  // ---------- Berichte ----------

  renderReports() {
    const list = this.root.querySelector('.report-list');
    list.innerHTML = '';
    if (this.game.guild.reports.length === 0) {
      list.innerHTML = '<p class="empty">Noch keine Berichte.</p>';
    }
    for (const report of this.game.guild.reports) {
      const dungeon = getDungeon(report.dungeonId);
      const row = document.createElement('button');
      row.className = 'report-row outcome-' + report.outcome;
      let text = 'Tag ' + report.day + ', ' + report.time + ' – ' + dungeon.name + ': ' + outcomeText(report.outcome);
      if (report.outcome === 'success') {
        text += ' +' + report.gold + ' Gold, ' + getLootBoxType(report.chest).name;
      }
      if (report.fallenNames.length > 0) {
        text += ' · gefallen: ' + report.fallenNames.join(', ');
      }
      // Erfahrung (ältere Berichte haben noch keine)
      if (report.heroResults && report.heroResults.length > 0) {
        const xpValues = report.heroResults.map((heroResult) => heroResult.xp);
        const levelUps = report.heroResults.filter((heroResult) => heroResult.levelsGained > 0).length;
        text += ' · +' + Math.max(...xpValues) + ' EP';
        if (levelUps > 0) {
          text += ' · ' + levelUps + '× Level-Up!';
        }
      }
      row.textContent = text;
      row.addEventListener('click', () => {
        Sound.click();
        this.viewer.showReport(report);
        this.renderRuns();
      });
      list.appendChild(row);
    }
  }
}

export function outcomeText(outcome) {
  if (outcome === 'success') {
    return 'Erfolg!';
  }
  if (outcome === 'retreat') {
    return 'Rückzug';
  }
  return 'Gescheitert';
}
