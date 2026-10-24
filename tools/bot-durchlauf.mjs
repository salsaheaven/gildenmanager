// ============================================================
// BOT-DURCHLAUF – ein Bot spielt das echte Spiel viele Tage lang und misst den Fortschritt
//
// Aufruf:  node tools/bot-durchlauf.mjs [Tage] [Spielstände] [Modus] [Resistenz-Gewicht]
//   Modus "level": nimmt den höchsten Dungeon, dessen Stufe höchstens dem Ø Gruppenlevel entspricht
//   Modus "push":  nimmt immer den höchsten freigeschalteten Dungeon
//   Resistenz-Gewicht: so viele Werte-Punkte ist 1 % passende Resistenz für den Bot wert (Standard 0.5,
//                      0 = Resistenzen ignorieren). So lässt sich messen, wie viel Resistenzen bringen.
// Beispiel: node tools/bot-durchlauf.mjs 60 20 level 0.5
//
// Der Bot heuert je einen Helden jeder Klasse an, schickt die Gruppe jeden Tag los (wenn niemand
// verletzt ist), öffnet alle Kisten und verkauft Schrott. Vor jedem Run rüstet er für den Ziel-Dungeon aus:
// pro Platz das Teil mit den meisten nützlichen Werten plus Resistenz gegen die Schadensarten des Dungeons.
// ============================================================

import { Game } from '../src/core/Game.js';
import { DUNGEONS, getDungeonDamageTypes } from '../src/data/dungeons.js';
import { EQUIPMENT_SLOTS } from '../src/entities/Hero.js';
import { STANDARD_GROUP } from './messhilfen.mjs';

const DAYS = Number(process.argv[2] || 60);
const SAVEGAMES = Number(process.argv[3] || 20);
const MODE = process.argv[4] || 'level';
const RESISTANCE_WEIGHT = process.argv[5] === undefined ? 0.5 : Number(process.argv[5]);
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
  resistanceRuns: 0,   // Runs in Dungeons mit besonderer Schadensart (Schatten, Säure …)
  resistanceSum: 0,    // Summe der passenden Resistenz pro Held in diesen Runs
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

// Wie gut ist ein Item für diesen Helden in diesem Dungeon? Nützliche Werte plus passende Resistenz.
function scoreItem(hero, item, damageTypes) {
  let score = hero.getItemPower(item);
  for (const damageType of damageTypes) {
    score += (item.resistances[damageType] || 0) * RESISTANCE_WEIGHT;
  }
  return score;
}

// Vor dem Run: pro Platz das Teil mit der besten Bewertung für diesen Dungeon anlegen
function equipForDungeon(game, hero, dungeon) {
  const damageTypes = getDungeonDamageTypes(dungeon.id);
  for (const slot of EQUIPMENT_SLOTS) {
    const current = hero.equipment[slot];
    let best = current;
    let bestScore = current ? scoreItem(hero, current, damageTypes) : 0;
    for (const item of game.guild.inventory) {
      if (item.getSlot() !== slot || !hero.canEquip(item)) {
        continue;
      }
      const score = scoreItem(hero, item, damageTypes);
      if (score > bestScore) {
        best = item;
        bestScore = score;
      }
    }
    if (best !== current) {
      game.equipItem(hero.id, best.id);
    }
  }
}

// Alle Kisten öffnen und zählen, wie viele Items für irgendwen ein Upgrade (nach Werten) sind
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
  const startDay = game.day;
  let losingStreak = 0;
  for (let day = 1; day <= DAYS; day++) {
    const ready = guild.heroes.filter((hero) => !hero.isInjured());
    if (ready.length === 5) {
      const dungeon = chooseDungeon(game, ready);
      for (const hero of ready) {
        equipForDungeon(game, hero, dungeon);
      }
      // Messen, wie viel passende Resistenz die Gruppe trägt
      const damageTypes = getDungeonDamageTypes(dungeon.id);
      if (damageTypes.length > 0) {
        stats.resistanceRuns++;
        for (const hero of ready) {
          for (const damageType of damageTypes) {
            stats.resistanceSum += (hero.getResistances()[damageType] || 0) / ready.length;
          }
        }
      }
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

console.log('Modus', MODE, '·', DAYS, 'Tage ·', SAVEGAMES, 'Spielstände · Resistenz-Gewicht', RESISTANCE_WEIGHT);
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
console.log('Ø passende Resistenz pro Held in Dungeons mit Schatten/Säure …:',
  stats.resistanceRuns > 0 ? (stats.resistanceSum / stats.resistanceRuns).toFixed(1) + ' %' : '-');
for (const day in stats.levelAt) {
  console.log('Tag', day, '· Ø Level', average(stats.levelAt[day]), '· Ø Gold', average(stats.goldAt[day]));
}
