// ============================================================
// NEXTTODOBAR – schmale Leiste unter den Unterreitern: "Noch 3 offen · Weiter: 2 Kisten warten aufs Öffnen ›"
// Führt von einem offenen Punkt zum nächsten, ohne Umweg über den Tagesplan.
// Auf dem Tagesplan selbst ist sie ausgeblendet (dort steht der ganze Kasten "Was gibt es heute zu tun?").
// Die offenen Punkte kommen aus systems/DailyTodo.js, die Texte aus TodoBox.js.
// ============================================================

import { describeTodo } from './TodoBox.js';
import { Sound } from './Sound.js';

export class NextTodoBar {
  // onGoTo(screenId) = zu einem Bildschirm springen
  constructor(rootElement, game, onGoTo) {
    this.root = rootElement;
    this.game = game;
    this.onGoTo = onGoTo;
    this.currentScreen = null;
    game.on('changed', () => this.render());
  }

  // Der Bildschirm hat gewechselt (aus main.js)
  setScreen(screenId) {
    this.currentScreen = screenId;
    this.render();
  }

  render() {
    this.root.innerHTML = '';
    // Nächster Punkt, der woanders zu erledigen ist als hier
    const todos = this.game.getDailyTodos();
    const next = todos.find((todo) => todo.screenId !== this.currentScreen);
    this.root.hidden = this.currentScreen === 'plan' || !next;
    if (this.root.hidden) {
      return;
    }
    const button = document.createElement('button');
    button.className = 'next-todo-button';
    button.textContent = 'Noch ' + todos.length + ' offen · Weiter: ' + describeTodo(next) + ' ›';
    button.addEventListener('click', () => {
      Sound.click();
      if (next.id === 'unlock') {
        this.game.acknowledgeUnlock(next.unlockId);
      }
      this.onGoTo(next.screenId);
    });
    this.root.appendChild(button);
  }
}
