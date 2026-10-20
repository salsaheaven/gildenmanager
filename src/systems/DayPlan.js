// ============================================================
// DAYPLAN – der Tagesplan: Welcher Held macht heute was?
//
// Jeder Held hat genau eine Aufgabe pro Tag (siehe data/heroTasks.js):
//   'dungeon' = er ist für einen Dungeon-Run eingeplant
//   'injured' = er ist verletzt und kuriert sich aus
//   'rest'    = er hat nichts zu tun und ruht sich aus
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
  return { taskId: 'rest', expedition: null };
}

// Der ganze Tagesplan der Gilde:
// { entries: [{ hero, taskId, expedition }], counts: { dungeon, injured, rest } }
export function getDayPlan(guild) {
  const entries = [];
  const counts = { dungeon: 0, injured: 0, rest: 0 };
  for (const hero of guild.heroes) {
    const task = getHeroTask(guild, hero);
    entries.push({ hero: hero, taskId: task.taskId, expedition: task.expedition });
    counts[task.taskId]++;
  }
  return { entries: entries, counts: counts };
}
