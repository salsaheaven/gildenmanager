// ============================================================
// LOOTBOX-ARTEN
// Jede Kiste hat Chancen in Prozent für jede Seltenheit.
// Die Chancen einer Kiste müssen zusammen genau 100 ergeben (ein Test prüft das).
//
// id          = interner Name
// name        = Anzeigename
// price       = Kaufpreis in Gold (null = nicht kaufbar). Seit P6 sind alle Kisten nicht mehr kaufbar:
//               Kisten kommen nur aus Dungeons (und als Start-Kisten). Der Händler verkauft Verbrauchsgüter.
// itemCount   = wie viele Items darin sind
// mainColor   = Hauptfarbe der Kiste (Pixelbild)
// darkColor   = dunkle Farbe für Schatten und Beschläge
// shakeTime   = wie lange die Kiste vor dem Öffnen wackelt (Sekunden), mehr = spannender
// chances     = Prozent-Chance pro Seltenheit
// bossLoot    = nur Boss-Kisten: besondere Items des Bosses. Eines davon ist garantiert in der Kiste,
//               mindestens in der Seltenheit minRarity. { id, templateId, name, minRarity }
//               id = feste Kennung des Boss-Items (für das Sammelbuch, muss einmalig sein)
// bossResistance = nur Boss-Kisten: Resistenz, die alle Boss-Items tragen (Schadensart des Bosses,
//               siehe damageTypes.js). Fehlt sie, haben die Boss-Items keine feste Resistenz.
// isRaidChest = nur Raid-Kisten (eine pro Raid-Boss, siehe data/raids.js):
//               - Legendär (Orange) gibt es NUR hier, und zwar als Waffe oder Ring (legendarySlots)
//               - Pity: Nach BALANCING.raidLegendaryPityAfter Raid-Kisten ohne Legendär ist die nächste garantiert legendär
//               - raidIngredients = { min, max }: so viele Raid-Zutaten (Aschenessenz) liegen dazu (zum Umschmieden von Set-Teilen)
// In allen anderen Kisten ist die Chance auf Legendär 0 (entschieden 2026-11-06: Orange nur noch im Raid).
// ============================================================

import { getSetLoot } from './sets.js';

export const LOOT_BOXES = [
  {
    id: 'wood',
    name: 'Holzkiste',
    price: null,
    itemCount: 2,
    mainColor: '#a0652d',
    darkColor: '#6b3f17',
    shakeTime: 0.8,
    chances: { poor: 40, common: 35, uncommon: 18, rare: 6, epic: 1, legendary: 0 },
  },
  {
    id: 'silver',
    name: 'Silberkiste',
    price: null,
    itemCount: 3,
    mainColor: '#b8c4d6',
    darkColor: '#6d7a8f',
    shakeTime: 1.1,
    chances: { poor: 15, common: 35, uncommon: 30, rare: 15, epic: 5, legendary: 0 },
  },
  {
    id: 'gold',
    name: 'Goldkiste',
    price: null,
    itemCount: 3,
    mainColor: '#f2c14e',
    darkColor: '#a87b16',
    shakeTime: 1.4,
    chances: { poor: 0, common: 15, uncommon: 35, rare: 32, epic: 18, legendary: 0 },
  },
  {
    id: 'epic',
    name: 'Epische Kiste',
    price: null,
    itemCount: 4,
    mainColor: '#9b4dff',
    darkColor: '#5a1fa8',
    shakeTime: 1.8,
    chances: { poor: 0, common: 0, uncommon: 20, rare: 45, epic: 35, legendary: 0 },
  },

  // ---------- Boss-Kisten (nur aus Dungeons, nicht kaufbar) ----------
  {
    id: 'chestGrimfang',
    name: 'Grimmzahns Beute',
    price: null,
    itemCount: 3,
    mainColor: '#8b5a2b',
    darkColor: '#4a2a10',
    shakeTime: 1.3,
    chances: { poor: 10, common: 30, uncommon: 35, rare: 19, epic: 6, legendary: 0 },
    bossLoot: [
      { id: 'grimfangFang', templateId: 'attackRing', name: 'Grimmzahns Fangzahn', minRarity: 'rare' },
      { id: 'bearhideArmor', templateId: 'leatherArmor', name: 'Bärenfell-Harnisch', minRarity: 'rare' },
      { id: 'pawHelmet', templateId: 'plateHelmet', name: 'Prankenhelm', minRarity: 'rare' },
    ],
  },
  {
    id: 'chestMorva',
    bossResistance: 'shadow',
    name: 'Morvas Reliquien',
    price: null,
    itemCount: 3,
    mainColor: '#5a2a8a',
    darkColor: '#2a1040',
    shakeTime: 1.5,
    chances: { poor: 5, common: 25, uncommon: 35, rare: 25, epic: 10, legendary: 0 },
    bossLoot: [
      { id: 'shadowcallerStaff', templateId: 'staff', name: 'Stab der Schattenruferin', minRarity: 'rare' },
      { id: 'sisterHood', templateId: 'clothHelmet', name: 'Kapuze der Schwester', minRarity: 'rare' },
      { id: 'chapelRing', templateId: 'magicRing', name: 'Gebetsring der Kapelle', minRarity: 'rare' },
    ],
  },
  {
    id: 'chestSkarrix',
    bossResistance: 'acid',
    name: 'Skarrix’ Brutschatz',
    price: null,
    itemCount: 4,
    mainColor: '#3f8a3a',
    darkColor: '#1d4a1a',
    shakeTime: 1.7,
    chances: { poor: 0, common: 20, uncommon: 35, rare: 30, epic: 15, legendary: 0 },
    bossLoot: [
      { id: 'chitinShield', templateId: 'shield', name: 'Chitinschild', minRarity: 'rare' },
      { id: 'broodBlade', templateId: 'sword', name: 'Brutklinge', minRarity: 'rare' },
      { id: 'acidBoots', templateId: 'leatherBoots', name: 'Säurestiefel', minRarity: 'rare' },
    ],
  },
  {
    id: 'chestHrimgar',
    bossResistance: 'ice',
    name: 'Hrimgars Eishort',
    price: null,
    itemCount: 4,
    mainColor: '#4a8ac8',
    darkColor: '#1a3a6a',
    shakeTime: 1.8,
    chances: { poor: 0, common: 15, uncommon: 35, rare: 32, epic: 18, legendary: 0 },
    bossLoot: [
      { id: 'glacierHammer', templateId: 'mace', name: 'Gletscherhammer', minRarity: 'rare' },
      { id: 'frostGiantArmor', templateId: 'holyPlateArmor', name: 'Harnisch des Frostriesen', minRarity: 'rare' },
      { id: 'iceClaws', templateId: 'fistWeapon', name: 'Eiskrallen', minRarity: 'rare' },
    ],
  },
  {
    id: 'chestGrezza',
    bossResistance: 'water',
    name: 'Grezzas Hexenkessel',
    price: null,
    itemCount: 4,
    mainColor: '#3a6a3a',
    darkColor: '#1a2a1a',
    shakeTime: 1.9,
    chances: { poor: 0, common: 12, uncommon: 33, rare: 34, epic: 21, legendary: 0 },
    bossLoot: [
      { id: 'moorbarkVest', templateId: 'wildLeatherArmor', name: 'Moorrindenwams', minRarity: 'rare' },
      { id: 'wispBow', templateId: 'bow', name: 'Irrlichtbogen', minRarity: 'rare' },
      { id: 'witchHat', templateId: 'clothHelmet', name: 'Hexenhut', minRarity: 'rare' },
    ],
  },
  {
    id: 'chestAzhur',
    bossResistance: 'fire',
    name: 'Schatz der letzten Sonne',
    price: null,
    itemCount: 5,
    mainColor: '#e0b030',
    darkColor: '#8a5a10',
    shakeTime: 2.1,
    chances: { poor: 0, common: 10, uncommon: 30, rare: 35, epic: 25, legendary: 0 },
    bossLoot: [
      { id: 'sunBlade', templateId: 'katana', name: 'Sonnenklinge', minRarity: 'rare' },
      { id: 'sunChoirLute', templateId: 'lute', name: 'Laute des Sonnenchors', minRarity: 'rare' },
      { id: 'templeBreaker', templateId: 'axe', name: 'Tempelbrecher', minRarity: 'rare' },
      { id: 'highPriestSeal', templateId: 'magicRing', name: 'Siegel des Hohepriesters', minRarity: 'rare' },
    ],
  },
  {
    id: 'chestIgnara',
    bossResistance: 'fire',
    name: 'Hort der Drachenmutter',
    price: null,
    itemCount: 5,
    mainColor: '#d04020',
    darkColor: '#6a1a0a',
    shakeTime: 2.3,
    chances: { poor: 0, common: 5, uncommon: 25, rare: 38, epic: 32, legendary: 0 },
    bossLoot: [
      { id: 'forgeHammer', templateId: 'mace', name: 'Vorraks Schmiedehammer', minRarity: 'rare' },
      { id: 'dragonscaleHelm', templateId: 'plateHelmet', name: 'Drachenschuppenhelm', minRarity: 'rare' },
      { id: 'emberHood', templateId: 'clothHelmet', name: 'Glutkapuze', minRarity: 'rare' },
      { id: 'drakeboneBow', templateId: 'bow', name: 'Drachenknochenbogen', minRarity: 'rare' },
      { id: 'heartOfIgnara', templateId: 'attackRing', name: 'Herz der Drachenmutter', minRarity: 'rare' },
    ],
  },
  {
    id: 'chestFerron',
    name: 'Waffenkammer der Zitadelle',
    price: null,
    itemCount: 4,
    mainColor: '#8a93a6',
    darkColor: '#3a4050',
    shakeTime: 2.4,
    chances: { poor: 0, common: 5, uncommon: 20, rare: 40, epic: 35, legendary: 0 },
    // Das garantierte Boss-Item ist immer ein Set-Teil (plate, siehe data/sets.js)
    bossLoot: getSetLoot('plate'),
  },
  {
    id: 'chestSkaar',
    name: 'Bau der Urbestie',
    price: null,
    itemCount: 4,
    mainColor: '#6f8a4a',
    darkColor: '#2a3a1a',
    shakeTime: 2.4,
    chances: { poor: 0, common: 5, uncommon: 20, rare: 40, epic: 35, legendary: 0 },
    // Das garantierte Boss-Item ist immer ein Set-Teil (leather, siehe data/sets.js)
    bossLoot: getSetLoot('leather'),
  },
  {
    id: 'chestMythrel',
    name: 'Verbotene Regale',
    price: null,
    itemCount: 4,
    mainColor: '#7a5ac8',
    darkColor: '#2a1a5a',
    shakeTime: 2.4,
    chances: { poor: 0, common: 5, uncommon: 20, rare: 40, epic: 35, legendary: 0 },
    // Das garantierte Boss-Item ist immer ein Set-Teil (cloth, siehe data/sets.js)
    bossLoot: getSetLoot('cloth'),
  },
  // ---------- Raid-Kisten (Raid 1: Die Aschenhallen, je eine pro Boss) ----------
  {
    id: 'raidChestColossus',
    name: 'Schatz des Steinkolosses',
    isRaidChest: true,
    price: null,
    itemCount: 4,
    mainColor: '#9aa3b5',
    darkColor: '#4a5268',
    shakeTime: 2.8,
    chances: { uncommon: 10, rare: 35, epic: 50, legendary: 5 },
    legendarySlots: ['weapon', 'ring'],
    raidIngredients: { min: 1, max: 2 },
    bossLoot: [
      { id: 'colossusCore', templateId: 'plateArmor', name: 'Kolosskern-Harnisch', minRarity: 'epic' },
      { id: 'runestoneBand', templateId: 'magicRing', name: 'Runenstein-Reif', minRarity: 'epic' },
    ],
  },
  {
    id: 'raidChestMorgul',
    name: 'Seuchenbeute',
    isRaidChest: true,
    bossResistance: 'acid',
    price: null,
    itemCount: 4,
    mainColor: '#b8c43a',
    darkColor: '#4a5a1a',
    shakeTime: 2.8,
    chances: { uncommon: 10, rare: 35, epic: 50, legendary: 5 },
    legendarySlots: ['weapon', 'ring'],
    raidIngredients: { min: 1, max: 2 },
    bossLoot: [
      { id: 'plagueFang', templateId: 'fistWeapon', name: 'Seuchenfänge', minRarity: 'epic' },
      { id: 'blightHood', templateId: 'leatherHelmet', name: 'Faulgeruch-Haube', minRarity: 'epic' },
    ],
  },
  {
    id: 'raidChestPyra',
    name: 'Glutschrein der Flammenzunge',
    isRaidChest: true,
    bossResistance: 'fire',
    price: null,
    itemCount: 4,
    mainColor: '#ff6b3a',
    darkColor: '#8a1a0a',
    shakeTime: 2.9,
    chances: { uncommon: 10, rare: 35, epic: 50, legendary: 5 },
    legendarySlots: ['weapon', 'ring'],
    raidIngredients: { min: 1, max: 2 },
    bossLoot: [
      { id: 'flametongueStaff', templateId: 'staff', name: 'Stab der Flammenzunge', minRarity: 'epic' },
      { id: 'cinderRobe', templateId: 'clothArmor', name: 'Aschenrobe', minRarity: 'epic' },
    ],
  },
  {
    id: 'raidChestAshKing',
    name: 'Thronschatz des Aschenkönigs',
    isRaidChest: true,
    bossResistance: 'fire',
    price: null,
    itemCount: 5,
    mainColor: '#ff8a3a',
    darkColor: '#3a1a1a',
    shakeTime: 3.2,
    chances: { uncommon: 5, rare: 30, epic: 55, legendary: 10 },
    legendarySlots: ['weapon', 'ring'],
    raidIngredients: { min: 2, max: 3 },
    bossLoot: [
      { id: 'ashCrown', templateId: 'plateHelmet', name: 'Krone des Aschenkönigs', minRarity: 'epic' },
      { id: 'kingslayerAxe', templateId: 'axe', name: 'Königsfäller', minRarity: 'epic' },
      { id: 'emberSignet', templateId: 'attackRing', name: 'Glutsiegel', minRarity: 'epic' },
    ],
  },
  // ---------- Raid-Kisten (Raid 2: Der Nachtthron) ----------
  {
    id: 'raidChestHrimvald',
    name: 'Eishort des Hrimvald',
    isRaidChest: true,
    bossResistance: 'ice',
    price: null,
    itemCount: 4,
    mainColor: '#bfe8ff',
    darkColor: '#2a5a9a',
    shakeTime: 2.9,
    chances: { uncommon: 5, rare: 35, epic: 54, legendary: 6 },
    legendarySlots: ['weapon', 'ring'],
    raidIngredients: { min: 1, max: 2 },
    bossLoot: [
      { id: 'glacierWard', templateId: 'shield', name: 'Gletscherwall', minRarity: 'epic' },
      { id: 'frostboundBoots', templateId: 'leatherBoots', name: 'Frostgebundene Stiefel', minRarity: 'epic' },
    ],
  },
  {
    id: 'raidChestZyra',
    name: 'Sturmtruhe der Hexe',
    isRaidChest: true,
    bossResistance: 'water',
    price: null,
    itemCount: 4,
    mainColor: '#4a8cff',
    darkColor: '#1a3a6a',
    shakeTime: 2.9,
    chances: { uncommon: 5, rare: 35, epic: 54, legendary: 6 },
    legendarySlots: ['weapon', 'ring'],
    raidIngredients: { min: 1, max: 2 },
    bossLoot: [
      { id: 'stormcallerLute', templateId: 'lute', name: 'Laute des Sturmrufers', minRarity: 'epic' },
      { id: 'tidecrestHood', templateId: 'clothHelmet', name: 'Gezeitenkrone', minRarity: 'epic' },
    ],
  },
  {
    id: 'raidChestMorvath',
    name: 'Knochenhort',
    isRaidChest: true,
    bossResistance: 'shadow',
    price: null,
    itemCount: 4,
    mainColor: '#d8dee9',
    darkColor: '#4a4a52',
    shakeTime: 3.0,
    chances: { uncommon: 5, rare: 35, epic: 54, legendary: 6 },
    legendarySlots: ['weapon', 'ring'],
    raidIngredients: { min: 1, max: 2 },
    bossLoot: [
      { id: 'bonewingBow', templateId: 'bow', name: 'Knochenschwingen-Bogen', minRarity: 'epic' },
      { id: 'ossuaryPlate', templateId: 'plateBoots', name: 'Beinhaus-Schritte', minRarity: 'epic' },
    ],
  },
  {
    id: 'raidChestUmbral',
    name: 'Schattenschatulle',
    isRaidChest: true,
    bossResistance: 'shadow',
    price: null,
    itemCount: 4,
    mainColor: '#7a3ac8',
    darkColor: '#1a0a2a',
    shakeTime: 3.0,
    chances: { uncommon: 5, rare: 35, epic: 54, legendary: 6 },
    legendarySlots: ['weapon', 'ring'],
    raidIngredients: { min: 1, max: 2 },
    bossLoot: [
      { id: 'umbralKatana', templateId: 'katana', name: 'Klinge der Finsternis', minRarity: 'epic' },
      { id: 'duskVest', templateId: 'leatherArmor', name: 'Dämmerweste', minRarity: 'epic' },
    ],
  },
  {
    id: 'raidChestVaelor',
    name: 'Hort des Weltenverschlingers',
    isRaidChest: true,
    bossResistance: 'shadow',
    price: null,
    itemCount: 5,
    mainColor: '#c07cff',
    darkColor: '#2a0a4a',
    shakeTime: 3.6,
    chances: { uncommon: 0, rare: 25, epic: 60, legendary: 15 },
    legendarySlots: ['weapon', 'ring'],
    raidIngredients: { min: 2, max: 3 },
    bossLoot: [
      { id: 'worldbreaker', templateId: 'mace', name: 'Weltenbrecher', minRarity: 'epic' },
      { id: 'voidheartRing', templateId: 'magicRing', name: 'Herz der Leere', minRarity: 'epic' },
      { id: 'starfallCrown', templateId: 'holyPlateHelmet', name: 'Krone des Sternenfalls', minRarity: 'epic' },
    ],
  },
];

// Hilfsfunktion: Kistenart anhand der id finden
export function getLootBoxType(boxTypeId) {
  for (const boxType of LOOT_BOXES) {
    if (boxType.id === boxTypeId) {
      return boxType;
    }
  }
  throw new Error('Unbekannte Kistenart: ' + boxTypeId);
}
