// Siegchance pro Dungeon je Heldenlevel, und Wirkung jeder Anweisung (ganzer Run, 300 Seeds)
import { simulateRun } from './src/systems/combat/CombatSimulator.js';
import { createTestGroup } from './src/systems/combat/TestGroup.js';
import { HERO_ORDERS } from './src/data/heroOrders.js';
import { DUNGEONS } from './src/data/dungeons.js';
import { LootSystem } from './src/systems/LootSystem.js';
import { Random } from './src/core/Random.js';

const N = 300;
function gear(group, itemLevel, rarity) {
  const ls = new LootSystem(new Random(5));
  const map = { warrior: ['sword', 'shield'], priest: ['staff'], runeweaver: ['staff', 'shield'], mage: ['staff'], rogue: ['sword'] };
  let id = 1;
  for (const h of group) {
    if (!rarity) continue;
    for (const t of [...map[h.classId], 'helmet', 'armor', 'boots', 'ring']) {
      const tpl = { sword: 'sword', staff: 'staff', shield: 'shield', helmet: 'helmet', armor: 'armor', boots: 'boots', ring: 'ring' }[t];
      const it = ls.createItem(rarity, id++, itemLevel, (await_tpl(tpl)));
      if (h.canEquip(it)) h.equip(it);
    }
  }
}
import { getItemTemplate } from './src/data/items.js';
function await_tpl(id) { return getItemTemplate(id); }

function rate(dungeonId, level, rarity, itemLevel, orders = {}) {
  let win = 0, anyFall = 0;
  for (let i = 0; i < N; i++) {
    const group = createTestGroup(level);
    gear(group, itemLevel, rarity);
    for (const h of group) for (const k in (orders[h.classId] || {})) h.setOrder(k, orders[h.classId][k]);
    const r = simulateRun({ heroes: group, dungeonId, seed: 1 + i * 7919 });
    if (r.outcome === 'success') win++;
    if (r.heroes.some((h) => !h.alive)) anyFall++;
  }
  return [Math.round(win / N * 100), Math.round(anyFall / N * 100)];
}

console.log('== Siegchance (Erfolg %, Run mit Gefallenen %) je Heldenlevel, grüne Ausrüstung der Dungeon-Stufe ==');
for (const d of DUNGEONS) {
  const row = [];
  for (const L of [1, 2, 3, 4, 5, 6, 7]) row.push('L' + L + ':' + rate(d.id, L, 'uncommon', d.level).join('/'));
  console.log(d.id.padEnd(13), row.join('  '));
}
console.log('\n== Anweisungen: Abweichung zur Standard-Option (Erfolg-Prozentpunkte), Gruppe Stufe-1 unter Dungeon-Stufe, grün ==');
for (const d of DUNGEONS) {
  const L = Math.max(1, d.level - 1);
  const base = rate(d.id, L, 'uncommon', Math.max(1, d.level - 2))[0];
  const out = [];
  for (const cls in HERO_ORDERS) {
    for (const order of HERO_ORDERS[cls]) {
      for (const opt of order.options.slice(1)) {
        const r = rate(d.id, L, 'uncommon', Math.max(1, d.level - 2), { [cls]: { [order.id]: opt.id } })[0];
        out.push(cls + '.' + order.id + '=' + opt.id + ':' + (r - base >= 0 ? '+' : '') + (r - base));
      }
    }
  }
  console.log(d.id, 'Basis', base + '%\n  ' + out.join('\n  '));
}
