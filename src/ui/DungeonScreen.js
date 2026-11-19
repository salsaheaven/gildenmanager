// ============================================================
// DUNGEONSCREEN – Dungeons auswählen, Gruppen einplanen, Berichte ansehen
// Wenig Text, viele Symbole: Erklärungen stecken in Info-Blasen (Antippen auf dem Handy, Maus drüber am PC,
// siehe InfoTip.js). Die Symbole stehen in data/sprites.js (iconSword …), siehe UiIcons.js.
//   Dungeon-Liste: pro Dungeon Name + Symbole (Stufe, empfohlene Ausrüstung, Wissen, Sammelbuch, geschafft).
//     Gesperrte Dungeons: nur der nächste, der Rest als eine Zeile "🔒 N weitere" (aufklappbar).
//   "Ein Dungeon = eine Karte": Tippt man einen Dungeon an, klappt darunter seine Planungs-Karte auf:
//     - 5 Plätze der Gruppe (fehlende Tank/Heiler mit ihrem Symbol). Antippen öffnet die Auswahl von unten
//       mit den passenden freien Helden. "Auto" füllt die freien Plätze, "Ausrüsten" legt das Beste an.
//     - Ø Level und Ø Ausrüstung als farbige Symbole (rot = unter der Stufe bzw. Empfehlung)
//     - Rückzug (3 Knöpfe) und Vorräte, aufklappbar: Anweisungen und Dungeonführer
//     - unten eine feste Leiste: Gruppe, Einschätzung (live), Konter ✓/✗ als Symbole, "Einplanen"
//     Noch einmal antippen klappt die Karte zu.
//   Darunter (aufklappbar): die für heute geplanten Runs und die Berichte
// Ausgekämpft wird erst bei "Tag beenden".
// ============================================================

import { t } from '../core/Language.js';
import { DUNGEONS, getDungeon } from '../data/dungeons.js';
import { RETREAT_RULES } from '../data/retreatRules.js';
import { getLootBoxType } from '../data/lootBoxes.js';
import { COMBAT_RULES } from '../data/combatRules.js';
import { createHeroCanvas, createSpriteCanvas } from './PixelArt.js';
import { renderOrders } from './OrdersPanel.js';
import { RunViewer } from './RunViewer.js';
import { createCompactRiskBadge, getRiskSummary } from './RiskBadge.js';
import { renderDungeonGuide } from './DungeonGuide.js';
import { getRunTitle, createRunControls } from './StandingGroupControls.js';
import { renderRoleTiles } from './RoleOverview.js';
import { getCollectionPage, getPageItems } from '../data/collectionBook.js';
import { announceEquipBest } from './HeroDetailPanel.js';
import { GROUP_RULES, getPositionId, getPositionName } from '../data/groupRules.js';
import { createSupplyPicker, describeSupplies } from './SupplyPicker.js';
import { createIconChip, POSITION_ICONS, COUNTER_ICONS } from './UiIcons.js';
import { attachInfo, createInfoIcon } from './InfoTip.js';
import { Sound } from './Sound.js';
import { showToast } from './Toast.js';

export class DungeonScreen {
  constructor(rootElement, game) {
    this.root = rootElement;
    this.game = game;
    this.dungeonId = DUNGEONS[0].id;
    this.selectedHeroIds = new Set();
    this.guideSections = {}; // welche Bereiche des Dungeonführers aufgeklappt sind (Gegner, Beute)
    this.retreatRuleId = 'never';
    this.chosenSupplies = []; // Vorräte, die die Gruppe mitnehmen soll (siehe SupplyPicker)
    // Ist die Karte des gewählten Dungeons aufgeklappt? Nur am Anfang (noch keine Gruppe), sonst stehen oben die Gruppen
    this.expanded = game.guild.standingGroups.length === 0;
    this.showAllLocked = false; // alle gesperrten Dungeons zeigen (sonst nur den nächsten)
    // Auswahl von unten: null = zu, sonst { heroId (der ersetzt wird, oder null), positionId (nur diese Position, oder null) }
    this.picker = null;
    // Welche Abschnitte der Karte offen sind (bleibt beim Neuzeichnen erhalten)
    this.openSections = { orders: false, guide: false };
    this.openRunSections = { runs: true, reports: false };

    this.root.innerHTML = `
      <div class="dungeon-screen">
        <section class="panel dungeon-list"><h2>${t('dungeon.title')}</h2><div class="dungeon-cards"></div></section>
        <section class="panel run-panel">
          <details class="run-section" data-section="runs">
            <summary class="run-section-title"></summary>
            <div class="run-list"></div>
          </details>
          <details class="run-section" data-section="reports">
            <summary class="run-section-title"></summary>
            <div class="report-list"></div>
            <div class="run-viewer"></div>
          </details>
        </section>
      </div>
    `;
    for (const section of this.root.querySelectorAll('.run-section')) {
      section.open = this.openRunSections[section.dataset.section];
      section.addEventListener('toggle', () => {
        this.openRunSections[section.dataset.section] = section.open;
      });
    }

    this.viewer = new RunViewer(this.root.querySelector('.run-viewer'), game);

    game.on('changed', () => this.render());
    this.render();
  }

  // Karte eines Dungeons öffnen und hinscrollen (z.B. aus "Neuer Dungeon offen" im Tagesplan)
  openDungeon(dungeonId) {
    this.dungeonId = dungeonId;
    this.expanded = true;
    this.picker = null;
    this.render();
    const card = this.root.querySelector('.dungeon-card.selected');
    if (card) {
      card.scrollIntoView({ block: 'start' });
    }
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
    this.renderRuns();
    this.renderReports();
  }

  // ---------- Dungeon-Liste ----------

  renderDungeonCards() {
    const container = this.root.querySelector('.dungeon-cards');
    container.innerHTML = '';
    // An Raid-Tagen (sobald der Raid offen ist) gibt es keine Dungeons
    if (this.game.areDungeonsClosedToday()) {
      const notice = document.createElement('div');
      notice.className = 'raid-day-notice';
      notice.textContent = t('dungeon.closed');
      attachInfo(notice, t('dungeon.closedInfo'));
      container.appendChild(notice);
    }
    // Oben einmal: Wie viele vollständige Gruppen sind heute noch frei?
    if (this.game.guild.heroes.length > 0) {
      container.appendChild(this.createGroupCountLine());
    }

    const lockedDungeons = DUNGEONS.filter((dungeon) => !this.game.isDungeonUnlocked(dungeon.id));
    for (const dungeon of DUNGEONS) {
      const unlocked = this.game.isDungeonUnlocked(dungeon.id);
      if (!unlocked) {
        // Gesperrt: nur der nächste, die übrigen erst nach "N weitere" (siehe unten)
        const index = lockedDungeons.indexOf(dungeon);
        if (index > 0 && !this.showAllLocked) {
          continue;
        }
        container.appendChild(this.createLockedRow(dungeon));
        continue;
      }
      container.appendChild(this.createDungeonCard(dungeon));
      // Die Planungs-Karte steht direkt unter dem gewählten Dungeon
      if (dungeon.id === this.dungeonId && this.expanded) {
        container.appendChild(this.createPlanCard(dungeon));
      }
    }
    if (lockedDungeons.length > 1) {
      const more = document.createElement('button');
      more.className = 'locked-more-button';
      more.appendChild(createSpriteCanvas('iconLock', 2));
      more.insertAdjacentHTML('beforeend', '<span></span>');
      more.querySelector('span').textContent = this.showAllLocked
        ? t('dungeon.collapseLocked')
        : t('dungeon.moreLocked', { count: lockedDungeons.length - 1 });
      more.addEventListener('click', () => {
        Sound.click();
        this.showAllLocked = !this.showAllLocked;
        this.render();
      });
      container.appendChild(more);
    }
  }

  // Kurz: "1 Gruppe frei", Details (was für die nächste fehlt) in der Info-Blase
  createGroupCountLine() {
    const result = this.game.countPossibleGroups();
    const missingParts = [];
    for (const positionId in GROUP_RULES.required) {
      if (result.missing[positionId]) {
        missingParts.push(result.missing[positionId] + ' ' + getPositionName(positionId));
      }
    }
    if (result.missing.any) {
      missingParts.push(t('heroes.moreHeroes', { count: result.missing.any }));
    }
    const text = t('heroes.groupsFree', { count: result.groups });
    const info = t('dungeon.groupCountInfo', { number: result.groups + 1, missing: missingParts.join(', ') });
    const line = createIconChip('iconHero', text, info, result.groups > 0 ? 'ok' : 'missing');
    line.classList.add('group-count-line');
    return line;
  }

  // Ein offener Dungeon: Name, dazu Symbole mit Zahl (Erklärung per Info-Blase)
  createDungeonCard(dungeon) {
    const clears = this.game.guild.getClears(dungeon.id);
    const knowledge = this.game.getDungeonKnowledge(dungeon.id);
    const card = document.createElement('button');
    card.className = 'dungeon-card';
    card.classList.toggle('selected', dungeon.id === this.dungeonId && this.expanded);
    card.innerHTML = '<span class="dungeon-name"></span><span class="dungeon-chips"></span><span class="dungeon-today"></span>';
    card.querySelector('.dungeon-name').textContent = dungeon.name;
    // Beschreibung des Dungeons als Info-Blase statt als Text
    card.querySelector('.dungeon-name').appendChild(createInfoIcon(dungeon.description));
    const chips = card.querySelector('.dungeon-chips');
    chips.appendChild(createIconChip('iconSword', String(dungeon.level),
      t('dungeon.levelInfo', { level: dungeon.level })));
    chips.appendChild(createIconChip('iconArmor', String(dungeon.recommendedGearScore),
      t('dungeon.gearInfo', { gear: dungeon.recommendedGearScore })));
    chips.appendChild(createIconChip('iconLens', knowledge.known + '/' + knowledge.total,
      t('dungeon.knowledgeInfo', { known: knowledge.known, total: knowledge.total }) +
      (this.game.isDungeonScouted(dungeon.id) ? t('dungeon.prepared') : ''),
      this.game.isDungeonScouted(dungeon.id) ? 'ok' : ''));
    const page = getCollectionPage(dungeon.id);
    if (page) {
      const found = this.game.guild.collection.countFoundOnPage(page);
      const total = getPageItems(page).length;
      chips.appendChild(createIconChip('iconBook', found + '/' + total,
        t('dungeon.collectionInfo', { found, total }),
        found === total ? 'ok' : ''));
    }
    const clearChip = document.createElement('span');
    clearChip.className = 'icon-chip' + (clears > 0 ? ' ok' : '');
    clearChip.textContent = clears > 0 ? '✓' + clears : t('common.new');
    attachInfo(clearChip, clears > 0 ? t('dungeon.clears', { count: clears }) : t('dungeon.neverCleared'));
    chips.appendChild(clearChip);
    this.fillTodayLine(card.querySelector('.dungeon-today'), dungeon);
    card.addEventListener('click', () => {
      Sound.click();
      // Derselbe Dungeon: Karte auf- bzw. zuklappen; ein anderer: dessen Karte öffnen
      this.expanded = dungeon.id === this.dungeonId ? !this.expanded : true;
      this.dungeonId = dungeon.id;
      this.picker = null;
      this.render();
    });
    return card;
  }

  // Ein gesperrter Dungeon als kurze Zeile: "🔒 Die Frostzinne · erst Die Brutnester schaffen"
  createLockedRow(dungeon) {
    const row = document.createElement('div');
    row.className = 'dungeon-locked-row';
    row.appendChild(createSpriteCanvas('iconLock', 2));
    row.insertAdjacentHTML('beforeend', '<span class="dungeon-name"></span><span class="hint"></span>');
    row.querySelector('.dungeon-name').textContent = dungeon.name;
    row.querySelector('.hint').textContent = t('dungeon.lockedAfter', { name: getDungeon(dungeon.unlockAfter).name });
    attachInfo(row, t('dungeon.lockedInfo', { name: getDungeon(dungeon.unlockAfter).name, level: dungeon.level }));
    return row;
  }

  // Gruppen in diesem Dungeon, gut sichtbar: pro Gruppe eine Zeile mit Name, Status, kleinen Porträts und Einschätzung.
  // Stehende Gruppen erscheinen auch, wenn sie heute nicht losziehen (ausgesetzt, alle verletzt, Raid-Tag).
  fillTodayLine(line, dungeon) {
    const guild = this.game.guild;
    for (const group of guild.standingGroups.filter((entry) => entry.dungeonId === dungeon.id)) {
      const expedition = this.game.getTodaysExpedition(group.id);
      const heroIds = expedition ? expedition.getHeroIds() : group.heroIds;
      line.appendChild(this.createGroupLine(group.name, heroIds, expedition, dungeon));
    }
    // Einzelne Runs ohne stehende Gruppe (falls es sie gibt)
    for (const expedition of guild.expeditions.filter((entry) => entry.dungeonId === dungeon.id && !entry.standingGroupId)) {
      line.appendChild(this.createGroupLine(t('dungeon.group'), expedition.getHeroIds(), expedition, dungeon));
    }
  }

  // Eine Gruppen-Zeile: "Gruppe A · zieht heute los" + Porträts (verletzte blass) + Einschätzung
  createGroupLine(name, heroIds, expedition, dungeon) {
    const row = document.createElement('span');
    row.className = 'dungeon-group-line' + (expedition ? ' going' : ' waiting');
    row.innerHTML = '<span class="dungeon-group-head"><b class="dungeon-group-name"></b><span class="dungeon-group-status"></span></span><span class="dungeon-group-heroes"></span>';
    row.querySelector('.dungeon-group-name').textContent = name;
    let status = t('dungeon.goesToday');
    if (!expedition) {
      status = this.game.areDungeonsClosedToday() ? t('dungeon.raidWaits') : t('dungeon.notToday');
    }
    row.querySelector('.dungeon-group-status').textContent = ' · ' + status;
    const heroesElement = row.querySelector('.dungeon-group-heroes');
    const heroes = heroIds.map((heroId) => this.game.guild.findHero(heroId)).filter((hero) => hero);
    for (const hero of heroes) {
      const portrait = createHeroCanvas(hero, 2);
      portrait.classList.add('dungeon-group-hero');
      portrait.classList.toggle('injured', hero.isInjured());
      portrait.title = hero.name + ' · ' + hero.getClass().name + ' · ' + t('common.lv') + ' ' + hero.level + (hero.isInjured() ? t('heroes.injuredShort') : '');
      heroesElement.appendChild(portrait);
    }
    if (expedition) {
      heroesElement.appendChild(createCompactRiskBadge(this.game, heroes, dungeon.id, expedition.retreatRuleId, expedition.supplies));
    }
    return row;
  }

  // ---------- Planungs-Karte des gewählten Dungeons ----------

  createPlanCard(dungeon) {
    const unlocked = this.game.isDungeonUnlocked(dungeon.id);
    const card = document.createElement('div');
    card.className = 'dungeon-plan-card';
    card.innerHTML = `
      <div class="plan-slots"></div>
      <div class="hero-pick-sheet" hidden></div>
      <div class="plan-stats"></div>
      <div class="plan-row plan-retreat"></div>
      <div class="plan-row plan-supplies"></div>
      <details class="plan-section" data-section="orders"><summary>${t('common.orders')}</summary><div class="orders-list"></div></details>
      <details class="plan-section" data-section="guide"><summary>${t('dungeon.guide')}</summary><div class="dungeon-guide"></div></details>
      <div class="plan-sticky-bar">
        <div class="plan-live"></div>
        <button class="big-button start-button">${t('dungeon.plan')}</button>
      </div>
    `;
    for (const section of card.querySelectorAll('.plan-section')) {
      section.open = this.openSections[section.dataset.section];
      section.addEventListener('toggle', () => {
        this.openSections[section.dataset.section] = section.open;
      });
    }

    // Stehende Gruppen aus anderen Dungeons: mit einem Tipp hierher verlegen
    const moveRow = this.createMoveRow(dungeon);
    if (moveRow) {
      card.insertBefore(moveRow, card.firstChild);
    }

    const group = this.getSelectedHeroes();
    this.renderSlots(card.querySelector('.plan-slots'), card);
    this.renderStats(card.querySelector('.plan-stats'), dungeon, group);
    this.renderRetreat(card.querySelector('.plan-retreat'));

    // Vorräte: kompakt, der Hinweis "Vorratskammer leer" steckt in der Info-Blase
    this.chosenSupplies = this.keepAvailableSupplies(this.chosenSupplies);
    const supplies = card.querySelector('.plan-supplies');
    supplies.appendChild(createIconChip('iconPotion', '', t('dungeon.suppliesInfo')));
    supplies.appendChild(createSupplyPicker(this.game.guild, this.chosenSupplies, [], (next) => {
      Sound.click();
      this.chosenSupplies = next;
      this.render();
    }, true));

    renderOrders(card.querySelector('.orders-list'), group, (hero, orderId, optionId) => {
      this.game.setHeroOrder(hero.id, orderId, optionId);
    });
    if (group.length === 0) {
      card.querySelector('.orders-list').innerHTML = '<p class="hint">' + t('misc.pickHeroesFirst') + '</p>';
    }
    // Dungeonführer: Niveau, Gegner und Beute (siehe DungeonGuide.js)
    renderDungeonGuide(card.querySelector('.dungeon-guide'), this.game, dungeon, this.guideSections);

    // Auswahl von unten (offen, wenn ein Platz angetippt wurde)
    if (this.picker) {
      this.renderPicker(card.querySelector('.hero-pick-sheet'));
    }

    // Feste Leiste: alles, was man beim Zusammenstellen sehen will
    const live = card.querySelector('.plan-live');
    this.renderLiveBar(live, dungeon, group, unlocked);
    const startButton = card.querySelector('.start-button');
    startButton.disabled = !unlocked || group.length === 0;
    startButton.addEventListener('click', () => this.start());
    card.querySelector('.plan-sticky-bar').insertBefore(
      createInfoIcon(t('dungeon.planInfo')),
      startButton);
    return card;
  }

  // Zeile "Gruppe A hierher verlegen" für jede stehende Gruppe, die gerade in einen anderen Dungeon zieht (oder null)
  createMoveRow(dungeon) {
    const groups = this.game.guild.standingGroups.filter((group) => group.dungeonId !== dungeon.id);
    if (groups.length === 0 || !this.game.isDungeonUnlocked(dungeon.id)) {
      return null;
    }
    const row = document.createElement('div');
    row.className = 'plan-move-row';
    for (const group of groups) {
      const button = document.createElement('button');
      button.className = 'move-group-button';
      button.textContent = t('dungeon.moveHere', { group: group.name });
      button.title = t('dungeon.movedFrom', { name: getDungeon(group.dungeonId).name });
      button.addEventListener('click', () => {
        if (this.game.moveStandingGroup(group.id, dungeon.id) !== 'ok') {
          showToast(t('common.notPossible'), '#ff6b6b');
          return;
        }
        Sound.boxArrived();
        showToast(t('dungeon.moved', { group: group.name, name: dungeon.name }), '#ffd23f');
        this.expanded = false;
        this.render();
      });
      row.appendChild(button);
    }
    row.appendChild(createInfoIcon(t('dungeon.moveInfo')));
    return row;
  }

  // Die 5 Plätze: gewählte Helden, dann leere Plätze (fehlende Tank/Heiler mit Symbol). Daneben "Auto" und "Ausrüsten".
  renderSlots(container) {
    if (this.game.guild.heroes.length === 0) {
      container.innerHTML = '<p class="empty">' + t('heroes.noHeroes') + '</p>';
      return;
    }
    const heroes = this.getSelectedHeroes();
    const check = this.game.checkGroup([...this.selectedHeroIds]);
    // Welche Pflicht-Positionen fehlen noch? Die ersten leeren Plätze zeigen sie
    const missingPositions = [];
    for (const positionId in check.required) {
      for (let i = check.required[positionId].have; i < check.required[positionId].need; i++) {
        missingPositions.push(positionId);
      }
    }

    const row = document.createElement('div');
    row.className = 'slot-row';
    for (const hero of heroes) {
      const slot = document.createElement('button');
      slot.className = 'group-slot filled';
      slot.style.setProperty('--rarity', hero.getRarity().color);
      slot.title = hero.name + ' · ' + hero.getClass().name + ' · ' + t('common.lv') + ' ' + hero.level;
      slot.appendChild(createHeroCanvas(hero, 2));
      slot.insertAdjacentHTML('beforeend', '<span class="group-slot-name"></span>');
      slot.querySelector('.group-slot-name').textContent = hero.name.split(' ')[0];
      slot.addEventListener('click', () => this.openPicker(hero.id, null));
      row.appendChild(slot);
    }
    for (let i = heroes.length; i < GROUP_RULES.size; i++) {
      const positionId = missingPositions[i - heroes.length] || null;
      const slot = document.createElement('button');
      slot.className = 'group-slot empty' + (positionId ? ' needed' : '');
      slot.appendChild(createSpriteCanvas(positionId ? POSITION_ICONS[positionId] : 'iconHero', 2));
      slot.insertAdjacentHTML('beforeend', '<span class="group-slot-name"></span>');
      slot.querySelector('.group-slot-name').textContent = positionId ? getPositionName(positionId) : '+';
      slot.addEventListener('click', () => this.openPicker(null, positionId));
      row.appendChild(slot);
    }
    container.appendChild(row);

    const buttons = document.createElement('div');
    buttons.className = 'slot-buttons';
    buttons.appendChild(this.createAutoGroupButton());
    const equipButton = document.createElement('button');
    equipButton.className = 'equip-group-button';
    equipButton.appendChild(createSpriteCanvas('iconArmor', 2));
    equipButton.insertAdjacentHTML('beforeend', '<span>' + t('common.equip') + '</span>');
    equipButton.title = t('dungeon.equipInfo');
    equipButton.disabled = heroes.length === 0;
    equipButton.addEventListener('click', () => {
      const heroIds = [...this.selectedHeroIds];
      const snapshot = this.game.getEquipmentSnapshot(heroIds);
      const count = this.game.equipBestForGroup(heroIds);
      announceEquipBest(this.game, count, t('dungeon.group'), snapshot);
      this.game.emit('changed'); // auch ohne Tausch: die "neu"-Markierungen sind weg
    });
    buttons.appendChild(equipButton);
    container.appendChild(buttons);
  }

  // Auswahl von unten öffnen. heroId = dieser Held wird ersetzt (oder null), positionId = nur diese Position zeigen
  openPicker(heroId, positionId) {
    Sound.click();
    this.picker = { heroId: heroId, positionId: positionId };
    this.render();
  }

  // Die Auswahl: passende Helden als Kacheln nach Position, "Entfernen" beim Ersetzen, Schließen
  renderPicker(sheet) {
    sheet.hidden = false;
    const replacing = this.picker.heroId !== null ? this.game.guild.findHero(this.picker.heroId) : null;
    const title = replacing ? t('dungeon.replace', { name: replacing.name }) :
      (this.picker.positionId ? t('dungeon.pickPosition', { position: getPositionName(this.picker.positionId) }) : t('dungeon.pickHero'));
    sheet.innerHTML = '<div class="hero-pick-head"><b></b><button class="hero-pick-close">✕</button></div><div class="hero-pick-list"></div>';
    sheet.querySelector('b').textContent = title;
    sheet.querySelector('.hero-pick-close').addEventListener('click', () => {
      Sound.click();
      this.picker = null;
      this.render();
    });
    if (replacing) {
      const remove = document.createElement('button');
      remove.className = 'hero-pick-remove';
      remove.textContent = t('dungeon.removeFromGroup', { name: replacing.name.split(' ')[0] });
      remove.addEventListener('click', () => {
        Sound.click();
        this.selectedHeroIds.delete(replacing.id);
        this.picker = null;
        this.render();
      });
      sheet.querySelector('.hero-pick-head').after(remove);
    }
    // Beim Ersetzen zeigt die Liste dieselbe Position wie der bisherige Held
    const onlyPosition = this.picker.showAll ? null : (this.picker.positionId || (replacing ? getPositionId(replacing.getClass()) : null));
    renderRoleTiles(sheet.querySelector('.hero-pick-list'), this.game, {
      onlyPosition: onlyPosition,
      isSelected: (hero) => this.selectedHeroIds.has(hero.id),
      isDisabled: (hero) => this.game.guild.isHeroBusy(hero.id) || hero.isInjured() ||
        (this.selectedHeroIds.has(hero.id) && hero !== replacing),
      onSelect: (heroId) => this.pickHero(heroId),
    });
    if (onlyPosition) {
      const all = document.createElement('button');
      all.className = 'hero-pick-all';
      all.textContent = t('dungeon.allPositions');
      all.addEventListener('click', () => {
        Sound.click();
        this.picker = { heroId: this.picker.heroId, positionId: null, showAll: true };
        this.render();
      });
      if (!this.picker.showAll) {
        sheet.appendChild(all);
      }
    }
  }

  // Ein Held wurde in der Auswahl angetippt: einsetzen (bzw. den ersetzten herausnehmen)
  pickHero(heroId) {
    Sound.click();
    const replacingId = this.picker.heroId;
    if (replacingId === heroId) {
      this.picker = null;
      this.render();
      return;
    }
    // Reihenfolge erhalten: Der neue Held kommt an die Stelle des ersetzten
    const order = [...this.selectedHeroIds];
    if (replacingId !== null) {
      order[order.indexOf(replacingId)] = heroId;
    } else if (order.length < GROUP_RULES.size) {
      order.push(heroId);
    }
    this.selectedHeroIds = new Set(order);
    this.picker = null;
    this.render();
  }

  // Knopf "Auto · Machbar": füllt leere Plätze mit freien Helden (siehe systems/AutoGroup.js),
  // die Einschätzung des Vorschlags steht schon auf dem Knopf
  createAutoGroupButton() {
    const button = document.createElement('button');
    button.className = 'auto-group-button';
    button.appendChild(createSpriteCanvas('iconBolt', 2));
    const selected = [...this.selectedHeroIds];
    const proposal = this.game.suggestAutoGroup(this.dungeonId, selected);
    button.title = t('dungeon.autoInfo');
    if (proposal.length === selected.length) {
      button.insertAdjacentHTML('beforeend', '<span>' + t('dungeon.auto') + '</span>');
      button.disabled = true;
      return button;
    }
    const heroes = proposal.map((heroId) => this.game.guild.findHero(heroId));
    const summary = getRiskSummary(this.game, heroes, this.dungeonId, this.retreatRuleId, this.chosenSupplies);
    button.insertAdjacentHTML('beforeend', '<span>' + t('dungeon.auto') + '</span><span class="auto-group-risk"></span>');
    const risk = button.querySelector('.auto-group-risk');
    risk.textContent = summary.name;
    risk.style.color = summary.color;
    button.addEventListener('click', () => {
      Sound.click();
      this.selectedHeroIds = new Set(proposal);
      this.picker = null;
      this.render();
    });
    return button;
  }

  getSelectedHeroes() {
    // In der Reihenfolge der Auswahl (wichtig für "Ausrüsten": wer zuerst gewählt wurde, ist zuerst dran)
    return [...this.selectedHeroIds].map((heroId) => this.game.guild.findHero(heroId)).filter((hero) => hero);
  }

  // Ø Level und Ø Ausrüstungswert als farbige Symbole (rot = unter Stufe bzw. Empfehlung)
  renderStats(container, dungeon, group) {
    if (group.length === 0) {
      return;
    }
    const averageGear = Math.round(group.reduce((sum, hero) => sum + hero.getGearScore(), 0) / group.length);
    const averageLevel = Math.round(group.reduce((sum, hero) => sum + hero.level, 0) / group.length * 10) / 10;
    const levelOk = averageLevel >= dungeon.level;
    const gearOk = averageGear >= dungeon.recommendedGearScore;
    container.appendChild(createIconChip('iconSword', t('common.lv') + ' ' + averageLevel + '/' + dungeon.level,
      t('dungeon.avgLevel', { level: averageLevel, dungeonLevel: dungeon.level }) + (levelOk ? '' : t('dungeon.levelLow')),
      levelOk ? 'ok' : 'missing'));
    container.appendChild(createIconChip('iconArmor', t('heroes.gs') + ' ' + averageGear + '/' + dungeon.recommendedGearScore,
      t('dungeon.avgGear', { gear: averageGear, recommended: dungeon.recommendedGearScore }) + (gearOk ? '' : t('dungeon.gearLow')),
      gearOk ? 'ok' : 'warn'));
  }

  // Rückzug: drei kurze Knöpfe ("Nie", "☠1", "☠2"), die Erklärung steckt im ⓘ
  renderRetreat(container) {
    container.appendChild(createIconChip('iconSkull', '', null));
    for (const rule of RETREAT_RULES) {
      const button = document.createElement('button');
      button.className = 'filter-button retreat-button';
      button.classList.toggle('active', rule.id === this.retreatRuleId);
      button.textContent = rule.afterFallen === null ? t('dungeon.never') : String(rule.afterFallen);
      button.title = rule.name;
      button.addEventListener('click', () => {
        Sound.click();
        this.retreatRuleId = rule.id;
        this.render();
      });
      container.appendChild(button);
    }
    container.appendChild(createInfoIcon(t('dungeon.retreatInfo', { rounds: COMBAT_RULES.retreatRounds })));
  }

  // Inhalt der festen Leiste: Gruppe, Einschätzung (neu bei jeder Änderung) und Konter ✓/✗ als Symbole
  renderLiveBar(container, dungeon, group, unlocked) {
    const check = this.game.checkGroup([...this.selectedHeroIds]);
    const statusRow = document.createElement('div');
    statusRow.className = 'plan-live-row';
    statusRow.appendChild(createIconChip('iconHero', check.count + '/' + check.size,
      t('dungeon.groupCount', { count: check.count, size: check.size }), check.count === check.size ? 'ok' : 'missing'));
    for (const positionId in check.required) {
      const part = check.required[positionId];
      const ok = part.have >= part.need;
      statusRow.appendChild(createIconChip(POSITION_ICONS[positionId], ok ? '✓' : '✗',
        ok ? t('dungeon.positionOk', { position: getPositionName(positionId) }) : t('dungeon.positionMissing', { position: getPositionName(positionId), need: part.need }), ok ? 'ok' : 'missing'));
    }
    // Konter für die bekannten Mechaniken: ✓ = jemand in der Gruppe kann es, ✗ = niemand
    const counterStatus = this.game.getCounterStatus(dungeon.id, [...this.selectedHeroIds]);
    for (const counter of counterStatus.counters) {
      statusRow.appendChild(createIconChip(COUNTER_ICONS[counter.id] || 'iconStar', counter.covered ? '✓' : '✗',
        counter.covered ? t('dungeon.counterOk', { name: counter.name }) : t('dungeon.counterMissing', { name: counter.name }),
        counter.covered ? 'ok' : 'missing'));
    }
    if (counterStatus.unknownBosses > 0) {
      statusRow.appendChild(createIconChip('iconLens', counterStatus.unknownBosses + '?',
        t('dungeon.unknownBosses', { count: counterStatus.unknownBosses })));
    }
    container.appendChild(statusRow);

    if (unlocked && group.length > 0) {
      // Kurz nur das Wort ("Riskant"), die Einzelheiten stehen in der Info-Blase
      container.appendChild(createCompactRiskBadge(this.game, group, dungeon.id, this.retreatRuleId, this.chosenSupplies));
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
    // Jede Gruppe ist eine stehende Gruppe: Sie zieht ab heute jeden Tag hierher, bis man sie auflöst
    const result = this.game.createStandingGroup(this.dungeonId, heroIds, this.retreatRuleId, this.chosenSupplies);
    if (result !== 'ok') {
      showToast(t('common.notPossible'), '#ff6b6b');
      return;
    }
    Sound.boxArrived();
    const group = this.game.guild.standingGroups[this.game.guild.standingGroups.length - 1];
    // An Raid-Tagen gibt es keine Dungeons: Die Gruppe zieht erst ab dem nächsten Dungeon-Tag los
    const when = this.game.getTodaysExpedition(group.id) ? t('dungeon.fromToday') : t('dungeon.fromNextDay');
    showToast(t('dungeon.planned', { group: group.name, when, name: getDungeon(this.dungeonId).name }), '#ffd23f');
    this.selectedHeroIds.clear();
    this.chosenSupplies = [];
    this.picker = null;
    // Karte zuklappen: Die Gruppe steht jetzt in der Dungeon-Zeile (sonst sähe es nach leeren, fehlerhaften Plätzen aus)
    this.expanded = false;
    this.render();
  }

  // ---------- Geplante Runs ----------

  renderRuns() {
    const expeditions = this.game.guild.expeditions;
    this.root.querySelector('[data-section="runs"] .run-section-title').textContent = t('dungeon.plannedToday', { count: expeditions.length });
    const list = this.root.querySelector('.run-list');
    list.innerHTML = '';
    if (expeditions.length === 0) {
      list.innerHTML = '<p class="empty">' + t('dungeon.noneToday') + '</p>';
    }
    for (const expedition of expeditions) {
      const heroNames = expedition.getHeroIds()
        .map((heroId) => this.game.guild.findHero(heroId))
        .filter((hero) => hero)
        .map((hero) => hero.name.split(' ')[0]);
      const retreatRule = RETREAT_RULES.find((rule) => rule.id === expedition.retreatRuleId);

      const row = document.createElement('div');
      row.className = 'run-row';
      row.innerHTML = `
        <div class="run-head">
          <b class="run-name"></b>
          <span class="run-status"></span>
        </div>
      `;
      row.querySelector('.run-name').textContent = getRunTitle(this.game, expedition);
      row.querySelector('.run-status').textContent = heroNames.join(', ') +
        (retreatRule && retreatRule.afterFallen !== null ? t('dungeon.retreatAfter', { count: retreatRule.afterFallen }) : '') +
        (expedition.supplies.length > 0 ? ' · ' + describeSupplies(expedition.supplies) : '');
      const heroes = expedition.getHeroIds().map((heroId) => this.game.guild.findHero(heroId)).filter((hero) => hero);
      row.querySelector('.run-head').after(createCompactRiskBadge(this.game, heroes, expedition.dungeonId, expedition.retreatRuleId,
        expedition.supplies));
      row.appendChild(createRunControls(this.game, expedition));
      list.appendChild(row);
    }
  }

  // ---------- Berichte ----------

  renderReports() {
    const reports = this.game.guild.reports;
    const title = this.root.querySelector('[data-section="reports"] .run-section-title');
    title.textContent = t('dungeon.reports', { count: reports.length });
    const list = this.root.querySelector('.report-list');
    list.innerHTML = '';
    if (reports.length === 0) {
      list.innerHTML = '<p class="empty">' + t('dungeon.noReports') + '</p>';
    }
    for (const report of reports) {
      const dungeon = getDungeon(report.dungeonId);
      const row = document.createElement('button');
      row.className = 'report-row outcome-' + report.outcome;
      let text = t('dungeon.reportLine', { day: report.day, name: dungeon.name, outcome: outcomeText(report.outcome) });
      if (report.outcome === 'success') {
        text += t('dungeon.reportGold', { gold: report.gold + report.trashGold + report.bonusGold, chest: getLootBoxType(report.chest).name });
      }
      if (report.fallenNames.length > 0) {
        text += t('dungeon.reportFallen', { names: report.fallenNames.join(', ') });
      }
      // Erfahrung (ältere Berichte haben noch keine)
      if (report.heroResults && report.heroResults.length > 0) {
        const xpValues = report.heroResults.map((heroResult) => heroResult.xp);
        const levelUps = report.heroResults.filter((heroResult) => heroResult.levelsGained > 0).length;
        text += t('dungeon.reportXp', { xp: Math.max(...xpValues) });
        if (levelUps > 0) {
          text += t('dungeon.reportLevelUps', { count: levelUps });
        }
      }
      row.textContent = text;
      row.title = t('dungeon.reportInfo');
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
    return t('dungeon.success');
  }
  if (outcome === 'retreat') {
    return t('dungeon.retreat');
  }
  return t('dungeon.failed');
}

// Verletzung als kurzer Text, z.B. "verletzt (noch 1 Tag)"
export function describeInjury(hero) {
  return t('dungeon.injured', { days: hero.injuryDays });
}
