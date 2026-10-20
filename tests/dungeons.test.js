// Tests für Dungeons: Runs, Trash, Rückzug, Tagesplanung, Belohnungen, Speichern.

import { describe, it, expect } from 'vitest';
import { simulateRun } from '../src/systems/combat/CombatSimulator.js';
import { createTestGroup } from '../src/systems/combat/TestGroup.js';
import { DUNGEONS } from '../src/data/dungeons.js';
import { MINIONS, getBoss } from '../src/data/enemies.js';
import { getLootBoxType } from '../src/data/lootBoxes.js';
import { getRarityRank } from '../src/data/rarities.js';
import { Game } from '../src/core/Game.js';
import { Expedition } from '../src/entities/Expedition.js';
import { getItemTemplate } from '../src/data/items.js';
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

});

describe('Expeditionen (Tagesplanung)', () => {
  it('Run einplanen, Tag beenden, Belohnung bekommen', () => {
    const { game, heroIds } = gameWithGroup(10);
    const goldBefore = game.guild.gold;
    expect(game.startExpedition('bearCave', heroIds, 'never')).toBe('ok');
    expect(game.guild.isHeroBusy(heroIds[0])).toBe(true);
    // Eingeplant heißt noch nicht gekämpft: Erst das Tagesende bringt das Ergebnis
    expect(game.guild.reports.length).toBe(0);

    const reports = game.endDay();

    expect(reports.length).toBe(1);
    expect(reports[0].outcome).toBe('success');
    expect(reports[0].day).toBe(1);
    expect(game.guild.gold).toBe(goldBefore + DUNGEONS[0].rewards.gold);
    expect(game.guild.countBoxes('chestGrimfang')).toBe(1);
    expect(game.guild.getClears('bearCave')).toBe(1);
    expect(game.guild.isHeroBusy(heroIds[0])).toBe(false);
  });

  it('gesperrte Dungeons und Helden, die heute schon eingeplant sind', () => {
    const { game, heroIds } = gameWithGroup(10);
    expect(game.startExpedition('ruinedChapel', heroIds, 'never')).toBe('locked');
    game.startExpedition('bearCave', heroIds, 'never');
    // Ein Held = eine Aufgabe pro Tag
    expect(game.startExpedition('bearCave', heroIds, 'never')).toBe('busy');
    // Eingeplante Helden kann man nicht entlassen
    expect(game.dismissHero(heroIds[0])).toBe(false);
  });

  it('eingeplante Helden kämpfen mit der Ausrüstung, die sie am Tagesende tragen', () => {
    const { game, heroIds } = gameWithGroup(1);
    game.startExpedition('bearCave', heroIds, 'never');
    // Nach dem Einplanen bekommt der Krieger noch ein Schwert
    const sword = game.lootSystem.createItem('rare', game.guild.createItemId(), 1, getItemTemplate('sword'));
    game.guild.addItem(sword);
    expect(game.equipItem(heroIds[0], sword.id)).toBe(true);
    const reports = game.endDay();
    const snapshot = reports[0].expedition.heroSnapshots.find((data) => data.id === heroIds[0]);
    expect(snapshot.equipment.weapon.id).toBe(sword.id);
  });

  it('einen geplanten Run absagen', () => {
    const { game, heroIds } = gameWithGroup(10);
    game.startExpedition('bearCave', heroIds, 'never');
    expect(game.cancelExpedition(game.guild.expeditions[0].id)).toBe(true);
    expect(game.guild.isHeroBusy(heroIds[0])).toBe(false);
    expect(game.endDay().length).toBe(0);
  });

  it('nach dem ersten Erfolg ist der nächste Dungeon frei', () => {
    const { game, heroIds } = gameWithGroup(10);
    game.startExpedition('bearCave', heroIds, 'never');
    game.endDay();
    expect(game.isDungeonUnlocked('ruinedChapel')).toBe(true);
  });

  it('ein geplanter Run übersteht Speichern und Laden', () => {
    const { game, heroIds } = gameWithGroup(1);
    game.startExpedition('bearCave', heroIds, 'never');
    const loaded = Game.fromSaveData(JSON.parse(JSON.stringify(game.toSaveData())));
    expect(loaded.guild.expeditions[0].getHeroIds()).toEqual(heroIds);
    // Beide kämpfen mit demselben Zufall: gleiches Ergebnis
    expect(loaded.endDay()[0].outcome).toBe(game.endDay()[0].outcome);
  });

  it('der Bericht lässt sich nach dem Laden genau gleich ansehen', () => {
    const { game, heroIds } = gameWithGroup(1);
    game.startExpedition('bearCave', heroIds, 'never');
    const report = game.endDay()[0];
    const copy = Expedition.fromSaveData(JSON.parse(JSON.stringify(report.expedition)));
    expect(copy.getResult().outcome).toBe(report.outcome);
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
