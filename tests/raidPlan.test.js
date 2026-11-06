// Tests für den Raid im Spiel: Raid-Tage, Wochen-Sperre, Auto-Raid, Aufstellung tauschen,
// Raid-Tag bei "Tag beenden", keine Dungeons an Raid-Tagen, Speichern.

import { describe, it, expect } from 'vitest';
import { Game } from '../src/core/Game.js';
import { Hero } from '../src/entities/Hero.js';
import { RAIDS, RAID_RULES } from '../src/data/raids.js';
import { getBoss, MINIONS } from '../src/data/enemies.js';
import { getWeekday, getWeek, isRaidDay, getNextEncounterIndex } from '../src/systems/RaidRules.js';

const LOOKS = { skin: '#f1c39b', hair: '#6b3f17' };
const RAID_CLASSES = [
  'warrior', 'paladin', 'priest', 'druid', 'runeweaver', 'priest',
  'mage', 'rogue', 'hunter', 'warlock', 'samurai', 'barbarian', 'bard', 'shaman',
];

// Eine Gilde mit 14 Helden auf Level 30 (der Raid ist damit offen)
function createRaidGame() {
  const game = new Game(7);
  RAID_CLASSES.forEach((classId, index) => {
    const hero = new Hero(index + 1, 'Held ' + (index + 1), classId, 'uncommon', [], LOOKS);
    hero.level = 30;
    game.guild.heroes.push(hero);
  });
  return game;
}

// Springt zum nächsten Raid-Tag (ohne Tage zu beenden)
function jumpToRaidDay(game) {
  while (!isRaidDay(game.day)) {
    game.day++;
  }
  game.emit('changed');
}

describe('Raid-Daten', () => {
  for (const raid of RAIDS) {
    it(`${raid.name}: Begegnungen gültig, 1–2 Trash-Gruppen vor jedem Boss`, () => {
      let trashSinceBoss = 0;
      for (const encounter of raid.encounters) {
        if (encounter.type === 'boss') {
          expect(getBoss(encounter.bossId).isRaidBoss, encounter.bossId).toBe(true);
          expect(trashSinceBoss).toBeGreaterThanOrEqual(1);
          expect(trashSinceBoss).toBeLessThanOrEqual(2);
          trashSinceBoss = 0;
        } else {
          for (const enemyId of encounter.enemies) {
            expect(MINIONS[enemyId], enemyId).toBeDefined();
          }
          trashSinceBoss++;
        }
      }
      expect(raid.encounters[raid.encounters.length - 1].type).toBe('boss');
    });
  }
});

describe('Raid-Regeln', () => {
  it('Wochentage und Wochen', () => {
    expect(getWeekday(1)).toBe(1);
    expect(getWeekday(7)).toBe(7);
    expect(getWeekday(8)).toBe(1);
    expect(getWeek(7)).toBe(1);
    expect(getWeek(8)).toBe(2);
    expect(isRaidDay(6)).toBe(true);
    expect(isRaidDay(7)).toBe(true);
    expect(isRaidDay(8)).toBe(false);
  });

  it('nach einem besiegten Boss geht es mit dem Trash danach weiter', () => {
    const raid = RAIDS[0];
    const firstBossIndex = raid.encounters.findIndex((encounter) => encounter.type === 'boss');
    expect(getNextEncounterIndex(raid, [])).toBe(0);
    expect(getNextEncounterIndex(raid, [raid.encounters[firstBossIndex].bossId])).toBe(firstBossIndex + 1);
    const allBosses = raid.encounters.filter((encounter) => encounter.type === 'boss').map((encounter) => encounter.bossId);
    expect(getNextEncounterIndex(raid, allBosses)).toBe(null);
  });
});

describe('Raid-Aufstellung', () => {
  it('Auto-Raid nimmt alle einsatzbereiten Helden, verteilt Tanks und Heiler auf verschiedene Gruppen', () => {
    const game = createRaidGame();
    expect(game.applyAutoRaid()).toBe('ok');
    const groups = game.guild.raidPlan.groups;
    expect(groups.flat().length).toBe(RAID_CLASSES.length);
    for (const group of groups) {
      expect(group.length).toBeLessThanOrEqual(RAID_RULES.groupSize);
    }
    const roleOf = (heroId) => game.guild.findHero(heroId).getClass().role;
    const tankGroups = groups.filter((group) => group.some((heroId) => roleOf(heroId) === 'tank'));
    expect(tankGroups.length).toBe(2);
    // 4 Heiler (Priester, Druide, Priester, Runenwirker): jede Gruppe hat einen
    for (const group of groups) {
      expect(group.filter((heroId) => roleOf(heroId) === 'healer').length).toBe(1);
    }
    expect(game.checkRaid().ok).toBe(true);
  });

  it('zu wenige Tanks: Der Raid reicht nicht', () => {
    const game = createRaidGame();
    game.applyAutoRaid();
    const tank = game.guild.heroes.find((hero) => hero.classId === 'paladin');
    game.removeRaidHero(tank.id);
    const check = game.checkRaid();
    expect(check.ok).toBe(false);
    expect(check.problems.some((text) => text.includes('Tanks'))).toBe(true);
  });

  it('Helden zwischen Gruppen verschieben und tauschen', () => {
    const game = createRaidGame();
    game.applyAutoRaid();
    const plan = game.guild.raidPlan;
    const heroId = plan.groups[0][0];
    const smallGroup = plan.groups.findIndex((group, index) => index !== 0 && group.length < RAID_RULES.groupSize);
    expect(game.moveRaidHero(heroId, smallGroup)).toBe('ok');
    expect(plan.getGroupIndexOf(heroId)).toBe(smallGroup);

    // Tauschen mit einem Helden einer anderen Gruppe
    const otherId = plan.groups[1].find((id) => id !== heroId);
    const otherGroup = plan.getGroupIndexOf(otherId);
    expect(game.moveRaidHero(heroId, otherGroup, otherId)).toBe('ok');
    expect(plan.getGroupIndexOf(heroId)).toBe(otherGroup);
    expect(plan.getGroupIndexOf(otherId)).toBe(smallGroup);
  });
});

describe('Raid-Tag', () => {
  it('an Raid-Tagen gibt es keine Dungeons, sobald der Raid offen ist, vorher schon', () => {
    const game = createRaidGame();
    jumpToRaidDay(game);
    const free = game.guild.heroes.slice(0, 5).map((hero) => hero.id);
    expect(game.startExpedition('bearCave', free, 'never')).toBe('raidDay');

    const early = new Game(3);
    const hero = new Hero(1, 'Neuling', 'warrior', 'uncommon', [], LOOKS);
    early.guild.heroes.push(hero);
    jumpToRaidDay(early);
    expect(early.startExpedition('bearCave', [hero.id], 'never')).toBe('ok');
  });

  it('der Raid kämpft bei "Tag beenden", besiegte Bosse sind bis Wochenende gesperrt', () => {
    const game = createRaidGame();
    game.applyAutoRaid();
    jumpToRaidDay(game);
    expect(game.guild.raidPlan.activeToday).toBe(true);
    // Raider haben heute die Aufgabe "Raid"
    expect(game.guild.isHeroBusy(game.guild.raidPlan.groups[0][0])).toBe(true);

    let finished = null;
    game.on('raidFinished', (report) => { finished = report; });
    game.endDay();
    expect(finished).not.toBe(null);
    expect(finished.result.encounters.length).toBeGreaterThan(0);
    expect(game.lastRaidReport).toBe(finished);
    // Gold für jede gewonnene Begegnung
    const wins = finished.result.encounters.filter((encounter) => encounter.outcome === 'victory').length;
    expect(finished.gold > 0).toBe(wins > 0);
    // Eine Raid-Kiste pro besiegtem Boss
    expect(finished.chests.length).toBe(finished.defeatedBossIds.length);
    expect(game.getDefeatedRaidBossIds()).toEqual(finished.defeatedBossIds);
    expect(finished.heroResults.length).toBe(RAID_CLASSES.length);
  });

  it('die Wochen-Sperre endet mit der neuen Woche', () => {
    const game = createRaidGame();
    game.guild.raidPlan.markBossDefeated(RAIDS[0].encounters[2].bossId, game.getWeek());
    expect(game.getDefeatedRaidBossIds().length).toBe(1);
    game.day += RAID_RULES.daysPerWeek;
    expect(game.getDefeatedRaidBossIds().length).toBe(0);
  });

  it('"Heute aussetzen": kein Raid', () => {
    const game = createRaidGame();
    game.applyAutoRaid();
    jumpToRaidDay(game);
    game.skipRaidToday();
    expect(game.guild.raidPlan.activeToday).toBe(false);
    game.planRaidToday();
    expect(game.guild.raidPlan.activeToday).toBe(true);
  });

  it('Aufstellung und Sperre werden gespeichert', () => {
    const game = createRaidGame();
    game.applyAutoRaid();
    game.guild.raidPlan.markBossDefeated('stoneColossus', game.getWeek());
    const loaded = Game.fromSaveData(JSON.parse(JSON.stringify(game.toSaveData())));
    expect(loaded.guild.raidPlan.groups).toEqual(game.guild.raidPlan.groups);
    expect(loaded.getDefeatedRaidBossIds()).toEqual(['stoneColossus']);
  });
});
