// Tests für die Konter-Talente: Unterbrechen, Fluch lösen und große Schläge abfangen
// auch ohne Spezialisten (siehe "Konter verteilen" in KONZEPT.md).

import { describe, it, expect } from 'vitest';
import { createTestGroup } from '../src/systems/combat/TestGroup.js';
import { simulateBattle } from '../src/systems/combat/CombatSimulator.js';
import { COUNTERS } from '../src/data/counters.js';
import { TALENTS } from '../src/data/talents.js';

// Testgruppe (Level 10) mit den gewählten Klassen; die Klasse withTalent bekommt das Talent talentId
function fight(classIds, withTalent, talentId, bossId) {
  const heroes = createTestGroup(10, 'uncommon', classIds);
  for (const hero of heroes) {
    if (hero.classId === withTalent) {
      hero.talentIds = [talentId];
    }
  }
  // Mehrere Seeds, damit die Mechanik sicher mindestens einmal kommt
  const texts = [];
  for (let seed = 1; seed <= 3; seed++) {
    const result = simulateBattle({ heroes, bossId, seed, recordLog: true });
    for (const entry of result.log) {
      texts.push(entry.text);
    }
  }
  return texts;
}

function hasLine(texts, ...parts) {
  return texts.some((text) => parts.every((part) => text.includes(part)));
}

describe('Konter-Talente', () => {
  // Gruppen ohne Schurke und ohne Runenwirker: Nur das Talent kann kontern
  const noSpecialists = ['warrior', 'priest', 'mage', 'hunter', 'bard'];

  it('Magier mit „Bannendes Eis“ unterbricht Morvas Schattenwoge', () => {
    const texts = fight(noSpecialists, 'mage', 'magCounterIce', 'morva');
    expect(hasLine(texts, 'Eiskranz unterbricht')).toBe(true);
    // Ohne das Talent unterbricht niemand
    expect(hasLine(fight(noSpecialists, 'mage', 'magManaFlow', 'morva'), 'unterbricht')).toBe(false);
  });

  it('Jäger mit „Netzwurf“ unterbricht mit dem Fangnetz', () => {
    expect(hasLine(fight(noSpecialists, 'hunter', 'hunInterruptNet', 'morva'), 'Fangnetz unterbricht')).toBe(true);
  });

  it('Priester mit „Läuternder Funke“ und Schamane mit „Reinigender Pfahl“ lösen Flüche', () => {
    expect(hasLine(fight(noSpecialists, 'priest', 'priPurifyingSpark', 'grezza'), 'Funke der Gnade befreit')).toBe(true);
    const withShaman = ['warrior', 'priest', 'mage', 'hunter', 'shaman'];
    expect(hasLine(fight(withShaman, 'shaman', 'shaCleansingTotem', 'grezza'), 'Felsenpfahl befreit')).toBe(true);
  });

  it('Paladin schützt mit „Schutzherr“ den Tank, Druide fängt mit „Borkenhaut“ einen großen Schlag ab', () => {
    const paladinTexts = fight(['warrior', 'paladin', 'priest', 'mage', 'hunter'], 'paladin', 'palGuardianShield', 'grimfang');
    expect(hasLine(paladinTexts, 'Gottesschild auf Test-Krieger')).toBe(true);
    const druidTexts = fight(['warrior', 'druid', 'mage', 'hunter', 'bard'], 'druid', 'druBarkskin', 'grimfang');
    expect(hasLine(druidTexts, 'Moosmantel schützt Test-Krieger')).toBe(true);
  });
});

describe('Konter-Daten', () => {
  it('jedes Konter-Talent gehört zur genannten Klasse', () => {
    for (const counter of COUNTERS) {
      for (const entry of counter.talents) {
        const ids = TALENTS[entry.classId].flat().map((talent) => talent.id);
        expect(ids, counter.id + ': ' + entry.talentId).toContain(entry.talentId);
      }
    }
  });
});
