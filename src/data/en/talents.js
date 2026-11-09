// ============================================================
// ENGLISCH: Talente (pro Klasse 3 Reihen, je Reihe zwei Talente; Reihe = Nummer 0, 1, 2)
// ============================================================

// Texte, die bei mehreren Klassen gleich sind
const LAST_STAND = 'Once per fight survives a deadly hit with 1 health';
const GROUP_DAMAGE = 'The whole group deals +5 % damage';
const GROUP_PROTECTION = 'The whole group takes −5 % damage';
const SHELL_BREAKER = 'Counter: his hits break a boss\'s shell (weaker than samurai, barbarian and monk)';
const CALM_FRENZY = 'Counter: calms a boss\'s frenzy (costs his turn, weaker than bard, chronomancer and warlock)';

export const TALENTS_EN = {
  warrior: {
    0: { warShieldMaster: { name: 'Shield Master', description: 'Iron Watch lasts 1 round longer' }, warBladeMaster: { name: 'Blade Master', description: '+15 % damage' } },
    1: { warUnbending: { name: 'Unbending', description: '+20 % health' }, warShellBreaker: { name: 'Shield Breaker', description: SHELL_BREAKER } },
    2: { warLastStand: { name: 'Last Stand', description: LAST_STAND }, warWarlord: { name: 'Warlord', description: GROUP_DAMAGE } },
  },
  paladin: {
    0: { palLightStrike: { name: 'Light Strike', description: 'Lightbreaker +25 %' },
      palGuardianShield: { name: 'Guardian', description: 'Counter: Divine Shield protects whoever a big blow is about to hit (instead of only himself)' } },
    1: { palRecovery: { name: 'Recovery', description: 'Vow of Recovery heals 30 % more' }, palShellBreaker: { name: 'Light Hammer', description: SHELL_BREAKER } },
    2: { palDevotionAura: { name: 'Devotion Aura', description: GROUP_PROTECTION }, palMartyr: { name: 'Martyr', description: LAST_STAND } },
  },
  monk: {
    0: { monWhirlwind: { name: 'Whirlwind', description: 'Whirl Kick +30 %' }, monHardPalm: { name: 'Hard Hand', description: 'Palm Strike +25 %' } },
    1: { monFlow: { name: 'Flow', description: 'Flowing Guard lasts 2 rounds longer' }, monLightFoot: { name: 'Light-footed', description: '+8 % dodge' } },
    2: { monInnerCalm: { name: 'Inner Calm', description: '+20 % health' }, monFistMaster: { name: 'Master of the Fist', description: '+20 % damage' } },
  },
  priest: {
    0: { priDevout: { name: 'Devout', description: 'Silent Devotion gives 50 % more mana' },
      priPurifyingSpark: { name: 'Purifying Spark', description: 'Counter: Spark of Grace cleanses curses, but is then only cast on the cursed' } },
    1: { priStreamOfGrace: { name: 'Stream of Grace', description: 'Stream of Life heals 30 % more' }, priZealous: { name: 'Zealous', description: '+10 % healing' } },
    2: { priHolyGlow: { name: 'Holy Glow', description: GROUP_PROTECTION }, priInspiration: { name: 'Divine Inspiration', description: '−25 % mana costs' } },
  },
  runeweaver: {
    0: { runRuneLore: { name: 'Rune Lore', description: 'Rune Armor +25 %' }, runGlyphLore: { name: 'Glyph Lore', description: 'Glyph Circle +25 %' } },
    1: { runEternalGlyphs: { name: 'Eternal Glyphs', description: '−20 % mana costs' }, runStrongRunes: { name: 'Strong Runes', description: '+15 % stronger shields' } },
    2: { runRuneWall: { name: 'Rune Wall', description: GROUP_PROTECTION }, runDeepMana: { name: 'Deep Well', description: '+30 % mana' } },
  },
  druid: {
    0: { druThickMoss: { name: 'Thick Moss', description: 'Moss Mantle heals 25 % more' },
      druBarkskin: { name: 'Barkskin', description: 'Counter: Moss Mantle absorbs a big blow with a shield, but is then only cast right before it' } },
    1: { druWideGrove: { name: 'Wide Grove', description: 'Grove Blessing heals 25 % more' }, druSoothe: { name: 'Soothe', description: CALM_FRENZY } },
    2: { druDeepRoots: { name: 'Deep Roots', description: 'Call of the Roots brings the fallen back with twice as much health' }, druForestHeart: { name: 'Heart of the Forest', description: GROUP_PROTECTION } },
  },
  mage: {
    0: { magEmber: { name: 'Ember', description: 'Ember Lance +20 %' },
      magCounterIce: { name: 'Binding Ice', description: 'Counter: Ice Wreath interrupts spells (long cooldown), but is then only used against interruptible spells' } },
    1: { magAsh: { name: 'Ash', description: 'Ash Rain +25 %' }, magManaFlow: { name: 'Mana Flow', description: '+30 % mana' } },
    2: { magFirestorm: { name: 'Firestorm', description: '+15 % damage, but +20 % aggro' }, magArchmage: { name: 'Archmage', description: '+15 % magic' } },
  },
  rogue: {
    0: { rogSharpBlade: { name: 'Sharp Blade', description: 'Shadow Stab +20 %' }, rogDeadlyPoison: { name: 'Deadly Poison', description: 'Viper Bite +30 %' } },
    1: { rogLingeringPoison: { name: 'Lingering Poison', description: 'Viper Bite lasts 2 rounds longer' }, rogEvasion: { name: 'Evasion Artist', description: '+10 % dodge' } },
    2: { rogShadowDance: { name: 'Shadow Dance', description: LAST_STAND }, rogAssassin: { name: 'Assassin', description: '+15 % damage' } },
  },
  samurai: {
    0: { samFlashBlade: { name: 'Flashing Blade', description: 'Iaido Strike +30 %' }, samCrescent: { name: 'Crescent', description: 'Crescent Cut +25 %' } },
    1: { samExecutioner: { name: 'Executioner', description: 'Execution +30 %' }, samBushido: { name: 'Bushido', description: '−10 % damage taken' } },
    2: { samHonorCode: { name: 'Code of Honor', description: LAST_STAND }, samMasterSword: { name: 'Master Sword', description: '+15 % attack' } },
  },
  barbarian: {
    0: { barWideScythe: { name: 'Wide Scythe', description: 'Scythe Circle +30 %' }, barMight: { name: 'Might', description: 'Reckless Blow +25 %' } },
    1: { barBloodthirst: { name: 'Bloodthirst', description: 'Blood Frenzy lasts 2 rounds longer' }, barThickHide: { name: 'Thick Hide', description: '+20 % health' } },
    2: { barUndyingRage: { name: 'Undying Rage', description: LAST_STAND }, barWarCry: { name: 'War Cry', description: GROUP_DAMAGE } },
  },
  hunter: {
    0: { hunEagleEye: { name: 'Eagle Eye', description: 'Hawk Eye +25 %' },
      hunInterruptNet: { name: 'Net Throw', description: 'Counter: Snare Net hits the boss and interrupts its spell, but no longer catches minions' } },
    1: { hunArrowHail: { name: 'Arrow Hail', description: 'Arrow Fan +30 %' }, hunMarksman: { name: 'Marksman', description: '+10 % attack' } },
    2: { hunPackLeader: { name: 'Hunting Fever', description: '+15 % damage' }, hunCamouflage: { name: 'Camouflage', description: '−50 % aggro, +10 % dodge' } },
  },
  warlock: {
    0: { wloRot: { name: 'Rot', description: 'Corruption +30 %' }, wloSoulEmber: { name: 'Soul Ember', description: 'Soulfire +30 %' } },
    1: { wloShadowArrow: { name: 'Shadow Arrow', description: 'Shadow Bolt +30 %' }, wloDarkPact: { name: 'Dark Pact', description: '−25 % mana costs' } },
    2: { wloSoulHarvest: { name: 'Soul Harvest', description: '+15 % magic' }, wloShadowWard: { name: 'Shadow Ward', description: LAST_STAND } },
  },
  bard: {
    0: { brdCuttingSong: { name: 'Cutting Song', description: 'Song of Blades +25 %' }, brdGentleBallad: { name: 'Gentle Ballad', description: 'Ballad of Hope heals 30 % more' } },
    1: { brdLongChorus: { name: 'Long Chorus', description: 'Song of Blades lasts 1 round longer' }, brdDeepSlumber: { name: 'Deep Slumber', description: 'Slumber Tune lasts 2 rounds longer' } },
    2: { brdHeroicEpic: { name: 'Heroic Epic', description: GROUP_DAMAGE }, brdShieldSong: { name: 'Shield Song', description: GROUP_PROTECTION } },
  },
  shaman: {
    0: { shaThunder: { name: 'Thunderstorm', description: 'Chain Lightning +30 %' },
      shaCleansingTotem: { name: 'Cleansing Totem', description: 'Counter: Stone Totem cleanses the whole group\'s curses, but is then set against curses instead of before group damage' } },
    1: { shaLongRage: { name: 'Long Rage', description: 'Bloodlust lasts 1 round longer' }, shaCalmingTotem: { name: 'Calming Earth', description: CALM_FRENZY } },
    2: { shaAncestor: { name: 'Ancestral Spirit', description: GROUP_DAMAGE }, shaStoneskin: { name: 'Stoneskin', description: GROUP_PROTECTION } },
  },
  chronomancer: {
    0: { chrStretch: { name: 'Time Stretch', description: 'Haste lasts 1 round longer' }, chrSandgrain: { name: 'Grain of Sand', description: '−20 % mana costs' } },
    1: { chrTimeTrap: { name: 'Time Trap', description: 'Time Stop lasts 1 round longer' }, chrTimeShield: { name: 'Time Shield', description: '+20 % health' } },
    2: { chrTimeless: { name: 'Timeless Group', description: GROUP_DAMAGE }, chrRewind: { name: 'Rewind', description: LAST_STAND } },
  },
};
