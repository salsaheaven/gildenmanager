// ============================================================
// RISIKO-STUFEN – die Einschätzung vor einem Dungeon-Run in Worten (siehe KONZEPT.md, "Siegchance in Dungeons")
// Gezeigt wird bewusst keine genaue Prozentzahl, nur eine Stufe.
//
// RISK_LEVELS: ab welcher Siegchance (minWinRate, 0 bis 1) welches Wort gilt. Von oben nach unten geprüft.
// FALL_LEVELS: wie oft in einem Run mindestens ein Held fällt (minFallRate, 0 bis 1).
// RISK_SIMULATION_COUNT: so viele Runs werden für die Einschätzung simuliert
// ============================================================

export const RISK_LEVELS = [
  { id: 'safe',     name: 'Sicher',       minWinRate: 0.9,  color: '#1eff00' },
  { id: 'doable',   name: 'Machbar',      minWinRate: 0.65, color: '#ffd23f' },
  { id: 'risky',    name: 'Riskant',      minWinRate: 0.35, color: '#ff9f43' },
  { id: 'hopeless', name: 'Aussichtslos', minWinRate: 0,    color: '#ff4d4d' },
];

export const FALL_LEVELS = [
  { id: 'often',     name: 'oft',      minFallRate: 0.5 },
  { id: 'sometimes', name: 'manchmal', minFallRate: 0.2 },
  { id: 'rarely',    name: 'selten',   minFallRate: 0 },
];

export const RISK_SIMULATION_COUNT = 100;

// Dungeonwissen (siehe systems/DungeonKnowledge.js): Ohne Erkunden gibt es keine Einschätzung,
// teilweise erkundet nur eine grobe. Erst vollständig erkundet gilt RISK_LEVELS mit "Gefallene: …".
export const UNKNOWN_RISK = { name: 'Unbekannt', hint: 'erst erkunden', color: '#8f86a3' };
export const PARTIAL_RISK_LEVELS = [
  { id: 'easy', name: 'Eher leicht', minWinRate: 0.5, color: '#9be15d' },
  { id: 'hard', name: 'Eher schwer', minWinRate: 0,   color: '#ff9f43' },
];

// Grobe Stufe für teilweise erkundete Dungeons
export function getPartialRiskLevel(winRate) {
  return PARTIAL_RISK_LEVELS.find((level) => winRate >= level.minWinRate);
}

// Risiko-Stufe für eine Siegchance (0 bis 1)
export function getRiskLevel(winRate) {
  return RISK_LEVELS.find((level) => winRate >= level.minWinRate);
}

// Gefallenen-Stufe für einen Anteil Runs mit Gefallenen (0 bis 1)
export function getFallLevel(fallRate) {
  return FALL_LEVELS.find((level) => fallRate >= level.minFallRate);
}
