// ============================================================
// ENGLISCH: Spielwelt – Aufgaben, Aufträge, Gebäude, Waren, Material, Freischaltungen, Konter,
// Sammelbuch-Titel, Raids, "Woran es lag", Sets und Dungeons (siehe core/DataLanguage.js)
// ============================================================

export const HERO_TASKS_EN = {
  dungeon: { name: 'Dungeon', description: 'Fights in the dungeon with their group today' },
  raid: { name: 'Raid', description: 'Fights in the raid today' },
  injured: { name: 'Recovering', description: 'Is injured and can\'t fight today' },
  rest: { name: 'Resting', description: 'Has no task today' },
  training: { name: 'Training', description: 'Gains experience without risk; the trainer costs gold' },
  herbs: { name: 'Gather herbs', description: 'Gathers herbs the alchemy lab brews potions from' },
  gatherRaw: { name: 'Gather materials', description: 'Gathers ore, leather and cloth the forge makes gear from' },
  jobs: { name: 'Do jobs', description: 'Earns safe gold in town, but gets no XP' },
  scouting: { name: 'Scout', description: 'Scouts a dungeon: reveals the next boss and prepares the next runs there' },
};

export const JOB_TEXTS_EN = [
  'escorts a caravan',
  'stands guard at the city gate',
  'drives wolves off a farm',
  'collects debts for a merchant',
  'clears out a rat cellar',
  'protects a travelling mage',
  'helps build the city wall',
  'hunts down a pickpocket',
];

export const BUILDINGS_EN = {
  barracks: { name: 'Barracks', description: 'Beds for more heroes', levels: { 0: { text: '+5 hero slots' }, 1: { text: '+10 hero slots' }, 2: { text: '+15 hero slots' } } },
  infirmary: { name: 'Infirmary', description: 'Healers look after the fallen so they don\'t drop out',
    levels: { 0: { text: '25 % of the fallen are fit again right away' }, 1: { text: '50 % of the fallen are fit again right away' }, 2: { text: '75 % of the fallen are fit again right away' } } },
  forge: { name: 'Forge', description: 'Make gear and upgrade more safely',
    levels: { 0: { text: 'Forging, +5 % upgrade chance' }, 1: { text: 'Reforging, +10 % chance' }, 2: { text: 'Reforge set pieces, forging 25 % cheaper, +15 % chance' } } },
  alchemyLab: { name: 'Alchemy lab', description: 'Brews potions from gathered herbs',
    levels: { 0: { text: 'Brew healing and mana potions and bandages' }, 1: { text: 'Also ward potions, 15 % fewer herbs' }, 2: { text: 'Also fury elixir and stoneskin, 30 % fewer herbs' } } },
  trainingHall: { name: 'Training hall', description: 'Better training for heroes who don\'t fight',
    levels: { 0: { text: 'Training +25 % XP, 20 % cheaper' }, 1: { text: 'Training +50 % XP, 40 % cheaper' }, 2: { text: 'Training +75 % XP, 60 % cheaper' } } },
  mapRoom: { name: 'Map room', description: 'Maps and reports make scouting more valuable',
    levels: { 0: { text: 'Scouting lasts 2 fighting days' }, 1: { text: 'Scouting lasts 3 fighting days' }, 2: { text: 'Shows in advance what the group would probably fail at' } } },
};

export const CONSUMABLES_EN = {
  healingPotions: { name: 'Healing potions', description: '+30 % extra health after every encounter' },
  manaPotions: { name: 'Mana potions', description: 'Healers and casters start every encounter with +30 % mana' },
  bandages: { name: 'Bandages', description: 'Shortens a hero\'s injury by 1 day right away' },
  shadowWard: { name: 'Shadow ward potion', description: 'All heroes +15 % shadow resistance' },
  acidWard: { name: 'Acid ward potion', description: 'All heroes +15 % acid resistance' },
  frostWard: { name: 'Frost ward potion', description: 'All heroes +15 % ice resistance' },
  fireWard: { name: 'Fire ward potion', description: 'All heroes +15 % fire resistance' },
  lightWard: { name: 'Light ward potion', description: 'All heroes +15 % light resistance' },
  furyElixir: { name: 'Fury elixir', description: 'All heroes deal +10 % damage' },
  stoneskin: { name: 'Stoneskin potion', description: 'All heroes take −10 % damage' },
};

export const MATERIALS_EN = {
  dust: { name: 'Arcane dust' },
  crystal: { name: 'Crystal' },
  raw: { name: 'Raw materials' },
  herbs: { name: 'Herbs' },
  ashEssence: { name: 'Ash essence' },
};

export const UNLOCKS_EN = {
  tavern: { name: 'Tavern', text: 'New applicants wait in the tavern every day. More heroes mean more groups.' },
  talents: { name: 'Talents', text: 'From level 5, heroes pick talents. Every row offers two paths.' },
  shop: { name: 'Merchant', text: 'The merchant sells potions. Every group takes up to 2 supplies into the dungeon.' },
  rivals: { name: 'Other guilds', text: 'Four other guilds compete for the same dungeons. News ticker and leaderboard are in the day plan.' },
  crafting: { name: 'Salvage and upgrade', text: 'In the inventory you can salvage items and use the material to upgrade others (+1 to +10).' },
  collection: { name: 'Collection', text: 'Every boss item goes into the collection. A full page gives a title and more gold.' },
  raid: { name: 'Raid', text: 'The Ash Halls are open! On days 6 and 7 of every week your raid (10 to 20 heroes) sets out; there are no dungeons on those days. Put together the lineup in the Raid tab.' },
  guildHall: { name: 'Guild hall', text: 'Expand the guild hall: barracks, infirmary, forge and more. New tasks: gather herbs and materials.' },
};

export const COUNTERS_EN = {
  interrupt: { name: 'Interrupt' },
  cleanse: { name: 'Cleanse curse' },
  block: { name: 'Intercept' },
  breakShell: { name: 'Break shell' },
  calm: { name: 'Calm frenzy' },
};

// Titel der Sammelbuch-Seiten (Liste: nach Nummer)
export const COLLECTION_PAGES_EN = {
  0: { title: 'Bear Slayer' },
  1: { title: 'Shadow Breaker' },
  2: { title: 'Brood Hunter' },
  3: { title: 'Frost Giant Feller' },
  4: { title: 'Witch Banisher' },
  5: { title: 'Keeper of the Last Sun' },
  6: { title: 'Dragon Slayer' },
  7: { title: 'Iron Guard' },
  8: { title: 'Lords of the Wild' },
  9: { title: 'Keepers of the Archive' },
  10: { title: 'Conquerors of the Ash Halls' },
  11: { title: 'Saviors of the World' },
};

export const RAIDS_EN = {
  ashHalls: {
    name: 'The Ash Halls',
    description: 'Beneath the extinct volcano rules the Ash King. Four guardians stand between your guild and his throne.',
    encounters: { 0: { name: 'Ash Forecourt' }, 1: { name: 'Stone Watch' }, 3: { name: 'Plague Pits' }, 5: { name: 'Ember Chamber' }, 6: { name: 'Fire Choir' }, 8: { name: 'Throne Guard' } },
  },
  nightThrone: {
    name: 'The Night Throne',
    description: 'Behind the Ice Gate waits Vaelor, the World Devourer. Whoever defeats him saves the world – and wins the game.',
    encounters: { 0: { name: 'Ice Gate' }, 2: { name: 'Storm Gallery' }, 3: { name: 'Thunder Bridge' }, 5: { name: 'Bone Pit' }, 7: { name: 'Shadow Chapel' }, 8: { name: 'Path of Darkness' }, 10: { name: 'Throne Forecourt' } },
  },
};

export const CAUSE_NOTES_EN = {
  missedInterrupt: '{name} was not interrupted {count}×.',
  outOfMana: '{name} ran out of mana.',
  uncountered: '{name} was not countered {count}× ({counter}).',
};

export const CAUSE_TIPS_EN = {
  mechanic: 'This mechanic can be countered: check the dungeon guide for which class or resistance helps.',
  attack: 'The tank can\'t take enough: better armor, a second healer or the stance "Bulwark" help.',
  minion: 'The minions deal too much damage: area damage clears them faster, "All on me" keeps them on the tank.',
  enrage: 'The fight takes too long and the boss enrages: bring more damage, e.g. the stance "Overload" or another damage dealer.',
};

export const CLASS_TIPS_EN = {
  minion: { text: 'area damage against the minions' },
  summon: { text: 'area damage against the minions' },
  enrage: { text: 'more damage' },
  attack: { text: 'more healing or protection for the tank' },
  frontWave: { text: 'ranged fighters instead of melee' },
  groupCast: { text: 'group healing and protection' },
  groupStrike: { text: 'group healing and protection' },
};

export const UNKNOWN_CAUSE_EN = {
  name: 'Something unknown',
  tip: 'Something took your group by surprise. Scouting helps.',
  missedInterrupt: 'An unknown spell was not interrupted {count}×.',
};

export const SETS_EN = {
  setWarrior: { name: 'Warlord\'s Defense', pieceNames: { head: 'Warlord\'s Helm', feet: 'Warlord\'s Boots' } },
  setPaladin: { name: 'Armor of the Light Oath', pieceNames: { head: 'Helm of the Light Oath', feet: 'Steps of the Light Oath' } },
  setSamurai: { name: 'Bladesmaster\'s Armor', pieceNames: { head: 'Bladesmaster\'s Kabuto', feet: 'Bladesmaster\'s Suneate' } },
  setShaman: { name: 'Stormcaller\'s Garb', pieceNames: { head: 'Stormcaller\'s Helm', feet: 'Stormcaller\'s Boots' } },
  setRogue: { name: 'Shadowrunner\'s Shroud', pieceNames: { head: 'Shadowrunner\'s Mask', feet: 'Shadowrunner\'s Soles' } },
  setMonk: { name: 'Garments of the Silent Mountain', pieceNames: { head: 'Headband of the Silent Mountain', feet: 'Sandals of the Silent Mountain' } },
  setBarbarian: { name: 'Pelts of the Blood Frenzy', pieceNames: { head: 'Skull of the Blood Frenzy', feet: 'Stompers of the Blood Frenzy' } },
  setHunter: { name: 'Tracker\'s Gear', pieceNames: { head: 'Tracker\'s Hood', feet: 'Tracker\'s Boots' } },
  setDruid: { name: 'Grovekeeper\'s Garb', pieceNames: { head: 'Grovekeeper\'s Antlers', feet: 'Grovekeeper\'s Roots' } },
  setPriest: { name: 'Vestments of the Dawn', pieceNames: { head: 'Coif of the Dawn', feet: 'Shoes of the Dawn' } },
  setRuneweaver: { name: 'Runemaster\'s Garb', pieceNames: { head: 'Runemaster\'s Hood', feet: 'Runemaster\'s Shoes' } },
  setMage: { name: 'Robes of the Starfire', pieceNames: { head: 'Hood of the Starfire', feet: 'Shoes of the Starfire' } },
  setWarlock: { name: 'Vestments of the Soul Harvest', pieceNames: { head: 'Hood of the Soul Harvest', feet: 'Shoes of the Soul Harvest' } },
  setBard: { name: 'Mastersinger\'s Attire', pieceNames: { head: 'Mastersinger\'s Hat', feet: 'Mastersinger\'s Shoes' } },
  setChronomancer: { name: 'Robes of the Timekeeper', pieceNames: { head: 'Hood of the Timekeeper', feet: 'Shoes of the Timekeeper' } },
};

export const DUNGEONS_EN = {
  bearCave: { name: 'The Bear Cave', description: 'A pack of cave wolves guards the den of the mighty Grimfang.', encounters: { 0: { name: 'Wolf Pack' } } },
  ruinedChapel: { name: 'The Ruined Chapel', description: 'Cultists and ghouls serve Sister Morva in her dark rituals.', encounters: { 0: { name: 'Cultists at the Gate' } } },
  broodNests: { name: 'The Brood Nests', description: 'Deep underground, beetles swarm everywhere. In the middle lurks the brood mother Skarrix.', encounters: { 0: { name: 'Brood Chamber' }, 1: { name: 'Shell Guard' } } },
  frostPeak: { name: 'The Frost Peak', description: 'Kobolds swarm across the glacier. At the top waits Hrimgar, whose annihilating blow crushes any tank.', encounters: { 0: { name: 'Kobold Gang' }, 1: { name: 'Frost Wolves' } } },
  witchMoor: { name: 'The Haunted Moor', description: 'Will-o\'-wisps lure wanderers into the swamp. Mother Grezza curses everyone who reaches her hut.', encounters: { 0: { name: 'Bog Corpses' }, 1: { name: 'Will-o\'-Wisps' } } },
  sunTemple: { name: 'The Sunken Sun Temple', description: 'A stone guardian watches the gate. Behind it, High Priest Azhur summons the last sun.', encounters: { 0: { name: 'Temple Guard' }, 2: { name: 'Sun Choir' } } },
  emberKeep: { name: 'The Ember Keep', description: 'In the forge beneath the volcano, Vorrak hammers away. Deeper in the mountain broods Ignara, the dragon mother.', encounters: { 0: { name: 'Ember Imps' }, 2: { name: 'Dragon Brood' } } },
  ironCitadel: { name: 'The Iron Citadel', description: 'Set dungeon for plate: the Iron Warden guards the gate. Behind it, Commander Ferron keeps the armor of the warlords.', encounters: { 0: { name: 'Gate Guard' }, 1: { name: 'Armory' }, 3: { name: 'Battlements' } } },
  wildGrove: { name: 'The Wild Grove', description: 'Set dungeon for leather: the bark giant Gnarr blocks the way. Deep in the grove, the primal beast Skaar watches over the garb of hunters and keepers.', encounters: { 0: { name: 'Wild Wolf Pack' }, 1: { name: 'Thorn Thicket' }, 3: { name: 'Moor Path' } } },
  arcaneArchive: { name: 'The Arcane Archive', description: 'Set dungeon for cloth: the ink witch Selvra dwells between the shelves. In the innermost hall, the archivist Mythrel keeps the robes of the great mages.', encounters: { 0: { name: 'Flying Pages' }, 1: { name: 'Reading Room' }, 3: { name: 'Forbidden Section' } } },
};

// Set-Boni je Rolle (ab 2 und ab 3 getragenen Teilen)
export const ROLE_BONUSES_EN = {
  tank: { 2: { text: '+15 % health' }, 3: { text: '−10 % damage taken' } },
  healer: { 2: { text: '+15 % healing' }, 3: { text: '−15 % mana costs' } },
  damage: { 2: { text: '+10 % damage' }, 3: { text: '+10 % damage, survives a deadly hit once per fight' } },
  support: { 2: { text: '+8 % damage and healing' }, 3: { text: '−8 % damage taken, +10 % health' } },
};
