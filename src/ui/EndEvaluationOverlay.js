// ============================================================
// ENDEVALUATIONOVERLAY – die Endauswertung als Vollbild nach dem ersten Sieg über den Endboss
//   - großer Rang (S/A/B/C/D) nach Spieltagen
//   - Statistik und Platz im Raid-Rennen gegen die KI-Gilden
//   - Bestenliste im Browser (dieser Lauf hervorgehoben)
//   - "Weiterspielen": Das Spiel geht danach ganz normal weiter
// Die Auswertung rechnet systems/EndEvaluation.js, die Bestenliste speichert ui/BestList.js.
// ============================================================

import { t } from '../core/Language.js';
import { addToBestList, loadBestList } from './BestList.js';
import { Sound } from './Sound.js';

export class EndEvaluationOverlay {
  // evaluation = Ergebnis von createEndEvaluation, saveToBestList = Lauf in die Bestenliste eintragen
  constructor(evaluation, saveToBestList = true) {
    const result = saveToBestList ? addToBestList(evaluation) : { list: loadBestList(), place: null };

    this.root = document.createElement('div');
    this.root.className = 'end-evaluation';
    this.root.innerHTML = `
      <div class="panel end-evaluation-box">
        <h1>${t('raid.endTitle')}</h1>
        <p class="end-evaluation-sub"></p>
        <div class="end-rank"></div>
        <div class="end-rank-name"></div>
        <ul class="end-stats"></ul>
        <h2>${t('raid.bestList')}</h2>
        <ol class="end-best-list"></ol>
        <div class="lab-actions"><button class="big-button end-continue-button">${t('raid.continue')}</button></div>
      </div>
    `;
    const stats = evaluation.stats;
    this.root.querySelector('.end-evaluation-sub').textContent = t('raid.savedWorld', { name: evaluation.guildName, day: evaluation.day });
    const rank = this.root.querySelector('.end-rank');
    rank.textContent = evaluation.rank;
    rank.style.color = evaluation.rankColor;
    this.root.querySelector('.end-rank-name').textContent = evaluation.rankName;

    const lines = [
      t('raid.place', { place: evaluation.place, count: evaluation.guildCount }),
      t('raid.statDays', { value: evaluation.day }),
      t('raid.statRuns', { value: stats.dungeonRuns }),
      t('raid.statRaidBosses', { value: stats.raidBosses, total: stats.raidBossTotal }),
      t('raid.statHeroes', { value: stats.heroes }),
      t('raid.statLegendaries', { value: stats.legendaries }),
      t('raid.statBoxes', { value: stats.boxesOpened }),
      t('raid.statPages', { value: stats.collectionPages }),
    ];
    for (const text of lines) {
      const line = document.createElement('li');
      line.textContent = text;
      this.root.querySelector('.end-stats').appendChild(line);
    }

    const bestList = this.root.querySelector('.end-best-list');
    result.list.forEach((entry, index) => {
      const line = document.createElement('li');
      line.classList.toggle('current', index + 1 === result.place);
      line.innerHTML = '<b class="end-best-rank"></b> <span></span>';
      line.querySelector('.end-best-rank').textContent = entry.rank;
      line.querySelector('.end-best-rank').style.color = entry.rankColor;
      line.querySelector('span').textContent = t('raid.bestEntry', { name: entry.guildName, day: entry.day, date: entry.date });
      bestList.appendChild(line);
    });
    if (result.list.length === 0) {
      bestList.innerHTML = '<li class="hint">' + t('raid.bestUnavailable') + '</li>';
    }

    this.root.querySelector('.end-continue-button').addEventListener('click', () => {
      Sound.click();
      this.root.remove();
      document.body.classList.remove('overlay-open');
    });
    document.body.appendChild(this.root);
    document.body.classList.add('overlay-open');
    Sound.collectionPage();
  }
}
