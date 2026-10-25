// ============================================================
// ANWEISUNGEN – was man jedem Helden vor dem Kampf vorgeben kann
// Pro Klasse eine Liste von Anweisungen, jede mit mehreren Optionen.
// Die ERSTE Option ist immer die Standard-Einstellung.
//
// effects einer Option (alle freiwillig):
//   healThreshold  = heilt, wenn jemand unter diesen Anteil Leben fällt (statt des Standards aus combatRules.js)
//   targetPriority = 'boss': Schaden zuerst auf den Boss statt auf Diener
//   manaReserve    = Anteil Mana, der für Notfälle aufgehoben wird (keine Schadens-Skills darunter)
//   abilityWhen    = { skill-id: Bedingung } ersetzt die Bedingung eines Skills
//                    (Bedingungen siehe systems/combat/HeroAI.js)
// ============================================================

const TARGET_ORDER = {
  id: 'targetPriority',
  name: 'Ziel',
  options: [
    { id: 'minions', label: 'Diener zuerst', effects: {} },
    { id: 'boss', label: 'Boss zuerst', effects: { targetPriority: 'boss' } },
  ],
};

export const HERO_ORDERS = {
  warrior: [
    {
      id: 'ironWatchUse',
      name: 'Eiserne Wacht',
      options: [
        { id: 'smart', label: 'Große Schläge + wenig Leben', effects: {} },
        { id: 'buster', label: 'Nur bei großen Schlägen', effects: { abilityWhen: { ironWatch: 'busterIncoming' } } },
        { id: 'asap', label: 'Sofort, wenn bereit', effects: { abilityWhen: { ironWatch: 'ready' } } },
      ],
    },
    {
      id: 'tauntUse',
      name: 'Herausforderungsruf',
      options: [
        { id: 'onLoss', label: 'Wenn er die Aggro verliert', effects: {} },
        { id: 'never', label: 'Nie', effects: { abilityWhen: { challengingShout: 'never' } } },
      ],
    },
  ],

  priest: [
    {
      id: 'healThreshold',
      name: 'Heilen ab',
      options: [
        { id: 'normal', label: 'Normal (unter 60 %)', effects: {} },
        { id: 'early', label: 'Früh (unter 80 %)', effects: { healThreshold: 0.8 } },
        { id: 'late', label: 'Spät (unter 40 %)', effects: { healThreshold: 0.4 } },
      ],
    },
    {
      id: 'devotionUse',
      name: 'Stille Andacht',
      options: [
        { id: 'low', label: 'Bei 30 % Mana', effects: {} },
        { id: 'half', label: 'Schon bei 50 % Mana', effects: { abilityWhen: { silentDevotion: 'halfMana' } } },
      ],
    },
  ],

  runeweaver: [
    {
      id: 'runeArmorUse',
      name: 'Runenpanzer',
      options: [
        { id: 'always', label: 'Tank immer schützen', effects: {} },
        { id: 'buster', label: 'Nur vor großen Schlägen', effects: { abilityWhen: { runeArmor: 'busterIncoming' } } },
      ],
    },
    {
      id: 'glyphUse',
      name: 'Glyphenkreis',
      options: [
        { id: 'smart', label: 'Bei Gefahr für die Gruppe', effects: {} },
        { id: 'incoming', label: 'Nur vor Gruppenschaden', effects: { abilityWhen: { glyphCircle: 'groupHitIncoming' } } },
      ],
    },
  ],

  mage: [
    TARGET_ORDER,
    {
      id: 'frostUse',
      name: 'Eiskranz',
      options: [
        { id: 'cast', label: 'Bei Boss-Zaubern', effects: {} },
        { id: 'adds', label: 'Ab 3 Gegnern', effects: { abilityWhen: { iceWreath: 'manyEnemies' } } },
        { id: 'asap', label: 'Sofort, wenn bereit', effects: { abilityWhen: { iceWreath: 'ready' } } },
      ],
    },
    {
      id: 'manaUse',
      name: 'Mana',
      options: [
        { id: 'free', label: 'Frei einsetzen', effects: {} },
        { id: 'save', label: '30 % aufheben', effects: { manaReserve: 0.3 } },
      ],
    },
  ],

  rogue: [
    TARGET_ORDER,
    {
      id: 'poisonUse',
      name: 'Natternbiss',
      options: [
        { id: 'keep', label: 'Immer aufrechterhalten', effects: {} },
        { id: 'never', label: 'Nie', effects: { abilityWhen: { viperBite: 'never' } } },
      ],
    },
  ],

  paladin: [
    {
      id: 'divineShieldUse',
      name: 'Gottesschild',
      options: [
        { id: 'buster', label: 'Vor einem großen Schlag', effects: {} },
        { id: 'low', label: 'Wenn er wenig Leben hat', effects: { abilityWhen: { divineShield: 'selfLow' } } },
      ],
    },
    {
      id: 'oathUse',
      name: 'Schwur der Standhaftigkeit',
      options: [
        { id: 'keep', label: 'Immer aufrechterhalten', effects: {} },
        { id: 'incoming', label: 'Nur vor Gruppenschaden', effects: { abilityWhen: { oathOfSteadfastness: 'groupHitIncoming' } } },
      ],
    },
  ],

  monk: [
    {
      id: 'flowingGuardUse',
      name: 'Fließende Abwehr',
      options: [
        { id: 'hurt', label: 'Wenn er angeschlagen ist', effects: {} },
        { id: 'asap', label: 'Sofort, wenn bereit', effects: { abilityWhen: { flowingGuard: 'ready' } } },
      ],
    },
  ],

  druid: [
    {
      id: 'healThreshold',
      name: 'Heilen ab',
      options: [
        { id: 'normal', label: 'Normal (unter 60 %)', effects: {} },
        { id: 'early', label: 'Früh (unter 80 %)', effects: { healThreshold: 0.8 } },
        { id: 'late', label: 'Spät (unter 40 %)', effects: { healThreshold: 0.4 } },
      ],
    },
  ],

  samurai: [
    TARGET_ORDER,
    {
      id: 'iaiUse',
      name: 'Iaido-Erstschlag',
      options: [
        { id: 'asap', label: 'Sofort', effects: {} },
        { id: 'boss', label: 'Für den Boss aufheben', effects: { abilityWhen: { iaiStrike: 'onBoss' } } },
      ],
    },
  ],

  barbarian: [
    TARGET_ORDER,
  ],

  hunter: [
    TARGET_ORDER,
    {
      id: 'netUse',
      name: 'Fangnetz',
      options: [
        { id: 'minions', label: 'Diener festhalten', effects: {} },
        { id: 'never', label: 'Nie', effects: { abilityWhen: { snareNet: 'never' } } },
      ],
    },
  ],

  warlock: [
    TARGET_ORDER,
    {
      id: 'manaUse',
      name: 'Mana',
      options: [
        { id: 'free', label: 'Frei einsetzen', effects: {} },
        { id: 'save', label: '30 % aufheben', effects: { manaReserve: 0.3 } },
      ],
    },
  ],

  bard: [
    {
      id: 'songUse',
      name: 'Lied der Klingen',
      options: [
        { id: 'always', label: 'In jedem Kampf', effects: {} },
        { id: 'boss', label: 'Nur im Bosskampf', effects: { abilityWhen: { songOfBlades: 'bossFightBuffMissing' } } },
      ],
    },
  ],

  shaman: [
    {
      id: 'bloodlustUse',
      name: 'Kampfrausch',
      options: [
        { id: 'boss', label: 'Im Bosskampf', effects: {} },
        { id: 'asap', label: 'In jedem Kampf sofort', effects: { abilityWhen: { bloodlust: 'groupBuffMissing' } } },
      ],
    },
  ],

  chronomancer: [
    {
      id: 'timeStopUse',
      name: 'Zeitstillstand',
      options: [
        { id: 'cast', label: 'Bei Boss-Zaubern', effects: {} },
        { id: 'asap', label: 'Sofort, wenn bereit', effects: { abilityWhen: { timeStop: 'ready' } } },
      ],
    },
  ],
};

// Anweisungen einer Klasse (leere Liste, wenn die Klasse noch keine hat)
export function getOrdersForClass(classId) {
  return HERO_ORDERS[classId] || [];
}
