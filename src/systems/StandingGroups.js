// ============================================================
// STANDINGGROUPS – Regeln für stehende Gruppen
//   - Name: der erste freie aus GROUP_NAMES ("Gruppe A", "Gruppe B" …)
//   - Wer fehlt heute? Mitglieder, die verletzt sind (ihr Platz bleibt leer)
//   - Ersatz: ein freier Held derselben Position, der höchste Level zuerst (nur für heute)
//   - Vorräte: so viele der gewohnten Vorräte, wie die Vorratskammer hergibt
// Das Einplanen selbst macht Game (planStandingGroups, jeden Morgen).
// ============================================================

import { t } from '../core/Language.js';
import { GROUP_NAMES, getPositionId } from '../data/groupRules.js';

// Erster freier Gruppenname
export function getFreeGroupName(guild) {
  const used = guild.standingGroups.map((group) => group.name);
  const free = GROUP_NAMES.find((name) => !used.includes(name));
  return free || t('logic.groupNumber', { number: guild.standingGroups.length + 1 });
}

// Mitglieder, die heute ausfallen, weil sie verletzt sind: [{ hero, positionId }]
export function getMissingMembers(guild, group) {
  const missing = [];
  for (const heroId of group.heroIds) {
    const hero = guild.findHero(heroId);
    if (hero && hero.isInjured()) {
      missing.push({ hero, positionId: getPositionId(hero.getClass()) });
    }
  }
  return missing;
}

// Ein freier Held derselben Position (nicht verletzt, heute nicht eingeplant), höchster Level zuerst. Sonst null.
export function findSubstitute(guild, positionId) {
  const candidates = guild.heroes.filter((hero) =>
    getPositionId(hero.getClass()) === positionId && !hero.isInjured() && !guild.isHeroBusy(hero.id));
  candidates.sort((a, b) => b.level - a.level);
  return candidates[0] || null;
}

// Die gewohnten Vorräte, soweit die Vorratskammer sie hergibt (z.B. nur 1 von 2 Heiltränken)
export function getAvailableSupplies(guild, supplies) {
  const available = [];
  const counted = {};
  for (const supplyId of supplies) {
    counted[supplyId] = (counted[supplyId] || 0) + 1;
    if (counted[supplyId] <= guild.countSupply(supplyId)) {
      available.push(supplyId);
    }
  }
  return available;
}
