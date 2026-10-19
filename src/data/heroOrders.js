// ============================================================
// ANWEISUNGEN – was man jedem Helden vor dem Kampf vorgeben kann
// Pro Klasse eine Liste von Anweisungen, jede mit mehreren Optionen.
// Die ERSTE Option ist immer die Standard-Einstellung.
//
// effects einer Option (alle freiwillig):
//   healThreshold  = heilt, wenn jemand unter diesen Anteil Leben fällt (statt der Taktik)
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
        { id: 'tactic', label: 'Wie die Taktik', effects: {} },
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
};

// Anweisungen einer Klasse (leere Liste, wenn die Klasse noch keine hat)
export function getOrdersForClass(classId) {
  return HERO_ORDERS[classId] || [];
}
