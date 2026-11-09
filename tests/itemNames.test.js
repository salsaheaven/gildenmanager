// Tests für Item-Namen: Nach einem Sprachwechsel werden sie aus ihren Bausteinen neu gebaut.
// (Diese Datei stellt die Daten auf Englisch um; Vitest lädt jede Testdatei getrennt, andere Tests bleiben deutsch.)

import { describe, it, expect } from 'vitest';
import { Random } from '../src/core/Random.js';
import { Guild } from '../src/entities/Guild.js';
import { LootSystem } from '../src/systems/LootSystem.js';
import { getItemName } from '../src/systems/ItemNames.js';
import { getItemTemplate } from '../src/data/items.js';
import { getLootBoxType } from '../src/data/lootBoxes.js';
import { applyDataLanguage } from '../src/core/DataLanguage.js';

describe('Item-Namen', () => {
  it('werden nach dem Wechsel auf Englisch neu gebaut (normale Items und Boss-Items)', () => {
    const lootSystem = new LootSystem(new Random(3));
    const sword = lootSystem.createItem('rare', 1, 1, getItemTemplate('sword'));
    expect(sword.name.startsWith('Schwert ')).toBe(true);
    expect(sword.suffixIndex).not.toBe(null);
    const bossItems = lootSystem.rollBoxContents(getLootBoxType('chestGrimfang'), new Guild());
    const bossItem = bossItems.find((item) => item.bossItemId);

    applyDataLanguage('en');
    expect(getItemName(sword).startsWith('Sword of the ')).toBe(true);
    expect(['Grimfang\'s Fang', 'Bearhide Armor', 'Paw Helm']).toContain(getItemName(bossItem));
  });
});
