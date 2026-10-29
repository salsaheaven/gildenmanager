// ============================================================
// DAYENDOVERLAY – der Tagesabschluss (Vollbild-Fenster nach "Tag beenden")
//
// Ablauf:
//   1. Kämpfe ansehen: Alle Runs von heute laufen nacheinander als Kampfszene ab,
//      Begegnung für Begegnung. Jede Szene lässt sich überspringen, oder gleich alles.
//      Das Ergebnis steht schon fest (es wurde beim Tagesende berechnet), die Szene zeigt es nur.
//   2. Zusammenfassung: pro Run Ergebnis, Gold, Boss-Kiste ("Jetzt öffnen"), EP und Level-Ups.
//      Erst jetzt erscheinen die Level-Up-Banner, damit sie das Ergebnis nicht vorher verraten.
// ============================================================

import { createDefeatCausesView } from './DefeatCausesView.js';
import { Hero } from '../entities/Hero.js';
import { Expedition } from '../entities/Expedition.js';
import { getDungeon } from '../data/dungeons.js';
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

  // Startet den Tagesabschluss. day = der Tag, der gerade zu Ende ging, reports = Berichte der Runs
  start(day, reports) {
    this.day = day;
    this.runs = reports.map((report) => {
      const expedition = Expedition.fromSaveData(report.expedition);
      return {
        report: report,
        result: expedition.getResult(),
        heroes: expedition.heroSnapshots.map((snapshot) => Hero.fromSaveData(snapshot)),
      };
    });
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
    const dungeon = getDungeon(run.report.dungeonId);
    const encounterResult = run.result.encounters[step.encounterIndex];
    const runNumber = this.runs.indexOf(run) + 1;

    let subText = dungeon.name + ' · Begegnung ' + (step.encounterIndex + 1) + '/' + dungeon.encounters.length +
      ': ' + encounterResult.encounterName;
    if (this.runs.length > 1) {
      subText = 'Gruppe ' + runNumber + ' von ' + this.runs.length + ' · ' + subText;
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
      flash.textContent = outcomeText(run.report.outcome);
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
      note.textContent = 'Die Gruppe zieht weiter …';
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
      summary.appendChild(this.createRunCard(run.report));
    }

    const nextButton = body.querySelector('.next-day-button');
    nextButton.textContent = 'Weiter zu Tag ' + (this.day + 1);
    nextButton.addEventListener('click', () => {
      Sound.click();
      this.close();
    });

    // Fanfare für den besten Erfolg des Tages
    const best = this.runs.find((run) => run.report.firstClear) || this.runs.find((run) => run.report.outcome === 'success');
    if (best) {
      Sound.itemReveal(best.report.firstClear ? 4 : 3);
    }
    this.callbacks.onSummaryShown();
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
      (report.firstClear ? ' Zum ersten Mal geschafft!' : '');

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

    if (report.chest) {
      const chest = getLootBoxType(report.chest);
      const chestLine = document.createElement('div');
      chestLine.className = 'day-reward day-chest';
      chestLine.style.setProperty('--rarity', chest.mainColor);
      chestLine.appendChild(createChestCanvas(chest, 3));
      chestLine.insertAdjacentHTML('beforeend', '<span></span><button class="open-chest-button">Jetzt öffnen!</button>');
      chestLine.querySelector('span').textContent = chest.name;
      const button = chestLine.querySelector('.open-chest-button');
      // Die Kiste könnte schon geöffnet sein (zweite Kiste derselben Art)
      button.disabled = this.game.guild.countBoxes(report.chest) === 0;
      button.addEventListener('click', () => {
        this.close();
        this.callbacks.onOpenChest(report.chest);
      });
      container.appendChild(chestLine);
    } else if (gold === 0) {
      container.innerHTML = '<span class="hint">Keine Beute.</span>';
    }
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
function createTraitBonusLine(text) {
  const line = document.createElement('div');
  line.className = 'day-trait-bonus';
  line.textContent = text;
  return line;
}
