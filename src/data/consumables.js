// ============================================================
// VERBRAUCHSGÜTER – was der Händler verkauft (Tränke, Elixiere, Verbandszeug)
// Gekaufte Waren liegen in der Vorratskammer der Gilde. Beim Einplanen nimmt eine Gruppe
// bis zu SUPPLY_SLOTS Waren mit. Sie wirken auf alle Helden der Gruppe, einen ganzen Run lang,
// und sind danach verbraucht (auch wenn der Run scheitert).
// Bewusst nicht billig: Ein Trank kostet am Anfang etwa so viel, wie ein Run in der Bärenhöhle einbringt.
//
// id        = interner Name
// name      = Anzeigename
// price     = Preis in Gold
// stock     = 'always': Grundware, gibt es immer; 'daily': nur, wenn sie im Tagesangebot ist
// use       = 'run': wird beim Einplanen mitgenommen; 'instant': wirkt sofort (z.B. auf einen verletzten Helden)
// icon      = Zeichen für die Anzeige
// color     = Farbe für die Anzeige
// strongAt  = wobei die Ware besonders hilft (Anzeige beim Händler, im Alchemielabor und in Tipps)
// advice    = für den Tränke-Ratgeber (systems/SupplyAdvice.js): value = wie stark die Ware allgemein hilft
//             (0 = nur in ihrer Nische), helpsAgainst = Ursachen aus "Woran es lag", gegen die sie hilft
//             ('attack', 'mechanic', 'minion', 'enrage', 'outOfMana'). Schutztränke zählen nur, wenn ihre
//             Schadensart im Dungeon bekannt ist.
// description = kurze Erklärung der Wirkung
// effects   = Wirkung im Run (alle freiwillig):
//   resistance   = { schadensart: Prozent } zusätzliche Resistenz für alle (die Obergrenze gilt weiter)
//   restHealth   = so viel Leben (Anteil) bekommen alle nach jeder Begegnung zusätzlich zurück
//   manaAtStart  = so viel Mana (Anteil) bekommen Heiler und Zauberer zu Beginn jeder Begegnung dazu
//   emergencyHeal = Notfall-Heiltrank: { below, amount } – fällt ein Held unter "below" seines Lebens,
//                   trinkt er zu Beginn der nächsten Runde und bekommt "amount" seines Lebens zurück (einmal pro Begegnung)
//   emergencyMana = Notfall-Manatrank: { below, amount } – dasselbe für Mana (nur Helden mit Mana)
//   damageDone   = Schaden aller Helden (0.1 = +10 %)
//   damageTaken  = erlittener Schaden aller Helden (-0.1 = −10 %)
//   injuryDays   = nur 'instant': so viele Tage kürzer ist eine Verletzung
// ============================================================

// So viele Waren darf eine Gruppe in einen Run mitnehmen
export const SUPPLY_SLOTS = 2;

// So viele Waren mit stock 'daily' bietet der Händler jeden Tag an
export const DAILY_OFFER_COUNT = 3;

export const CONSUMABLES = [
  // ---------- Grundware (immer da) ----------
  {
    id: 'healingPotions', name: 'Heiltränke', price: 60, stock: 'always', use: 'run', icon: '❤', color: '#ff6b6b',
    strongAt: 'Gruppen, denen Helden wegsterben',
    advice: { value: 1, helpsAgainst: ['attack', 'mechanic'] },
    description: 'Fällt ein Held unter 50 % Leben, trinkt er: +50 % Leben (einmal pro Begegnung)',
    effects: { emergencyHeal: { below: 0.5, amount: 0.5 } },
  },
  {
    id: 'manaPotions', name: 'Manatränke', price: 60, stock: 'always', use: 'run', icon: '✦', color: '#5aa9ff',
    strongAt: 'lange Kämpfe, in denen den Heilern das Mana ausgeht',
    advice: { value: 0, helpsAgainst: ['outOfMana'] },
    description: 'Fällt ein Heiler oder Zauberer unter 30 % Mana, trinkt er: +60 % Mana (einmal pro Begegnung)',
    effects: { emergencyMana: { below: 0.3, amount: 0.6 } },
  },
  {
    id: 'bandages', name: 'Verbandszeug', price: 50, stock: 'always', use: 'instant', icon: '✚', color: '#f2e6c8',
    strongAt: 'verletzte Helden schneller zurück in die Gruppe',
    advice: { value: 0, helpsAgainst: [] },
    description: 'Verletzung eines Helden sofort 1 Tag kürzer',
    effects: { injuryDays: 1 },
  },

  // ---------- Tagesangebot (wechselt jeden Tag) ----------
  {
    id: 'shadowWard', name: 'Schattenschutz-Trank', price: 80, stock: 'daily', use: 'run', icon: '◐', color: '#9b6bff',
    strongAt: 'Dungeons mit Schattenschaden',
    advice: { value: 2, helpsAgainst: [] },
    description: 'Alle Helden +15 % Schattenresistenz',
    effects: { resistance: { shadow: 15 } },
  },
  {
    id: 'acidWard', name: 'Säureschutz-Trank', price: 80, stock: 'daily', use: 'run', icon: '◐', color: '#9be15d',
    strongAt: 'Dungeons mit Säureschaden',
    advice: { value: 2, helpsAgainst: [] },
    description: 'Alle Helden +15 % Säureresistenz',
    effects: { resistance: { acid: 15 } },
  },
  {
    id: 'frostWard', name: 'Frostschutz-Trank', price: 80, stock: 'daily', use: 'run', icon: '◐', color: '#8fe3ff',
    strongAt: 'Dungeons mit Eisschaden',
    advice: { value: 2, helpsAgainst: [] },
    description: 'Alle Helden +15 % Eisresistenz',
    effects: { resistance: { ice: 15 } },
  },
  {
    id: 'fireWard', name: 'Feuerschutz-Trank', price: 80, stock: 'daily', use: 'run', icon: '◐', color: '#ff8c3a',
    strongAt: 'Dungeons mit Feuerschaden',
    advice: { value: 2, helpsAgainst: [] },
    description: 'Alle Helden +15 % Feuerresistenz',
    effects: { resistance: { fire: 15 } },
  },
  {
    id: 'lightWard', name: 'Lichtschutz-Trank', price: 80, stock: 'daily', use: 'run', icon: '◐', color: '#ffe680',
    strongAt: 'Dungeons mit Lichtschaden',
    advice: { value: 2, helpsAgainst: [] },
    description: 'Alle Helden +15 % Lichtresistenz',
    effects: { resistance: { light: 15 } },
  },
  {
    id: 'furyElixir', name: 'Wutelixier', price: 120, stock: 'daily', use: 'run', icon: '▲', color: '#ff3030',
    strongAt: 'Bosse, die in Raserei geraten, weil der Kampf zu lange dauert',
    advice: { value: 3, helpsAgainst: ['enrage', 'minion'] },
    description: 'Alle Helden machen +10 % Schaden',
    effects: { damageDone: 0.1 },
  },
  {
    id: 'stoneskin', name: 'Steinhaut-Trank', price: 120, stock: 'daily', use: 'run', icon: '■', color: '#b8a58a',
    strongAt: 'harte Treffer auf Tank und Gruppe',
    advice: { value: 3, helpsAgainst: ['attack', 'mechanic', 'minion'] },
    description: 'Alle Helden nehmen −10 % Schaden',
    effects: { damageTaken: -0.1 },
  },
];

export function getConsumable(consumableId) {
  const consumable = CONSUMABLES.find((entry) => entry.id === consumableId);
  if (!consumable) {
    throw new Error('Unbekanntes Verbrauchsgut: ' + consumableId);
  }
  return consumable;
}
