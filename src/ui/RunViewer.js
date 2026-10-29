// ============================================================
// RUNVIEWER – zeigt den Bericht eines beendeten Dungeon-Runs
// Alle Begegnungen nacheinander, jeweils mit Schadensmesser und Kampfbericht.
// (Die Kampfszenen am Tagesende kommen im nächsten Schritt dazu.)
// ============================================================

import { createDefeatCausesView } from './DefeatCausesView.js';
import { Expedition } from '../entities/Expedition.js';
import { renderCombatReport } from './CombatReport.js';

export class RunViewer {
  constructor(container, game) {
    this.container = container;
    this.game = game;
    this.showEmpty();
  }

  showEmpty() {
    this.container.innerHTML = '<p class="hint">Tippe einen Bericht an, um den Kampfverlauf zu sehen.</p>';
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
      heading.textContent = 'Begegnung ' + (i + 1) + ': ' + encounterResult.encounterName;
      this.container.appendChild(heading);
      const box = document.createElement('div');
      box.className = 'final-report';
      this.container.appendChild(box);
      renderCombatReport(box, encounterResult);
    }
  }
}
