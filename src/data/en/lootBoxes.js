// ============================================================
// ENGLISCH: Kisten, Boss-Items (bossLoot) und die Stimmung zum Pity-Stand
// ============================================================

export const LOOT_BOXES_EN = {
  wood: { name: 'Wooden chest' },
  silver: { name: 'Silver chest' },
  gold: { name: 'Golden chest' },
  epic: { name: 'Epic chest' },
  chestGrimfang: { name: 'Grimfang\'s Spoils', bossLoot: { grimfangFang: { name: 'Grimfang\'s Fang' }, bearhideArmor: { name: 'Bearhide Armor' }, pawHelmet: { name: 'Paw Helm' } } },
  chestMorva: { name: 'Morva\'s Relics', bossLoot: { shadowcallerStaff: { name: 'Staff of the Shadowcaller' }, sisterHood: { name: 'Hood of the Sister' }, chapelRing: { name: 'Prayer Ring of the Chapel' } } },
  chestSkarrix: { name: 'Skarrix\'s Brood Hoard', bossLoot: { chitinShield: { name: 'Chitin Shield' }, broodBlade: { name: 'Brood Blade' }, acidBoots: { name: 'Acid Boots' } } },
  chestHrimgar: { name: 'Hrimgar\'s Ice Hoard', bossLoot: { glacierHammer: { name: 'Glacier Hammer' }, frostGiantArmor: { name: 'Armor of the Frost Giant' }, iceClaws: { name: 'Ice Claws' } } },
  chestGrezza: { name: 'Grezza\'s Cauldron', bossLoot: { moorbarkVest: { name: 'Moorbark Vest' }, wispBow: { name: 'Wisp Bow' }, witchHat: { name: 'Witch Hat' } } },
  chestAzhur: { name: 'Treasure of the Last Sun', bossLoot: { sunBlade: { name: 'Sun Blade' }, sunChoirLute: { name: 'Lute of the Sun Choir' }, templeBreaker: { name: 'Temple Breaker' }, highPriestSeal: { name: 'Seal of the High Priest' } } },
  chestIgnara: { name: 'Hoard of the Dragon Mother', bossLoot: { forgeHammer: { name: 'Vorrak\'s Forge Hammer' }, dragonscaleHelm: { name: 'Dragonscale Helm' }, emberHood: { name: 'Ember Hood' },
    drakeboneBow: { name: 'Drakebone Bow' }, heartOfIgnara: { name: 'Heart of the Dragon Mother' } } },
  chestFerron: { name: 'Armory of the Citadel', bossLoot: {
    setWarrior_head: { name: 'Warlord\'s Helm' }, setWarrior_chest: { name: 'Warlord\'s Breastplate' }, setWarrior_feet: { name: 'Warlord\'s Boots' },
    setPaladin_head: { name: 'Helm of the Light Oath' }, setPaladin_chest: { name: 'Breastplate of the Light Oath' }, setPaladin_feet: { name: 'Steps of the Light Oath' },
    setSamurai_head: { name: 'Bladesmaster\'s Kabuto' }, setSamurai_chest: { name: 'Bladesmaster\'s Do' }, setSamurai_feet: { name: 'Bladesmaster\'s Suneate' },
    setShaman_head: { name: 'Stormcaller\'s Helm' }, setShaman_chest: { name: 'Stormcaller\'s Breastplate' }, setShaman_feet: { name: 'Stormcaller\'s Boots' } } },
  chestSkaar: { name: 'Den of the Primal Beast', bossLoot: {
    setRogue_head: { name: 'Shadowrunner\'s Mask' }, setRogue_chest: { name: 'Shadowrunner\'s Jerkin' }, setRogue_feet: { name: 'Shadowrunner\'s Soles' },
    setMonk_head: { name: 'Headband of the Silent Mountain' }, setMonk_chest: { name: 'Tunic of the Silent Mountain' }, setMonk_feet: { name: 'Sandals of the Silent Mountain' },
    setBarbarian_head: { name: 'Skull of the Blood Frenzy' }, setBarbarian_chest: { name: 'Pelt of the Blood Frenzy' }, setBarbarian_feet: { name: 'Stompers of the Blood Frenzy' },
    setHunter_head: { name: 'Tracker\'s Hood' }, setHunter_chest: { name: 'Tracker\'s Vest' }, setHunter_feet: { name: 'Tracker\'s Boots' },
    setDruid_head: { name: 'Grovekeeper\'s Antlers' }, setDruid_chest: { name: 'Grovekeeper\'s Bark' }, setDruid_feet: { name: 'Grovekeeper\'s Roots' } } },
  chestMythrel: { name: 'Forbidden Shelves', bossLoot: {
    setPriest_head: { name: 'Coif of the Dawn' }, setPriest_chest: { name: 'Robe of the Dawn' }, setPriest_feet: { name: 'Shoes of the Dawn' },
    setRuneweaver_head: { name: 'Runemaster\'s Hood' }, setRuneweaver_chest: { name: 'Runemaster\'s Robe' }, setRuneweaver_feet: { name: 'Runemaster\'s Shoes' },
    setMage_head: { name: 'Hood of the Starfire' }, setMage_chest: { name: 'Robe of the Starfire' }, setMage_feet: { name: 'Shoes of the Starfire' },
    setWarlock_head: { name: 'Hood of the Soul Harvest' }, setWarlock_chest: { name: 'Robe of the Soul Harvest' }, setWarlock_feet: { name: 'Shoes of the Soul Harvest' },
    setBard_head: { name: 'Mastersinger\'s Hat' }, setBard_chest: { name: 'Mastersinger\'s Jerkin' }, setBard_feet: { name: 'Mastersinger\'s Shoes' },
    setChronomancer_head: { name: 'Hood of the Timekeeper' }, setChronomancer_chest: { name: 'Robe of the Timekeeper' }, setChronomancer_feet: { name: 'Shoes of the Timekeeper' } } },
  raidChestColossus: { name: 'Treasure of the Stone Colossus', bossLoot: { colossusCore: { name: 'Colossus Core Armor' }, runestoneBand: { name: 'Runestone Band' } } },
  raidChestMorgul: { name: 'Plague Spoils', bossLoot: { plagueFang: { name: 'Plague Fangs' }, blightHood: { name: 'Blight Hood' } } },
  raidChestPyra: { name: 'Ember Shrine of the Flame Tongue', bossLoot: { flametongueStaff: { name: 'Staff of the Flame Tongue' }, cinderRobe: { name: 'Cinder Robe' } } },
  raidChestAshKing: { name: 'Throne Treasure of the Ash King', bossLoot: { ashCrown: { name: 'Crown of the Ash King' }, kingslayerAxe: { name: 'Kingslayer' }, emberSignet: { name: 'Ember Signet' } } },
  raidChestHrimvald: { name: 'Hrimvald\'s Ice Hoard', bossLoot: { glacierWard: { name: 'Glacier Wall' }, frostboundBoots: { name: 'Frostbound Boots' } } },
  raidChestZyra: { name: 'Storm Chest of the Witch', bossLoot: { stormcallerLute: { name: 'Lute of the Stormcaller' }, tidecrestHood: { name: 'Tidecrest Crown' } } },
  raidChestMorvath: { name: 'Bone Hoard', bossLoot: { bonewingBow: { name: 'Bonewing Bow' }, ossuaryPlate: { name: 'Ossuary Steps' } } },
  raidChestUmbral: { name: 'Shadow Casket', bossLoot: { umbralKatana: { name: 'Blade of Darkness' }, duskVest: { name: 'Dusk Vest' } } },
  raidChestVaelor: { name: 'Hoard of the World Devourer', bossLoot: { worldbreaker: { name: 'Worldbreaker' }, voidheartRing: { name: 'Heart of the Void' }, starfallCrown: { name: 'Crown of the Starfall' } } },
};

export const BALANCING_EN = {
  pityHints: {
    0: { text: 'Luck is still asleep.' },
    1: { text: 'A faint tingle hangs in the air …' },
    2: { text: 'Something big is coming!' },
    3: { text: 'Luck is very close to you!' },
  },
};
