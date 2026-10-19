// ============================================================
// COMBATREPORT – zeigt das Ergebnis eines Kampfes an:
//   - Ergebnis-Banner (Sieg / Niederlage)
//   - Schadensmesser: wer hat wie viel Schaden gemacht, geheilt, eingesteckt
//   - Kampfbericht Runde für Runde
// Wird im Kampf-Labor benutzt (und später bei den Dungeons).
// ============================================================

import { getHeroClass } from '../data/heroClasses.js';
import { getBoss } from '../data/enemies.js';

export function renderCombatReport(container, result) {
  container.innerHTML = '';
  container.appendChild(createBanner(result));
  container.appendChild(createMeter(result));
  container.appendChild(createLog(result));
}

function createBanner(result) {
  const banner = document.createElement('div');
  const boss = getBoss(result.bossId);
  if (result.isDummy) {
    banner.className = 'result-banner neutral';
    banner.textContent = 'Messung beendet: ' + result.rounds + ' Runden';
  } else if (result.victory) {
    banner.className = 'result-banner victory';
    banner.textContent = 'SIEG gegen ' + boss.name + ' nach ' + result.rounds + ' Runden';
  } else {
    banner.className = 'result-banner defeat';
    // Aufrunden, damit ein knapp überlebender Boss nicht als "0 %" erscheint
    const bossLeft = Math.ceil(result.bossHpPercent * 100);
    banner.textContent = 'NIEDERLAGE nach ' + result.rounds + ' Runden (' + boss.name + ' hatte noch ' + bossLeft + ' % Leben)';
  }
  return banner;
}

// Tabelle mit Balken, wie ein Schadensmesser im MMO
function createMeter(result) {
  const meter = document.createElement('table');
  meter.className = 'meter';
  meter.innerHTML = `
    <tr><th>Held</th><th>Schaden</th><th>pro Runde</th><th>Heilung / Schutz</th><th>Erlitten</th><th>Status</th></tr>
  `;

  let maxDamage = 1;
  let maxHealing = 1;
  for (const hero of result.heroes) {
    maxDamage = Math.max(maxDamage, hero.damageDone);
    maxHealing = Math.max(maxHealing, hero.healingDone);
  }

  for (const hero of result.heroes) {
    const heroClass = getHeroClass(hero.classId);
    const row = document.createElement('tr');
    row.style.setProperty('--class-color', heroClass.color);
    row.innerHTML = `
      <td class="meter-name"></td>
      <td>${createBarHtml(hero.damageDone, maxDamage, 'damage')}</td>
      <td>${Math.round(hero.damageDone / Math.max(1, result.rounds))}</td>
      <td>${createBarHtml(hero.healingDone, maxHealing, 'healing')}</td>
      <td>${hero.damageTaken}</td>
      <td class="${hero.alive ? 'status-alive' : 'status-fallen'}">${hero.alive ? hero.hp + ' / ' + hero.maxHp : 'gefallen'}</td>
    `;
    row.querySelector('.meter-name').textContent = hero.name;
    meter.appendChild(row);
  }

  const wrapper = document.createElement('div');
  wrapper.className = 'meter-wrapper';
  wrapper.appendChild(meter);
  return wrapper;
}

function createBarHtml(value, maxValue, kind) {
  const width = Math.round((value / maxValue) * 100);
  return `<div class="meter-bar ${kind}"><div style="width: ${width}%"></div><span>${value}</span></div>`;
}

// Bericht Runde für Runde
function createLog(result) {
  const log = document.createElement('div');
  log.className = 'combat-log';

  let currentRound = -1;
  for (const entry of result.log) {
    // Aktions-Einträge sind nur für die Kampfszene da
    if (entry.kind === 'action') {
      continue;
    }
    if (entry.round !== currentRound) {
      currentRound = entry.round;
      if (currentRound > 0) {
        const header = document.createElement('div');
        header.className = 'log-round';
        header.textContent = 'Runde ' + currentRound;
        log.appendChild(header);
      }
    }
    const line = document.createElement('div');
    line.className = 'log-line log-' + entry.kind;
    line.textContent = entry.text;
    log.appendChild(line);
  }
  return log;
}
