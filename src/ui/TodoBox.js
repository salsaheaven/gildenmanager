// ============================================================
// TODOBOX – Kasten "Was gibt es heute zu tun?" ganz oben im Tagesplan
// Zeigt nur Dinge, die eine Entscheidung brauchen (siehe systems/DailyTodo.js).
// Jede Zeile ist ein Knopf, der direkt an die richtige Stelle springt.
// Ist nichts zu tun, steht dort "Alles erledigt", und man kann den Tag beenden.
// Neu freigeschaltete Teile des Spiels stehen ganz oben mit kurzer Erklärung (das Tutorial).
// ============================================================

import { Sound } from './Sound.js';
import { getUnlock } from '../data/unlocks.js';

// Text pro Eintrag, abhängig von der Anzahl
const TODO_TEXTS = {
  groupMissing: (count) => count === 1 ? 'Einer Gruppe fehlt heute jemand (Ersatz einsetzen?)' : count + ' Gruppen fehlt heute jemand (Ersatz einsetzen?)',
  raidNotReady: () => 'Heute ist Raid-Tag, aber die Raid-Aufstellung reicht noch nicht',
  boxes: (count) => count === 1 ? '1 Kiste wartet aufs Öffnen' : count + ' Kisten warten aufs Öffnen',
  newGear: (count) => count === 1 ? '1 Held hat neue Ausrüstung' : count + ' Helden haben neue Ausrüstung',
  talents: (count) => count === 1 ? '1 Held kann ein Talent wählen' : count + ' Helden können ein Talent wählen',
  building: () => 'Ein Gebäude ist fertig. Was baust du als Nächstes?',
  upkeep: () => 'Unterhalt nicht bezahlt: Heute wirkt kein Gebäude',
  unhappy: (count) => count === 1 ? '1 Held ist unzufrieden (kein Sold)' : count + ' Helden sind unzufrieden (kein Sold)',
  groups: (count) => count === 1 ? '1 vollständige Gruppe könnte noch los' : count + ' vollständige Gruppen könnten noch los',
  candidate: () => 'Ein seltener Bewerber wartet in der Taverne',
};

// Wichtige Einträge (rot statt gold)
const WARNING_IDS = ['groupMissing', 'raidNotReady', 'upkeep', 'unhappy'];

// onGoTo(screenId) = zu einem Bildschirm springen
export function createTodoBox(game, onGoTo) {
  const todos = game.getDailyTodos();
  const box = document.createElement('section');
  box.className = 'panel todo-box';
  box.innerHTML = '<h2>Was gibt es heute zu tun?</h2><div class="todo-list"></div>';
  const list = box.querySelector('.todo-list');

  if (todos.length === 0) {
    list.innerHTML = '<p class="todo-done">Alles erledigt. Zeit, den Tag zu beenden!</p>';
    return box;
  }
  for (const todo of todos) {
    if (todo.id === 'unlock') {
      list.appendChild(createUnlockEntry(game, todo, onGoTo));
      continue;
    }
    const button = document.createElement('button');
    button.className = 'todo-entry' + (WARNING_IDS.includes(todo.id) ? ' warning' : '');
    button.textContent = TODO_TEXTS[todo.id](todo.count) + ' ›';
    button.addEventListener('click', () => {
      Sound.click();
      onGoTo(todo.screenId);
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
  entry.innerHTML = '<b class="todo-unlock-name"></b><span class="todo-unlock-text"></span><button class="todo-unlock-button">Ansehen ›</button>';
  entry.querySelector('.todo-unlock-name').textContent = 'Neu: ' + unlock.name;
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
    return 'Neu: ' + getUnlock(todo.unlockId).name;
  }
  return TODO_TEXTS[todo.id](todo.count);
}
