// ============================================================
// DUNGEONSCREEN – Dungeons auswählen, Gruppen für heute einplanen, Berichte ansehen
//   Links:  alle Dungeons (gesperrte grau)
//   Mitte:  der gewählte Dungeon mit Begegnungen, Gruppe, Rückzugsregel, Anweisungen
//   Rechts: die für heute geplanten Runs (absagen möglich) und die Berichte
// Ausgekämpft wird erst bei "Tag beenden" (oben in der Leiste).
// ============================================================

import { DUNGEONS, getDungeon, getDungeonDamageTypes } from '../data/dungeons.js';
import { getBoss, MINIONS } from '../data/enemies.js';
import { getDamageType } from '../data/damageTypes.js';
import { RETREAT_RULES } from '../data/retreatRules.js';
import { getLootBoxType } from '../data/lootBoxes.js';
import { COMBAT_RULES } from '../data/combatRules.js';
import { createHeroCanvas, createSpriteCanvas, createChestCanvas } from './PixelArt.js';
import { renderOrders } from './OrdersPanel.js';
import { RunViewer } from './RunViewer.js';
import { createRiskBadge } from './RiskBadge.js';
import { renderRoleTiles } from './RoleOverview.js';
import { GROUP_RULES, getPositionName } from '../data/groupRules.js';
import { createSupplyPicker, describeSupplies } from './SupplyPicker.js';
import { Sound } from './Sound.js';
import { showToast } from './Toast.js';


export class DungeonScreen {
  constructor(rootElement, game) {
    this.root = rootElement;
    this.game = game;
    this.dungeonId = DUNGEONS[0].id;
    this.selectedHeroIds = new Set();
    this.retreatRuleId = 'never';
    this.chosenSupplies = []; // Vorräte, die die Gruppe mitnehmen soll (siehe SupplyPicker)

    this.root.innerHTML = `
      <div class="dungeon-screen">
        <section class="panel dungeon-list"><h2>Dungeons</h2><div class="dungeon-cards"></div></section>
        <section class="panel dungeon-setup"></section>
        <section class="panel run-panel">
          <h2>Heute geplant</h2>
          <div class="run-list"></div>
          <h2>Berichte</h2>
          <div class="report-list"></div>
          <div class="run-viewer"></div>
        </section>
      </div>
    `;

    this.viewer = new RunViewer(this.root.querySelector('.run-viewer'), game);

    game.on('changed', () => this.render());
    this.render();
  }

  render() {
    // Gewählte Helden, die inzwischen eingeplant, verletzt oder weg sind, abwählen
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
        ? 'Stufe ' + dungeon.level + ' · Empf. AW ' + dungeon.recommendedGearScore + (clears > 0 ? ' · geschafft: ' + clears + '×' : ' · noch nie geschafft') +
          (this.game.isDungeonScouted(dungeon.id) ? ' · Erkundet ✓' : '')
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
      <div class="damage-type-line"></div>
      <div class="reward-line"></div>
      <h3 title="${GROUP_RULES.size} Helden: 1 Tank, 1 Heiler und 3 beliebige">Gruppe</h3>
      <div class="group-picker"></div>
      <div class="group-check"></div>
      <div class="risk-line"></div>
      <h3>Rückzug</h3>
      <div class="button-row retreat-buttons"></div>
      <p class="hint">Der Rückzug dauert ${COMBAT_RULES.retreatRounds} Runden, in denen der Gegner weiter angreift. Danach gibt es keine Beute.</p>
      <h3>Vorräte</h3>
      <div class="supply-line"></div>
      <h3>Anweisungen</h3>
      <div class="orders-list"></div>
      <div class="lab-actions"><button class="big-button start-button">Für heute einplanen</button></div>
      <p class="hint">Die Gruppe kämpft, wenn du oben „Tag beenden“ drückst. Bis dahin kannst du sie noch umrüsten.</p>
    `;
    panel.querySelector('h2').textContent = dungeon.name;
    if (this.game.isDungeonScouted(dungeon.id)) {
      panel.querySelector('h2').insertAdjacentHTML('beforeend',
        ' <span class="scouted-chip" title="Die nächsten Runs hier (alle Gruppen eines Tages) sind vorbereitet: Mechaniken bekannt, etwas mehr Schaden">Erkundet ✓</span>');
    }
    panel.querySelector('.dungeon-description').textContent = dungeon.description;

    this.renderEncounters(panel.querySelector('.encounter-list'), dungeon);
    // Welche Resistenzen hier helfen, z.B. "Schadensarten: Schatten"
    const damageTypes = getDungeonDamageTypes(dungeon.id);
    if (damageTypes.length > 0) {
      const line = panel.querySelector('.damage-type-line');
      line.innerHTML = '<span class="hint">Schadensarten hier (Resistenzen helfen):</span> ';
      for (const damageTypeId of damageTypes) {
        const part = document.createElement('span');
        part.className = 'resistance-chip';
        part.style.color = getDamageType(damageTypeId).color;
        part.textContent = getDamageType(damageTypeId).name;
        line.appendChild(part);
      }
    }
    this.renderReward(panel.querySelector('.reward-line'), dungeon);
    this.renderGroupPicker(panel.querySelector('.group-picker'));
    this.renderGroupCheck(panel.querySelector('.group-check'), dungeon);
    this.fillButtonRow(panel.querySelector('.retreat-buttons'), RETREAT_RULES.map((r) => ({ label: r.name, value: r.id })),
      (value) => value === this.retreatRuleId, (value) => { this.retreatRuleId = value; });

    const group = this.getSelectedHeroes();
    // Gewählte Vorräte, die nicht mehr in der Kammer liegen (z.B. von einer anderen Gruppe genommen), fallen weg
    this.chosenSupplies = this.keepAvailableSupplies(this.chosenSupplies);
    panel.querySelector('.supply-line').appendChild(createSupplyPicker(this.game.guild, this.chosenSupplies, [], (next) => {
      Sound.click();
      this.chosenSupplies = next;
      this.render();
    }));
    // Einschätzung in Worten, neu berechnet bei jeder Änderung an Gruppe, Ausrüstung, Rückzug oder Vorräten
    if (unlocked && group.length > 0) {
      panel.querySelector('.risk-line').appendChild(createRiskBadge(group, dungeon.id, this.retreatRuleId, this.chosenSupplies,
        this.game.isDungeonScouted(dungeon.id), this.game.hasDefeatForecast()));
    }
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

  // Begegnungen mit Bildern. Boss-Mechaniken kennt man erst nach dem ersten Versuch (oder nach dem Erkunden).
  renderEncounters(container, dungeon) {
    const attempted = this.game.guild.getAttempts(dungeon.id) > 0 || this.game.isDungeonScouted(dungeon.id);
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
        // Mechaniken mit Schadensart, z.B. "Säureschwall (Säure)": wogegen man sich rüsten kann
        const mechanics = boss.mechanics.map((m) => {
          const name = m.name + describeDamageType(m.damageType);
          return attempted ? name + ': ' + m.hint : name;
        }).join(' · ');
        text.innerHTML = '<b></b><span></span>';
        text.querySelector('b').textContent = (index + 1) + '. Boss: ' + boss.name + ' – ' + boss.title +
          (boss.attackDamageType ? ' · greift mit ' + getDamageType(boss.attackDamageType).name + ' an' : '');
        text.querySelector('span').textContent = attempted ? mechanics : mechanics + ' (Tipps nach dem ersten Versuch)';
      } else {
        for (const enemyId of encounter.enemies) {
          const enemy = MINIONS[enemyId];
          icons.appendChild(createSpriteCanvas(enemy.sprite, 2, enemy.colors || {}));
        }
        text.innerHTML = '<b></b><span></span>';
        text.querySelector('b').textContent = (index + 1) + '. ' + encounter.name;
        text.querySelector('span').textContent = encounter.enemies.length + ' Gegner: ' +
          [...new Set(encounter.enemies.map((id) => MINIONS[id].name + describeDamageType(MINIONS[id].attackDamageType)))].join(', ');
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

  // Gruppenwahl nach Position (wie die Heldenübersicht):
  //   - oben die Statuszeile "Tank ✓ · Heiler ✗ · 4/5 Helden" und die gewählten Helden (antippen = wieder raus)
  //   - darunter alle Helden als Kacheln pro Position; eingeplante und verletzte sind gesperrt
  renderGroupPicker(container) {
    if (this.game.guild.heroes.length === 0) {
      container.innerHTML = '<p class="empty">Noch keine Helden. Heuere welche in der Taverne an!</p>';
      return;
    }
    container.appendChild(this.createGroupStatus());

    const chosen = document.createElement('div');
    chosen.className = 'group-chosen';
    for (const hero of this.getSelectedHeroes()) {
      const chip = document.createElement('button');
      chip.className = 'group-chosen-hero';
      chip.style.setProperty('--rarity', hero.getRarity().color);
      chip.title = hero.name + ' aus der Gruppe nehmen';
      chip.appendChild(createHeroCanvas(hero, 2));
      chip.insertAdjacentHTML('beforeend', '<span>✕</span>');
      chip.addEventListener('click', () => this.toggleHero(hero.id));
      chosen.appendChild(chip);
    }
    // Leere Plätze als gestrichelte Kästchen
    for (let i = this.selectedHeroIds.size; i < GROUP_RULES.size; i++) {
      chosen.insertAdjacentHTML('beforeend', '<span class="group-empty-slot"></span>');
    }
    container.appendChild(chosen);

    renderRoleTiles(container, this.game, {
      isSelected: (hero) => this.selectedHeroIds.has(hero.id),
      isDisabled: (hero) => this.game.guild.isHeroBusy(hero.id) || hero.isInjured(),
      onSelect: (heroId) => this.toggleHero(heroId),
    });
  }

  // Held in die Gruppe nehmen oder wieder heraus (höchstens GROUP_RULES.size Helden)
  toggleHero(heroId) {
    Sound.click();
    if (this.selectedHeroIds.has(heroId)) {
      this.selectedHeroIds.delete(heroId);
    } else if (this.selectedHeroIds.size < GROUP_RULES.size) {
      this.selectedHeroIds.add(heroId);
    }
    this.render();
  }

  // "Tank ✓ · Heiler ✗ · 4/5 Helden": grün = erfüllt, rot = fehlt
  createGroupStatus() {
    const check = this.game.checkGroup([...this.selectedHeroIds]);
    const status = document.createElement('div');
    status.className = 'group-status' + (check.complete ? ' complete' : '');
    for (const positionId in check.required) {
      const part = check.required[positionId];
      const ok = part.have >= part.need;
      status.insertAdjacentHTML('beforeend', '<span class="group-status-part ' + (ok ? 'ok' : 'missing') + '">' +
        getPositionName(positionId) + ' ' + (ok ? '✓' : '✗') + '</span>');
    }
    const full = check.count === check.size;
    status.insertAdjacentHTML('beforeend', '<span class="group-status-part ' + (full ? 'ok' : 'missing') + '">' +
      check.count + '/' + check.size + ' Helden</span>');
    if (check.complete) {
      status.insertAdjacentHTML('beforeend', '<span class="group-status-done">Gruppe komplett!</span>');
    }
    return status;
  }

  getSelectedHeroes() {
    return this.game.guild.heroes.filter((hero) => this.selectedHeroIds.has(hero.id));
  }

  // Hinweise zur Stärke: Ø Level und Ø Ausrüstungswert (fehlende Rollen zeigt die Statuszeile der Gruppenwahl)
  renderGroupCheck(container, dungeon) {
    const group = this.getSelectedHeroes();
    if (group.length === 0) {
      container.innerHTML = '';
      return;
    }
    const averageGear = Math.round(group.reduce((sum, hero) => sum + hero.getGearScore(), 0) / group.length);
    const averageLevel = Math.round(group.reduce((sum, hero) => sum + hero.level, 0) / group.length * 10) / 10;

    const levelClass = averageLevel >= dungeon.level ? 'good' : 'bad';
    const gearClass = averageGear >= dungeon.recommendedGearScore ? 'good' : 'bad';
    container.innerHTML =
      '<div class="gear-check ' + levelClass + '">Ø Level: ' + averageLevel + ' (Stufe des Dungeons: ' + dungeon.level + ')</div>' +
      '<div class="gear-check ' + gearClass + '">Ø Ausrüstungswert: ' + averageGear +
      ' (empfohlen: ' + dungeon.recommendedGearScore + ')</div>';
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

  // Nur die Vorräte behalten, die noch in der Vorratskammer liegen
  keepAvailableSupplies(supplyIds) {
    const counts = {};
    const kept = [];
    for (const supplyId of supplyIds) {
      counts[supplyId] = (counts[supplyId] || 0) + 1;
      if (counts[supplyId] <= this.game.guild.countSupply(supplyId)) {
        kept.push(supplyId);
      }
    }
    return kept;
  }

  start() {
    const heroIds = [...this.selectedHeroIds];
    const result = this.game.startExpedition(this.dungeonId, heroIds, this.retreatRuleId, this.chosenSupplies);
    if (result !== 'ok') {
      showToast('Das geht gerade nicht.', '#ff6b6b');
      return;
    }
    Sound.boxArrived();
    showToast('Eingeplant: ' + getDungeon(this.dungeonId).name + '. Die Gruppe kämpft am Ende des Tages.', '#ffd23f');
    this.selectedHeroIds.clear();
    this.chosenSupplies = [];
    this.render();
  }

  // ---------- Geplante Runs ----------

  renderRuns() {
    const list = this.root.querySelector('.run-list');
    list.innerHTML = '';
    if (this.game.guild.expeditions.length === 0) {
      list.innerHTML = '<p class="empty">Heute ist noch keine Gruppe eingeplant. Wer nichts zu tun hat, ruht sich aus.</p>';
    }
    for (const expedition of this.game.guild.expeditions) {
      const dungeon = getDungeon(expedition.dungeonId);
      const heroNames = expedition.getHeroIds()
        .map((heroId) => this.game.guild.findHero(heroId))
        .filter((hero) => hero)
        .map((hero) => hero.name);
      const retreatRule = RETREAT_RULES.find((rule) => rule.id === expedition.retreatRuleId);

      const row = document.createElement('div');
      row.className = 'run-row';
      row.innerHTML = `
        <div class="run-head">
          <b class="run-name"></b>
          <span class="run-status"></span>
        </div>
        <div class="run-buttons">
          <button class="cancel-button">Absagen</button>
        </div>
      `;
      row.querySelector('.run-name').textContent = dungeon.name;
      row.querySelector('.run-status').textContent = heroNames.join(', ') +
        (retreatRule ? ' · Rückzug: ' + retreatRule.name : '') +
        (expedition.supplies.length > 0 ? ' · Vorräte: ' + describeSupplies(expedition.supplies) : '');
      const heroes = expedition.getHeroIds().map((heroId) => this.game.guild.findHero(heroId)).filter((hero) => hero);
      row.querySelector('.run-head').after(createRiskBadge(heroes, expedition.dungeonId, expedition.retreatRuleId,
        expedition.supplies, this.game.isDungeonScouted(expedition.dungeonId), this.game.hasDefeatForecast()));
      row.querySelector('.cancel-button').addEventListener('click', () => {
        Sound.click();
        this.game.cancelExpedition(expedition.id);
      });
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
      let text = 'Tag ' + report.day + ' – ' + dungeon.name + ': ' + outcomeText(report.outcome);
      if (report.outcome === 'success') {
        text += ' +' + (report.gold + report.trashGold + report.bonusGold) + ' Gold, ' + getLootBoxType(report.chest).name;
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

// "verletzt (noch 1 Tag)" bzw. "verletzt (noch 3 Tage)"
// " (Säure)" für nicht-körperlichen Schaden, sonst nichts
function describeDamageType(damageTypeId) {
  if (!damageTypeId || damageTypeId === 'physical') {
    return '';
  }
  return ' (' + getDamageType(damageTypeId).name + ')';
}

export function describeInjury(hero) {
  return 'verletzt (noch ' + hero.injuryDays + (hero.injuryDays === 1 ? ' Tag)' : ' Tage)');
}
