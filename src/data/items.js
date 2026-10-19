// ============================================================
// ITEM-VORLAGEN
// Jede Vorlage beschreibt eine Art von Gegenstand. Wenn ein Item gedroppt wird,
// wird eine Vorlage zufällig gewählt und mit der Seltenheit verrechnet.
//
// id            = interner Name
// name          = Grundname im Spiel
// legendaryName = besonderer Name, wenn das Item legendär ist
// slot          = wo der Held es trägt (Waffe, Kopf, Brust …)
// sprite        = welches Pixelbild aus sprites.js benutzt wird
// stats         = Grundwerte (werden mit der Seltenheit multipliziert)
// ============================================================

export const ITEM_TEMPLATES = [
  { id: 'sword',  name: 'Schwert', legendaryName: 'Morgenröte',               slot: 'weapon',  sprite: 'sword',  stats: { attack: 6 } },
  { id: 'staff',  name: 'Stab',    legendaryName: 'Stab der tausend Sterne',  slot: 'weapon',  sprite: 'staff',  stats: { magic: 7, mana: 15 } },
  { id: 'shield', name: 'Schild',  legendaryName: 'Bollwerk der Ewigkeit',    slot: 'offhand', sprite: 'shield', stats: { defense: 6 } },
  { id: 'helmet', name: 'Helm',    legendaryName: 'Krone des Sturmkönigs',    slot: 'head',    sprite: 'helmet', stats: { defense: 3, health: 12 } },
  { id: 'armor',  name: 'Harnisch', legendaryName: 'Drachenschuppenharnisch', slot: 'chest',   sprite: 'armor',  stats: { defense: 5, health: 20 } },
  { id: 'boots',  name: 'Stiefel', legendaryName: 'Schritte des Windes',      slot: 'feet',    sprite: 'boots',  stats: { defense: 2, health: 8 } },
  { id: 'ring',   name: 'Ring',    legendaryName: 'Siegel der Leere',         slot: 'ring',    sprite: 'ring',   stats: { magic: 3, attack: 2 } },
];

// Namenszusätze für ungewöhnliche, seltene und epische Items,
// z.B. "Schwert des Bären"
export const ITEM_SUFFIXES = [
  'des Bären', 'des Adlers', 'der Eule', 'des Wolfes',
  'des Tigers', 'des Falken', 'der Schlange', 'des Löwen',
];

// Anzeigenamen der Werte
export const STAT_NAMES = {
  attack: 'Angriff',
  magic: 'Magie',
  defense: 'Rüstung',
  health: 'Leben',
  mana: 'Mana',
};

// Wie stark ein Wert in die "Stärke" eines Items einfließt.
// Leben und Mana haben große Zahlen, deshalb zählen sie weniger.
export const STAT_POWER_WEIGHTS = {
  attack: 1,
  magic: 1,
  defense: 1,
  health: 0.25,
  mana: 0.25,
};

// Anzeigenamen der Ausrüstungsplätze
export const SLOT_NAMES = {
  weapon: 'Waffe',
  offhand: 'Nebenhand',
  head: 'Kopf',
  chest: 'Brust',
  feet: 'Füße',
  ring: 'Ring',
};

// Hilfsfunktion: Vorlage anhand der id finden
export function getItemTemplate(templateId) {
  for (const template of ITEM_TEMPLATES) {
    if (template.id === templateId) {
      return template;
    }
  }
  throw new Error('Unbekannte Item-Vorlage: ' + templateId);
}
