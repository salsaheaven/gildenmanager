// ============================================================
// ENDEVALUATIONOVERLAY – die Endauswertung als Vollbild nach dem ersten Sieg über den Endboss
//   - großer Rang (S/A/B/C/D) nach Spieltagen
//   - Statistik und Platz im Raid-Rennen gegen die KI-Gilden
//   - Bestenliste im Browser (dieser Lauf hervorgehoben)
//   - "Weiterspielen": Das Spiel geht danach ganz normal weiter
// Die Auswertung rechnet systems/EndEvaluation.js, die Bestenliste speichert ui/BestList.js.
// ============================================================

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
        <h1>Der Weltenverschlinger ist besiegt!</h1>
        <p class="end-evaluation-sub"></p>
        <div class="end-rank"></div>
        <div class="end-rank-name"></div>
        <ul class="end-stats"></ul>
        <h2>Bestenliste</h2>
        <ol class="end-best-list"></ol>
        <div class="lab-actions"><button class="big-button end-continue-button">Weiterspielen</button></div>
      </div>
    `;
    const stats = evaluation.stats;
    this.root.querySelector('.end-evaluation-sub').textContent = evaluation.guildName + ' hat die Welt gerettet – an Tag ' + evaluation.day + '.';
    const rank = this.root.querySelector('.end-rank');
    rank.textContent = evaluation.rank;
    rank.style.color = evaluation.rankColor;
    this.root.querySelector('.end-rank-name').textContent = evaluation.rankName;

    const lines = [
      'Platz ' + evaluation.place + ' von ' + evaluation.guildCount + ' im Raid-Rennen' + (evaluation.place === 1 ? ' – Server-First!' : ''),
      'Spieltage: ' + evaluation.day,
      'Geschaffte Dungeon-Runs: ' + stats.dungeonRuns,
      'Raid-Bosse besiegt: ' + stats.raidBosses + ' / ' + stats.raidBossTotal,
      'Helden in der Gilde: ' + stats.heroes,
      'Legendäre Items gefunden: ' + stats.legendaries,
      'Kisten geöffnet: ' + stats.boxesOpened,
      'Volle Sammelbuch-Seiten: ' + stats.collectionPages,
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
      line.querySelector('span').textContent = entry.guildName + ' · Tag ' + entry.day + ' · ' + entry.date;
      bestList.appendChild(line);
    });
    if (result.list.length === 0) {
      bestList.innerHTML = '<li class="hint">Die Bestenliste ist in diesem Browser nicht verfügbar.</li>';
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
