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

import { DUNGEONS, getDungeon } from '../data/dungeons.js';
import { RETREAT_RULES } from '../data/retreatRules.js';
import { getLootBoxType } from '../data/lootBoxes.js';
import { COMBAT_RULES } from '../data/combatRules.js';
import { createHeroCanvas, createSpriteCanvas } from './PixelArt.js';
import { renderOrders } from './OrdersPanel.js';
import { RunViewer } from './RunViewer.js';
import { createRiskBadge, createRiskBadgeFromSummary, getRiskSummary } from './RiskBadge.js';
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
    this.expanded = true;     // ist die Karte des gewählten Dungeons aufgeklappt?
    this.showAllLocked = false; // alle gesperrten Dungeons zeigen (sonst nur den nächsten)
    // Auswahl von unten: null = zu, sonst { heroId (der ersetzt wird, oder null), positionId (nur diese Position, oder null) }
    this.picker = null;
    // Welche Abschnitte der Karte offen sind (bleibt beim Neuzeichnen erhalten)
    this.openSections = { orders: false, guide: false };
    this.openRunSections = { runs: true, reports: false };

    this.root.innerHTML = `
      <div class="dungeon-screen">
        <section class="panel dungeon-list"><h2>Dungeons</h2><div class="dungeon-cards"></div></section>
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
      notice.textContent = 'Raid-Tag: Dungeons geschlossen';
      attachInfo(notice, 'An Raid-Tagen gibt es keine Dungeon-Runs. Neue Gruppen ziehen ab dem nächsten Dungeon-Tag los.');
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
        ? 'Gesperrte zuklappen'
        : (lockedDungeons.length - 1) + ' weitere Dungeons';
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
      missingParts.push(result.missing.any + (result.missing.any === 1 ? ' weiterer Held' : ' weitere Helden'));
    }
    const text = result.groups === 1 ? '1 Gruppe frei' : result.groups + ' Gruppen frei';
    const info = 'Gezählt werden freie Helden (nicht verletzt, heute nicht eingeplant). Eine Gruppe braucht 1 Tank, 1 Heiler und 3 beliebige Helden. ' +
      'Für Gruppe ' + (result.groups + 1) + ' fehlen: ' + missingParts.join(', ') + '.';
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
      'Stufe ' + dungeon.level + ': So stark sind die Gegner. Helden auf diesem Level passen zum Dungeon, Items aus der Boss-Kiste haben diese Stufe.'));
    chips.appendChild(createIconChip('iconArmor', String(dungeon.recommendedGearScore),
      'Empfohlener Ausrüstungswert (AW) der Gruppe: ' + dungeon.recommendedGearScore + '.'));
    chips.appendChild(createIconChip('iconLens', knowledge.known + '/' + knowledge.total,
      'Wissen: ' + knowledge.known + ' von ' + knowledge.total + ' Bossen erkundet. Erkunden (Tagesplan) deckt Mechaniken auf und macht die Einschätzung genauer.' +
      (this.game.isDungeonScouted(dungeon.id) ? ' Vorbereitet: Der nächste Kampftag hier bekommt einen Vorteil.' : ''),
      this.game.isDungeonScouted(dungeon.id) ? 'ok' : ''));
    const page = getCollectionPage(dungeon.id);
    if (page) {
      const found = this.game.guild.collection.countFoundOnPage(page);
      const total = getPageItems(page).length;
      chips.appendChild(createIconChip('iconBook', found + '/' + total,
        'Sammelbuch: ' + found + ' von ' + total + ' Boss-Items dieses Dungeons gefunden. Eine volle Seite bringt einen Titel und mehr Gold.',
        found === total ? 'ok' : ''));
    }
    const clearChip = document.createElement('span');
    clearChip.className = 'icon-chip' + (clears > 0 ? ' ok' : '');
    clearChip.textContent = clears > 0 ? '✓' + clears : 'neu';
    attachInfo(clearChip, clears > 0 ? clears + '× geschafft.' : 'Noch nie geschafft.');
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
    row.querySelector('.hint').textContent = 'erst ' + getDungeon(dungeon.unlockAfter).name;
    attachInfo(row, 'Gesperrt: Schaffe zuerst ' + getDungeon(dungeon.unlockAfter).name + '. Stufe ' + dungeon.level + '.');
    return row;
  }

  // Heute eingeplante Gruppen in diesem Dungeon (mit Einschätzung der ersten)
  fillTodayLine(line, dungeon) {
    const expeditions = this.game.guild.expeditions.filter((expedition) => expedition.dungeonId === dungeon.id);
    for (const expedition of expeditions) {
      const group = this.game.findStandingGroup(expedition.standingGroupId);
      line.appendChild(createIconChip('iconHero', group ? group.name : 'Gruppe', 'Diese Gruppe zieht heute hierher.'));
    }
    if (expeditions.length > 0) {
      const expedition = expeditions[0];
      const heroes = expedition.getHeroIds().map((heroId) => this.game.guild.findHero(heroId)).filter((hero) => hero);
      line.appendChild(createRiskBadge(this.game, heroes, expedition.dungeonId, expedition.retreatRuleId, expedition.supplies));
    }
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
      <details class="plan-section" data-section="orders"><summary>Anweisungen</summary><div class="orders-list"></div></details>
      <details class="plan-section" data-section="guide"><summary>Dungeonführer</summary><div class="dungeon-guide"></div></details>
      <div class="plan-sticky-bar">
        <div class="plan-live"></div>
        <button class="big-button start-button">Einplanen</button>
      </div>
    `;
    for (const section of card.querySelectorAll('.plan-section')) {
      section.open = this.openSections[section.dataset.section];
      section.addEventListener('toggle', () => {
        this.openSections[section.dataset.section] = section.open;
      });
    }

    const group = this.getSelectedHeroes();
    this.renderSlots(card.querySelector('.plan-slots'), card);
    this.renderStats(card.querySelector('.plan-stats'), dungeon, group);
    this.renderRetreat(card.querySelector('.plan-retreat'));

    // Vorräte: kompakt, der Hinweis "Vorratskammer leer" steckt in der Info-Blase
    this.chosenSupplies = this.keepAvailableSupplies(this.chosenSupplies);
    const supplies = card.querySelector('.plan-supplies');
    supplies.appendChild(createIconChip('iconPotion', '', 'Vorräte: Tränke aus der Vorratskammer, die die Gruppe mitnimmt (kaufen beim Händler).'));
    supplies.appendChild(createSupplyPicker(this.game.guild, this.chosenSupplies, [], (next) => {
      Sound.click();
      this.chosenSupplies = next;
      this.render();
    }, true));

    renderOrders(card.querySelector('.orders-list'), group, (hero, orderId, optionId) => {
      this.game.setHeroOrder(hero.id, orderId, optionId);
    });
    if (group.length === 0) {
      card.querySelector('.orders-list').innerHTML = '<p class="hint">Wähle zuerst Helden aus.</p>';
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
      createInfoIcon('Einplanen macht die Gruppe zu einer festen Gruppe: Sie kämpft am Ende jedes Tages hier, bis du sie im Tagesplan auflöst. Verletzte fehlen, bis sie wieder fit sind.'),
      startButton);
    return card;
  }

  // Die 5 Plätze: gewählte Helden, dann leere Plätze (fehlende Tank/Heiler mit Symbol). Daneben "Auto" und "Ausrüsten".
  renderSlots(container) {
    if (this.game.guild.heroes.length === 0) {
      container.innerHTML = '<p class="empty">Noch keine Helden. Heuere welche in der Taverne an!</p>';
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
      slot.title = hero.name + ' · ' + hero.getClass().name + ' · Lv ' + hero.level;
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
    equipButton.insertAdjacentHTML('beforeend', '<span>Ausrüsten</span>');
    equipButton.title = 'Rüstet die Gruppe mit dem Besten aus dem Inventar aus. Wer zuerst gewählt wurde, ist zuerst dran.';
    equipButton.disabled = heroes.length === 0;
    equipButton.addEventListener('click', () => {
      const heroIds = [...this.selectedHeroIds];
      const snapshot = this.game.getEquipmentSnapshot(heroIds);
      const count = this.game.equipBestForGroup(heroIds);
      announceEquipBest(this.game, count, 'Gruppe', snapshot);
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
    const title = replacing ? replacing.name + ' ersetzen' :
      (this.picker.positionId ? getPositionName(this.picker.positionId) + ' wählen' : 'Held wählen');
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
      remove.textContent = '✕ ' + replacing.name.split(' ')[0] + ' aus der Gruppe nehmen';
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
      all.textContent = 'Alle Positionen zeigen';
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
    button.title = 'Füllt die leeren Plätze mit freien Helden: zuerst Tank und Heiler, dann wer bekannte Mechaniken kontert, dann die Stärksten. Gewählte Helden bleiben drin.';
    if (proposal.length === selected.length) {
      button.insertAdjacentHTML('beforeend', '<span>Auto</span>');
      button.disabled = true;
      return button;
    }
    const heroes = proposal.map((heroId) => this.game.guild.findHero(heroId));
    const summary = getRiskSummary(this.game, heroes, this.dungeonId, this.retreatRuleId, this.chosenSupplies);
    button.insertAdjacentHTML('beforeend', '<span>Auto</span><span class="auto-group-risk"></span>');
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
    container.appendChild(createIconChip('iconSword', 'Lv ' + averageLevel + '/' + dungeon.level,
      'Ø Level der Gruppe: ' + averageLevel + ', Stufe des Dungeons: ' + dungeon.level + '.' +
      (levelOk ? '' : ' Zu niedrig: Darunter sinkt die Siegchance stark. Erst leveln (Training, leichtere Dungeons).'),
      levelOk ? 'ok' : 'missing'));
    container.appendChild(createIconChip('iconArmor', 'AW ' + averageGear + '/' + dungeon.recommendedGearScore,
      'Ø Ausrüstungswert der Gruppe: ' + averageGear + ', empfohlen: ' + dungeon.recommendedGearScore + '.' +
      (gearOk ? '' : ' Bessere Ausrüstung anlegen („Ausrüsten“) oder Items verbessern.'),
      gearOk ? 'ok' : 'warn'));
  }

  // Rückzug: drei kurze Knöpfe ("Nie", "☠1", "☠2"), die Erklärung steckt im ⓘ
  renderRetreat(container) {
    container.appendChild(createIconChip('iconSkull', '', null));
    for (const rule of RETREAT_RULES) {
      const button = document.createElement('button');
      button.className = 'filter-button retreat-button';
      button.classList.toggle('active', rule.id === this.retreatRuleId);
      button.textContent = rule.afterFallen === null ? 'Nie' : String(rule.afterFallen);
      button.title = rule.name;
      button.addEventListener('click', () => {
        Sound.click();
        this.retreatRuleId = rule.id;
        this.render();
      });
      container.appendChild(button);
    }
    container.appendChild(createInfoIcon('Rückzug: Die Gruppe zieht sich zurück, sobald so viele Helden gefallen sind (Nie, nach 1 oder nach 2 Gefallenen). ' +
      'Der Rückzug dauert ' + COMBAT_RULES.retreatRounds + ' Runden, in denen der Gegner weiter angreift. Danach gibt es keine Beute.'));
  }

  // Inhalt der festen Leiste: Gruppe, Einschätzung (neu bei jeder Änderung) und Konter ✓/✗ als Symbole
  renderLiveBar(container, dungeon, group, unlocked) {
    const check = this.game.checkGroup([...this.selectedHeroIds]);
    const statusRow = document.createElement('div');
    statusRow.className = 'plan-live-row';
    statusRow.appendChild(createIconChip('iconHero', check.count + '/' + check.size,
      'Gruppe: ' + check.count + ' von ' + check.size + ' Helden.', check.count === check.size ? 'ok' : 'missing'));
    for (const positionId in check.required) {
      const part = check.required[positionId];
      const ok = part.have >= part.need;
      statusRow.appendChild(createIconChip(POSITION_ICONS[positionId], ok ? '✓' : '✗',
        getPositionName(positionId) + (ok ? ' ist dabei.' : ' fehlt: Jede Gruppe braucht mindestens ' + part.need + '.'), ok ? 'ok' : 'missing'));
    }
    // Konter für die bekannten Mechaniken: ✓ = jemand in der Gruppe kann es, ✗ = niemand
    const counterStatus = this.game.getCounterStatus(dungeon.id, [...this.selectedHeroIds]);
    for (const counter of counterStatus.counters) {
      statusRow.appendChild(createIconChip(COUNTER_ICONS[counter.id] || 'iconStar', counter.covered ? '✓' : '✗',
        counter.name + (counter.covered ? ': Jemand in der Gruppe kann das.' : ': Niemand in der Gruppe kann das. Der Dungeonführer zeigt, wer es kann.'),
        counter.covered ? 'ok' : 'missing'));
    }
    if (counterStatus.unknownBosses > 0) {
      statusRow.appendChild(createIconChip('iconLens', counterStatus.unknownBosses + '?',
        counterStatus.unknownBosses + (counterStatus.unknownBosses === 1 ? ' Boss ist' : ' Bosse sind') +
        ' noch nicht erkundet: Seine Mechaniken sind unbekannt. Erkunden (Tagesplan) deckt sie auf.'));
    }
    container.appendChild(statusRow);

    if (unlocked && group.length > 0) {
      // Kurz nur das Wort ("Riskant"), die Einzelheiten stehen in der Info-Blase
      const summary = getRiskSummary(this.game, group, dungeon.id, this.retreatRuleId, this.chosenSupplies);
      const badge = createRiskBadgeFromSummary(this.game, summary);
      const forecast = this.game.hasDefeatForecast() && summary.likelyCause ? ' Größte Gefahr: ' + summary.likelyCause.name + '.' : '';
      attachInfo(badge, 'Einschätzung: ' + summary.name + ' ' + summary.detail + '. ' + summary.title + forecast);
      container.appendChild(badge);
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
      showToast('Das geht gerade nicht.', '#ff6b6b');
      return;
    }
    Sound.boxArrived();
    const group = this.game.guild.standingGroups[this.game.guild.standingGroups.length - 1];
    // An Raid-Tagen gibt es keine Dungeons: Die Gruppe zieht erst ab dem nächsten Dungeon-Tag los
    const when = this.game.getTodaysExpedition(group.id) ? 'ab heute' : 'ab dem nächsten Dungeon-Tag';
    showToast(group.name + ' zieht ' + when + ' jeden Tag in ' + getDungeon(this.dungeonId).name + '.', '#ffd23f');
    this.selectedHeroIds.clear();
    this.chosenSupplies = [];
    this.picker = null;
    this.render();
  }

  // ---------- Geplante Runs ----------

  renderRuns() {
    const expeditions = this.game.guild.expeditions;
    this.root.querySelector('[data-section="runs"] .run-section-title').textContent = 'Heute geplant (' + expeditions.length + ')';
    const list = this.root.querySelector('.run-list');
    list.innerHTML = '';
    if (expeditions.length === 0) {
      list.innerHTML = '<p class="empty">Noch keine Gruppe eingeplant.</p>';
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
        (retreatRule && retreatRule.afterFallen !== null ? ' · Rückzug nach ' + retreatRule.afterFallen : '') +
        (expedition.supplies.length > 0 ? ' · ' + describeSupplies(expedition.supplies) : '');
      const heroes = expedition.getHeroIds().map((heroId) => this.game.guild.findHero(heroId)).filter((hero) => hero);
      row.querySelector('.run-head').after(createRiskBadge(this.game, heroes, expedition.dungeonId, expedition.retreatRuleId,
        expedition.supplies));
      row.appendChild(createRunControls(this.game, expedition));
      list.appendChild(row);
    }
  }

  // ---------- Berichte ----------

  renderReports() {
    const reports = this.game.guild.reports;
    const title = this.root.querySelector('[data-section="reports"] .run-section-title');
    title.textContent = 'Berichte (' + reports.length + ')';
    const list = this.root.querySelector('.report-list');
    list.innerHTML = '';
    if (reports.length === 0) {
      list.innerHTML = '<p class="empty">Noch keine Berichte.</p>';
    }
    for (const report of reports) {
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
      row.title = 'Antippen zeigt den Kampfverlauf';
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

// Verletzung als kurzer Text, z.B. "verletzt (noch 1 Tag)"
export function describeInjury(hero) {
  return 'verletzt (noch ' + hero.injuryDays + (hero.injuryDays === 1 ? ' Tag)' : ' Tage)');
}
