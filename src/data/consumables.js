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
// description = kurze Erklärung der Wirkung
// effects   = Wirkung im Run (alle freiwillig):
//   resistance   = { schadensart: Prozent } zusätzliche Resistenz für alle (die Obergrenze gilt weiter)
//   restHealth   = so viel Leben (Anteil) bekommen alle nach jeder Begegnung zusätzlich zurück
//   manaAtStart  = so viel Mana (Anteil) bekommen Heiler und Zauberer zu Beginn jeder Begegnung dazu
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
    description: 'Nach jeder Begegnung +30 % Leben zusätzlich',
    effects: { restHealth: 0.3 },
  },
  {
    id: 'manaPotions', name: 'Manatränke', price: 60, stock: 'always', use: 'run', icon: '✦', color: '#5aa9ff',
    description: 'Heiler und Zauberer starten jede Begegnung mit +30 % Mana',
    effects: { manaAtStart: 0.3 },
  },
  {
    id: 'bandages', name: 'Verbandszeug', price: 50, stock: 'always', use: 'instant', icon: '✚', color: '#f2e6c8',
    description: 'Verletzung eines Helden sofort 1 Tag kürzer',
    effects: { injuryDays: 1 },
  },

  // ---------- Tagesangebot (wechselt jeden Tag) ----------
  {
    id: 'shadowWard', name: 'Schattenschutz-Trank', price: 80, stock: 'daily', use: 'run', icon: '◐', color: '#9b6bff',
    description: 'Alle Helden +15 % Schattenresistenz',
    effects: { resistance: { shadow: 15 } },
  },
  {
    id: 'acidWard', name: 'Säureschutz-Trank', price: 80, stock: 'daily', use: 'run', icon: '◐', color: '#9be15d',
    description: 'Alle Helden +15 % Säureresistenz',
    effects: { resistance: { acid: 15 } },
  },
  {
    id: 'frostWard', name: 'Frostschutz-Trank', price: 80, stock: 'daily', use: 'run', icon: '◐', color: '#8fe3ff',
    description: 'Alle Helden +15 % Eisresistenz',
    effects: { resistance: { ice: 15 } },
  },
  {
    id: 'fireWard', name: 'Feuerschutz-Trank', price: 80, stock: 'daily', use: 'run', icon: '◐', color: '#ff8c3a',
    description: 'Alle Helden +15 % Feuerresistenz',
    effects: { resistance: { fire: 15 } },
  },
  {
    id: 'lightWard', name: 'Lichtschutz-Trank', price: 80, stock: 'daily', use: 'run', icon: '◐', color: '#ffe680',
    description: 'Alle Helden +15 % Lichtresistenz',
    effects: { resistance: { light: 15 } },
  },
  {
    id: 'furyElixir', name: 'Wutelixier', price: 120, stock: 'daily', use: 'run', icon: '▲', color: '#ff3030',
    description: 'Alle Helden machen +10 % Schaden',
    effects: { damageDone: 0.1 },
  },
  {
    id: 'stoneskin', name: 'Steinhaut-Trank', price: 120, stock: 'daily', use: 'run', icon: '■', color: '#b8a58a',
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
