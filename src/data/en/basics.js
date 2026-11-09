// ============================================================
// ENGLISCH: Grundbegriffe – Seltenheiten, Eigenschaften, Schadensarten, Positionen, Einschätzung,
// KI-Gilden, Ränge, Werte, Plätze und Item-Vorlagen (siehe core/DataLanguage.js)
// ============================================================

export const RARITIES_EN = {
  poor: { name: 'Junk' },
  common: { name: 'Common' },
  uncommon: { name: 'Uncommon' },
  rare: { name: 'Rare' },
  epic: { name: 'Epic' },
  legendary: { name: 'Legendary' },
};

export const TRAITS_EN = {
  brave: { name: 'Brave', description: '+10 % attack' },
  tough: { name: 'Tough', description: '+15 % health' },
  wise: { name: 'Wise', description: '+15 % mana' },
  gifted: { name: 'Gifted', description: '+10 % magic' },
  sturdy: { name: 'Sturdy', description: '+10 % armor' },
  hothead: { name: 'Hothead', description: '+20 % attack, −10 % armor' },
  fragile: { name: 'Fragile', description: '+15 % magic, −10 % health' },
  greedy: { name: 'Greedy', description: '+20 % gold from the dungeon when fighting along, and from jobs' },
  lucky: { name: 'Lucky', description: '+1 item in the boss chest when fighting along' },
};

export const DAMAGE_TYPES_EN = {
  physical: { name: 'Physical' },
  shadow: { name: 'Shadow' },
  light: { name: 'Light' },
  fire: { name: 'Fire' },
  ice: { name: 'Ice' },
  acid: { name: 'Acid' },
  water: { name: 'Water' },
};

export const RETREAT_RULES_EN = {
  never: { name: 'Never retreat' },
  afterOne: { name: 'After 1 fallen' },
  afterTwo: { name: 'After 2 fallen' },
};

export const POSITIONS_EN = {
  tank: { name: 'Tank' },
  healer: { name: 'Healer' },
  melee: { name: 'Melee' },
  ranged: { name: 'Ranged' },
  support: { name: 'Support' },
};

export const GROUP_NAMES_EN = ['Group A', 'Group B', 'Group C', 'Group D', 'Group E', 'Group F', 'Group G', 'Group H'];

export const RISK_LEVELS_EN = {
  safe: { name: 'Safe' },
  doable: { name: 'Doable' },
  risky: { name: 'Risky' },
  hopeless: { name: 'Hopeless' },
};

export const FALL_LEVELS_EN = {
  often: { name: 'often' },
  sometimes: { name: 'sometimes' },
  rarely: { name: 'rarely' },
};

export const UNKNOWN_RISK_EN = { name: 'Unknown', hint: 'scout first' };

export const PARTIAL_RISK_LEVELS_EN = {
  easy: { name: 'Rather easy' },
  hard: { name: 'Rather hard' },
};

export const RIVAL_GUILDS_EN = {
  ironFists: { name: 'The Iron Fists', personality: 'Daredevils: try their luck almost every day, but often fail' },
  silverWolves: { name: 'Order of the Silver Wolves', personality: 'Thorough: slow but steady' },
  fortuneKnights: { name: 'Fortune Knights of Kragmoor', personality: 'Fickle: sometimes fast, sometimes nothing for days' },
  ashenCrown: { name: 'Ashen Crown', personality: 'Elite: the fastest guild on the server' },
};

// Ränge der Endauswertung (Liste ohne id: nach Nummer)
export const RANKS_EN = {
  0: { name: 'Legend of the Server' },
  1: { name: 'Hero Guild' },
  2: { name: 'Strong Guild' },
  3: { name: 'Solid Guild' },
  4: { name: 'Late Bloomer' },
};

export const START_TEAM_RULES_EN = { defaultGuildName: 'The Invincibles' };

export const ROLE_NAMES_EN = { tank: 'Tank', healer: 'Healer', damage: 'Damage', support: 'Support' };
export const ROW_NAMES_EN = { front: 'in front', back: 'in the back' };
export const STAT_NAMES_EN = { attack: 'Attack', magic: 'Magic', defense: 'Armor', health: 'Health', mana: 'Mana' };
export const SLOT_NAMES_EN = { weapon: 'Weapon', offhand: 'Off-hand', head: 'Head', chest: 'Chest', feet: 'Feet', ring: 'Ring' };

export const ARMOR_TYPES_EN = {
  plate: { name: 'Plate' },
  leather: { name: 'Leather' },
  cloth: { name: 'Cloth' },
};

// Namenszusätze (Liste: nach Nummer)
export const ITEM_SUFFIXES_EN = ['of the Bear', 'of the Eagle', 'of the Owl', 'of the Wolf', 'of the Tiger', 'of the Falcon', 'of the Snake', 'of the Lion'];

export const ITEM_TEMPLATES_EN = {
  sword: { name: 'Sword', poorName: 'Cracked Sword', legendaryName: 'Dawnbreaker' },
  staff: { name: 'Staff', poorName: 'Cracked Staff', legendaryName: 'Staff of a Thousand Stars' },
  shield: { name: 'Shield', poorName: 'Cracked Shield', legendaryName: 'Bulwark of Eternity' },
  mace: { name: 'Mace', poorName: 'Cracked Mace', legendaryName: 'Hammer of the Dawn' },
  fistWeapon: { name: 'Fist Blade', poorName: 'Cracked Fist Blade', legendaryName: 'Claws of the Tiger' },
  katana: { name: 'Katana', poorName: 'Cracked Katana', legendaryName: 'Moonblade' },
  axe: { name: 'Battle Axe', poorName: 'Cracked Battle Axe', legendaryName: 'Skullsplitter' },
  bow: { name: 'Bow', poorName: 'Cracked Bow', legendaryName: 'String of the Storm' },
  lute: { name: 'Lute', poorName: 'Cracked Lute', legendaryName: 'Lute of the First Songs' },
  plateHelmet: { name: 'Plate Helmet', poorName: 'Cracked Plate Helmet', legendaryName: 'Crown of the Storm King' },
  plateArmor: { name: 'Plate Armor', poorName: 'Cracked Plate Armor', legendaryName: 'Dragonscale Armor' },
  plateBoots: { name: 'Plate Boots', poorName: 'Cracked Plate Boots', legendaryName: 'Stride of the Titan' },
  holyPlateHelmet: { name: 'Blessed Plate Helmet', poorName: 'Cracked Blessed Plate Helmet', legendaryName: 'Halo of the Lightbringer' },
  holyPlateArmor: { name: 'Blessed Plate Armor', poorName: 'Cracked Blessed Plate Armor', legendaryName: 'Armor of Vows' },
  holyPlateBoots: { name: 'Blessed Plate Boots', poorName: 'Cracked Blessed Plate Boots', legendaryName: 'Steps of the Crusade' },
  leatherHelmet: { name: 'Leather Cap', poorName: 'Cracked Leather Cap', legendaryName: 'Mask of the Shadow Lord' },
  leatherArmor: { name: 'Leather Jerkin', poorName: 'Cracked Leather Jerkin', legendaryName: 'Cloak of a Thousand Blades' },
  leatherBoots: { name: 'Leather Boots', poorName: 'Cracked Leather Boots', legendaryName: 'Steps of the Wind' },
  wildLeatherHelmet: { name: 'Wildhide Cap', poorName: 'Cracked Wildhide Cap', legendaryName: 'Antlers of the Grove Warden' },
  wildLeatherArmor: { name: 'Wildhide Jerkin', poorName: 'Cracked Wildhide Jerkin', legendaryName: 'Bark of the World Ash' },
  wildLeatherBoots: { name: 'Wildhide Boots', poorName: 'Cracked Wildhide Boots', legendaryName: 'Path of the Roots' },
  clothHelmet: { name: 'Cloth Hood', poorName: 'Cracked Cloth Hood', legendaryName: 'Hood of the Stargazer' },
  clothArmor: { name: 'Cloth Robe', poorName: 'Cracked Cloth Robe', legendaryName: 'Robe of the Archmage' },
  clothBoots: { name: 'Cloth Shoes', poorName: 'Cracked Cloth Shoes', legendaryName: 'Path of the Void' },
  attackRing: { name: 'Battle Ring', poorName: 'Cracked Battle Ring', legendaryName: 'Seal of the Warlord' },
  magicRing: { name: 'Spell Ring', poorName: 'Cracked Spell Ring', legendaryName: 'Seal of the Void' },
};
