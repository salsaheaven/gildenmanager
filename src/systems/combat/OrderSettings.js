// ============================================================
// ORDERSETTINGS – fasst die gewählten Anweisungen UND Talente eines Helden zu einem Paket für den Kampf zusammen
// Das Paket hat immer alle Felder, auch wenn nichts gewählt ist. So muss der Kampf-Code
// nie prüfen, ob ein Feld fehlt. Was die Felder bedeuten, steht oben in data/heroOrders.js
// und data/talents.js (statBonus, abilityDuration, cheatDeath, groupAura).
// ============================================================

// Ein leeres Paket: nichts verändert (gilt auch für Gegner und Begleiter)
export function createEmptyOrderSettings() {
  return {
    damageDone: 0,
    damageTaken: 0,
    healingDone: 0,
    manaCost: 0,
    threat: 0,
    dodge: 0,
    targetPriority: null,
    abilityPower: {},
    abilityWhen: {},
    abilityTarget: {},
    statBonus: {},       // Wert → Anteil, z.B. { health: 0.2 }
    abilityDuration: {}, // Skill-id → zusätzliche Runden
    cheatDeath: false,   // einmal pro Kampf einen tödlichen Treffer überleben
    groupAuras: [],      // Auren für die ganze Gruppe: [{ id, damageDone, damageTaken }] (siehe applyGroupAuras)
  };
}

// effectsList = die "effects" aller gewählten Optionen.
// Zahlen werden zusammengezählt (z.B. Haltung +15 % und Eigenheit +15 % erlittener Schaden = +30 %).
export function combineOrderEffects(effectsList) {
  const settings = createEmptyOrderSettings();
  for (const effects of effectsList) {
    for (const key in effects) {
      const value = effects[key];
      if (key === 'abilityPower' || key === 'statBonus' || key === 'abilityDuration') {
        // Zahlen pro Skill bzw. Wert zusammenzählen
        for (const name in value) {
          settings[key][name] = (settings[key][name] || 0) + value[name];
        }
      } else if (key === 'cheatDeath') {
        settings.cheatDeath = settings.cheatDeath || value;
      } else if (key === 'groupAura') {
        // Auren kommen mit ihrer Talent-id über Hero.getOrderSettings in groupAuras (siehe unten)
        continue;
      } else if (key === 'abilityWhen' || key === 'abilityTarget') {
        Object.assign(settings[key], value);
      } else if (key === 'targetPriority') {
        settings.targetPriority = value;
      } else {
        settings[key] += value;
      }
    }
  }
  return settings;
}

// Zu Beginn eines Kampfes: Auren (Talente wie "Kriegsherr") wirken auf alle Helden der Gruppe.
// Dieselbe Aura (gleiche Talent-id) zählt nur einmal, auch wenn zwei Helden sie haben.
export function applyGroupAuras(heroCombatants) {
  const seen = {};
  for (const hero of heroCombatants) {
    for (const aura of hero.orderSettings.groupAuras) {
      seen[aura.id] = aura;
    }
  }
  for (const id in seen) {
    const aura = seen[id];
    for (const hero of heroCombatants) {
      hero.orderSettings.damageDone += aura.damageDone || 0;
      hero.orderSettings.damageTaken += aura.damageTaken || 0;
    }
  }
}
