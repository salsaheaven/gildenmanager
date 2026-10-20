// ============================================================
// AUFGABEN – was ein Held an einem Tag tun kann (1 Aufgabe pro Held und Tag)
//
// name        = Anzeige im Tagesplan
// description = kurze Erklärung
// color       = Farbe des Aufgaben-Schilds
//
// Später kommen hier weitere Aufgaben dazu, z.B. Farmen oder Kräuter sammeln.
// ============================================================

export const HERO_TASKS = {
  dungeon: {
    name: 'Dungeon',
    description: 'Kämpft heute mit seiner Gruppe im Dungeon',
    color: '#ffd23f',
  },
  injured: {
    name: 'Kuriert sich aus',
    description: 'Ist verletzt und kann heute nicht kämpfen',
    color: '#ff6b6b',
  },
  rest: {
    name: 'Ruht sich aus',
    description: 'Hat heute keine Aufgabe',
    color: '#8f86a3',
  },
};
