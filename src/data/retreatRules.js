// ============================================================
// RÜCKZUGSREGELN – stellt man vor dem Start eines Dungeons ein
// Die Regel reagiert nur auf Gefallene, nicht auf Lebenspunkte. Bevor sie greift, ist also schon jemand gefallen.
// Der Rückzug selbst dauert ein paar Runden (siehe combatRules.js), in denen der Gegner weiter angreift.
//
// afterFallen = Rückzug, sobald so viele Helden gefallen sind (null = nie)
// ============================================================

export const RETREAT_RULES = [
  { id: 'never', name: 'Nie zurückziehen', afterFallen: null },
  { id: 'afterOne', name: 'Nach 1 Gefallenen', afterFallen: 1 },
  { id: 'afterTwo', name: 'Nach 2 Gefallenen', afterFallen: 2 },
];

export function getRetreatRule(ruleId) {
  for (const rule of RETREAT_RULES) {
    if (rule.id === ruleId) {
      return rule;
    }
  }
  throw new Error('Unbekannte Rückzugsregel: ' + ruleId);
}
