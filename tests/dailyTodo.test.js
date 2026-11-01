// Tests für "Was gibt es heute zu tun?" (UI-Neubau Schritt 3).

import { describe, it, expect } from 'vitest';
import { Game } from '../src/core/Game.js';
import { Item } from '../src/entities/Item.js';

const START_TEAM = ['paladin', 'rogue', 'mage', 'bard', 'druid'];

function foundedGame() {
  const game = new Game(8);
  game.foundGuild('', START_TEAM);
  game.guild.inventory = [];
  game.guild.boxes = [];
  game.guild.candidates = [];
  return game;
}

describe('Was gibt es heute zu tun?', () => {
  it('neue Gilde: eine Gruppe könnte los', () => {
    const game = foundedGame();
    expect(game.getDailyTodos()).toEqual([{ id: 'groups', count: 1, screenId: 'dungeons' }]);
  });

  it('Kisten, neue Ausrüstung und fehlender Unterhalt erscheinen mit dem richtigen Ziel', () => {
    const game = foundedGame();
    game.guild.addBox('wood');
    game.guild.addItem(new Item(game.guild.createItemId(), 'attackRing', 'rare', 'Ring', { attack: 5 }));
    game.guild.hall.upkeepPaid = false;
    game.unlockEverything(); // Unterhalt gibt es erst mit freigeschalteter Gildenhalle
    const todos = game.getDailyTodos();
    expect(todos.find((todo) => todo.id === 'boxes')).toEqual({ id: 'boxes', count: 1, screenId: 'treasury' });
    expect(todos.find((todo) => todo.id === 'newGear').screenId).toBe('heroes');
    expect(todos.find((todo) => todo.id === 'upkeep').screenId).toBe('hall');
  });

  it('eingeplante Gruppe: keine Meldung mehr, dass eine Gruppe los könnte', () => {
    const game = foundedGame();
    game.startExpedition('bearCave', game.guild.heroes.map((hero) => hero.id), 'never');
    expect(game.getDailyTodos().some((todo) => todo.id === 'groups')).toBe(false);
  });
});
