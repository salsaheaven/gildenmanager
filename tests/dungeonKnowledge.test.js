// Tests für Dungeonwissen durch Erkunden (UI-Neubau Schritt 4).

import { describe, it, expect } from 'vitest';
import { Game } from '../src/core/Game.js';
import { getDungeon } from '../src/data/dungeons.js';
import { analyzeRun } from '../src/systems/combat/DefeatAnalysis.js';
import { UNKNOWN_CAUSE } from '../src/data/defeatCauses.js';

const START_TEAM = ['paladin', 'rogue', 'mage', 'bard', 'druid'];

function foundedGame() {
  const game = new Game(21);
  game.foundGuild('', START_TEAM);
  return game;
}


describe('Dungeonwissen', () => {
  it('am Anfang unbekannt, Erkunden deckt Boss für Boss auf', () => {
    const game = foundedGame();
    const dungeon = getDungeon('sunTemple'); // 2 Bosse: "Stück für Stück"
    expect(game.getDungeonKnowledge(dungeon.id)).toEqual({ known: 0, total: 2, level: 'none' });
    expect(game.getKnownDamageTypes(dungeon.id)).toEqual([]);

    game.guild.dungeonKnowledge[dungeon.id] = 1;
    expect(game.getDungeonKnowledge(dungeon.id).level).toBe('partial');
    const firstBoss = dungeon.encounters.findIndex((encounter) => encounter.type === 'boss');
    const lastBoss = dungeon.encounters.length - 1;
    expect(game.isEncounterKnown(dungeon.id, 0)).toBe(true);
    expect(game.isEncounterKnown(dungeon.id, firstBoss)).toBe(true);
    expect(game.isEncounterKnown(dungeon.id, lastBoss)).toBe(false);

    game.guild.dungeonKnowledge[dungeon.id] = 2;
    expect(game.getDungeonKnowledge(dungeon.id).level).toBe('full');
  });

  it('die Aufgabe Erkunden deckt auf und bereitet vor, der Vorteil hängt vom Wissen ab', () => {
    const game = foundedGame();
    const hero = game.guild.heroes[0];
    game.setHeroTask(hero.id, 'scouting', 'bearCave');
    expect(game.getScoutingLevel('bearCave')).toBe(null);
    game.endDay();
    expect(game.lastDaySummary.tasks.find((task) => task.heroId === hero.id).revealedBossId).toBe('grimfang');
    expect(game.getDungeonKnowledge('bearCave').level).toBe('full');
    expect(game.getScoutingLevel('bearCave')).toBe('full');
    // Nochmal erkunden: nichts Neues, aber wieder vorbereitet
    game.endDay();
    expect(game.lastDaySummary.tasks.find((task) => task.heroId === hero.id).revealedBossId).toBe(null);
    expect(game.isDungeonScouted('bearCave')).toBe(true);
  });

  it('„Woran es lag“ bleibt bei unerkundeten Mechaniken vage', () => {
    const fakeRun = {
      outcome: 'defeat',
      heroes: [],
      encounters: [{
        causes: {
          damageBySource: [
            { key: 'mechanic:Zermalmender Prankenhieb', name: 'Zermalmender Prankenhieb', type: 'mechanic', hint: 'Geheim', damage: 100 },
            { key: 'attack:grimfang', name: 'Angriffe von Grimmzahn', type: 'attack', damage: 50 },
          ],
          missedInterrupts: { 'Zermalmender Prankenhieb': 2 },
          outOfMana: [],
        },
      }],
    };
    const vague = analyzeRun(fakeRun, ['Zermalmender Prankenhieb']);
    expect(vague.causes[0].name).toBe(UNKNOWN_CAUSE.name);
    expect(vague.tip).toBe(UNKNOWN_CAUSE.tip);
    expect(vague.notes[0]).not.toContain('Prankenhieb');

    const known = analyzeRun(fakeRun, []);
    expect(known.causes[0].name).toBe('Zermalmender Prankenhieb');
    expect(known.tip).toBe('Geheim');
  });
});
