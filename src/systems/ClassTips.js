// ============================================================
// CLASSTIPS – "Helfen würde: …": welche Klassen gegen die größte Ursache einer Niederlage helfen
// Für Mechaniken mit Konter kommen die Klassen aus data/counters.js (fest und per Talent),
// sonst aus CLASS_TIPS in data/defeatCauses.js. "Flächenschaden" ermittelt die Datei selbst aus den Skills.
// Rechnet nur, ändert nichts.
// ============================================================

import { t } from '../core/Language.js';
import { CLASS_TIPS } from '../data/defeatCauses.js';
import { COUNTERS, getCounterIds } from '../data/counters.js';
import { HERO_CLASSES, getHeroClass } from '../data/heroClasses.js';
import { ABILITIES } from '../data/abilities.js';

// Klassen mit Flächenschaden (ein Schadens-Skill, der alle oder bis zu 3 Gegner trifft)
export function getAreaDamageClassIds() {
  return HERO_CLASSES.filter((heroClass) => heroClass.abilities.some((abilityId) => {
    const ability = ABILITIES[abilityId];
    return ability.type === 'damage' && (ability.target === 'allEnemies' || ability.target === 'threeEnemies');
  })).map((heroClass) => heroClass.id);
}

function classNames(classIds) {
  return classIds.map((classId) => getHeroClass(classId).name).join(', ');
}

// Tipp für eine Ursache (aus DefeatAnalysis: { type, mechanicType, interruptible }), z.B.
// "Unterbrechen: Schurke (per Talent auch Jäger, Magier)" oder "Flächenschaden gegen die Diener: Magier, Barbar".
// Gibt null zurück, wenn es keinen passenden Tipp gibt.
export function getClassTip(cause) {
  if (cause.type === 'mechanic' && cause.mechanicType) {
    const counterIds = getCounterIds({ type: cause.mechanicType, interruptible: cause.interruptible });
    if (counterIds.length > 0) {
      return counterIds.map((counterId) => {
        const counter = COUNTERS.find((entry) => entry.id === counterId);
        const talentText = counter.talents.length > 0
          ? t('logic.alsoByTalent', { names: classNames(counter.talents.map((entry) => entry.classId)) })
          : '';
        return counter.name + ': ' + classNames(counter.classIds) + talentText;
      }).join(' · ');
    }
  }
  const key = cause.type === 'mechanic' ? cause.mechanicType : cause.type;
  const tip = CLASS_TIPS[key];
  if (!tip) {
    return null;
  }
  const classIds = tip.classIds === 'aoe' ? getAreaDamageClassIds() : tip.classIds;
  return tip.text + ': ' + classNames(classIds);
}
