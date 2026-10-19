// ============================================================
// RUNVIEWER – zeigt einen laufenden Dungeon-Run als Kampfszene
// Die Szene folgt dabei der Expedition: Sie zeigt immer die Begegnung, in der die Gruppe gerade ist,
// und springt an die richtige Stelle, auch wenn man erst mittendrin zuschaut.
// Kann außerdem den Bericht eines beendeten Runs anzeigen.
// ============================================================

import { Hero } from '../entities/Hero.js';
import { Expedition } from '../entities/Expedition.js';
import { getDungeon } from '../data/dungeons.js';
import { BattleScene } from './BattleScene.js';
import { renderCombatReport } from './CombatReport.js';

export class RunViewer {
  constructor(container, game) {
    this.container = container;
    this.game = game;
    this.expeditionId = null;   // welcher Run gerade angezeigt wird
    this.shownResult = null;    // das Ergebnis, zu dem die aktuelle Szene gehört
    this.shownEncounter = -1;   // welche Begegnung die Szene gerade zeigt (-1 = keine)
    this.scene = null;
    this.heroes = [];
    this.showEmpty();
  }

  showEmpty() {
    this.expeditionId = null;
    this.scene = null;
    this.container.innerHTML = '<p class="hint">Schicke eine Gruppe los oder wähle einen laufenden Run zum Zuschauen.</p>';
  }

  watch(expeditionId) {
    this.expeditionId = expeditionId;
    this.shownResult = null;
    this.shownEncounter = -1;
    this.scene = null;
    const expedition = this.game.guild.findExpedition(expeditionId);
    this.heroes = expedition.heroSnapshots.map((snapshot) => Hero.fromSaveData(snapshot));
    this.update();
  }

  isWatching(expeditionId) {
    return this.expeditionId === expeditionId;
  }

  // Wird in jedem Bild aufgerufen
  update() {
    if (this.expeditionId === null) {
      return;
    }
    const expedition = this.game.guild.findExpedition(this.expeditionId);
    if (!expedition) {
      return; // Run ist vorbei, der Bericht wird von außen angezeigt
    }

    const result = expedition.getResult();
    const position = expedition.getPosition();

    // Nach einem Rückzug wurde der Run neu berechnet: Szene neu aufbauen
    if (result !== this.shownResult) {
      this.shownResult = result;
      this.shownEncounter = -1;
    }

    if (position.traveling) {
      if (this.shownEncounter !== 'travel') {
        this.shownEncounter = 'travel';
        this.scene = null;
        const next = getDungeon(expedition.dungeonId).encounters[position.encounterIndex];
        const nextName = next ? (next.type === 'boss' ? 'dem Boss' : next.name) : 'dem Ausgang';
        this.container.innerHTML = '<div class="travel-note">Die Gruppe zieht weiter zu ' + nextName + ' …</div>';
      }
      return;
    }

    if (this.shownEncounter !== position.encounterIndex) {
      this.shownEncounter = position.encounterIndex;
      this.container.innerHTML = '';
      this.scene = new BattleScene(this.container, result.encounters[position.encounterIndex], this.heroes, () => {}, false);
    }
    const clock = this.game.clock;
    this.scene.syncTo(position.localTime, clock.paused, clock.speed);
  }

  // Bericht eines beendeten Runs: alle Begegnungen mit Schadensmesser und Kampfbericht
  showReport(report) {
    this.expeditionId = null;
    this.scene = null;
    const expedition = Expedition.fromSaveData(report.expedition);
    const result = expedition.getResult();

    this.container.innerHTML = '';
    for (let i = 0; i < result.encounters.length; i++) {
      const encounterResult = result.encounters[i];
      const heading = document.createElement('h3');
      heading.textContent = 'Begegnung ' + (i + 1) + ': ' + encounterResult.encounterName;
      this.container.appendChild(heading);
      const box = document.createElement('div');
      box.className = 'final-report';
      this.container.appendChild(box);
      renderCombatReport(box, encounterResult);
    }
  }
}
