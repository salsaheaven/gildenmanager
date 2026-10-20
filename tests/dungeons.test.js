// Tests für Dungeons: Runs, Trash, Rückzug, Expeditionen, Belohnungen, Speichern.

import { describe, it, expect } from 'vitest';
import { simulateRun } from '../src/systems/combat/CombatSimulator.js';
import { computeRunTimeline } from '../src/systems/combat/BattleTimeline.js';
import { createTestGroup } from '../src/systems/combat/TestGroup.js';
import { DUNGEONS } from '../src/data/dungeons.js';
import { MINIONS, getBoss } from '../src/data/enemies.js';
import { getLootBoxType } from '../src/data/lootBoxes.js';
import { getRarityRank } from '../src/data/rarities.js';
import { BALANCING } from '../src/data/balancing.js';
import { Game } from '../src/core/Game.js';
import { Guild } from '../src/entities/Guild.js';
import { LootSystem } from '../src/systems/LootSystem.js';
import { Random } from '../src/core/Random.js';

// Ein Spiel mit einer fertigen 5er-Gruppe (Testgruppe als echte Gildenhelden)
function gameWithGroup(level = 5) {
  const game = new Game(11);
  const group = createTestGroup(level);
  group.forEach((hero, index) => { hero.id = 100 + index; });
  game.guild.heroes.push(...group);
  return { game, heroIds: group.map((hero) => hero.id) };
}

describe('Dungeon-Daten', () => {
  for (const dungeon of DUNGEONS) {
    it(`${dungeon.name}: mindestens eine Trash-Gruppe und ein Boss, alles existiert`, () => {
      expect(dungeon.encounters.some((e) => e.type === 'trash')).toBe(true);
      expect(dungeon.encounters.some((e) => e.type === 'boss')).toBe(true);
      for (const encounter of dungeon.encounters) {
        if (encounter.type === 'boss') {
          expect(() => getBoss(encounter.bossId)).not.toThrow();
        } else {
          for (const enemyId of encounter.enemies) {
            expect(MINIONS[enemyId], enemyId).toBeDefined();
          }
        }
      }
      const chest = getLootBoxType(dungeon.rewards.chest);
      expect(chest.price).toBe(null);
      expect(chest.bossLoot.length).toBeGreaterThan(0);
      if (dungeon.unlockAfter) {
        expect(DUNGEONS.some((d) => d.id === dungeon.unlockAfter)).toBe(true);
      }
    });
  }
});

describe('simulateRun', () => {
  it('gleicher Seed = gleicher Run, Begegnungen laufen nacheinander', () => {
    const options = { dungeonId: 'broodNests', retreatRuleId: 'never', seed: 5, recordLog: true };
    const a = simulateRun({ ...options, heroes: createTestGroup(10) });
    const b = simulateRun({ ...options, heroes: createTestGroup(10) });
    expect(a.outcome).toBe('success');
    expect(a.encounters.length).toBe(3);
    expect(a.encounters.map((e) => e.log.length)).toEqual(b.encounters.map((e) => e.log.length));
  });

  it('Leben aus der Trash-Begegnung geht in den Bosskampf mit', () => {
    const run = simulateRun({ heroes: createTestGroup(1), dungeonId: 'bearCave', seed: 3, recordLog: true });
    const afterTrash = run.encounters[0].heroes;
    const bossStart = run.encounters[1].startingCombatants.filter((c) => c.side === 'hero');
    // Erholung zwischen den Begegnungen: höchstens volles Leben, mindestens so viel wie nach dem Trash
    for (const hero of bossStart) {
      const before = afterTrash.find((h) => h.combatantId === hero.id);
      expect(hero.hp).toBeGreaterThanOrEqual(before.hp);
      expect(hero.hp).toBeLessThanOrEqual(hero.maxHp);
    }
  });

  it('Rückzugsregel "nach 1 Gefallenen" beendet den Run mit Rückzug statt Niederlage', () => {
    // Ohne Heiler fällt schnell jemand
    const heroes = createTestGroup(1, 'uncommon', ['warrior', 'mage', 'rogue']);
    let retreats = 0;
    for (let seed = 1; seed < 30; seed++) {
      const run = simulateRun({ heroes, dungeonId: 'ruinedChapel', retreatRuleId: 'afterOne', seed, recordLog: true });
      expect(run.outcome).not.toBe('success');
      if (run.outcome === 'retreat') {
        retreats++;
        // Beim Rückzug ist mindestens einer gefallen (die Regel reagiert nur auf Gefallene)
        expect(run.heroes.some((h) => !h.alive)).toBe(true);
      }
    }
    expect(retreats).toBeGreaterThan(0);
  });

  it('Rückzug per Hand: bis zur Rückzugsrunde verläuft der Run genau gleich', () => {
    const base = { heroes: createTestGroup(1), dungeonId: 'bearCave', seed: 9, recordLog: true };
    const normal = simulateRun(base);
    const retreated = simulateRun({ ...base, manualRetreat: { encounterIndex: 1, round: 6 } });
    const before = (run) => run.encounters[1].log.filter((entry) => entry.round < 6);
    expect(before(retreated)).toEqual(before(normal));
    expect(retreated.outcome === 'retreat' || retreated.outcome === 'defeat').toBe(true);
  });
});

describe('Expeditionen', () => {
  it('Run starten, Zeit laufen lassen, Belohnung bekommen', () => {
    const { game, heroIds } = gameWithGroup(10);
    const goldBefore = game.guild.gold;
    expect(game.startExpedition('bearCave', heroIds, 'never')).toBe('ok');
    expect(game.guild.isHeroBusy(heroIds[0])).toBe(true);

    const reports = [];
    game.on('expeditionFinished', (report) => reports.push(report));
    const total = game.guild.expeditions[0].getTotalTime();
    game.advanceTime(total + 1);

    expect(reports.length).toBe(1);
    expect(reports[0].outcome).toBe('success');
    expect(game.guild.gold).toBe(goldBefore + DUNGEONS[0].rewards.gold);
    expect(game.guild.countBoxes('chestGrimfang')).toBe(1);
    expect(game.guild.getClears('bearCave')).toBe(1);
    expect(game.guild.isHeroBusy(heroIds[0])).toBe(false);
  });

  it('gesperrte Dungeons und beschäftigte Helden', () => {
    const { game, heroIds } = gameWithGroup(10);
    expect(game.startExpedition('ruinedChapel', heroIds, 'never')).toBe('locked');
    game.startExpedition('bearCave', heroIds, 'never');
    expect(game.startExpedition('bearCave', heroIds, 'never')).toBe('busy');
    // Wer unterwegs ist, kann nicht umgerüstet oder entlassen werden
    expect(game.dismissHero(heroIds[0])).toBe(false);
  });

  it('nach dem ersten Erfolg ist der nächste Dungeon frei, nach 3 Erfolgen gibt es Schnellkampf', () => {
    const { game, heroIds } = gameWithGroup(10);
    for (let i = 0; i < BALANCING.quickFinishAfterClears; i++) {
      game.startExpedition('bearCave', heroIds, 'never');
      game.advanceTime(10000);
    }
    expect(game.isDungeonUnlocked('ruinedChapel')).toBe(true);
    expect(game.canQuickFinish('bearCave')).toBe(true);
    game.startExpedition('bearCave', heroIds, 'never');
    expect(game.finishExpeditionNow(game.guild.expeditions[0].id)).toBe(true);
    expect(game.guild.expeditions.length).toBe(0);
  });

  it('ein Run mittendrin speichern und laden verläuft genau gleich', () => {
    const { game, heroIds } = gameWithGroup(1);
    game.startExpedition('bearCave', heroIds, 'never');
    game.advanceTime(12);
    const original = game.guild.expeditions[0];
    const loaded = Game.fromSaveData(JSON.parse(JSON.stringify(game.toSaveData())));
    const copy = loaded.guild.expeditions[0];
    expect(copy.elapsed).toBe(original.elapsed);
    expect(copy.getResult().outcome).toBe(original.getResult().outcome);
    expect(copy.getTotalTime()).toBe(original.getTotalTime());
  });

  it('Rückzug befehlen beendet den Run ohne Beute', () => {
    const { game, heroIds } = gameWithGroup(10);
    game.startExpedition('bearCave', heroIds, 'never');
    game.advanceTime(3);
    expect(game.orderRetreat(game.guild.expeditions[0].id)).toBe(true);
    const reports = [];
    game.on('expeditionFinished', (report) => reports.push(report));
    game.advanceTime(10000);
    expect(reports[0].outcome).toBe('retreat');
    expect(game.guild.countBoxes('chestGrimfang')).toBe(0);
  });

  it('die Dauer eines Runs ergibt sich aus der Zeitleiste', () => {
    const run = simulateRun({ heroes: createTestGroup(5), dungeonId: 'bearCave', seed: 2, recordLog: true });
    const timeline = computeRunTimeline(run, BALANCING.travelSeconds);
    expect(timeline.segments.length).toBe(run.encounters.length);
    expect(timeline.totalTime).toBeGreaterThan(BALANCING.travelSeconds);
  });
});

describe('Boss-Kisten', () => {
  it('enthalten immer ein Boss-Item mit festem Namen, mindestens selten', () => {
    const guild = new Guild();
    const lootSystem = new LootSystem(new Random(4));
    const boxType = getLootBoxType('chestGrimfang');
    const bossNames = boxType.bossLoot.map((entry) => entry.name);
    for (let i = 0; i < 50; i++) {
      const items = lootSystem.rollBoxContents(boxType, guild);
      expect(items.length).toBe(boxType.itemCount);
      const bossItem = items.find((item) => bossNames.includes(item.name));
      expect(bossItem).toBeDefined();
      expect(getRarityRank(bossItem.rarityId)).toBeGreaterThanOrEqual(getRarityRank('rare'));
    }
  });
});
