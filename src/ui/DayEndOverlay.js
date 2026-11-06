// ============================================================
// DAYENDOVERLAY – der Tagesabschluss (Vollbild-Fenster nach "Tag beenden")
//
// Ablauf:
//   1. Kämpfe ansehen: Alle Runs von heute laufen nacheinander als Kampfszene ab,
//      Begegnung für Begegnung. Jede Szene lässt sich überspringen, oder gleich alles.
//      Das Ergebnis steht schon fest (es wurde beim Tagesende berechnet), die Szene zeigt es nur.
//      An Raid-Tagen läuft danach der Raid (Raid-Szene mit 4 Gruppenreihen), bis zum ersten Wipe.
//   2. Zusammenfassung: pro Run Ergebnis, Gold, Boss-Kiste ("Jetzt öffnen"), EP und Level-Ups; beim Raid
//      die besiegten Bosse, das Gold und wo es am nächsten Raid-Tag weitergeht.
//      Erst jetzt erscheinen die Level-Up-Banner, damit sie das Ergebnis nicht vorher verraten.
// ============================================================

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
        <button class="skip-all-button">Alles überspringen</button>
      </div>
      <div class="day-end-sub"></div>
      <div class="day-end-body"></div>
    `;
    document.body.appendChild(this.root);

    this.root.querySelector('.skip-all-button').addEventListener('click', () => {
      Sound.click();
      this.showSummary();
    });
  }

  isOpen() {
    return this.phase !== 'closed';
  }

  // Startet den Tagesabschluss. day = der Tag, der gerade zu Ende ging, reports = Berichte der Runs,
  // daySummary = Ergebnisse der Aufgaben und der Sold (siehe Game.lastDaySummary),
  // raidReport = Bericht des Raids (an Raid-Tagen, siehe Game.finishRaid), sonst null
  start(day, reports, daySummary, raidReport = null) {
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

    this.root.hidden = false;
    document.body.classList.add('overlay-open');
    this.root.querySelector('.day-end-title').textContent = 'Tag ' + day + ' – Abend';
    this.root.querySelector('.skip-all-button').hidden = false;
    this.stepIndex = 0;
    this.playStep();
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
      subText = 'Raid · ' + raid.name + ' · Begegnung ' + (run.report.startIndex + step.encounterIndex + 1) + '/' +
        raid.encounters.length + ': ' + encounterResult.encounterName;
    } else {
      const dungeon = getDungeon(run.report.dungeonId);
      subText = dungeon.name + ' · Begegnung ' + (step.encounterIndex + 1) + '/' + dungeon.encounters.length +
        ': ' + encounterResult.encounterName;
      if (dungeonRuns.length > 1) {
        subText = 'Gruppe ' + (dungeonRuns.indexOf(run) + 1) + ' von ' + dungeonRuns.length + ' · ' + subText;
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
    const isLastOfRun = step.encounterIndex === run.result.encounters.length - 1;
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
      note.textContent = run.isRaid ? 'Der Raid zieht weiter …' : 'Die Gruppe zieht weiter …';
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
    this.root.querySelector('.day-end-sub').textContent = 'Das hat deine Gilde heute erreicht:';

    const body = this.root.querySelector('.day-end-body');
    body.innerHTML = '<div class="day-summary"></div><div class="lab-actions"><button class="big-button next-day-button"></button></div>';
    const summary = body.querySelector('.day-summary');
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
    nextButton.textContent = 'Weiter zu Tag ' + (this.day + 1);
    nextButton.addEventListener('click', () => {
      Sound.click();
      this.close();
    });

    // Fanfare für den besten Erfolg des Tages (Server-First am größten)
    const serverFirst = this.runs.find((run) => run.report.serverFirst);
    const best = this.runs.find((run) => run.report.firstClear) || this.runs.find((run) => run.report.outcome === 'success') ||
      this.runs.find((run) => run.isRaid && run.report.defeatedBossIds.length > 0);
    if (serverFirst) {
      Sound.collectionPage();
      showToast('Server-First! Neuer Titel: „' + getServerFirstTitle(serverFirst.report.dungeonId) + '“', '#ffd23f');
    } else if (best) {
      Sound.itemReveal(best.report.firstClear ? 4 : 3);
    }
    this.callbacks.onSummaryShown();
  }

  // Karte "Neues vom Server": alle Meldungen dieses Abends (deine und die der KI-Gilden),
  // in der Reihenfolge, in der sie passiert sind (deine Runs zuerst)
  createNewsCard(newsList) {
    const card = document.createElement('div');
    card.className = 'day-run-card day-news-card';
    card.innerHTML = '<div class="day-run-head"><b class="day-run-name">Neues vom Server</b></div><div class="day-news-lines"></div>';
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
    card.querySelector('.day-run-name').textContent = 'Gebäude fertig: ' + building.name + ' Stufe ' + finished.level;
    card.querySelector('.day-run-outcome').textContent = '⚒';
    card.querySelector('.day-building-effect').textContent = 'Ab morgen: ' + building.levels[finished.level - 1].text;
    // Kurz nach der Fanfare des besten Runs, damit sich die Töne nicht überlagern
    setTimeout(() => Sound.buildingDone(), this.runs.length > 0 ? 900 : 0);
    return card;
  }

  // Karte "Daheim": was die Helden ohne Kampf erledigt haben, und der Sold
  createHomeCard(daySummary) {
    const card = document.createElement('div');
    card.className = 'day-run-card day-home-card';
    card.innerHTML = '<div class="day-run-head"><b class="day-run-name">Daheim in der Gilde</b></div><div class="day-home-lines"></div>';
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
      ? 'Sold nicht voll bezahlt: ' + wages.paid + ' von ' + wages.total + ' Gold. Unzufrieden (weniger Schaden): ' +
        wages.unpaidNames.join(', ')
      : 'Sold: −' + wages.total + ' Gold';
    lines.appendChild(wageLine);

    // Unterhalt der Gebäude: alles oder nichts
    const upkeep = daySummary.upkeep;
    if (upkeep.total > 0) {
      const upkeepLine = document.createElement('div');
      upkeepLine.className = 'day-home-line wages' + (upkeep.paid < upkeep.total ? ' unpaid' : '');
      upkeepLine.textContent = upkeep.paid < upkeep.total
        ? 'Unterhalt nicht bezahlt (' + upkeep.total + ' Gold): Morgen wirkt kein Gebäude!'
        : 'Unterhalt der Gebäude: −' + upkeep.total + ' Gold';
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
    card.querySelector('.day-run-name').textContent = 'Raid: ' + raid.name;
    card.querySelector('.day-run-outcome').textContent = raidOutcomeText(report);

    const bossLine = card.querySelector('.day-raid-bosses');
    for (const bossId of report.defeatedBossIds) {
      const chip = document.createElement('span');
      chip.className = 'raid-boss-chip defeated';
      chip.textContent = '✓ ' + getBoss(bossId).name;
      bossLine.appendChild(chip);
    }
    if (report.defeatedBossIds.length === 0) {
      bossLine.textContent = 'Heute fiel kein Boss.';
    }
    if (report.gold > 0) {
      const goldLine = document.createElement('div');
      goldLine.className = 'day-reward';
      goldLine.appendChild(createSpriteCanvas('coin', 2));
      goldLine.insertAdjacentHTML('beforeend', '<span>+' + report.gold + ' Gold</span>');
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
      ? 'Am nächsten Raid-Tag dieser Woche geht es bei ' + getBoss(nextBoss.bossId).name + ' weiter.'
      : 'Alle Bosse dieser Woche sind besiegt! Nächste Woche beginnt der Raid von vorn.';
    if (report.endbossDefeated) {
      nextText = 'Der Endboss ist besiegt! Gleich kommt die Endauswertung.';
    }
    // Zum ersten Mal ganz geschafft: der nächste Raid ist offen
    if (report.unlockedRaidId) {
      nextText += ' Neu: ' + getRaid(report.unlockedRaidId).name + ' ist offen (Reiter „Raid“)!';
    }
    card.querySelector('.day-raid-next').textContent = nextText;

    const heroResults = report.heroResults || [];
    card.querySelector('.day-raid-heroes summary').textContent = heroResults.length + ' Helden · ' +
      (report.fallenNames.length > 0 ? report.fallenNames.length + ' gefallen' : 'niemand gefallen');
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
      (report.serverFirst ? ' Server-First: als erste Gilde geschafft!' : (report.firstClear ? ' Zum ersten Mal geschafft!' : ''));

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
      goldLine.insertAdjacentHTML('beforeend', '<span>+' + gold + ' Gold</span>');
      container.appendChild(goldLine);
    }
    // Wirkung der Eigenschaften sichtbar machen
    if (report.bonusGold > 0) {
      container.appendChild(createTraitBonusLine(report.bonusGoldHero + ' ist gierig: +' + report.bonusGold + ' Gold'));
    }
    if (report.collectionGold > 0) {
      container.appendChild(createTraitBonusLine('Sammelbuch (volle Seite): +' + report.collectionGold + ' Gold'));
    }
    if (report.chestBonusItems > 0) {
      container.appendChild(createTraitBonusLine(report.chestBonusHero + ' ist ein Glückspilz: +' +
        report.chestBonusItems + ' Item in der Kiste'));
    }

    if (report.supplies && report.supplies.length > 0) {
      container.appendChild(createTraitBonusLine('Vorräte verbraucht: ' + describeSupplies(report.supplies)));
    }
    if (report.scouted) {
      container.appendChild(createTraitBonusLine('Erkundet: Die Gruppe war vorbereitet (mehr Schaden' +
        (report.scouting === 'full' ? ', weniger erlittener Schaden)' : ')')));
    }

    if (report.chest) {
      container.appendChild(this.createChestLine(report.chest));
    } else if (gold === 0) {
      container.innerHTML = '<span class="hint">Keine Beute.</span>';
    }
  }

  // Zeile mit einer Kiste und "Jetzt öffnen!" (Boss-Kiste eines Runs oder Raid-Kiste)
  createChestLine(chestId) {
    const chest = getLootBoxType(chestId);
    const chestLine = document.createElement('div');
    chestLine.className = 'day-reward day-chest';
    chestLine.style.setProperty('--rarity', chest.mainColor);
    chestLine.appendChild(createChestCanvas(chest, 3));
    chestLine.insertAdjacentHTML('beforeend', '<span></span><button class="open-chest-button">Jetzt öffnen!</button>');
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
    text.textContent = heroResult.name + ' +' + heroResult.xp + ' EP' + (heroResult.catchUp ? ' (Aufhol-Bonus)' : '');
    row.appendChild(text);
    if (heroResult.levelsGained > 0) {
      row.insertAdjacentHTML('beforeend', '<span class="day-level-up">Level ' + heroResult.newLevel + '!</span>');
    }
    if (heroResult.injured) {
      row.insertAdjacentHTML('beforeend', '<span class="day-injured">verletzt</span>');
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
      return task.name + ': Training fiel aus, zu wenig Gold für den Trainer';
    }
    return task.name + ' trainiert: +' + task.xp + ' EP' + (task.levelsGained > 0 ? ' · Level ' + task.newLevel + '!' : '');
  }
  if (task.taskId === 'herbs' || task.taskId === 'gatherRaw') {
    return task.name + ': ' + HERO_TASKS[task.taskId].name + ' +' + describeMaterials(task.gathered);
  }
  if (task.taskId === 'jobs') {
    return task.name + ' ' + task.jobText + ': +' + task.gold + ' Gold' +
      (task.greedyGold > 0 ? ' (davon ' + task.greedyGold + ' durch Gierig)' : '');
  }
  if (task.taskId === 'scouting' && task.scoutedDungeonId) {
    const found = task.revealedBossId ? getBoss(task.revealedBossId).name + ' aufgedeckt!' : 'alles schon bekannt';
    return task.name + ' erkundet ' + getDungeon(task.scoutedDungeonId).name + ': ' + found + ' Der nächste Run dort ist vorbereitet.';
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
    return 'Raid geschafft!';
  }
  if (bosses === 0) {
    return 'Wipe! Kein Boss besiegt';
  }
  return 'Wipe nach ' + bosses + (bosses === 1 ? ' Boss' : ' Bossen');
}
