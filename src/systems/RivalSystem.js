// ============================================================
// RIVALSYSTEM – die KI-Gilden kommen voran, der Ticker bekommt Neuigkeiten, Server-Firsts werden vergeben
//
// Server-First: Wer einen Dungeon als ERSTE Gilde schafft (du oder eine KI-Gilde).
// Am selben Abend kommst du vor den KI-Gilden dran: Deine Runs werden vor ihren ausgewertet.
// Schaffst du ein Server-First, bekommt deine Gilde den Titel "Erste in: <Dungeon>".
// Zahlen und Gilden stehen in data/rivalGuilds.js.
// ============================================================

import { RIVAL_RULES } from '../data/rivalGuilds.js';
import { DUNGEONS, getDungeon } from '../data/dungeons.js';
import { getBoss } from '../data/enemies.js';

// Titel für ein eigenes Server-First
export function getServerFirstTitle(dungeonId) {
  return 'Erste in: ' + getDungeon(dungeonId).name;
}

// Der letzte Boss eines Dungeons (für die Meldungen, z.B. "besiegen Grimmzahn")
function getFinalBossName(dungeon) {
  const bosses = dungeon.encounters.filter((encounter) => encounter.type === 'boss');
  return getBoss(bosses[bosses.length - 1].bossId).name;
}

// Text einer Meldung, z.B. "Server-First! Aschenkrone: Grimmzahn als erste Gilde besiegt (Die Bärenhöhle)"
// (Gildenname vorne mit Doppelpunkt, damit es für "Die Eisenfäuste" und "Aschenkrone" gleich gut passt)
function describeClear(guildName, dungeon, serverFirst) {
  if (serverFirst) {
    return 'Server-First! ' + guildName + ': ' + getFinalBossName(dungeon) + ' als erste Gilde besiegt (' + dungeon.name + ')';
  }
  return guildName + ': ' + getFinalBossName(dungeon) + ' besiegt (' + dungeon.name + ')';
}

// Schreibt eine Meldung in den Ticker (neueste zuerst)
// news = { day, text, color, kind ('clear', 'serverFirst', 'fail'), isPlayer }
export function addNews(guild, news) {
  guild.news.unshift(news);
  guild.news = guild.news.slice(0, RIVAL_RULES.keptNews);
}

// Deine Gilde hat einen Dungeon zum ersten Mal geschafft: Meldung, evtl. Server-First mit Titel.
// Gibt true zurück, wenn es ein Server-First war.
export function recordPlayerClear(guild, dungeonId, day) {
  const dungeon = getDungeon(dungeonId);
  const serverFirst = guild.serverFirsts[dungeonId] === undefined;
  if (serverFirst) {
    guild.serverFirsts[dungeonId] = { name: guild.name, day: day, isPlayer: true };
    const title = getServerFirstTitle(dungeonId);
    if (!guild.earnedTitles.includes(title)) {
      guild.earnedTitles.push(title);
    }
  }
  addNews(guild, {
    day: day,
    text: describeClear(guild.name, dungeon, serverFirst),
    color: '#ffd23f',
    kind: serverFirst ? 'serverFirst' : 'clear',
    isPlayer: true,
  });
  return serverFirst;
}

// Ein Abend für alle KI-Gilden. Gibt die neuen Meldungen dieses Abends zurück.
export function advanceRivals(guild, day, random) {
  const newNews = [];
  for (const rival of guild.rivals) {
    const data = rival.getData();
    const dungeon = rival.getNextDungeon();
    if (dungeon === null || random.next() >= data.attemptChance) {
      continue;
    }
    const successChance = data.successChance * Math.pow(RIVAL_RULES.successFactorPerLevel, dungeon.level - 1);
    if (random.next() < successChance) {
      rival.clears[dungeon.id] = day;
      const serverFirst = guild.serverFirsts[dungeon.id] === undefined;
      if (serverFirst) {
        guild.serverFirsts[dungeon.id] = { name: data.name, day: day, isPlayer: false };
      }
      newNews.push({
        day: day,
        text: describeClear(data.name, dungeon, serverFirst),
        color: data.color,
        kind: serverFirst ? 'serverFirst' : 'clear',
        isPlayer: false,
      });
    } else if (random.next() < RIVAL_RULES.failNewsChance) {
      newNews.push({
        day: day,
        text: data.name + ': an ' + getFinalBossName(dungeon) + ' gescheitert.',
        color: data.color,
        kind: 'fail',
        isPlayer: false,
      });
    }
  }
  for (const news of newNews) {
    addNews(guild, news);
  }
  return newNews;
}

// Rangliste aller Gilden (deine eingeschlossen): höchster geschaffter Dungeon zuerst,
// bei Gleichstand wer ihn früher geschafft hat.
// Gibt eine Liste zurück: [{ name, color, isPlayer, clears: { dungeon-id → Tag }, best, bestDay }]
//   best = Anzahl geschaffter Dungeons in Reihenfolge (0 = noch keiner)
export function getLeaderboard(guild) {
  const entries = [{
    name: guild.name, color: '#ffd23f', isPlayer: true, clears: guild.firstClearDays,
  }];
  for (const rival of guild.rivals) {
    const data = rival.getData();
    entries.push({ name: data.name, color: data.color, isPlayer: false, clears: rival.clears });
  }
  for (const entry of entries) {
    entry.best = 0;
    entry.bestDay = 0;
    for (const dungeon of DUNGEONS) {
      if (entry.clears[dungeon.id] === undefined) {
        break;
      }
      entry.best++;
      entry.bestDay = entry.clears[dungeon.id];
    }
  }
  entries.sort((a, b) => {
    if (a.best !== b.best) {
      return b.best - a.best;
    }
    if (a.bestDay !== b.bestDay) {
      return a.bestDay - b.bestDay;
    }
    return a.isPlayer ? -1 : 1; // bei völligem Gleichstand zuerst du
  });
  return entries;
}
