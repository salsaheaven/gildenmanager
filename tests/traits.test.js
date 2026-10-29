// Tests für Eigenschaften, die nach einem Run wirken: "Gierig" und "Glückspilz"

import { describe, it, expect } from 'vitest';
import { Game } from '../src/core/Game.js';
import { createTestGroup } from '../src/systems/combat/TestGroup.js';
import { getGroupGoldBonus, getGroupExtraChestItems } from '../src/systems/TraitEffects.js';
import { DUNGEONS } from '../src/data/dungeons.js';
import { getLootBoxType } from '../src/data/lootBoxes.js';
import { LootBox } from '../src/entities/LootBox.js';

// Eine starke Gruppe, die die Bärenhöhle sicher schafft. traitIds = Eigenschaften des ersten Helden
function gameWithGroup(traitIds) {
  const game = new Game(11);
  const group = createTestGroup(10);
  group.forEach((hero, index) => { hero.id = 100 + index; });
  group[0].traitIds = traitIds;
  game.guild.heroes.push(...group);
  return { game, heroIds: group.map((hero) => hero.id) };
}

describe('Eigenschaften nach dem Run', () => {
  it('Gierig: +20 % auf Boss- und Trash-Gold, mehrere Gierige stapeln sich nicht', () => {
    const group = createTestGroup(1);
    expect(getGroupGoldBonus(group).bonus).toBe(0);
    group[0].traitIds = ['greedy'];
    group[1].traitIds = ['greedy'];
    expect(getGroupGoldBonus(group).bonus).toBe(0.2);

    const { game, heroIds } = gameWithGroup(['greedy']);
    const goldBefore = game.guild.gold;
    game.startExpedition('bearCave', heroIds, 'never');
    const report = game.endDay()[0];
    const normalGold = DUNGEONS[0].rewards.gold + DUNGEONS[0].rewards.trashGold;
    expect(report.bonusGold).toBe(Math.round(normalGold * 0.2));
    expect(report.bonusGoldHero).toBe(game.guild.heroes[0].name);
    // Abends wird außerdem der Sold bezahlt
    expect(game.guild.gold).toBe(goldBefore + normalGold + report.bonusGold - game.lastDaySummary.wages.paid);
  });

  it('Glückspilz: 1 Item mehr in der Boss-Kiste', () => {
    expect(getGroupExtraChestItems(createTestGroup(1)).bonus).toBe(0);

    const { game, heroIds } = gameWithGroup(['lucky']);
    game.startExpedition('bearCave', heroIds, 'never');
    const report = game.endDay()[0];
    expect(report.chestBonusItems).toBe(1);
    const items = game.openBox(report.chest);
    expect(items.length).toBe(getLootBoxType(report.chest).itemCount + 1);
  });

  it('ohne solche Helden gibt es keinen Bonus', () => {
    const { game, heroIds } = gameWithGroup([]);
    game.startExpedition('bearCave', heroIds, 'never');
    const report = game.endDay()[0];
    expect(report.bonusGold).toBe(0);
    expect(report.chestBonusItems).toBe(0);
  });

  it('die Kiste merkt sich ihre Bonus-Items im Spielstand', () => {
    const box = LootBox.fromSaveData(new LootBox('chestGrimfang', 3, 1).toSaveData());
    expect(box.bonusItems).toBe(1);
    expect(box.itemLevel).toBe(3);
  });
});
