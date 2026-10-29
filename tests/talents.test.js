// Tests für Talente (M2).

import { describe, it, expect } from 'vitest';
import { TALENTS, TALENT_RULES, getTalentRows, findTalent } from '../src/data/talents.js';
import { HERO_CLASSES, getHeroClass } from '../src/data/heroClasses.js';
import { Hero } from '../src/entities/Hero.js';
import { Game } from '../src/core/Game.js';
import { createTestGroup } from '../src/systems/combat/TestGroup.js';
import { estimateChances } from '../src/systems/combat/ChanceEstimator.js';
import { simulateRun, createHeroCombatant } from '../src/systems/combat/CombatSimulator.js';
import { applyGroupAuras } from '../src/systems/combat/OrderSettings.js';
import { Combatant } from '../src/systems/combat/Combatant.js';

const LOOKS = { skin: '#f1c39b', hair: '#6b3f17' };
const KNOWN_EFFECTS = ['damageDone', 'damageTaken', 'healingDone', 'manaCost', 'threat', 'dodge', 'targetPriority',
  'abilityPower', 'abilityWhen', 'abilityTarget', 'statBonus', 'abilityDuration', 'cheatDeath', 'groupAura'];

function heroOf(classId, level, rarityId = 'uncommon') {
  const hero = new Hero(1, 'T', classId, rarityId, [], LOOKS);
  hero.level = level;
  return hero;
}

describe('Talent-Daten', () => {
  it('jede Klasse: 3 Reihen mit je 2 Talenten, alle ids einmalig, 90 insgesamt', () => {
    const ids = new Set();
    for (const heroClass of HERO_CLASSES) {
      const rows = getTalentRows(heroClass.id);
      expect(rows.length, heroClass.name).toBe(TALENT_RULES.rowLevels.length);
      for (const row of rows) {
        expect(row.length).toBe(2);
        for (const talent of row) {
          expect(ids.has(talent.id), talent.id).toBe(false);
          ids.add(talent.id);
        }
      }
    }
    expect(ids.size).toBe(90);
  });

  for (const classId in TALENTS) {
    it(`${classId}: Talente sind beschrieben, nutzen bekannte Wirkungen und nur eigene Skills`, () => {
      const heroClass = getHeroClass(classId);
      for (const row of TALENTS[classId]) {
        for (const talent of row) {
          expect(talent.name).toBeTruthy();
          expect(talent.description).toBeTruthy();
          expect(Object.keys(talent.effects).length).toBeGreaterThan(0);
          for (const key in talent.effects) {
            expect(KNOWN_EFFECTS, talent.id + ': ' + key).toContain(key);
          }
          for (const field of ['abilityPower', 'abilityWhen', 'abilityTarget', 'abilityDuration']) {
            for (const abilityId in talent.effects[field] || {}) {
              expect(heroClass.abilities, talent.id).toContain(abilityId);
            }
          }
        }
      }
    });
  }

  it('alle Talente laufen im Kampf ohne Absturz', () => {
    for (const heroClass of HERO_CLASSES) {
      const group = createTestGroup(25, 'uncommon', ['warrior', 'priest', heroClass.id, 'mage', 'rogue']);
      for (const row of getTalentRows(heroClass.id)) {
        for (const talent of row) {
          group[2].talentIds = [talent.id];
          for (const bossId of ['grimfang', 'morva', 'skarrix']) {
            expect(() => estimateChances({ heroes: group, bossId, count: 2 }), talent.id).not.toThrow();
          }
        }
      }
    }
  });
});

describe('Talente wählen', () => {
  it('Reihen öffnen sich erst auf ihrem Level, 1 Talent pro Reihe', () => {
    const hero = heroOf('warrior', 4);
    expect(hero.getFreeTalentPicks()).toBe(0);
    expect(hero.chooseTalent('warShieldMaster')).toBe(false);
    hero.level = 5;
    expect(hero.getFreeTalentPicks()).toBe(1);
    expect(hero.chooseTalent('warShieldMaster')).toBe(true);
    expect(hero.chooseTalent('warBladeMaster')).toBe(false); // Reihe ist voll
    expect(hero.chooseTalent('warUnbending')).toBe(false);   // Reihe 2 erst ab 15
    expect(hero.chooseTalent('priDevout')).toBe(false);      // fremde Klasse
    hero.level = 30;
    expect(hero.getFreeTalentPicks()).toBe(2);
  });

  it('Doppelwahl: episch in Reihe 1, legendär in Reihe 1 und 2', () => {
    const epic = heroOf('warrior', 30, 'epic');
    expect(epic.getFreeTalentPicks()).toBe(4);
    expect(epic.chooseTalent('warShieldMaster')).toBe(true);
    expect(epic.chooseTalent('warBladeMaster')).toBe(true);
    expect(epic.chooseTalent('warUnbending')).toBe(true);
    expect(epic.chooseTalent('warChallenger')).toBe(false);

    const legendary = heroOf('warrior', 30, 'legendary');
    expect(legendary.getFreeTalentPicks()).toBe(5);
    expect(TALENT_RULES.doubleRowsByRarity.legendary).toBe(2);
  });

  it('Umskillen kostet Gold pro Level und setzt alles zurück; wird gespeichert', () => {
    const game = new Game(3);
    game.guild.gold = 1000;
    const candidate = game.guild.candidates[0];
    game.hireHero(candidate.id);
    const hero = game.guild.heroes[0];
    hero.level = 15;
    const rows = getTalentRows(hero.classId);
    expect(game.chooseHeroTalent(hero.id, rows[0][0].id)).toBe(true);
    expect(game.chooseHeroTalent(hero.id, rows[1][1].id)).toBe(true);

    const loaded = Game.fromSaveData(JSON.parse(JSON.stringify(game.toSaveData())));
    expect(loaded.guild.heroes[0].talentIds).toEqual(hero.talentIds);

    const goldBefore = game.guild.gold;
    expect(game.respecHero(hero.id)).toBe('ok');
    expect(game.guild.gold).toBe(goldBefore - TALENT_RULES.respecCostPerLevel * 15);
    expect(hero.talentIds).toEqual([]);
    expect(game.respecHero(hero.id)).toBe('nothingToReset');
    game.chooseHeroTalent(hero.id, rows[0][0].id);
    game.guild.gold = 0;
    expect(game.respecHero(hero.id)).toBe('noGold');
  });
});

describe('Talente im Kampf', () => {
  it('Werte-Bonus: +20 % Leben', () => {
    const hero = heroOf('warrior', 15);
    const without = createHeroCombatant(hero).maxHp;
    hero.talentIds = ['warUnbending'];
    expect(createHeroCombatant(hero).maxHp).toBe(Math.round(without * 1.2));
  });

  it('Letztes Gefecht: einmal pro Kampf mit 1 Leben gerettet, danach nicht mehr', () => {
    const hero = heroOf('warrior', 25);
    hero.talentIds = ['warLastStand'];
    const combatant = createHeroCombatant(hero);
    const first = combatant.takeDamage(999999, true);
    expect(first.savedByTalent).toBe(true);
    expect(combatant.hp).toBe(1);
    expect(combatant.alive).toBe(true);
    const second = combatant.takeDamage(999999, true);
    expect(second.savedByTalent).toBe(false);
    expect(combatant.alive).toBe(false);
  });

  it('Gruppen-Aura wirkt auf alle, dieselbe Aura zählt nur einmal', () => {
    const a = heroOf('warrior', 25);
    const b = heroOf('warrior', 25);
    a.talentIds = ['warWarlord'];
    b.talentIds = ['warWarlord'];
    const mage = heroOf('mage', 25);
    const combatants = [a, b, mage].map((hero) => createHeroCombatant(hero));
    applyGroupAuras(combatants);
    expect(combatants[2].orderSettings.damageDone).toBeCloseTo(0.05);
    expect(combatants[0].orderSettings.damageDone).toBeCloseTo(0.05);
  });

  it('längere Skills: Eiserne Wacht mit Schildmeister hält länger', () => {
    const hero = heroOf('warrior', 5);
    hero.talentIds = ['warShieldMaster'];
    expect(createHeroCombatant(hero).getAbilityDurationBonus('ironWatch')).toBe(1);
    expect(new Combatant({ id: 'x', name: 'x', side: 'enemy', stats: { health: 10 } }).getAbilityDurationBonus('ironWatch')).toBe(0);
  });

  it('ein Run mit Talenten läuft durch (Log mit "Letzte Kraft" möglich)', () => {
    const group = createTestGroup(25);
    group[0].talentIds = ['warLastStand', 'warWarlord'];
    const result = simulateRun({ heroes: group, dungeonId: 'broodNests', seed: 4, recordLog: true });
    expect(['success', 'defeat', 'retreat', 'timeout']).toContain(result.outcome);
    expect(findTalent('warLastStand').effects.cheatDeath).toBe(true);
  });
});
