// Bot: spielt das echte Game-Objekt durch und misst den Fortschritt.
import { Game } from './src/core/Game.js';
import { DUNGEONS } from './src/data/dungeons.js';

const WANT = ['warrior', 'priest', 'mage', 'rogue', 'runeweaver'];
const DAYS = Number(process.argv[2] || 60);
const SEEDS = Number(process.argv[3] || 20);
const mode = process.argv[4] || 'push'; // push = immer höchster Dungeon, safe = höchster mit Erfolg zuletzt

const agg = { firstClear: {}, runs: 0, success: 0, upgrades: 0, items: 0, chests: 0, idleDays: 0, levelAt: {}, goldAt: {}, failStreakMax: 0, noUpgradeChests: 0 };
for (const d of DUNGEONS) agg.firstClear[d.id] = [];

for (let s = 1; s <= SEEDS; s++) {
  const game = new Game(s * 1000 + 7);
  const g = game.guild;
  // Starter-Kisten öffnen
  while (g.boxes.length) game.openBox(g.boxes[0].typeId);
  // Gruppe anheuern: eine von jeder Klasse (wie TestGroup)
  let safety = 0;
  while (g.heroes.length < 5 && safety++ < 200) {
    const have = g.heroes.map((h) => h.classId);
    const c = g.candidates.find((c) => !have.includes(c.classId) && WANT.includes(c.classId) && c.getHireCost() <= g.gold);
    if (c) game.hireHero(c.id);
    else game.endDay(); // kostenlos neue Bewerber am nächsten Tag
  }
  const startDay = game.day;
  for (const h of g.heroes) game.equipBestItems(h.id);
  let lastOutcome = {};
  let failStreak = 0;
  for (let day = 0; day < DAYS; day++) {
    const ready = g.heroes.filter((h) => !h.isInjured());
    if (ready.length === 5) {
      const unlocked = DUNGEONS.filter((d) => game.isDungeonUnlocked(d.id));
      let target = unlocked[unlocked.length - 1];
      if (mode === 'level') {
        const avgLvl = ready.reduce((a, h) => a + h.level, 0) / 5;
        const ok = unlocked.filter((d) => d.level <= Math.max(1, avgLvl));
        target = ok[ok.length - 1];
      }
      if (mode === 'safe' && lastOutcome[target.id] && lastOutcome[target.id] !== 'success' && unlocked.length > 1 && failStreak >= 2) {
        target = unlocked[unlocked.length - 2];
      }
      game.startExpedition(target.id, ready.map((h) => h.id), 'never');
    } else {
      agg.idleDays++;
    }
    const reports = game.endDay();
    for (const r of reports) {
      agg.runs++;
      lastOutcome[r.dungeonId] = r.outcome;
      if (r.outcome === 'success') { agg.success++; failStreak = 0; } else { failStreak++; agg.failStreakMax = Math.max(agg.failStreakMax, failStreak); }
      if (r.firstClear) agg.firstClear[r.dungeonId].push(game.day - 1 - startDay + 1);
    }
    // Kisten öffnen und bestes anlegen
    while (g.boxes.length) {
      const items = game.openBox(g.boxes[0].typeId);
      agg.chests++; agg.items += items.length;
      let up = 0;
      for (const it of items) {
        for (const h of g.heroes) {
          if (h.canEquip(it) && h.getUpgradeValue(it) > 0) { up++; break; }
        }
      }
      agg.upgrades += up;
      if (up === 0) agg.noUpgradeChests++;
      for (const h of g.heroes) game.equipBestItems(h.id);
    }
    game.sellAllOfRarity('poor');
    const d = day + 1;
    if ([10, 20, 30, 45, 60, 90].includes(d)) {
      (agg.levelAt[d] ||= []).push(g.heroes.reduce((a, h) => a + h.level, 0) / g.heroes.length);
      (agg.goldAt[d] ||= []).push(g.gold);
    }
  }
}
const avg = (a) => (a.length ? (a.reduce((x, y) => x + y, 0) / a.length).toFixed(1) : '-');
console.log('Modus', mode, 'Tage', DAYS, 'Seeds', SEEDS);
for (const id in agg.firstClear) console.log('Erster Sieg', id, 'nach Ø Tag', avg(agg.firstClear[id]), '(' + agg.firstClear[id].length + '/' + SEEDS + ' geschafft)');
console.log('Runs', agg.runs, 'Erfolgsquote', (agg.success / agg.runs * 100).toFixed(0) + '%', 'Tage ohne Run (Verletzung)', agg.idleDays, 'längste Pechsträhne', agg.failStreakMax);
console.log('Kisten', agg.chests, 'Items', agg.items, 'davon Upgrade für irgendwen', agg.upgrades, '(' + (agg.upgrades / agg.items * 100).toFixed(0) + '%)', 'Kisten ganz ohne Upgrade', agg.noUpgradeChests, '(' + (agg.noUpgradeChests / agg.chests * 100).toFixed(0) + '%)');
for (const d in agg.levelAt) console.log('Tag', d, 'Ø Level', avg(agg.levelAt[d]), 'Ø Gold', avg(agg.goldAt[d]));
