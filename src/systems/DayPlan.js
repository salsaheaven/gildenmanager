// ============================================================
// DAYPLAN – der Tagesplan: Welcher Held macht heute was?
//
// Jeder Held hat genau eine Aufgabe pro Tag (siehe data/heroTasks.js):
//   'dungeon' = er ist für einen Dungeon-Run eingeplant
//   'injured' = er ist verletzt und kuriert sich aus
//   sonst seine gewählte Aufgabe (hero.task): 'rest', 'training', 'herbs' oder 'scouting'
// Diese Datei rechnet nur nach, sie ändert nichts am Spielstand.
// ============================================================

// Die Aufgabe eines Helden heute: { taskId, expedition } (expedition nur bei 'dungeon', sonst null)
export function getHeroTask(guild, hero) {
  const expedition = guild.expeditions.find((e) => e.getHeroIds().includes(hero.id));
  if (expedition) {
    return { taskId: 'dungeon', expedition: expedition };
  }
  if (hero.isInjured()) {
    return { taskId: 'injured', expedition: null };
  }
  return { taskId: hero.task.taskId, expedition: null };
}

import { HERO_TASKS } from '../data/heroTasks.js';

// Der ganze Tagesplan der Gilde:
// { entries: [{ hero, taskId, expedition }], counts: { Aufgabe → Anzahl Helden } }
export function getDayPlan(guild) {
  const entries = [];
  const counts = {};
  for (const taskId in HERO_TASKS) {
    counts[taskId] = 0;
  }
  for (const hero of guild.heroes) {
    const task = getHeroTask(guild, hero);
    entries.push({ hero: hero, taskId: task.taskId, expedition: task.expedition });
    counts[task.taskId]++;
  }
  return { entries: entries, counts: counts };
}
