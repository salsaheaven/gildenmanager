// ============================================================
// MESSHILFEN – gemeinsame Bausteine für die Mess-Werkzeuge in tools/
// Die Werkzeuge benutzen die echte Spiellogik aus src/, keine Nachbauten.
// ============================================================

import { simulateRun } from '../src/systems/combat/CombatSimulator.js';
import { Hero } from '../src/entities/Hero.js';
import { LootSystem } from '../src/systems/LootSystem.js';
import { Random } from '../src/core/Random.js';
import { getItemTemplate } from '../src/data/items.js';

// Welche Waffen und Nebenhand-Items jede Klasse zum Messen bekommt
const WEAPONS_BY_CLASS = {
  warrior: ['sword', 'shield'],
  priest: ['staff'],
  runeweaver: ['staff', 'shield'],
  mage: ['staff'],
  rogue: ['sword'],
};
const ARMOR_SLOTS = ['helmet', 'armor', 'boots', 'ring'];

// Die Standardgruppe: je ein Held jeder Klasse
export const STANDARD_GROUP = ['warrior', 'priest', 'runeweaver', 'mage', 'rogue'];

// Baut eine Testgruppe.
// classIds  = Liste von Klassen, doppelte sind erlaubt (z.B. zwei Schurken)
// level     = Level aller Helden
// itemLevel = 0: ohne Ausrüstung, sonst grüne Ausrüstung mit diesem Item-Level in allen Plätzen
export function createGroup(classIds, level, itemLevel = 0) {
  // Fester Seed: Jede Gruppe bekommt bei gleichen Angaben genau dieselbe Ausrüstung
  const lootSystem = new LootSystem(new Random(5));
  let itemId = 1;
  const group = [];
  for (let i = 0; i < classIds.length; i++) {
    const classId = classIds[i];
    const hero = new Hero(-(i + 1), 'Test ' + (i + 1), classId, 'uncommon', [], { skin: '#f1c39b', hair: '#6b3f17' });
    hero.level = level;
    if (itemLevel > 0) {
      for (const templateId of WEAPONS_BY_CLASS[classId].concat(ARMOR_SLOTS)) {
        const item = lootSystem.createItem('uncommon', itemId, itemLevel, getItemTemplate(templateId));
        itemId++;
        if (hero.canEquip(item)) {
          hero.equip(item);
        }
      }
    }
    group.push(hero);
  }
  return group;
}

// Lässt eine Gruppe viele Male durch einen Dungeon laufen.
// Alle Messungen benutzen dieselben Seeds (1, 7920, 15839 …). So vergleicht man zwei Varianten
// mit genau denselben Zufallszahlen, und Unterschiede kommen von der Variante, nicht vom Glück.
// orders = { klassen-id: { anweisungs-id: options-id } }, gilt für alle Helden dieser Klasse
// Ergebnis: { win, fall, rounds } = Siege in %, Runs mit Gefallenen in %, Ø Kampfrunden pro Run
export function measureRuns(options) {
  const runs = options.runs || 300;
  let wins = 0;
  let runsWithFallen = 0;
  let rounds = 0;
  for (let i = 0; i < runs; i++) {
    const group = createGroup(options.classIds, options.level, options.itemLevel || 0);
    const orders = options.orders || {};
    for (const hero of group) {
      const heroOrders = orders[hero.classId] || {};
      for (const orderId in heroOrders) {
        hero.setOrder(orderId, heroOrders[orderId]);
      }
    }
    const result = simulateRun({ heroes: group, dungeonId: options.dungeonId, seed: 1 + i * 7919 });
    if (result.outcome === 'success') {
      wins++;
    }
    if (result.heroes.some((hero) => !hero.alive)) {
      runsWithFallen++;
    }
    for (const encounter of result.encounters) {
      rounds += encounter.rounds;
    }
  }
  return {
    win: Math.round((wins / runs) * 100),
    fall: Math.round((runsWithFallen / runs) * 100),
    rounds: rounds / runs,
  };
}

// Zahl mit Vorzeichen, z.B. "+5" oder "-12"
export function signed(number) {
  return (number >= 0 ? '+' : '') + number;
}
