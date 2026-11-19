// ============================================================
// KLASSEN-SETS – pro Klasse ein Set aus 3 Teilen (Kopf, Brust, Füße), nur Rüstung
// Die Teile droppen in den 3 Set-Dungeons auf Stufe 30, aufgeteilt nach Rüstungsart
// (Eisenzitadelle = Platte, Wilder Hain = Leder, Arkanes Archiv = Stoff, siehe dungeons.js).
// Ein Set-Teil ist ein Boss-Item: Es steht im Sammelbuch und fällt garantiert aus der Boss-Kiste (lootBoxes.js).
// Der Bonus gilt nur für die Klasse des Sets und wirkt wie Anweisungen und Talente (siehe combat/OrderSettings.js).
//
// id         = Kennung des Sets
// classId    = für welche Klasse (data/heroClasses.js)
// name       = Name des Sets
// templates  = welche Item-Vorlage pro Platz (data/items.js), armorType = Rüstungsart (bestimmt den Set-Dungeon)
// pieceNames = Namen der Teile pro Platz
// bonuses    = Bonus ab 2 und ab 3 getragenen Teilen: { effects, text } (die Wirkungen zählen zusammen)
//
// Die 3er-Boni haben zusätzlich je Rolle einen Encounter-Bonus gegen typische Raid-Mechaniken (vor allem im Nachtthron):
//   tankStackReduction      = Tank-Stapel des Raid-Bosses wirken um diesen Anteil schwächer (0.5 = halb so stark)
//   healingAfterGroupHit    = nach einem Gruppenschlag/Gruppenzauber auf die eigene Gruppe: so viel mehr Heilung für 2 Runden
//   damageVsMinionsAndShell = mehr Schaden gegen Diener und gegen Bosse mit Panzer
//   curseDamageTaken        = Flüche von Bossen machen so viel weniger Schaden (−0.4 = 40 % weniger)
//
// Zahlen grob gesetzt (je Rolle gleich).
// ============================================================

// Ab so vielen getragenen Teilen gibt es einen Bonus
export const SET_BONUS_COUNTS = [2, 3];

// Boni je Rolle (damit nicht jedes Set eigene Zahlen braucht; einzelne Sets dürfen später eigene bekommen)
export const ROLE_BONUSES = {
  tank: {
    2: { effects: { statBonus: { health: 0.15 } }, text: '+15 % Leben' },
    3: { effects: { damageTaken: -0.1, tankStackReduction: 0.5 }, text: '−10 % erlittener Schaden. Raid: Tank-Stapel wirken nur halb so stark' },
  },
  healer: {
    2: { effects: { healingDone: 0.15 }, text: '+15 % Heilung' },
    3: { effects: { manaCost: -0.15, healingAfterGroupHit: 0.3 }, text: '−15 % Manakosten. Raid: +30 % Heilung für 2 Runden, nachdem ein Gruppenschlag die eigene Gruppe trifft' },
  },
  damage: {
    2: { effects: { damageDone: 0.1 }, text: '+10 % Schaden' },
    3: { effects: { damageDone: 0.1, cheatDeath: true, damageVsMinionsAndShell: 0.25 }, text: '+10 % Schaden, überlebt einmal pro Kampf einen tödlichen Treffer. +25 % Schaden gegen Diener und gepanzerte Bosse' },
  },
  support: {
    2: { effects: { damageDone: 0.08, healingDone: 0.08 }, text: '+8 % Schaden und Heilung' },
    3: { effects: { damageTaken: -0.08, statBonus: { health: 0.1 }, curseDamageTaken: -0.4 }, text: '−8 % erlittener Schaden, +10 % Leben. Flüche machen 40 % weniger Schaden' },
  },
};

// Vorlagen je Rüstungs-Variante (siehe data/items.js)
const PLATE = { head: 'plateHelmet', chest: 'plateArmor', feet: 'plateBoots' };
const HOLY_PLATE = { head: 'holyPlateHelmet', chest: 'holyPlateArmor', feet: 'holyPlateBoots' };
const LEATHER = { head: 'leatherHelmet', chest: 'leatherArmor', feet: 'leatherBoots' };
const WILD_LEATHER = { head: 'wildLeatherHelmet', chest: 'wildLeatherArmor', feet: 'wildLeatherBoots' };
const CLOTH = { head: 'clothHelmet', chest: 'clothArmor', feet: 'clothBoots' };

export const SETS = [
  // ---------- Platte (Eisenzitadelle) ----------
  { id: 'setWarrior', classId: 'warrior', role: 'tank', name: 'Wehr des Schlachtenführers', templates: PLATE, armorType: 'plate',
    pieceNames: { head: 'Helm des Schlachtenführers', chest: 'Harnisch des Schlachtenführers', feet: 'Stiefel des Schlachtenführers' } },
  { id: 'setPaladin', classId: 'paladin', role: 'tank', name: 'Rüstung des Lichtschwurs', templates: HOLY_PLATE, armorType: 'plate',
    pieceNames: { head: 'Helm des Lichtschwurs', chest: 'Harnisch des Lichtschwurs', feet: 'Schritte des Lichtschwurs' } },
  { id: 'setSamurai', classId: 'samurai', role: 'damage', name: 'Rüstung des Klingenmeisters', templates: PLATE, armorType: 'plate',
    pieceNames: { head: 'Kabuto des Klingenmeisters', chest: 'Do des Klingenmeisters', feet: 'Suneate des Klingenmeisters' } },
  { id: 'setShaman', classId: 'shaman', role: 'support', name: 'Gewand des Sturmrufers', templates: HOLY_PLATE, armorType: 'plate',
    pieceNames: { head: 'Helm des Sturmrufers', chest: 'Brustplatte des Sturmrufers', feet: 'Stiefel des Sturmrufers' } },

  // ---------- Leder (Wilder Hain) ----------
  { id: 'setRogue', classId: 'rogue', role: 'damage', name: 'Hülle des Schattenläufers', templates: LEATHER, armorType: 'leather',
    pieceNames: { head: 'Maske des Schattenläufers', chest: 'Wams des Schattenläufers', feet: 'Sohlen des Schattenläufers' } },
  { id: 'setMonk', classId: 'monk', role: 'tank', name: 'Kleidung des Stillen Berges', templates: LEATHER, armorType: 'leather',
    pieceNames: { head: 'Stirnband des Stillen Berges', chest: 'Kittel des Stillen Berges', feet: 'Sandalen des Stillen Berges' } },
  { id: 'setBarbarian', classId: 'barbarian', role: 'damage', name: 'Felle des Blutrauschs', templates: LEATHER, armorType: 'leather',
    pieceNames: { head: 'Schädel des Blutrauschs', chest: 'Fell des Blutrauschs', feet: 'Stampfer des Blutrauschs' } },
  { id: 'setHunter', classId: 'hunter', role: 'damage', name: 'Ausrüstung des Fährtenlesers', templates: LEATHER, armorType: 'leather',
    pieceNames: { head: 'Kapuze des Fährtenlesers', chest: 'Weste des Fährtenlesers', feet: 'Stiefel des Fährtenlesers' } },
  { id: 'setDruid', classId: 'druid', role: 'healer', name: 'Gewand des Hainhüters', templates: WILD_LEATHER, armorType: 'leather',
    pieceNames: { head: 'Geweih des Hainhüters', chest: 'Rinde des Hainhüters', feet: 'Wurzeln des Hainhüters' } },

  // ---------- Stoff (Arkanes Archiv) ----------
  { id: 'setPriest', classId: 'priest', role: 'healer', name: 'Ornat der Morgenröte', templates: CLOTH, armorType: 'cloth',
    pieceNames: { head: 'Haube der Morgenröte', chest: 'Robe der Morgenröte', feet: 'Schuhe der Morgenröte' } },
  { id: 'setRuneweaver', classId: 'runeweaver', role: 'support', name: 'Gewand des Runenmeisters', templates: CLOTH, armorType: 'cloth',
    pieceNames: { head: 'Kapuze des Runenmeisters', chest: 'Robe des Runenmeisters', feet: 'Schuhe des Runenmeisters' } },
  { id: 'setMage', classId: 'mage', role: 'damage', name: 'Roben des Sternenfeuers', templates: CLOTH, armorType: 'cloth',
    pieceNames: { head: 'Kapuze des Sternenfeuers', chest: 'Robe des Sternenfeuers', feet: 'Schuhe des Sternenfeuers' } },
  { id: 'setWarlock', classId: 'warlock', role: 'damage', name: 'Gewänder der Seelenernte', templates: CLOTH, armorType: 'cloth',
    pieceNames: { head: 'Kapuze der Seelenernte', chest: 'Robe der Seelenernte', feet: 'Schuhe der Seelenernte' } },
  { id: 'setBard', classId: 'bard', role: 'support', name: 'Tracht des Meistersängers', templates: CLOTH, armorType: 'cloth',
    pieceNames: { head: 'Hut des Meistersängers', chest: 'Wams des Meistersängers', feet: 'Schuhe des Meistersängers' } },
  { id: 'setChronomancer', classId: 'chronomancer', role: 'support', name: 'Roben des Zeitwächters', templates: CLOTH, armorType: 'cloth',
    pieceNames: { head: 'Kapuze des Zeitwächters', chest: 'Robe des Zeitwächters', feet: 'Schuhe des Zeitwächters' } },
];

// Die Plätze eines Sets in fester Reihenfolge
export const SET_SLOTS = ['head', 'chest', 'feet'];

export function getSet(setId) {
  const set = SETS.find((entry) => entry.id === setId);
  if (!set) {
    throw new Error('Unbekanntes Set: ' + setId);
  }
  return set;
}

// Bonus eines Sets für eine Anzahl Teile (2 oder 3), oder null
export function getSetBonus(set, count) {
  return ROLE_BONUSES[set.role][count] || null;
}

// Die Teile aller Sets einer Rüstungsart als Boss-Beute für eine Kiste (siehe bossLoot in lootBoxes.js).
// Jedes Teil hat eine feste Kennung (Set-id + Platz) fürs Sammelbuch und mindestens die Seltenheit Episch.
export function getSetLoot(armorTypeId) {
  const loot = [];
  for (const set of SETS) {
    if (set.armorType !== armorTypeId) {
      continue;
    }
    for (const slot of SET_SLOTS) {
      loot.push({ id: set.id + '_' + slot, templateId: set.templates[slot], name: set.pieceNames[slot], minRarity: 'epic', setId: set.id });
    }
  }
  return loot;
}
