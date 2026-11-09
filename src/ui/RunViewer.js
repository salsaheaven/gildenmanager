// ============================================================
// RUNVIEWER – zeigt den Bericht eines beendeten Dungeon-Runs
// Alle Begegnungen nacheinander, jeweils mit Schadensmesser und Kampfbericht.
// (Die Kampfszenen am Tagesende kommen im nächsten Schritt dazu.)
// ============================================================

import { t } from '../core/Language.js';
import { createDefeatCausesView } from './DefeatCausesView.js';
import { Expedition } from '../entities/Expedition.js';
import { renderCombatReport } from './CombatReport.js';

export class RunViewer {
  constructor(container, game) {
    this.container = container;
    this.game = game;
    this.showEmpty();
  }

  // Ohne gewählten Bericht bleibt der Bereich leer (der Hinweis steht als Info-Blase an "Berichte")
  showEmpty() {
    this.container.innerHTML = '';
  }

  // Bericht eines beendeten Runs: alle Begegnungen mit Schadensmesser und Kampfbericht
  showReport(report) {
    const expedition = Expedition.fromSaveData(report.expedition);
    const result = expedition.getResult();

    this.container.innerHTML = '';
    // Oben: "Woran es lag" (nur bei Niederlage oder Gefallenen)
    this.container.appendChild(createDefeatCausesView(report.analysis));
    for (let i = 0; i < result.encounters.length; i++) {
      const encounterResult = result.encounters[i];
      const heading = document.createElement('h3');
      heading.textContent = t('guide.encounter', { number: i + 1, name: encounterResult.encounterName });
      this.container.appendChild(heading);
      const box = document.createElement('div');
      box.className = 'final-report';
      this.container.appendChild(box);
      renderCombatReport(box, encounterResult);
    }
  }
}
