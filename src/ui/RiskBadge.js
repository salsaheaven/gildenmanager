// ============================================================
// RISKBADGE – zeigt die Einschätzung für einen Dungeon-Run in Worten,
// z.B. "Einschätzung: Riskant · Gefallene: oft" (Dungeon-Bildschirm und Tagesplan)
// Die Stufen und Farben stehen in data/riskLevels.js.
// ============================================================

import { estimateRunChances } from '../systems/combat/ChanceEstimator.js';
import { getRiskLevel, getFallLevel, RISK_SIMULATION_COUNT } from '../data/riskLevels.js';

// heroes = Hero-Objekte der Gruppe, retreatRuleId = gewählte Rückzugsregel
// supplies = mitgenommene Verbrauchsgüter (freiwillig), scouted = Dungeon erkundet (freiwillig).
// Beides fließt in die Einschätzung ein.
export function createRiskBadge(heroes, dungeonId, retreatRuleId, supplies = [], scouted = false) {
  const chances = estimateRunChances({ heroes, dungeonId, retreatRuleId, supplies, scouted, count: RISK_SIMULATION_COUNT });
  const risk = getRiskLevel(chances.winRate);
  const fall = getFallLevel(chances.fallenRate);

  const badge = document.createElement('div');
  badge.className = 'risk-badge';
  badge.style.setProperty('--risk-color', risk.color);
  badge.innerHTML = '<span class="risk-label">Einschätzung:</span> <b class="risk-name"></b> <span class="risk-fall"></span>';
  badge.querySelector('.risk-name').textContent = risk.name;
  badge.querySelector('.risk-fall').textContent = '· Gefallene: ' + fall.name;
  return badge;
}
