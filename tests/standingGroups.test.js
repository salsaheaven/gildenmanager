// Tests für stehende Gruppen (UI-Neubau Schritt 5).

import { describe, it, expect } from 'vitest';
import { Game } from '../src/core/Game.js';

const START_TEAM = ['paladin', 'rogue', 'mage', 'bard', 'druid'];

// Gründet eine Gilde und heuert weitere Helden an, bis es count sind
function gameWithHeroes(count) {
  const game = new Game(31);
  game.foundGuild('', START_TEAM);
  game.guild.gold = 100000;
  while (game.guild.heroes.length < count) {
    if (game.guild.candidates.length === 0) {
      game.refreshCandidates();
    }
    game.hireHero(game.guild.candidates[0].id);
  }
  return game;
}

function startTeamIds(game) {
  return game.guild.heroes.slice(0, 5).map((hero) => hero.id);
}

describe('Stehende Gruppen', () => {
  it('werden heute eingeplant und ziehen jeden Tag wieder los', () => {
    const game = gameWithHeroes(5);
    expect(game.createStandingGroup('bearCave', startTeamIds(game), 'never')).toBe('ok');
    const group = game.guild.standingGroups[0];
    expect(group.name).toBe('Gruppe A');
    expect(game.getTodaysExpedition(group.id)).not.toBeNull();

    // Heute aussetzen (niemand wird verletzt), am nächsten Morgen zieht die Gruppe von selbst los
    game.skipStandingGroupToday(group.id);
    game.endDay();
    const expedition = game.getTodaysExpedition(group.id);
    expect(expedition).not.toBeNull();
    expect(expedition.getHeroIds()).toEqual(group.heroIds);
  });

  it('Heute aussetzen und Auflösen', () => {
    const game = gameWithHeroes(5);
    game.createStandingGroup('bearCave', startTeamIds(game), 'never');
    const groupId = game.guild.standingGroups[0].id;
    expect(game.skipStandingGroupToday(groupId)).toBe(true);
    expect(game.getTodaysExpedition(groupId)).toBeNull();
    expect(game.guild.standingGroups).toHaveLength(1);

    game.endDay();
    expect(game.getTodaysExpedition(groupId)).not.toBeNull();
    game.disbandStandingGroup(groupId);
    expect(game.guild.standingGroups).toHaveLength(0);
    expect(game.guild.expeditions).toHaveLength(0);
  });

  it('verletzte Mitglieder fehlen, Ersatz derselben Position springt nur heute ein', () => {
    const game = gameWithHeroes(12);
    const tank = game.guild.heroes.find((hero) => hero.getClass().role === 'tank');
    const others = game.guild.heroes.filter((hero) => hero.getClass().role !== 'tank').slice(0, 4);
    const ids = [tank.id].concat(others.map((hero) => hero.id));
    game.createStandingGroup('bearCave', ids, 'never');
    const groupId = game.guild.standingGroups[0].id;
    game.skipStandingGroupToday(groupId);
    tank.injuryDays = 2;
    game.endDay();

    expect(game.getMissingMembers(groupId).map((entry) => entry.hero.id)).toEqual([tank.id]);
    expect(game.getDailyTodos().some((todo) => todo.id === 'groupMissing')).toBe(true);
    const otherTank = game.guild.heroes.find((hero) => hero.getClass().role === 'tank' && hero.id !== tank.id && !hero.isInjured());
    const substitute = game.addSubstitute(groupId);
    if (otherTank) {
      expect(substitute.getClass().role).toBe('tank');
      expect(game.getTodaysExpedition(groupId).getHeroIds()).toContain(substitute.id);
      expect(game.guild.standingGroups[0].heroIds).not.toContain(substitute.id);
      expect(game.getDailyTodos().some((todo) => todo.id === 'groupMissing')).toBe(false);
      // Kein zweiter Ersatz für dasselbe fehlende Mitglied
      expect(game.addSubstitute(groupId)).toBeNull();
    } else {
      expect(substitute).toBeNull();
    }
  });

  it('ein Held gehört nur zu einer Gruppe, wird mitgespeichert', () => {
    const game = gameWithHeroes(5);
    const ids = startTeamIds(game);
    game.createStandingGroup('bearCave', ids, 'never');
    game.skipStandingGroupToday(game.guild.standingGroups[0].id);
    game.createStandingGroup('bearCave', ids.slice(0, 2), 'never');
    // Die erste Gruppe hat die beiden abgegeben
    expect(game.guild.standingGroups).toHaveLength(2);
    expect(game.guild.standingGroups[0].heroIds).toHaveLength(3);
    expect(game.guild.standingGroups[1].name).toBe('Gruppe B');
    const loaded = Game.fromSaveData(JSON.parse(JSON.stringify(game.toSaveData())));
    expect(loaded.guild.standingGroups.map((group) => group.name)).toEqual(['Gruppe A', 'Gruppe B']);
  });

  it('Verlegen: Gruppe zieht ab heute in einen neuen Dungeon, "Neuer Dungeon offen" verschwindet', () => {
    const game = gameWithHeroes(5);
    game.createStandingGroup('bearCave', startTeamIds(game), 'never');
    const group = game.guild.standingGroups[0];
    // Gesperrt: geht nicht
    expect(game.moveStandingGroup(group.id, 'ruinedChapel')).toBe('locked');
    game.guild.dungeonClears.bearCave = 1;
    const newDungeon = () => game.getDailyTodos().find((todo) => todo.id === 'newDungeon');
    expect(newDungeon().dungeonId).toBe('ruinedChapel');

    expect(game.moveStandingGroup(group.id, 'ruinedChapel')).toBe('ok');
    expect(group.dungeonId).toBe('ruinedChapel');
    expect(game.getTodaysExpedition(group.id).dungeonId).toBe('ruinedChapel');
    expect(newDungeon()).toBeUndefined();
  });
});
