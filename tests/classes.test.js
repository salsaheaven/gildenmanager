// Tests für die Klassen und ihre besonderen Mechaniken:
// Jede Klasse kann gegen jeden Boss kämpfen, und Begleiter, Wiederbelebung, Ausweichen,
// Gruppen-Buffs, wachsende Flüche und Beschleunigung tun, was sie sollen.

import { describe, it, expect } from 'vitest';
import { simulateBattle, simulateRun } from '../src/systems/combat/CombatSimulator.js';
import { createTestGroup } from '../src/systems/combat/TestGroup.js';
import { Combatant } from '../src/systems/combat/Combatant.js';
import { HERO_CLASSES } from '../src/data/heroClasses.js';
import { BOSSES } from '../src/data/enemies.js';
import { DUNGEONS } from '../src/data/dungeons.js';

// Eine Gruppe aus Tank, Heiler und der zu prüfenden Klasse (dreimal)
function groupWith(classId, level = 5) {
  return createTestGroup(level, 'uncommon', ['warrior', 'priest', classId, classId, classId]);
}

// Alle Einträge des Kampfberichts, deren Text dieses Stück enthält
function logLines(result, textPart) {
  return result.log.filter((entry) => entry.text.includes(textPart));
}

describe('Jede Klasse kämpft ohne Fehler', () => {
  for (const heroClass of HERO_CLASSES) {
    it(`${heroClass.name}: gegen jeden Boss und durch jeden Dungeon`, () => {
      for (const boss of BOSSES) {
        const result = simulateBattle({ heroes: groupWith(heroClass.id), bossId: boss.id, seed: 7, recordLog: true });
        expect(result.rounds).toBeGreaterThan(0);
      }
      for (const dungeon of DUNGEONS) {
        const run = simulateRun({ heroes: groupWith(heroClass.id), dungeonId: dungeon.id, seed: 7, recordLog: true });
        expect(run.encounters.length).toBeGreaterThan(0);
      }
    });
  }

  it('jede Klasse benutzt im Kampf mindestens einen ihrer Skills', () => {
    for (const heroClass of HERO_CLASSES) {
      const run = simulateRun({ heroes: groupWith(heroClass.id), dungeonId: 'broodNests', seed: 3, recordLog: true });
      const used = new Set();
      for (const encounter of run.encounters) {
        for (const entry of encounter.log) {
          if (entry.action && entry.action.abilityId) {
            used.add(entry.action.abilityId);
          }
        }
      }
      const ownSkills = heroClass.abilities.filter((abilityId) => used.has(abilityId));
      expect(ownSkills.length, heroClass.name).toBeGreaterThan(0);
    }
  });
});

describe('Besondere Mechaniken', () => {
  it('der Wolf des Jägers kämpft mit und bindet Trash-Gegner', () => {
    const run = simulateRun({ heroes: groupWith('hunter'), dungeonId: 'ruinedChapel', seed: 2, recordLog: true });
    const trash = run.encounters[0];
    const pets = trash.startingCombatants.filter((info) => info.isPet);
    expect(pets.length).toBe(3);
    expect(logLines(trash, 'stellt sich').length).toBeGreaterThan(0);
    // Begleiter zählen nicht als Helden im Ergebnis
    expect(run.heroes.length).toBe(5);
  });

  it('der Druide belebt einen Gefallenen wieder', () => {
    let revived = false;
    for (let seed = 1; seed <= 30 && !revived; seed++) {
      const group = createTestGroup(1, 'uncommon', ['warrior', 'druid', 'mage', 'mage', 'mage']);
      const result = simulateBattle({ heroes: group, bossId: 'skarrix', enemyLevel: 5, seed: seed, recordLog: true });
      revived = logLines(result, 'steht wieder auf').length > 0;
    }
    expect(revived).toBe(true);
  });

  it('Ausweichen: ein Mönch weicht normalen Angriffen aus', () => {
    const result = simulateBattle({ heroes: groupWith('monk'), bossId: 'grimfang', seed: 4, recordLog: true });
    expect(logLines(result, 'weicht dem Angriff').length).toBeGreaterThan(0);
  });

  it('gleiche Buffs zählen nicht doppelt', () => {
    const hero = new Combatant({ id: 'h', name: 'H', side: 'hero', stats: { health: 100 } });
    hero.addEffect({ kind: 'damageDone', buffId: 'songOfBlades', value: 0.2, remaining: 3 });
    hero.addEffect({ kind: 'damageDone', buffId: 'songOfBlades', value: 0.2, remaining: 3 });
    expect(hero.getDamageDoneFactor()).toBeCloseTo(1.2, 5);
    // Ein anderer Buff (Kampfrausch) zählt zusätzlich
    hero.addEffect({ kind: 'damageDone', buffId: 'bloodlust', value: 0.3, remaining: 4 });
    expect(hero.getDamageDoneFactor()).toBeCloseTo(1.2 * 1.3, 5);
  });

  it('Gottesschild: unverwundbar heißt kein Schaden', () => {
    const hero = new Combatant({ id: 'h', name: 'H', side: 'hero', stats: { health: 100 } });
    hero.addEffect({ kind: 'immune', buffId: 'divineShield', value: 1, remaining: 1 });
    expect(hero.takeDamage(5000).damage).toBe(0);
    expect(hero.alive).toBe(true);
  });

  it('Wundenzorn: der Barbar macht mit wenig Leben mehr Schaden', () => {
    const barbarian = new Combatant({ id: 'b', name: 'B', side: 'hero', stats: { health: 100 },
      passive: { rageFromMissingHealth: 1.0 } });
    expect(barbarian.getDamageDoneFactor()).toBeCloseTo(1, 5);
    barbarian.hp = 25;
    expect(barbarian.getDamageDoneFactor()).toBeCloseTo(1.75, 5);
  });

  it('die Flüche des Hexenmeisters wachsen mit der Zeit', () => {
    const result = simulateBattle({ heroes: groupWith('warlock'), bossId: 'trainingDummy', seed: 5, recordLog: true });
    const ticks = logLines(result, 'Verderbnis verletzt').map((entry) => entry.hits[0].amount);
    expect(ticks.length).toBeGreaterThan(5);
    expect(ticks[5]).toBeGreaterThan(ticks[0]);
  });

  it('Beschleunigung: ein Held handelt in einer Runde zweimal', () => {
    const group = createTestGroup(5, 'uncommon', ['warrior', 'priest', 'chronomancer', 'mage', 'rogue']);
    const result = simulateBattle({ heroes: group, bossId: 'trainingDummy', seed: 1, recordLog: true });
    // Pro Runde und Handelndem zählen, wie viele Aktionen es gab
    const actionsPerRound = {};
    for (const entry of result.log) {
      if (entry.action) {
        const key = entry.round + '-' + entry.action.sourceId;
        actionsPerRound[key] = (actionsPerRound[key] || 0) + 1;
      }
    }
    expect(Object.values(actionsPerRound).some((count) => count >= 2)).toBe(true);
  });
});
