// ============================================================
// RIVALSYSTEM – die KI-Gilden kommen voran, der Ticker bekommt Neuigkeiten, Server-Firsts werden vergeben
//
// Server-First: Wer einen Dungeon als ERSTE Gilde schafft (du oder eine KI-Gilde).
// Am selben Abend kommst du vor den KI-Gilden dran: Deine Runs werden vor ihren ausgewertet.
// Schaffst du ein Server-First, bekommt deine Gilde den Titel "Erste in: <Dungeon>".
// Raid-Rennen: An Raid-Tagen raiden die KI-Gilden, die alle Dungeons geschafft haben, Boss für Boss.
// Gescheiterte Raid-Versuche kommen immer in den Ticker. Der erste Sieg über einen Raid-Boss ist ein
// Server-First (dein Titel: "Erste: <Boss>"). Die Rangliste zählt zuerst den Raid-Fortschritt.
// Zahlen und Gilden stehen in data/rivalGuilds.js.
// ============================================================

import { t } from '../core/Language.js';
import { RIVAL_RULES } from '../data/rivalGuilds.js';
import { DUNGEONS, getDungeon } from '../data/dungeons.js';
import { getBoss } from '../data/enemies.js';
import { RAIDS } from '../data/raids.js';
import { isRaidDay } from './RaidRules.js';

// Kennung eines Raid-Bosses in guild.serverFirsts (getrennt von den Dungeon-ids)
function raidKey(bossId) {
  return 'raid:' + bossId;
}

// Titel für ein eigenes Server-First an einem Raid-Boss
export function getRaidServerFirstTitle(bossId) {
  return t('logic2.firstRaidTitle', { name: getBoss(bossId).name });
}

// Deine Gilde hat einen Raid-Boss zum ersten Mal besiegt: Meldung, evtl. Server-First mit Titel.
// Gibt true zurück, wenn es ein Server-First war.
export function recordPlayerRaidKill(guild, bossId, day) {
  const serverFirst = guild.serverFirsts[raidKey(bossId)] === undefined;
  if (serverFirst) {
    guild.serverFirsts[raidKey(bossId)] = { name: guild.name, day: day, isPlayer: true };
    const title = getRaidServerFirstTitle(bossId);
    if (!guild.earnedTitles.includes(title)) {
      guild.earnedTitles.push(title);
    }
  }
  addNews(guild, {
    day: day,
    text: describeRaidKill(guild.name, bossId, serverFirst),
    color: '#ffd23f',
    kind: serverFirst ? 'serverFirst' : 'clear',
    isPlayer: true,
  });
  return serverFirst;
}

function describeRaidKill(guildName, bossId, serverFirst) {
  const raid = RAIDS.find((entry) => entry.encounters.some((encounter) => encounter.bossId === bossId));
  const params = { guild: guildName, boss: getBoss(bossId).name, raid: raid.name };
  return serverFirst ? t('logic.raidKillFirst', params) : t('logic.raidKill', params);
}

// Eine KI-Gilde an einem Raid-Tag: ein Versuch am nächsten Raid-Boss (Meldung bei Sieg und Niederlage)
function rivalRaidAttempt(guild, rival, day, random) {
  const data = rival.getData();
  const next = rival.getNextRaidBoss();
  if (next === null || random.next() >= data.attemptChance) {
    return null;
  }
  const attempts = rival.raidAttempts[next.bossId] || 0;
  const chance = data.successChance * RIVAL_RULES.raidSuccessFactor + attempts * RIVAL_RULES.raidLearningPerAttempt;
  if (random.next() < chance) {
    rival.raidKills[next.bossId] = day;
    const serverFirst = guild.serverFirsts[raidKey(next.bossId)] === undefined;
    if (serverFirst) {
      guild.serverFirsts[raidKey(next.bossId)] = { name: data.name, day: day, isPlayer: false };
    }
    return { day: day, text: describeRaidKill(data.name, next.bossId, serverFirst), color: data.color,
      kind: serverFirst ? 'serverFirst' : 'clear', isPlayer: false };
  }
  rival.raidAttempts[next.bossId] = attempts + 1;
  return { day: day, text: t('logic.raidFail', { guild: data.name, boss: getBoss(next.bossId).name, attempt: attempts + 1 }),
    color: data.color, kind: 'fail', isPlayer: false };
}

// Titel für ein eigenes Server-First
export function getServerFirstTitle(dungeonId) {
  return t('logic.firstTitle', { name: getDungeon(dungeonId).name });
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
    return t('logic.clearFirst', { guild: guildName, boss: getFinalBossName(dungeon), dungeon: dungeon.name });
  }
  return t('logic.clear', { guild: guildName, boss: getFinalBossName(dungeon), dungeon: dungeon.name });
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
    // An Raid-Tagen raiden Gilden, die alle Dungeons geschafft haben
    if (isRaidDay(day) && rival.getNextRaidBoss() !== null) {
      const raidNews = rivalRaidAttempt(guild, rival, day, random);
      if (raidNews) {
        newNews.push(raidNews);
      }
      continue;
    }
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
        text: t('logic.fail', { guild: data.name, boss: getFinalBossName(dungeon) }),
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

// Alle Raid-Bosse in Reihenfolge (Raid 1, dann Raid 2)
export function getAllRaidBossIds() {
  const ids = [];
  for (const raid of RAIDS) {
    for (const encounter of raid.encounters) {
      if (encounter.type === 'boss') {
        ids.push(encounter.bossId);
      }
    }
  }
  return ids;
}

// Rangliste aller Gilden (deine eingeschlossen): zuerst der Raid-Fortschritt, dann der höchste geschaffte
// Dungeon; bei Gleichstand, wer es früher geschafft hat.
// Gibt eine Liste zurück: [{ name, color, isPlayer, clears, best, bestDay, raidKills, raidBest, raidBestDay }]
//   best     = Anzahl geschaffter Dungeons in Reihenfolge (0 = noch keiner)
//   raidBest = Anzahl besiegter Raid-Bosse in Reihenfolge
export function getLeaderboard(guild) {
  const entries = [{
    name: guild.name, color: '#ffd23f', isPlayer: true, clears: guild.firstClearDays, raidKills: guild.raidPlan.bossKillDays,
  }];
  for (const rival of guild.rivals) {
    const data = rival.getData();
    entries.push({ name: data.name, color: data.color, isPlayer: false, clears: rival.clears, raidKills: rival.raidKills });
  }
  const raidBossIds = getAllRaidBossIds();
  for (const entry of entries) {
    entry.raidBest = 0;
    entry.raidBestDay = 0;
    entry.raidBossCount = raidBossIds.length;
    for (const bossId of raidBossIds) {
      if (entry.raidKills[bossId] === undefined) {
        break;
      }
      entry.raidBest++;
      entry.raidBestDay = entry.raidKills[bossId];
    }
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
    if (a.raidBest !== b.raidBest) {
      return b.raidBest - a.raidBest;
    }
    if (a.raidBest > 0 && a.raidBestDay !== b.raidBestDay) {
      return a.raidBestDay - b.raidBestDay;
    }
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
