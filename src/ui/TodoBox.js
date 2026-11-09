// ============================================================
// TODOBOX – Kasten "Was gibt es heute zu tun?" ganz oben im Tagesplan
// Zeigt nur Dinge, die eine Entscheidung brauchen (siehe systems/DailyTodo.js).
// Jede Zeile ist ein Knopf, der direkt an die richtige Stelle springt.
// Ist nichts zu tun, steht dort "Alles erledigt", und man kann den Tag beenden.
// Neu freigeschaltete Teile des Spiels stehen ganz oben mit kurzer Erklärung (das Tutorial).
// ============================================================

import { t } from '../core/Language.js';
import { Sound } from './Sound.js';
import { getUnlock } from '../data/unlocks.js';
import { getDungeon } from '../data/dungeons.js';

// Text pro Eintrag, abhängig von der Anzahl
// (die Sätze stehen in data/texts unter "todo", z.B. t('todo.boxes', { count: 3 }))
function getTodoText(todo) {
  if (todo.id === 'newDungeon') {
    return t('todo.newDungeon', { name: getDungeon(todo.dungeonId).name });
  }
  return t('todo.' + todo.id, { count: todo.count });
}

// Wichtige Einträge (rot statt gold)
const WARNING_IDS = ['groupMissing', 'raidNotReady', 'upkeep', 'unhappy'];

// onGoTo(screenId) = zu einem Bildschirm springen
export function createTodoBox(game, onGoTo) {
  const todos = game.getDailyTodos();
  const box = document.createElement('section');
  box.className = 'panel todo-box';
  box.innerHTML = '<h2></h2><div class="todo-list"></div>';
  box.querySelector('h2').textContent = t('todo.title');
  const list = box.querySelector('.todo-list');

  if (todos.length === 0) {
    list.innerHTML = '<p class="todo-done"></p>';
    list.querySelector('.todo-done').textContent = t('todo.allDone');
    return box;
  }
  for (const todo of todos) {
    if (todo.id === 'unlock') {
      list.appendChild(createUnlockEntry(game, todo, onGoTo));
      continue;
    }
    const button = document.createElement('button');
    button.className = 'todo-entry' + (WARNING_IDS.includes(todo.id) ? ' warning' : '');
    button.textContent = getTodoText(todo) + ' ›';
    button.addEventListener('click', () => {
      Sound.click();
      onGoTo(todo.screenId, todo);
    });
    list.appendChild(button);
  }
  return box;
}

// Neu freigeschaltet (Tutorial): Name, kurze Erklärung und "Ansehen ›".
// Antippen springt hin, danach verschwindet der Hinweis.
function createUnlockEntry(game, todo, onGoTo) {
  const unlock = getUnlock(todo.unlockId);
  const entry = document.createElement('div');
  entry.className = 'todo-unlock';
  entry.innerHTML = '<b class="todo-unlock-name"></b><span class="todo-unlock-text"></span><button class="todo-unlock-button"></button>';
  entry.querySelector('.todo-unlock-button').textContent = t('todo.look');
  entry.querySelector('.todo-unlock-name').textContent = t('todo.unlockNew', { name: unlock.name });
  entry.querySelector('.todo-unlock-text').textContent = unlock.text;
  entry.querySelector('.todo-unlock-button').addEventListener('click', () => {
    Sound.click();
    game.acknowledgeUnlock(unlock.id);
    if (unlock.screenId) {
      onGoTo(unlock.screenId);
    }
  });
  return entry;
}

// Kurzer Text für einen Eintrag (auch für die "Weiter"-Leiste, siehe NextTodoBar.js)
export function describeTodo(todo) {
  if (todo.id === 'unlock') {
    return t('todo.unlockNew', { name: getUnlock(todo.unlockId).name });
  }
  return getTodoText(todo);
}
