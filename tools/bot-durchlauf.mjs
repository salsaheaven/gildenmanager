// ============================================================
// BOT-DURCHLAUF – ein Bot spielt das echte Spiel viele Tage lang und misst den Fortschritt
//
// Aufruf:  node tools/bot-durchlauf.mjs [Tage] [Spielstände] [Modus]
//   Modus "level": nimmt den höchsten Dungeon, dessen Stufe höchstens dem Ø Gruppenlevel entspricht
//   Modus "push":  nimmt immer den höchsten freigeschalteten Dungeon
// Beispiel: node tools/bot-durchlauf.mjs 60 20 level
//
// Der Bot heuert je einen Helden jeder Klasse an, schickt die Gruppe jeden Tag los (wenn niemand
// verletzt ist), öffnet alle Kisten, legt die beste Ausrüstung an und verkauft Schrott.
// ============================================================

import { Game } from '../src/core/Game.js';
import { DUNGEONS } from '../src/data/dungeons.js';
import { STANDARD_GROUP } from './messhilfen.mjs';

const DAYS = Number(process.argv[2] || 60);
const SAVEGAMES = Number(process.argv[3] || 20);
const MODE = process.argv[4] || 'level';
const REPORT_DAYS = [10, 20, 30, 45, 60, 90];
const CHEAPEST_HERO = 40;

const stats = {
  firstClearDays: {},  // Dungeon-id → Liste: an welchem Tag zum ersten Mal geschafft
  runs: 0,
  successes: 0,
  daysWithoutRun: 0,   // Tage, an denen jemand verletzt war
  longestLosingStreak: 0,
  chests: 0,
  items: 0,
  upgradeItems: 0,     // Items, die für irgendeinen Helden ein Upgrade waren
  chestsWithoutUpgrade: 0,
  levelAt: {},
  goldAt: {},
  stuckSavegames: 0,   // Spielstände, in denen keine volle Gruppe zustande kam
};
for (const dungeon of DUNGEONS) {
  stats.firstClearDays[dungeon.id] = [];
}

// Heuert je einen Helden jeder Klasse an. Nur so teuer, dass danach noch Gold
// für die restlichen Plätze bleibt (sonst sitzt der Bot ohne Gold und ohne Gruppe fest).
function hireGroup(game) {
  const guild = game.guild;
  let tries = 0;
  while (guild.heroes.length < 5 && tries < 200) {
    tries++;
    const haveClasses = guild.heroes.map((hero) => hero.classId);
    const stillNeeded = 4 - guild.heroes.length;
    const candidate = guild.candidates.find((c) =>
      STANDARD_GROUP.includes(c.classId) &&
      !haveClasses.includes(c.classId) &&
      c.getHireCost() + stillNeeded * CHEAPEST_HERO <= guild.gold);
    if (candidate) {
      game.hireHero(candidate.id);
    } else {
      game.endDay(); // am nächsten Morgen kommen kostenlos neue Bewerber
    }
  }
  return guild.heroes.length === 5;
}

// Welcher Dungeon heute? (siehe Modus oben)
function chooseDungeon(game, heroes) {
  const unlocked = DUNGEONS.filter((dungeon) => game.isDungeonUnlocked(dungeon.id));
  if (MODE === 'push') {
    return unlocked[unlocked.length - 1];
  }
  const averageLevel = heroes.reduce((sum, hero) => sum + hero.level, 0) / heroes.length;
  const fitting = unlocked.filter((dungeon) => dungeon.level <= Math.max(1, averageLevel));
  return fitting[fitting.length - 1];
}

// Alle Kisten öffnen, zählen, wie viele Items ein Upgrade sind, dann das Beste anlegen
function openAllChests(game) {
  const guild = game.guild;
  while (guild.boxes.length > 0) {
    const items = game.openBox(guild.boxes[0].typeId);
    stats.chests++;
    stats.items += items.length;
    let upgrades = 0;
    for (const item of items) {
      if (guild.heroes.some((hero) => hero.canEquip(item) && hero.getUpgradeValue(item) > 0)) {
        upgrades++;
      }
    }
    stats.upgradeItems += upgrades;
    if (upgrades === 0) {
      stats.chestsWithoutUpgrade++;
    }
    for (const hero of guild.heroes) {
      game.equipBestItems(hero.id);
    }
  }
}

for (let savegame = 1; savegame <= SAVEGAMES; savegame++) {
  const game = new Game(savegame * 1000 + 7);
  const guild = game.guild;
  // Start-Kisten öffnen
  while (guild.boxes.length > 0) {
    game.openBox(guild.boxes[0].typeId);
  }
  if (!hireGroup(game)) {
    stats.stuckSavegames++;
    continue;
  }
  for (const hero of guild.heroes) {
    game.equipBestItems(hero.id);
  }

  const startDay = game.day;
  let losingStreak = 0;
  for (let day = 1; day <= DAYS; day++) {
    const ready = guild.heroes.filter((hero) => !hero.isInjured());
    if (ready.length === 5) {
      const dungeon = chooseDungeon(game, ready);
      game.startExpedition(dungeon.id, ready.map((hero) => hero.id), 'never');
    } else {
      stats.daysWithoutRun++;
    }

    for (const report of game.endDay()) {
      stats.runs++;
      if (report.outcome === 'success') {
        stats.successes++;
        losingStreak = 0;
      } else {
        losingStreak++;
        stats.longestLosingStreak = Math.max(stats.longestLosingStreak, losingStreak);
      }
      if (report.firstClear) {
        stats.firstClearDays[report.dungeonId].push(game.day - startDay);
      }
    }
    openAllChests(game);
    game.sellAllOfRarity('poor');

    if (REPORT_DAYS.includes(day)) {
      (stats.levelAt[day] ||= []).push(guild.heroes.reduce((sum, hero) => sum + hero.level, 0) / 5);
      (stats.goldAt[day] ||= []).push(guild.gold);
    }
  }
}

// ---------- Ausgabe ----------

function average(list) {
  if (list.length === 0) {
    return '-';
  }
  return (list.reduce((sum, value) => sum + value, 0) / list.length).toFixed(1);
}
function percent(part, total) {
  return total > 0 ? Math.round((part / total) * 100) + ' %' : '-';
}

console.log('Modus', MODE, '·', DAYS, 'Tage ·', SAVEGAMES, 'Spielstände');
if (stats.stuckSavegames > 0) {
  console.log('ACHTUNG:', stats.stuckSavegames, 'Spielstände ohne volle Gruppe (nicht mitgezählt)');
}
for (const dungeonId in stats.firstClearDays) {
  const days = stats.firstClearDays[dungeonId];
  console.log('Erster Sieg', dungeonId.padEnd(13), 'Ø Tag', average(days), '(' + days.length + ' Spielstände)');
}
console.log('Runs', stats.runs, '· Erfolgsquote', percent(stats.successes, stats.runs),
  '· Tage ohne Run (Verletzte)', stats.daysWithoutRun, '· längste Pechsträhne', stats.longestLosingStreak);
console.log('Kisten', stats.chests, '· Items', stats.items, '· davon Upgrade', percent(stats.upgradeItems, stats.items),
  '· Kisten ganz ohne Upgrade', percent(stats.chestsWithoutUpgrade, stats.chests));
for (const day in stats.levelAt) {
  console.log('Tag', day, '· Ø Level', average(stats.levelAt[day]), '· Ø Gold', average(stats.goldAt[day]));
}
