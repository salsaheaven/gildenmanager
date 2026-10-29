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
// armorType     = nur bei Rüstung: Platte, Leder oder Stoff (siehe ARMOR_TYPES). Jede Klasse trägt nur ihre Art.
// forScaling    = nur bei Ringen: für wen der Ring gedacht ist ('attack' = Angriff, 'magic' = Zauber).
//                 Tragen darf ihn jeder.
// colors        = freiwillig: Farben, die im Pixelbild ersetzt werden (sonst die Farben der Rüstungsart)
// dropWeight    = freiwillig: wie oft die Vorlage in Kisten vorkommt (ohne Angabe 1, 2 = doppelt so oft).
//                 Platte und Leder haben je zwei Varianten, Stoff nur eine. Deshalb hat Stoff Gewicht 2:
//                 So fällt jede Rüstungsart gleich oft (ein Test prüft das).
// ============================================================

// Die drei Rüstungsarten. colors = Farben im Pixelbild (Stahl, Leder, Stoff)
export const ARMOR_TYPES = {
  plate:   { name: 'Platte', colors: { b: '#d8dee9', B: '#8a93a6' } },
  leather: { name: 'Leder',  colors: { s: '#c08a52', S: '#7a4a22' } },
  cloth:   { name: 'Stoff',  colors: { s: '#b07ce8', S: '#5a2a8a', b: '#b07ce8', B: '#5a2a8a' } },
};

export const ITEM_TEMPLATES = [
  { id: 'sword',  name: 'Schwert', legendaryName: 'Morgenröte',               slot: 'weapon',  sprite: 'sword',  stats: { attack: 6 } },
  { id: 'staff',  name: 'Stab',    legendaryName: 'Stab der tausend Sterne',  slot: 'weapon',  sprite: 'staff',  stats: { magic: 7, mana: 15 } },
  { id: 'shield', name: 'Schild',  legendaryName: 'Bollwerk der Ewigkeit',    slot: 'offhand', sprite: 'shield', stats: { defense: 6 } },
  { id: 'mace',       name: 'Streitkolben', legendaryName: 'Hammer der Morgendämmerung', slot: 'weapon', sprite: 'mace',   stats: { magic: 5, defense: 2, mana: 8 } },
  { id: 'fistWeapon', name: 'Faustklinge',  legendaryName: 'Pranken des Tigers',         slot: 'weapon', sprite: 'fist',   stats: { attack: 5, defense: 1 } },
  { id: 'katana',     name: 'Katana',       legendaryName: 'Mondklinge',                 slot: 'weapon', sprite: 'katana', stats: { attack: 7 } },
  { id: 'axe',        name: 'Streitaxt',    legendaryName: 'Schädelspalter',             slot: 'weapon', sprite: 'axe',    stats: { attack: 7, health: 8 } },
  { id: 'bow',        name: 'Bogen',        legendaryName: 'Sehne des Sturms',           slot: 'weapon', sprite: 'bow',    stats: { attack: 6 } },
  { id: 'lute',       name: 'Laute',        legendaryName: 'Laute der ersten Lieder',    slot: 'weapon', sprite: 'lute',   stats: { magic: 6, mana: 12 } },

  // ---------- Platte (Krieger, Samurai): viel Rüstung und Leben ----------
  { id: 'plateHelmet', name: 'Plattenhelm',     legendaryName: 'Krone des Sturmkönigs',   slot: 'head',  sprite: 'helmet', armorType: 'plate', stats: { defense: 3, health: 12 } },
  { id: 'plateArmor',  name: 'Plattenharnisch', legendaryName: 'Drachenschuppenharnisch', slot: 'chest', sprite: 'armor',  armorType: 'plate', stats: { defense: 5, health: 20 } },
  { id: 'plateBoots',  name: 'Plattenstiefel',  legendaryName: 'Tritt des Titanen',       slot: 'feet',  sprite: 'boots',  armorType: 'plate', stats: { defense: 2, health: 8 } },

  // ---------- Geweihte Platte (Paladin, Schamane): Rüstung, Leben und Magie ----------
  { id: 'holyPlateHelmet', name: 'Geweihter Plattenhelm',     legendaryName: 'Heiligenschein des Lichtbringers', slot: 'head',  sprite: 'helmet', armorType: 'plate', stats: { defense: 2, health: 10, magic: 2 } },
  { id: 'holyPlateArmor',  name: 'Geweihter Plattenharnisch', legendaryName: 'Harnisch der Gelübde',             slot: 'chest', sprite: 'armor',  armorType: 'plate', stats: { defense: 4, health: 16, magic: 3, mana: 8 } },
  { id: 'holyPlateBoots',  name: 'Geweihte Plattenstiefel',   legendaryName: 'Schritte des Kreuzzugs',           slot: 'feet',  sprite: 'boots',  armorType: 'plate', stats: { defense: 2, health: 6, magic: 1 } },

  // ---------- Leder (Schurke, Mönch, Barbar, Jäger): Angriff, etwas Rüstung und Leben ----------
  { id: 'leatherHelmet', name: 'Lederkappe',   legendaryName: 'Maske des Schattenfürsten', slot: 'head',  sprite: 'helmet', armorType: 'leather', stats: { attack: 2, defense: 1, health: 10 } },
  { id: 'leatherArmor',  name: 'Lederwams',    legendaryName: 'Mantel der Tausend Klingen', slot: 'chest', sprite: 'armor',  armorType: 'leather', stats: { attack: 3, defense: 2, health: 16 } },
  { id: 'leatherBoots',  name: 'Lederstiefel', legendaryName: 'Schritte des Windes',        slot: 'feet',  sprite: 'boots',  armorType: 'leather', stats: { attack: 1, defense: 1, health: 6 } },

  // ---------- Wildleder (Druide): Magie, Mana, etwas Rüstung ----------
  { id: 'wildLeatherHelmet', name: 'Wildlederkappe',   legendaryName: 'Geweih des Hainwächters', slot: 'head',  sprite: 'helmet', armorType: 'leather', stats: { magic: 2, defense: 1, health: 8, mana: 6 } },
  { id: 'wildLeatherArmor',  name: 'Wildlederwams',    legendaryName: 'Rinde der Weltesche',     slot: 'chest', sprite: 'armor',  armorType: 'leather', stats: { magic: 3, defense: 2, health: 12, mana: 10 } },
  { id: 'wildLeatherBoots',  name: 'Wildlederstiefel', legendaryName: 'Pfad der Wurzeln',        slot: 'feet',  sprite: 'boots',  armorType: 'leather', stats: { magic: 1, defense: 1, health: 6, mana: 4 } },

  // ---------- Stoff (Priester, Runenwirker, Magier, Hexenmeister, Barde, Chronomant): Magie und Mana, wenig Rüstung ----------
  { id: 'clothHelmet', name: 'Stoffkapuze',  legendaryName: 'Kapuze der Sternenseherin', slot: 'head',  sprite: 'helmet', armorType: 'cloth', dropWeight: 2, stats: { magic: 2, health: 8, mana: 8 } },
  { id: 'clothArmor',  name: 'Stoffrobe',    legendaryName: 'Robe des Erzmagiers',       slot: 'chest', sprite: 'armor',  armorType: 'cloth', dropWeight: 2, stats: { magic: 3, defense: 1, health: 12, mana: 12 } },
  { id: 'clothBoots',  name: 'Stoffschuhe',  legendaryName: 'Pfad der Leere',            slot: 'feet',  sprite: 'boots',  armorType: 'cloth', dropWeight: 2, stats: { magic: 1, health: 6, mana: 6 } },

  // ---------- Ringe: jeder darf sie tragen ----------
  { id: 'attackRing', name: 'Kampfring',  legendaryName: 'Siegel des Kriegsherrn', slot: 'ring', sprite: 'ring', forScaling: 'attack', stats: { attack: 4 } },
  { id: 'magicRing',  name: 'Zauberring', legendaryName: 'Siegel der Leere',       slot: 'ring', sprite: 'ring', forScaling: 'magic',  stats: { magic: 3, mana: 6 },
    colors: { g: '#5ef2ff', G: '#2a7a8a' } },
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

// Name der Rüstungsart eines Items, z.B. "Platte" (oder null, wenn es keine Rüstung ist)
export function getArmorTypeName(template) {
  return template.armorType ? ARMOR_TYPES[template.armorType].name : null;
}

// Farben, die im Pixelbild eines Items ersetzt werden
export function getTemplateColors(template) {
  if (template.colors) {
    return template.colors;
  }
  if (template.armorType) {
    return ARMOR_TYPES[template.armorType].colors;
  }
  return {};
}
