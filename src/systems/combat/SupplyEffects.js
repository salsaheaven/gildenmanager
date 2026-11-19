// ============================================================
// SUPPLYEFFECTS – was die mitgenommenen Vorräte (Verbrauchsgüter) im Run bewirken
// Fasst die Wirkungen aller Vorräte einer Gruppe zusammen und wendet sie auf die Kämpfer an.
// Die Waren und Zahlen stehen in data/consumables.js. Benutzt von simulateRun.
// ============================================================

import { getConsumable } from '../../data/consumables.js';
import { MAX_RESISTANCE } from '../../data/damageTypes.js';

// Ein Paket ohne Wirkung (keine Vorräte)
export function createEmptySupplyEffects() {
  return { resistance: {}, restHealth: 0, manaAtStart: 0, damageDone: 0, damageTaken: 0, emergencyHeal: null, emergencyMana: null };
}

// supplyIds = Liste von Verbrauchsgut-ids. Gleiche Wirkungen werden zusammengezählt.
export function combineSupplyEffects(supplyIds) {
  const combined = createEmptySupplyEffects();
  for (const supplyId of supplyIds) {
    const effects = getConsumable(supplyId).effects;
    for (const damageType in effects.resistance || {}) {
      combined.resistance[damageType] = (combined.resistance[damageType] || 0) + effects.resistance[damageType];
    }
    combined.restHealth += effects.restHealth || 0;
    combined.manaAtStart += effects.manaAtStart || 0;
    combined.damageDone += effects.damageDone || 0;
    combined.damageTaken += effects.damageTaken || 0;
    combined.emergencyHeal = addEmergencyPotion(combined.emergencyHeal, effects.emergencyHeal);
    combined.emergencyMana = addEmergencyPotion(combined.emergencyMana, effects.emergencyMana);
  }
  return combined;
}

// Zwei gleiche Notfall-Tränke: die Mengen zählen zusammen, es gilt die höhere Grenze
function addEmergencyPotion(current, extra) {
  if (!extra) {
    return current;
  }
  if (!current) {
    return { ...extra };
  }
  return { below: Math.max(current.below, extra.below), amount: current.amount + extra.amount };
}

// Zu Beginn des Runs: Resistenzen und Schaden auf jeden Helden-Kämpfer legen.
// Schaden und erlittener Schaden wirken wie eine Anweisung (siehe OrderSettings.js).
export function applySupplyEffects(heroCombatants, supplyEffects) {
  for (const hero of heroCombatants) {
    for (const damageType in supplyEffects.resistance) {
      const total = (hero.resistances[damageType] || 0) + supplyEffects.resistance[damageType];
      hero.resistances = { ...hero.resistances, [damageType]: Math.min(MAX_RESISTANCE, total) };
    }
    hero.orderSettings.damageDone += supplyEffects.damageDone;
    hero.orderSettings.damageTaken += supplyEffects.damageTaken;
    // Notfall-Tränke merkt sich der Kämpfer, getrunken wird im Kampf (siehe drinkEmergencyPotions)
    hero.emergencyHeal = supplyEffects.emergencyHeal;
    hero.emergencyMana = supplyEffects.emergencyMana;
  }
}

// Zu Beginn jeder Runde: Ein Held unter der Grenze trinkt seinen Notfall-Trank (einmal pro Begegnung).
// Gibt zurück, was getrunken wurde: [{ kind: 'heal' oder 'mana', amount }] (für Kampfbericht und Szene).
export function drinkEmergencyPotions(hero) {
  const drunk = [];
  if (!hero.alive) {
    return drunk;
  }
  const heal = hero.emergencyHeal;
  if (heal && !hero.usedOnce.emergencyHeal && hero.hp < hero.maxHp * heal.below) {
    hero.usedOnce.emergencyHeal = true;
    drunk.push({ kind: 'heal', amount: hero.heal(hero.maxHp * heal.amount) });
  }
  const mana = hero.emergencyMana;
  if (mana && hero.maxMana > 0 && !hero.usedOnce.emergencyMana && hero.mana < hero.maxMana * mana.below) {
    hero.usedOnce.emergencyMana = true;
    const before = hero.mana;
    hero.mana = Math.min(hero.maxMana, hero.mana + hero.maxMana * mana.amount);
    drunk.push({ kind: 'mana', amount: Math.round(hero.mana - before) });
  }
  return drunk;
}

// Vor jeder Begegnung (auch der ersten): Manatränke füllen Mana auf
export function applyManaAtStart(heroCombatants, supplyEffects) {
  if (supplyEffects.manaAtStart <= 0) {
    return;
  }
  for (const hero of heroCombatants) {
    if (hero.alive && hero.maxMana > 0) {
      hero.mana = Math.min(hero.maxMana, hero.mana + hero.maxMana * supplyEffects.manaAtStart);
    }
  }
}

// Nach jeder Begegnung: Heiltränke geben zusätzlich Leben zurück
export function applyRestHealth(heroCombatants, supplyEffects) {
  if (supplyEffects.restHealth <= 0) {
    return;
  }
  for (const hero of heroCombatants) {
    if (hero.alive) {
      hero.heal(hero.maxHp * supplyEffects.restHealth);
    }
  }
}
