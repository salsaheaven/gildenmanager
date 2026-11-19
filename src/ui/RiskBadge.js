// ============================================================
// RISKBADGE – zeigt die Einschätzung für einen Dungeon-Run in Worten (Dungeon-Bildschirm und Tagesplan)
// Wie genau sie ist, hängt vom Dungeonwissen ab (siehe systems/DungeonKnowledge.js):
//   nichts erkundet      → "Einschätzung: Unbekannt (erst erkunden)", ohne Simulation
//   teilweise erkundet   → grob: "Eher leicht" oder "Eher schwer"
//   vollständig erkundet → genau: "Riskant · Gefallene: oft", mit Kartenraum Stufe 3 auch die größte Gefahr
// So kann man nicht beliebig viele Gruppen durchprobieren, bevor man den Dungeon kennt.
// Die Stufen und Farben stehen in data/riskLevels.js.
// Nimmt die Gruppe keine Vorräte mit, zeigt sie zusätzlich, was die besten Tränke bringen würden (Tränke-Ratgeber).
// ============================================================

import { t } from '../core/Language.js';
import { estimateRunChances } from '../systems/combat/ChanceEstimator.js';
import { attachInfo } from './InfoTip.js';
import { getRiskLevel, getFallLevel, getPartialRiskLevel, UNKNOWN_RISK, RISK_SIMULATION_COUNT, SUPPLY_ADVICE_MIN_GAIN } from '../data/riskLevels.js';
import { suggestSupplies } from '../systems/SupplyAdvice.js';
import { getConsumable } from '../data/consumables.js';

// Die Einschätzung als Daten (für den Kasten unten und für den Knopf "Auto-Gruppe"):
// { name, color, detail, title, likelyCause, withSupplies }. detail = Zusatz wie "· Gefallene: oft", likelyCause nur bei vollem Wissen.
// withSupplies = nur wenn die Gruppe keine Vorräte mitnimmt und Tränke die Einschätzung deutlich verbessern würden:
//                { names: "Wutelixier + Steinhaut", name: "Machbar", color } (Tränke-Ratgeber, siehe systems/SupplyAdvice.js)
export function getRiskSummary(game, heroes, dungeonId, retreatRuleId, supplies = []) {
  const knowledge = game.getDungeonKnowledge(dungeonId);
  if (knowledge.level === 'none' || heroes.length === 0) {
    return {
      name: UNKNOWN_RISK.name, color: UNKNOWN_RISK.color, detail: '(' + UNKNOWN_RISK.hint + ')', likelyCause: null,
      title: t('parts.riskUnknownTitle'), withSupplies: null,
    };
  }
  const chances = estimateChancesFor(game, heroes, dungeonId, retreatRuleId, supplies);
  const level = getLevelFor(knowledge, chances);
  const summary = { name: level.name, color: level.color, likelyCause: null, withSupplies: null };
  if (knowledge.level === 'partial') {
    summary.detail = t('parts.riskPartialDetail', { known: knowledge.known, total: knowledge.total });
    summary.title = t('parts.riskPartialTitle');
  } else {
    summary.detail = t('parts.riskFallen', { level: getFallLevel(chances.fallenRate).name });
    summary.title = '';
    summary.likelyCause = chances.likelyCause;
  }
  // Ohne Vorräte: Was würden die besten Tränke bringen?
  if (supplies.length === 0) {
    summary.withSupplies = getSupplyUpgrade(game, heroes, dungeonId, retreatRuleId, knowledge, chances);
  }
  return summary;
}

// Siegchance der Gruppe mit diesen Vorräten (Erkunden zählt mit)
function estimateChancesFor(game, heroes, dungeonId, retreatRuleId, supplies) {
  return estimateRunChances({
    heroes, dungeonId, retreatRuleId, supplies,
    scouting: game.getScoutingLevel(dungeonId),
    count: RISK_SIMULATION_COUNT,
  });
}

// Wort und Farbe zur Siegchance: grob bei teilweise erkundeten Dungeons, sonst genau
function getLevelFor(knowledge, chances) {
  return knowledge.level === 'partial' ? getPartialRiskLevel(chances.winRate) : getRiskLevel(chances.winRate);
}

// "Mit Wutelixier + Steinhaut: Machbar" – nur wenn die Tränke die Siegchance deutlich heben, sonst null
function getSupplyUpgrade(game, heroes, dungeonId, retreatRuleId, knowledge, chances) {
  const suggestion = suggestSupplies(game.guild, dungeonId, chances.likelyCause ? [chances.likelyCause.type] : []);
  if (suggestion.length === 0) {
    return null;
  }
  const better = estimateChancesFor(game, heroes, dungeonId, retreatRuleId, suggestion);
  if (better.winRate - chances.winRate < SUPPLY_ADVICE_MIN_GAIN) {
    return null;
  }
  const level = getLevelFor(knowledge, better);
  return { names: suggestion.map((id) => getConsumable(id).name).join(' + '), name: level.name, color: level.color };
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
  badge.innerHTML = '<span class="risk-label"></span> <b class="risk-name"></b> <span class="risk-fall"></span>';
  badge.querySelector('.risk-label').textContent = t('parts.riskLabel');
  badge.style.setProperty('--risk-color', summary.color);
  badge.querySelector('.risk-name').textContent = summary.name;
  badge.querySelector('.risk-fall').textContent = summary.detail;
  badge.title = summary.title;
  // Tränke-Ratgeber: "Mit Wutelixier + Steinhaut: Machbar"
  if (summary.withSupplies) {
    const supplyLine = document.createElement('div');
    supplyLine.className = 'risk-supplies';
    supplyLine.style.setProperty('--risk-color', summary.withSupplies.color);
    supplyLine.innerHTML = '<span class="risk-supplies-text"></span> <b class="risk-supplies-name"></b>';
    supplyLine.querySelector('.risk-supplies-text').textContent = t('parts.riskWithSupplies', { names: summary.withSupplies.names });
    supplyLine.querySelector('.risk-supplies-name').textContent = summary.withSupplies.name;
    badge.appendChild(supplyLine);
  }
  // Kartenraum Stufe 3: die größte Gefahr
  if (game.hasDefeatForecast() && summary.likelyCause) {
    const forecastLine = document.createElement('div');
    forecastLine.className = 'risk-forecast';
    forecastLine.textContent = t('parts.riskForecast', { name: summary.likelyCause.name });
    badge.appendChild(forecastLine);
  }
  return badge;
}

// Kompakte Einschätzung: nur das Wort ("Riskant"), alle Einzelheiten in der Info-Blase (Antippen / Maus drüber)
export function createCompactRiskBadge(game, heroes, dungeonId, retreatRuleId, supplies = []) {
  const summary = getRiskSummary(game, heroes, dungeonId, retreatRuleId, supplies);
  const badge = createRiskBadgeFromSummary(game, summary);
  badge.classList.add('compact');
  const forecast = game.hasDefeatForecast() && summary.likelyCause ? t('parts.riskBiggest', { name: summary.likelyCause.name }) : '';
  const supplyText = summary.withSupplies ? ' ' + t('parts.riskWithSupplies', { names: summary.withSupplies.names }) + ' ' + summary.withSupplies.name + '.' : '';
  attachInfo(badge, t('parts.riskInfo', { name: summary.name, detail: summary.detail, title: summary.title, forecast }) + supplyText);
  return badge;
}
