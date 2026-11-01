// ============================================================
// RISKBADGE – zeigt die Einschätzung für einen Dungeon-Run in Worten (Dungeon-Bildschirm und Tagesplan)
// Wie genau sie ist, hängt vom Dungeonwissen ab (siehe systems/DungeonKnowledge.js):
//   nichts erkundet      → "Einschätzung: Unbekannt (erst erkunden)", ohne Simulation
//   teilweise erkundet   → grob: "Eher leicht" oder "Eher schwer"
//   vollständig erkundet → genau: "Riskant · Gefallene: oft", mit Kartenraum Stufe 3 auch die größte Gefahr
// So kann man nicht beliebig viele Gruppen durchprobieren, bevor man den Dungeon kennt.
// Die Stufen und Farben stehen in data/riskLevels.js.
// ============================================================

import { estimateRunChances } from '../systems/combat/ChanceEstimator.js';
import { getRiskLevel, getFallLevel, getPartialRiskLevel, UNKNOWN_RISK, RISK_SIMULATION_COUNT } from '../data/riskLevels.js';

// heroes = Hero-Objekte der Gruppe, retreatRuleId = gewählte Rückzugsregel, supplies = mitgenommene Verbrauchsgüter.
// Wissen, Vorbereitung durch Erkunden und Kartenraum holt sich die Anzeige selbst aus game.
export function createRiskBadge(game, heroes, dungeonId, retreatRuleId, supplies = []) {
  const knowledge = game.getDungeonKnowledge(dungeonId);
  const badge = document.createElement('div');
  badge.className = 'risk-badge';
  badge.innerHTML = '<span class="risk-label">Einschätzung:</span> <b class="risk-name"></b> <span class="risk-fall"></span>';

  if (knowledge.level === 'none') {
    badge.style.setProperty('--risk-color', UNKNOWN_RISK.color);
    badge.querySelector('.risk-name').textContent = UNKNOWN_RISK.name;
    badge.querySelector('.risk-fall').textContent = '(' + UNKNOWN_RISK.hint + ')';
    badge.title = 'Schicke einen Helden zum Erkunden (Tagesplan), dann wird die Einschätzung genauer.';
    return badge;
  }

  const chances = estimateRunChances({
    heroes, dungeonId, retreatRuleId, supplies,
    scouting: game.getScoutingLevel(dungeonId),
    count: RISK_SIMULATION_COUNT,
  });

  if (knowledge.level === 'partial') {
    const level = getPartialRiskLevel(chances.winRate);
    badge.style.setProperty('--risk-color', level.color);
    badge.querySelector('.risk-name').textContent = level.name;
    badge.querySelector('.risk-fall').textContent = '(erkundet ' + knowledge.known + ' von ' + knowledge.total + ' Bossen)';
    badge.title = 'Erst wenn alle Bosse erkundet sind, wird die Einschätzung genau.';
    return badge;
  }

  const risk = getRiskLevel(chances.winRate);
  badge.style.setProperty('--risk-color', risk.color);
  badge.querySelector('.risk-name').textContent = risk.name;
  badge.querySelector('.risk-fall').textContent = '· Gefallene: ' + getFallLevel(chances.fallenRate).name;
  // Kartenraum Stufe 3: die größte Gefahr
  if (game.hasDefeatForecast() && chances.likelyCause) {
    const forecastLine = document.createElement('div');
    forecastLine.className = 'risk-forecast';
    forecastLine.textContent = 'Kartenraum: Größte Gefahr ist „' + chances.likelyCause.name + '“';
    badge.appendChild(forecastLine);
  }
  return badge;
}
