// ============================================================
// DAYENDOVERLAY – der Tagesabschluss (Vollbild-Fenster nach "Tag beenden")
//
// Ablauf:
//   1. Kämpfe ansehen: Alle Runs von heute laufen nacheinander als Kampfszene ab,
//      Begegnung für Begegnung. Jede Szene lässt sich überspringen, oder gleich alles.
//      Das Ergebnis steht schon fest (es wurde beim Tagesende berechnet), die Szene zeigt es nur.
//      An Raid-Tagen läuft danach der Raid (Raid-Szene mit 4 Gruppenreihen), bis zum ersten Wipe.
//      Oben wählt man "Alle Kämpfe / Nur Bosse / Keine" (wird im Browser gemerkt).
//   2. Zusammenfassung: ganz oben die Bilanz des Tages (Gold ±, Kisten, besiegte Bosse, Level-Ups, Verletzte),
//      darunter pro Run Ergebnis, Gold, Boss-Kiste ("Jetzt öffnen"), EP und Level-Ups; beim Raid
//      die besiegten Bosse, das Gold und wo es am nächsten Raid-Tag weitergeht.
//      Erst jetzt erscheinen die Level-Up-Banner, damit sie das Ergebnis nicht vorher verraten.
// ============================================================

import { t } from '../core/Language.js';
import { createNewsLine } from './NewsLine.js';
import { getServerFirstTitle } from '../systems/RivalSystem.js';
import { showToast } from './Toast.js';
import { HERO_TASKS } from '../data/heroTasks.js';
import { describeSupplies } from './SupplyPicker.js';
import { describeMaterials } from './UpgradeControls.js';
import { createDefeatCausesView } from './DefeatCausesView.js';
import { Hero } from '../entities/Hero.js';
import { Expedition } from '../entities/Expedition.js';
import { getDungeon } from '../data/dungeons.js';
import { getRaid } from '../data/raids.js';
import { getNextEncounterIndex } from '../systems/RaidRules.js';
import { getBoss } from '../data/enemies.js';
import { getBuilding } from '../data/buildings.js';
import { getLootBoxType } from '../data/lootBoxes.js';
import { BattleScene } from './BattleScene.js';
import { createHeroCanvas, createSpriteCanvas, createChestCanvas } from './PixelArt.js';
import { outcomeText } from './DungeonScreen.js';
import { Sound } from './Sound.js';

// Welche Kämpfe als Szene laufen (die Wahl merkt sich der Browser, siehe loadSceneMode)
const SCENE_MODES = [
  { id: 'all', label: t('dayEnd.modeAll') },
  { id: 'bosses', label: t('dayEnd.modeBosses') },
  { id: 'none', label: t('dayEnd.modeNone') },
];
const SCENE_MODE_KEY = 'gildenmanager-dayend-scenes';

// Pause zwischen zwei Begegnungen ("Die Gruppe zieht weiter …"), in Sekunden
const TRAVEL_SECONDS = 1.2;
// So lange bleibt das Ergebnis eines Runs stehen, bevor es weitergeht
const RESULT_SECONDS = 1.6;

export class DayEndOverlay {
  // callbacks = { onSummaryShown(), onOpenChest(boxTypeId), onClosed() }
  constructor(game, callbacks) {
    this.game = game;
    this.callbacks = callbacks;
    this.steps = [];        // alle Begegnungen von heute in Reihenfolge: { run, encounterIndex }
    this.stepIndex = 0;
    this.scene = null;
    this.waitSeconds = 0;   // Wartezeit bis zum nächsten Schritt (zwischen den Begegnungen)
    this.phase = 'closed';  // 'closed', 'scene', 'waiting' oder 'summary'

    this.root = document.createElement('div');
    this.root.className = 'day-end-overlay';
    this.root.hidden = true;
    this.root.innerHTML = `
      <div class="day-end-header">
        <h2 class="day-end-title"></h2>
        <button class="skip-all-button">${t('dayEnd.skipAll')}</button>
      </div>
      <div class="button-row day-end-modes"></div>
      <div class="day-end-sub"></div>
      <div class="day-end-body"></div>
    `;
    document.body.appendChild(this.root);

    this.root.querySelector('.skip-all-button').addEventListener('click', () => {
      Sound.click();
      this.showSummary();
    });
    this.sceneMode = loadSceneMode();
    this.lastStart = null; // der letzte Tagesabschluss (für "Bericht von gestern")
  }

  // Knöpfe "Alle Kämpfe / Nur Bosse / Keine"
  renderModeButtons() {
    const container = this.root.querySelector('.day-end-modes');
    container.innerHTML = '';
    for (const mode of SCENE_MODES) {
      const button = document.createElement('button');
      button.className = 'filter-button';
      button.textContent = mode.label;
      button.classList.toggle('active', mode.id === this.sceneMode);
      button.addEventListener('click', () => {
        Sound.click();
        this.changeSceneMode(mode.id);
      });
      container.appendChild(button);
    }
  }

  // Neue Szenen-Wahl: gilt sofort für die restlichen Kämpfe des Abends
  changeSceneMode(modeId) {
    this.sceneMode = modeId;
    saveSceneMode(modeId);
    this.renderModeButtons();
    if (this.phase !== 'scene' && this.phase !== 'waiting') {
      return;
    }
    const remaining = this.steps.slice(this.stepIndex + 1).filter((step) => this.isStepShown(step));
    this.steps = this.steps.slice(0, this.stepIndex + 1).concat(remaining);
    if (modeId === 'none' || (this.phase === 'scene' && !this.isStepShown(this.steps[this.stepIndex]))) {
      // Die laufende Szene passt nicht mehr: gleich zum nächsten passenden Kampf (oder zur Zusammenfassung)
      this.stepIndex++;
      if (modeId === 'none') {
        this.showSummary();
      } else {
        this.playStep();
      }
    }
  }

  // Läuft dieser Kampf als Szene? (je nach Wahl: alle, nur Bosse oder keine)
  isStepShown(step) {
    if (this.sceneMode === 'none') {
      return false;
    }
    if (this.sceneMode === 'bosses') {
      return step.run.result.encounters[step.encounterIndex].encounterType === 'boss';
    }
    return true;
  }

  // "Bericht von gestern": die Zusammenfassung des letzten Abends noch einmal (ohne Szenen)
  hasLastReport() {
    return this.lastStart !== null;
  }

  showLastReport() {
    if (!this.lastStart || this.isOpen()) {
      return;
    }
    const last = this.lastStart;
    this.prepare(last.day, last.reports, last.daySummary, last.raidReport);
    this.root.hidden = false;
    document.body.classList.add('overlay-open');
    this.root.querySelector('.day-end-title').textContent = t('dayEnd.reportOf', { day: last.day });
    this.root.querySelector('.day-end-modes').innerHTML = '';
    this.phase = 'closed';
    this.isReplay = true;
    this.showSummary();
  }

  isOpen() {
    return this.phase !== 'closed';
  }

  // Startet den Tagesabschluss. day = der Tag, der gerade zu Ende ging, reports = Berichte der Runs,
  // daySummary = Ergebnisse der Aufgaben und der Sold (siehe Game.lastDaySummary),
  // raidReport = Bericht des Raids (an Raid-Tagen, siehe Game.finishRaid), sonst null
  start(day, reports, daySummary, raidReport = null) {
    this.lastStart = { day, reports, daySummary, raidReport };
    this.isReplay = false;
    this.prepare(day, reports, daySummary, raidReport);
    // Nur die gewählten Kämpfe als Szene
    this.steps = this.steps.filter((step) => this.isStepShown(step));

    this.root.hidden = false;
    document.body.classList.add('overlay-open');
    this.root.querySelector('.day-end-title').textContent = t('dayEnd.evening', { day });
    this.root.querySelector('.skip-all-button').hidden = false;
    this.renderModeButtons();
    this.stepIndex = 0;
    this.playStep();
  }

  // Runs und Schritte für einen Abend vorbereiten (für den Tagesabschluss und "Bericht von gestern")
  prepare(day, reports, daySummary, raidReport) {
    this.day = day;
    this.daySummary = daySummary;
    this.raidReport = raidReport;
    this.runs = reports.map((report) => {
      const expedition = Expedition.fromSaveData(report.expedition);
      return {
        report: report,
        result: expedition.getResult(),
        heroes: expedition.heroSnapshots.map((snapshot) => Hero.fromSaveData(snapshot)),
      };
    });
    // Der Raid läuft wie ein weiterer Run (mit den Helden der Gilde für die Bilder)
    if (raidReport) {
      this.runs.push({ isRaid: true, report: raidReport, result: raidReport.result, heroes: this.game.guild.heroes });
    }
    this.steps = [];
    for (const run of this.runs) {
      for (let i = 0; i < run.result.encounters.length; i++) {
        this.steps.push({ run: run, encounterIndex: i });
      }
    }
  }

  // Wird in jedem Bild aufgerufen (seconds = vergangene echte Zeit)
  update(seconds) {
    if (this.phase === 'scene' && this.scene) {
      this.scene.update(seconds);
    } else if (this.phase === 'waiting') {
      this.waitSeconds -= seconds;
      if (this.waitSeconds <= 0) {
        this.stepIndex++;
        this.playStep();
      }
    }
  }

  // ---------- 1. Kämpfe ansehen ----------

  playStep() {
    const step = this.steps[this.stepIndex];
    if (!step) {
      this.showSummary();
      return;
    }
    const run = step.run;
    const encounterResult = run.result.encounters[step.encounterIndex];
    const dungeonRuns = this.runs.filter((entry) => !entry.isRaid);
    let subText;
    if (run.isRaid) {
      // Raid: Begegnungen zählen ab dem Anfang des Raids (heute ging es evtl. erst beim 2. Boss los)
      const raid = getRaid(run.report.raidId);
      subText = t('dayEnd.raidEncounter', { name: raid.name, number: run.report.startIndex + step.encounterIndex + 1,
        total: raid.encounters.length, encounter: encounterResult.encounterName });
    } else {
      const dungeon = getDungeon(run.report.dungeonId);
      subText = t('dayEnd.dungeonEncounter', { name: dungeon.name, number: step.encounterIndex + 1,
        total: dungeon.encounters.length, encounter: encounterResult.encounterName });
      if (dungeonRuns.length > 1) {
        subText = t('dayEnd.groupOf', { number: dungeonRuns.indexOf(run) + 1, total: dungeonRuns.length }) + subText;
      }
    }
    this.root.querySelector('.day-end-sub').textContent = subText;

    const body = this.root.querySelector('.day-end-body');
    body.innerHTML = '<div class="scene-box"></div>';
    this.phase = 'scene';
    this.scene = new BattleScene(body.querySelector('.scene-box'), encounterResult, run.heroes,
      () => this.onSceneFinished(step), true);
  }

  // Eine Begegnung ist fertig: kurz warten, beim letzten Kampf eines Runs das Ergebnis einblenden
  onSceneFinished(step) {
    const run = step.run;
    // Letzter gezeigter Kampf dieses Runs? (bei "Nur Bosse" fehlen die Trash-Kämpfe)
    const nextStep = this.steps[this.stepIndex + 1];
    const isLastOfRun = !nextStep || nextStep.run !== run;
    const body = this.root.querySelector('.day-end-body');

    if (isLastOfRun) {
      const flash = document.createElement('div');
      flash.className = 'run-result-flash outcome-' + run.report.outcome;
      flash.textContent = run.isRaid ? raidOutcomeText(run.report) : outcomeText(run.report.outcome);
      body.appendChild(flash);
      if (run.report.outcome === 'success') {
        Sound.itemReveal(3);
      } else {
        Sound.fall();
      }
      this.waitSeconds = RESULT_SECONDS;
    } else {
      const note = document.createElement('div');
      note.className = 'day-end-travel';
      note.textContent = run.isRaid ? t('dayEnd.raidMovesOn') : t('dayEnd.groupMovesOn');
      body.appendChild(note);
      this.waitSeconds = TRAVEL_SECONDS;
    }
    this.phase = 'waiting';
  }

  // ---------- 2. Zusammenfassung ----------

  showSummary() {
    if (this.phase === 'summary') {
      return;
    }
    this.phase = 'summary';
    this.scene = null;
    this.root.querySelector('.skip-all-button').hidden = true;
    this.root.querySelector('.day-end-sub').textContent = this.isReplay ? t('dayEnd.achievedThatDay') : t('dayEnd.achievedToday');
    this.root.querySelector('.day-end-modes').innerHTML = '';

    const body = this.root.querySelector('.day-end-body');
    body.innerHTML = '<div class="day-summary"></div><div class="lab-actions"><button class="big-button next-day-button"></button></div>';
    const summary = body.querySelector('.day-summary');
    // Ganz oben: die Kernzahlen des Tages
    summary.appendChild(this.createBalanceBar());
    for (const run of this.runs) {
      summary.appendChild(run.isRaid ? this.createRaidCard(run.report) : this.createRunCard(run.report));
    }
    if (this.daySummary.finishedBuilding) {
      summary.appendChild(this.createBuildingCard(this.daySummary.finishedBuilding));
    }
    summary.appendChild(this.createHomeCard(this.daySummary));
    if (this.daySummary.news.length > 0) {
      summary.appendChild(this.createNewsCard(this.daySummary.news));
    }

    const nextButton = body.querySelector('.next-day-button');
    nextButton.textContent = this.isReplay ? t('dayEnd.close') : t('dayEnd.nextDay', { day: this.day + 1 });
    nextButton.addEventListener('click', () => {
      Sound.click();
      this.close();
    });

    // Fanfare für den besten Erfolg des Tages (Server-First am größten)
    const serverFirst = this.runs.find((run) => run.report.serverFirst);
    const best = this.runs.find((run) => run.report.firstClear) || this.runs.find((run) => run.report.outcome === 'success') ||
      this.runs.find((run) => run.isRaid && run.report.defeatedBossIds.length > 0);
    if (this.isReplay) {
      // "Bericht von gestern": keine Fanfare und keine Meldungen noch einmal
    } else if (serverFirst) {
      Sound.collectionPage();
      showToast(t('misc2.serverFirstTitle', { title: getServerFirstTitle(serverFirst.report.dungeonId) }), '#ffd23f');
    } else if (best) {
      Sound.itemReveal(best.report.firstClear ? 4 : 3);
    }
    this.callbacks.onSummaryShown();
  }

  // Bilanz des Tages: Gold ±, Kisten, besiegte Bosse, Level-Ups, Verletzte (nur was nicht 0 ist, Gold immer)
  createBalanceBar() {
    let chests = 0;
    let bosses = 0;
    let levelUps = 0;
    let injured = 0;
    for (const run of this.runs) {
      const report = run.report;
      if (run.isRaid) {
        chests += report.chests.length;
        bosses += report.defeatedBossIds.length;
      } else {
        chests += report.chest ? 1 : 0;
        bosses += run.result.encounters.filter((encounter) => encounter.encounterType === 'boss' && encounter.outcome === 'victory').length;
      }
      for (const heroResult of report.heroResults || []) {
        levelUps += heroResult.levelsGained > 0 ? 1 : 0;
        injured += heroResult.injured ? 1 : 0;
      }
    }
    for (const task of this.daySummary.tasks) {
      levelUps += task.levelsGained > 0 ? 1 : 0;
    }
    const bar = document.createElement('div');
    bar.className = 'day-balance';
    const gold = this.daySummary.goldChange || 0;
    const parts = [
      { text: t('dayEnd.gold', { sign: gold >= 0 ? '+' : '−', amount: Math.abs(gold) }), className: gold >= 0 ? 'good' : 'bad' },
      { text: t('dayEnd.chests', { count: chests }), className: chests > 0 ? 'good' : '', show: chests > 0 },
      { text: t('dayEnd.bosses', { count: bosses }), className: 'good', show: bosses > 0 },
      { text: t('dayEnd.levelUps', { count: levelUps }), className: 'good', show: levelUps > 0 },
      { text: t('dayEnd.injured', { count: injured }), className: 'bad', show: injured > 0 },
    ];
    for (const part of parts) {
      if (part.show === false) {
        continue;
      }
      const chip = document.createElement('span');
      chip.className = 'day-balance-part ' + part.className;
      chip.textContent = part.text;
      bar.appendChild(chip);
    }
    return bar;
  }

  // Karte "Neues vom Server": alle Meldungen dieses Abends (deine und die der KI-Gilden),
  // in der Reihenfolge, in der sie passiert sind (deine Runs zuerst)
  createNewsCard(newsList) {
    const card = document.createElement('div');
    card.className = 'day-run-card day-news-card';
    card.innerHTML = '<div class="day-run-head"><b class="day-run-name">' + t('dayEnd.serverNews') + '</b></div><div class="day-news-lines"></div>';
    for (const news of newsList.slice().reverse()) {
      card.querySelector('.day-news-lines').appendChild(createNewsLine(news));
    }
    return card;
  }

  // Karte "Gebäude fertig!": großes Schild mit der neuen Wirkung, dazu eine Fanfare
  createBuildingCard(finished) {
    const building = getBuilding(finished.buildingId);
    const card = document.createElement('div');
    card.className = 'day-run-card day-building-card';
    card.innerHTML = '<div class="day-run-head"><b class="day-run-name"></b><span class="day-run-outcome"></span></div>' +
      '<div class="day-building-effect"></div>';
    card.querySelector('.day-run-name').textContent = t('dayEnd.buildingDone', { name: building.name, level: finished.level });
    card.querySelector('.day-run-outcome').textContent = '⚒';
    card.querySelector('.day-building-effect').textContent = t('dayEnd.fromTomorrow', { text: building.levels[finished.level - 1].text });
    // Kurz nach der Fanfare des besten Runs, damit sich die Töne nicht überlagern
    setTimeout(() => Sound.buildingDone(), this.runs.length > 0 ? 900 : 0);
    return card;
  }

  // Karte "Daheim": was die Helden ohne Kampf erledigt haben, und der Sold
  createHomeCard(daySummary) {
    const card = document.createElement('div');
    card.className = 'day-run-card day-home-card';
    card.innerHTML = '<div class="day-run-head"><b class="day-run-name">' + t('dayEnd.home') + '</b></div><div class="day-home-lines"></div>';
    const lines = card.querySelector('.day-home-lines');
    for (const task of daySummary.tasks) {
      const text = describeTaskResult(task);
      if (text) {
        const line = document.createElement('div');
        line.className = 'day-home-line';
        line.style.setProperty('--task-color', HERO_TASKS[task.taskId].color);
        line.textContent = text;
        lines.appendChild(line);
      }
    }
    const wages = daySummary.wages;
    const wageLine = document.createElement('div');
    wageLine.className = 'day-home-line wages' + (wages.paid < wages.total ? ' unpaid' : '');
    wageLine.textContent = wages.paid < wages.total
      ? t('dayEnd.wagesUnpaid', { paid: wages.paid, total: wages.total, names: wages.unpaidNames.join(', ') })
      : t('dayEnd.wages', { total: wages.total });
    lines.appendChild(wageLine);

    // Unterhalt der Gebäude: alles oder nichts
    const upkeep = daySummary.upkeep;
    if (upkeep.total > 0) {
      const upkeepLine = document.createElement('div');
      upkeepLine.className = 'day-home-line wages' + (upkeep.paid < upkeep.total ? ' unpaid' : '');
      upkeepLine.textContent = upkeep.paid < upkeep.total
        ? t('dayEnd.upkeepUnpaid', { total: upkeep.total })
        : t('dayEnd.upkeep', { total: upkeep.total });
      lines.appendChild(upkeepLine);
    }
    return card;
  }

  // Karte für den Raid: besiegte Bosse, Gold, wo es weitergeht, Helden mit EP und Verletzungen
  createRaidCard(report) {
    const raid = getRaid(report.raidId);
    const card = document.createElement('div');
    card.className = 'day-run-card day-raid-card outcome-' + (report.defeatedBossIds.length > 0 ? 'success' : 'defeat');
    card.innerHTML = `
      <div class="day-run-head">
        <b class="day-run-name"></b>
        <span class="day-run-outcome"></span>
      </div>
      <div class="day-raid-bosses"></div>
      <div class="day-run-rewards"></div>
      <div class="day-raid-next hint"></div>
      <details class="day-raid-heroes"><summary></summary><div class="day-run-heroes"></div></details>
    `;
    card.querySelector('.day-run-name').textContent = t('misc.raidCard', { name: raid.name });
    card.querySelector('.day-run-outcome').textContent = raidOutcomeText(report);

    const bossLine = card.querySelector('.day-raid-bosses');
    for (const bossId of report.defeatedBossIds) {
      const chip = document.createElement('span');
      chip.className = 'raid-boss-chip defeated';
      chip.textContent = '✓ ' + getBoss(bossId).name;
      bossLine.appendChild(chip);
    }
    if (report.defeatedBossIds.length === 0) {
      bossLine.textContent = t('dayEnd.noBossToday');
    }
    if (report.gold > 0) {
      const goldLine = document.createElement('div');
      goldLine.className = 'day-reward';
      goldLine.appendChild(createSpriteCanvas('coin', 2));
      goldLine.insertAdjacentHTML('beforeend', '<span>' + t('dayEnd.plusGold', { gold: report.gold }) + '</span>');
      card.querySelector('.day-run-rewards').appendChild(goldLine);
    }
    // Eine Raid-Kiste pro besiegtem Boss, jede mit "Jetzt öffnen!"
    for (const chestId of report.chests) {
      card.querySelector('.day-run-rewards').appendChild(this.createChestLine(chestId));
    }
    // Wo geht es weiter? (Wochen-Sperre)
    const nextIndex = getNextEncounterIndex(raid, this.game.getDefeatedRaidBossIds(raid.id));
    const nextBoss = nextIndex === null ? null : raid.encounters.slice(nextIndex).find((encounter) => encounter.type === 'boss');
    let nextText = nextBoss
      ? t('dayEnd.raidNext', { name: getBoss(nextBoss.bossId).name })
      : t('dayEnd.raidWeekDone');
    if (report.endbossDefeated) {
      nextText = t('dayEnd.endbossDown');
    }
    // Zum ersten Mal ganz geschafft: der nächste Raid ist offen
    if (report.unlockedRaidId) {
      nextText += t('dayEnd.raidUnlocked', { name: getRaid(report.unlockedRaidId).name });
    }
    card.querySelector('.day-raid-next').textContent = nextText;

    const heroResults = report.heroResults || [];
    card.querySelector('.day-raid-heroes summary').textContent = t('dayEnd.raidHeroes', { count: heroResults.length, fallen: report.fallenNames.length });
    const heroList = card.querySelector('.day-run-heroes');
    for (const heroResult of heroResults) {
      heroList.appendChild(this.createHeroRow(heroResult));
    }
    return card;
  }

  // Karte für einen Run: Ergebnis, Belohnung, Helden
  createRunCard(report) {
    const dungeon = getDungeon(report.dungeonId);
    const card = document.createElement('div');
    card.className = 'day-run-card outcome-' + report.outcome;
    card.innerHTML = `
      <div class="day-run-head">
        <b class="day-run-name"></b>
        <span class="day-run-outcome"></span>
      </div>
      <div class="day-run-rewards"></div>
      <div class="day-run-heroes"></div>
    `;
    card.querySelector('.day-run-name').textContent = dungeon.name;
    card.querySelector('.day-run-outcome').textContent = outcomeText(report.outcome) +
      (report.serverFirst ? t('dayEnd.serverFirst') : (report.firstClear ? t('dayEnd.firstClear') : ''));

    this.renderRewards(card.querySelector('.day-run-rewards'), report);

    const heroList = card.querySelector('.day-run-heroes');
    for (const heroResult of report.heroResults || []) {
      heroList.appendChild(this.createHeroRow(heroResult));
    }
    // Bei Niederlage oder Gefallenen: "Woran es lag"
    card.appendChild(createDefeatCausesView(report.analysis));
    return card;
  }

  renderRewards(container, report) {
    const gold = report.gold + report.trashGold + report.bonusGold + report.collectionGold;
    if (gold > 0) {
      const goldLine = document.createElement('div');
      goldLine.className = 'day-reward';
      goldLine.appendChild(createSpriteCanvas('coin', 2));
      goldLine.insertAdjacentHTML('beforeend', '<span>' + t('dayEnd.plusGold', { gold }) + '</span>');
      container.appendChild(goldLine);
    }
    // Wirkung der Eigenschaften sichtbar machen
    if (report.bonusGold > 0) {
      container.appendChild(createTraitBonusLine(t('dayEnd.greedy', { name: report.bonusGoldHero, gold: report.bonusGold })));
    }
    if (report.collectionGold > 0) {
      container.appendChild(createTraitBonusLine(t('dayEnd.collectionGold', { gold: report.collectionGold })));
    }
    if (report.chestBonusItems > 0) {
      container.appendChild(createTraitBonusLine(t('dayEnd.lucky', { name: report.chestBonusHero, count: report.chestBonusItems })));
    }

    if (report.supplies && report.supplies.length > 0) {
      container.appendChild(createTraitBonusLine(t('dayEnd.suppliesUsed', { list: describeSupplies(report.supplies) })));
    }
    if (report.scouted) {
      container.appendChild(createTraitBonusLine(report.scouting === 'full' ? t('dayEnd.scoutedFull') : t('dayEnd.scoutedPartial')));
    }

    if (report.chest) {
      container.appendChild(this.createChestLine(report.chest));
    } else if (gold === 0) {
      container.innerHTML = '<span class="hint">' + t('dayEnd.noLoot') + '</span>';
    }
  }

  // Zeile mit einer Kiste und "Jetzt öffnen!" (Boss-Kiste eines Runs oder Raid-Kiste)
  createChestLine(chestId) {
    const chest = getLootBoxType(chestId);
    const chestLine = document.createElement('div');
    chestLine.className = 'day-reward day-chest';
    chestLine.style.setProperty('--rarity', chest.mainColor);
    chestLine.appendChild(createChestCanvas(chest, 3));
    chestLine.insertAdjacentHTML('beforeend', '<span></span><button class="open-chest-button"></button>');
    chestLine.querySelector('.open-chest-button').textContent = t('dayEnd.openNow');
    chestLine.querySelector('span').textContent = chest.name;
    const button = chestLine.querySelector('.open-chest-button');
    // Die Kiste könnte schon geöffnet sein (zweite Kiste derselben Art)
    button.disabled = this.game.guild.countBoxes(chestId) === 0;
    button.addEventListener('click', () => {
      this.close();
      this.callbacks.onOpenChest(chestId);
    });
    return chestLine;
  }

  // Eine Zeile pro Held: Bild, Name, EP, Level-Up, Verletzung
  createHeroRow(heroResult) {
    const row = document.createElement('div');
    row.className = 'day-hero-row';
    const hero = this.game.guild.findHero(heroResult.heroId);
    if (hero) {
      row.appendChild(createHeroCanvas(hero, 2));
    }
    const text = document.createElement('span');
    text.className = 'day-hero-text';
    text.textContent = t('dayEnd.heroXp', { name: heroResult.name, xp: heroResult.xp, catchUp: heroResult.catchUp });
    row.appendChild(text);
    if (heroResult.levelsGained > 0) {
      row.insertAdjacentHTML('beforeend', '<span class="day-level-up">' + t('dayEnd.levelReached', { level: heroResult.newLevel }) + '</span>');
    }
    if (heroResult.injured) {
      row.insertAdjacentHTML('beforeend', '<span class="day-injured">' + t('dayEnd.injuredShort') + '</span>');
    }
    return row;
  }

  close() {
    this.phase = 'closed';
    this.scene = null;
    this.root.hidden = true;
    this.root.querySelector('.day-end-body').innerHTML = '';
    document.body.classList.remove('overlay-open');
    this.callbacks.onClosed();
  }
}

// Kleine Zeile unter der Beute, z.B. "Brakka ist gierig: +12 Gold"
// Eine Zeile für das Ergebnis einer Aufgabe (null bei "Ruht sich aus")
function describeTaskResult(task) {
  if (task.taskId === 'training') {
    if (task.skipped === 'noGold') {
      return t('dayEnd.trainingSkipped', { name: task.name });
    }
    return t('dayEnd.trained', { name: task.name, xp: task.xp, level: task.levelsGained > 0 ? task.newLevel : null });
  }
  if (task.taskId === 'herbs' || task.taskId === 'gatherRaw') {
    return t('dayEnd.gathered', { name: task.name, task: HERO_TASKS[task.taskId].name, materials: describeMaterials(task.gathered) });
  }
  if (task.taskId === 'jobs') {
    return t('dayEnd.job', { name: task.name, job: task.jobText, gold: task.gold, greedy: task.greedyGold });
  }
  if (task.taskId === 'scouting' && task.scoutedDungeonId) {
    const found = task.revealedBossId ? t('dayEnd.revealed', { name: getBoss(task.revealedBossId).name }) : t('dayEnd.allKnown');
    return t('dayEnd.scouting', { name: task.name, dungeon: getDungeon(task.scoutedDungeonId).name, found });
  }
  return null;
}

function createTraitBonusLine(text) {
  const line = document.createElement('div');
  line.className = 'day-trait-bonus';
  line.textContent = text;
  return line;
}

// Ergebnis des Raids in Worten: "Raid geschafft!" oder "Wipe nach 2 Bossen"
function raidOutcomeText(report) {
  const bosses = report.defeatedBossIds.length;
  if (report.outcome === 'success') {
    return t('dayEnd.raidCleared');
  }
  if (bosses === 0) {
    return t('dayEnd.wipeNone');
  }
  return t('dayEnd.wipeAfter', { count: bosses });
}

// ---------- Gemerkte Szenen-Wahl ----------
// Liegt nur im Browser (kein Teil des Spielstands). Kann blockiert sein, daher try/catch.

function loadSceneMode() {
  try {
    const saved = localStorage.getItem(SCENE_MODE_KEY);
    if (SCENE_MODES.some((mode) => mode.id === saved)) {
      return saved;
    }
  } catch (error) {
    // nichts gemerkt
  }
  return 'all';
}

function saveSceneMode(modeId) {
  try {
    localStorage.setItem(SCENE_MODE_KEY, modeId);
  } catch (error) {
    // nicht schlimm
  }
}
