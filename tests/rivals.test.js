// Tests für KI-Gilden, Neuigkeiten-Ticker, Server-First und Rangliste (P5).

import { describe, it, expect } from 'vitest';
import { Game } from '../src/core/Game.js';
import { RIVAL_GUILDS, RIVAL_RULES } from '../src/data/rivalGuilds.js';
import { DUNGEONS } from '../src/data/dungeons.js';
import { getServerFirstTitle } from '../src/systems/RivalSystem.js';

// Lässt ein Spiel ohne eigene Helden days Tage laufen
function runDays(game, days) {
  for (let day = 0; day < days; day++) {
    game.endDay();
  }
}

describe('KI-Gilden-Daten', () => {
  it('4 Gilden mit gültigen Chancen und einmaligen ids', () => {
    expect(RIVAL_GUILDS).toHaveLength(4);
    expect(new Set(RIVAL_GUILDS.map((rival) => rival.id)).size).toBe(4);
    for (const rival of RIVAL_GUILDS) {
      expect(rival.attemptChance).toBeGreaterThan(0);
      expect(rival.attemptChance).toBeLessThanOrEqual(1);
      expect(rival.successChance).toBeGreaterThan(0);
      expect(rival.successChance).toBeLessThanOrEqual(1);
    }
  });
});

describe('KI-Gilden kommen voran', () => {
  it('nach einiger Zeit haben die Rivalen Dungeons geschafft, der Reihe nach', () => {
    const game = new Game(21);
    runDays(game, 40);
    const total = game.guild.rivals.reduce((sum, rival) => sum + Object.keys(rival.clears).length, 0);
    expect(total).toBeGreaterThan(0);
    for (const rival of game.guild.rivals) {
      // Keine Lücken: wer Dungeon 3 hat, hat auch 1 und 2, und zwar nicht später
      let lastDay = 0;
      let gap = false;
      for (const dungeon of DUNGEONS) {
        const day = rival.clears[dungeon.id];
        if (day === undefined) {
          gap = true;
          continue;
        }
        expect(gap).toBe(false);
        expect(day).toBeGreaterThanOrEqual(lastDay);
        lastDay = day;
      }
    }
  });

  it('der Ticker hat Meldungen, höchstens keptNews, neueste zuerst; Server-Firsts sind vergeben', () => {
    const game = new Game(22);
    runDays(game, 80);
    expect(game.guild.news.length).toBeGreaterThan(0);
    expect(game.guild.news.length).toBeLessThanOrEqual(RIVAL_RULES.keptNews);
    for (let i = 1; i < game.guild.news.length; i++) {
      expect(game.guild.news[i - 1].day).toBeGreaterThanOrEqual(game.guild.news[i].day);
    }
    expect(game.guild.serverFirsts.bearCave).toBeDefined();
    expect(game.guild.serverFirsts.bearCave.isPlayer).toBe(false);
  });

  it('gleicher Seed = gleiche Geschichte, und alles wird gespeichert', () => {
    const a = new Game(23);
    const b = new Game(23);
    runDays(a, 15);
    runDays(b, 15);
    expect(a.guild.news).toEqual(b.guild.news);
    const loaded = Game.fromSaveData(JSON.parse(JSON.stringify(a.toSaveData())));
    expect(loaded.guild.rivals.map((rival) => rival.clears)).toEqual(a.guild.rivals.map((rival) => rival.clears));
    expect(loaded.guild.serverFirsts).toEqual(a.guild.serverFirsts);
  });
});

describe('Server-First für deine Gilde', () => {
  it('erster Sieg vor allen anderen: Server-First, Titel, Meldung; der zweite Sieg ist kein Server-First mehr', () => {
    const game = new Game(24);
    game.guild.gold = 100000;
    const ids = [];
    for (const candidate of game.guild.candidates.slice(0, 4)) {
      game.hireHero(candidate.id);
      ids.push(candidate.id);
    }
    for (const hero of game.guild.heroes) {
      hero.level = 12;
    }
    game.startExpedition('bearCave', ids, 'never');
    const report = game.endDay()[0];
    expect(report.outcome).toBe('success');
    expect(report.serverFirst).toBe(true);
    expect(game.guild.serverFirsts.bearCave.isPlayer).toBe(true);
    const title = getServerFirstTitle('bearCave');
    expect(game.getAvailableTitles()).toContain(title);
    expect(game.selectGuildTitle(title)).toBe(true);
    expect(game.lastDaySummary.news.some((news) => news.isPlayer && news.kind === 'serverFirst')).toBe(true);
    expect(game.guild.firstClearDays.bearCave).toBe(1);

    // Die Rangliste führt jetzt deine Gilde an
    expect(game.getLeaderboard()[0].isPlayer).toBe(true);

    for (const hero of game.guild.heroes) {
      hero.injuryDays = 0;
    }
    game.startExpedition('bearCave', ids, 'never');
    const second = game.endDay()[0];
    expect(second.firstClear).toBe(false);
    expect(second.serverFirst).toBe(false);
  });

  it('hat eine KI-Gilde den Dungeon schon geschafft, gibt es nur eine normale Meldung, keinen Titel', () => {
    const game = new Game(25);
    game.guild.serverFirsts.bearCave = { name: 'Aschenkrone', day: 1, isPlayer: false };
    game.guild.gold = 100000;
    const ids = [];
    for (const candidate of game.guild.candidates.slice(0, 4)) {
      game.hireHero(candidate.id);
      ids.push(candidate.id);
    }
    for (const hero of game.guild.heroes) {
      hero.level = 12;
    }
    game.startExpedition('bearCave', ids, 'never');
    const report = game.endDay()[0];
    expect(report.firstClear).toBe(true);
    expect(report.serverFirst).toBe(false);
    expect(game.guild.earnedTitles).toEqual([]);
  });
});

describe('Rangliste', () => {
  it('alle 5 Gilden, sortiert nach Anzahl Dungeons, dann nach Tag', () => {
    const game = new Game(26);
    runDays(game, 30);
    const board = game.getLeaderboard();
    expect(board).toHaveLength(RIVAL_GUILDS.length + 1);
    expect(board.filter((entry) => entry.isPlayer)).toHaveLength(1);
    for (let i = 1; i < board.length; i++) {
      const before = board[i - 1];
      const after = board[i];
      expect(before.best > after.best || (before.best === after.best && before.bestDay <= after.bestDay)).toBe(true);
    }
  });
});
