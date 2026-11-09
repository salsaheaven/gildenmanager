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

// Die Einschätzung als Daten (für den Kasten unten und für den Knopf "Auto-Gruppe"):
// { name, color, detail, title, likelyCause }. detail = Zusatz wie "· Gefallene: oft", likelyCause nur bei vollem Wissen.
export function getRiskSummary(game, heroes, dungeonId, retreatRuleId, supplies = []) {
  const knowledge = game.getDungeonKnowledge(dungeonId);
  if (knowledge.level === 'none' || heroes.length === 0) {
    return {
      name: UNKNOWN_RISK.name, color: UNKNOWN_RISK.color, detail: '(' + UNKNOWN_RISK.hint + ')', likelyCause: null,
      title: 'Schicke einen Helden zum Erkunden (Tagesplan), dann wird die Einschätzung genauer.',
    };
  }
  const chances = estimateRunChances({
    heroes, dungeonId, retreatRuleId, supplies,
    scouting: game.getScoutingLevel(dungeonId),
    count: RISK_SIMULATION_COUNT,
  });
  if (knowledge.level === 'partial') {
    const level = getPartialRiskLevel(chances.winRate);
    return {
      name: level.name, color: level.color, likelyCause: null,
      detail: '(erkundet ' + knowledge.known + ' von ' + knowledge.total + ' Bossen)',
      title: 'Erst wenn alle Bosse erkundet sind, wird die Einschätzung genau.',
    };
  }
  const risk = getRiskLevel(chances.winRate);
  return {
    name: risk.name, color: risk.color, title: '',
    detail: '· Gefallene: ' + getFallLevel(chances.fallenRate).name,
    likelyCause: chances.likelyCause,
  };
}

// heroes = Hero-Objekte der Gruppe, retreatRuleId = gewählte Rückzugsregel, supplies = mitgenommene Verbrauchsgüter.
// Wissen, Vorbereitung durch Erkunden und Kartenraum holt sich die Anzeige selbst aus game.
export function createRiskBadge(game, heroes, dungeonId, retreatRuleId, supplies = []) {
  return createRiskBadgeFromSummary(game, getRiskSummary(game, heroes, dungeonId, retreatRuleId, supplies));
}

// Dasselbe Kästchen aus einer schon berechneten Einschätzung (spart die zweite Simulation)
export function createRiskBadgeFromSummary(game, summary) {
  const badge = document.createElement('div');
  badge.className = 'risk-badge';
  badge.innerHTML = '<span class="risk-label">Einschätzung:</span> <b class="risk-name"></b> <span class="risk-fall"></span>';
  badge.style.setProperty('--risk-color', summary.color);
  badge.querySelector('.risk-name').textContent = summary.name;
  badge.querySelector('.risk-fall').textContent = summary.detail;
  badge.title = summary.title;
  // Kartenraum Stufe 3: die größte Gefahr
  if (game.hasDefeatForecast() && summary.likelyCause) {
    const forecastLine = document.createElement('div');
    forecastLine.className = 'risk-forecast';
    forecastLine.textContent = 'Kartenraum: Größte Gefahr ist „' + summary.likelyCause.name + '“';
    badge.appendChild(forecastLine);
  }
  return badge;
}
