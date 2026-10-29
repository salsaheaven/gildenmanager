// ============================================================
// ORDERSETTINGS – fasst die gewählten Anweisungen eines Helden zu einem Paket für den Kampf zusammen
// Das Paket hat immer alle Felder, auch wenn keine Anweisung gewählt ist. So muss der Kampf-Code
// nie prüfen, ob ein Feld fehlt. Was die Felder bedeuten, steht oben in data/heroOrders.js.
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
  };
}

// effectsList = die "effects" aller gewählten Optionen.
// Zahlen werden zusammengezählt (z.B. Haltung +15 % und Eigenheit +15 % erlittener Schaden = +30 %).
export function combineOrderEffects(effectsList) {
  const settings = createEmptyOrderSettings();
  for (const effects of effectsList) {
    for (const key in effects) {
      const value = effects[key];
      if (key === 'abilityPower') {
        for (const abilityId in value) {
          settings.abilityPower[abilityId] = (settings.abilityPower[abilityId] || 0) + value[abilityId];
        }
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
