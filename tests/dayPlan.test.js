// Tests für den Tagesplan und die Abklingzeit-Anzeige der Kampfszene

import { describe, it, expect } from 'vitest';
import { Game } from '../src/core/Game.js';
import { createTestGroup } from '../src/systems/combat/TestGroup.js';
import { getDayPlan, getHeroTask } from '../src/systems/DayPlan.js';
import { HERO_TASKS } from '../src/data/heroTasks.js';
import { getSkillStatus } from '../src/ui/SkillTooltip.js';
import { simulateBattle } from '../src/systems/combat/CombatSimulator.js';
import { DUNGEONS } from '../src/data/dungeons.js';

function gameWithHeroes(count) {
  const game = new Game(5);
  const group = createTestGroup(3).slice(0, count);
  group.forEach((hero, index) => { hero.id = 200 + index; });
  game.guild.heroes.push(...group);
  return { game, heroes: group };
}

describe('Tagesplan', () => {
  it('jeder Held hat genau eine Aufgabe: Dungeon, verletzt oder Ruhe', () => {
    const { game, heroes } = gameWithHeroes(5);
    heroes[4].injuryDays = 1;
    expect(game.startExpedition('bearCave', [heroes[0].id, heroes[1].id], 'never')).toBe('ok');

    const plan = getDayPlan(game.guild);
    expect(plan.entries.length).toBe(5);
    expect(plan.counts).toMatchObject({ dungeon: 2, injured: 1, rest: 2, training: 0 });
    expect(getHeroTask(game.guild, heroes[0]).expedition.dungeonId).toBe('bearCave');
    expect(getHeroTask(game.guild, heroes[2]).taskId).toBe('rest');
    for (const entry of plan.entries) {
      expect(HERO_TASKS[entry.taskId]).toBeDefined();
    }
  });

  it('nach dem Tagesende sind alle wieder frei', () => {
    const { game, heroes } = gameWithHeroes(5);
    game.startExpedition('bearCave', heroes.map((hero) => hero.id), 'never');
    game.endDay();
    expect(getDayPlan(game.guild).counts.dungeon).toBe(0);
  });
});

describe('Skill-Fenster: Abklingzeiten', () => {
  const ability = { cooldown: 2, manaCost: 10 };

  it('zählt wie der Kampf: benutzt in Runde 5, Abklingzeit 2 → ab Runde 8 bereit', () => {
    expect(getSkillStatus(ability, 5, 5, 50).text).toBe('noch 2 Runden');
    expect(getSkillStatus(ability, 5, 6, 50).text).toBe('noch 2 Runden');
    expect(getSkillStatus(ability, 5, 7, 50).text).toBe('noch 1 Runde');
    expect(getSkillStatus(ability, 5, 8, 50).ready).toBe(true);
  });

  it('nie benutzt = bereit, außer das Mana reicht nicht', () => {
    expect(getSkillStatus(ability, undefined, 3, 50).ready).toBe(true);
    expect(getSkillStatus(ability, undefined, 3, 5).text).toBe('zu wenig Mana');
    expect(getSkillStatus(ability, undefined, 3, null).ready).toBe(true);
  });

  it('der Kampfbericht merkt sich, welcher Skill benutzt wurde', () => {
    const boss = DUNGEONS[0].encounters.find((e) => e.type === 'boss').bossId;
    const result = simulateBattle({ heroes: createTestGroup(3), bossId: boss, seed: 1, recordLog: true });
    const skillActions = result.log.filter((entry) => entry.kind === 'action' && entry.action.abilityId);
    expect(skillActions.length).toBeGreaterThan(0);
  });
});
