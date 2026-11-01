// ============================================================
// TODOBOX – Kasten "Was gibt es heute zu tun?" ganz oben im Tagesplan
// Zeigt nur Dinge, die eine Entscheidung brauchen (siehe systems/DailyTodo.js).
// Jede Zeile ist ein Knopf, der direkt an die richtige Stelle springt.
// Ist nichts zu tun, steht dort "Alles erledigt", und man kann den Tag beenden.
// ============================================================

import { Sound } from './Sound.js';

// Text pro Eintrag, abhängig von der Anzahl
const TODO_TEXTS = {
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
const WARNING_IDS = ['upkeep', 'unhappy'];

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
