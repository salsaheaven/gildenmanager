// ============================================================
// ENGLISCH: Raid-Bosse (Name, Titel, Tank-Stapel, Mechaniken, Phasen; Listen = Nummer 0, 1, 2)
// ============================================================

const GROUP_HINT = 'Hits a whole group: the group\'s healer has to be ready.';
const MANY_CURSES = 'Many curses: spread heroes who cleanse curses across the groups.';
const FINAL_PHASE = 'Hits the whole raid again and again: now only damage and healing count.';

export const RAID_BOSSES_EN = {
  stoneColossus: { name: 'Stone Colossus', title: 'Gatekeeper of the Ash Halls', tankStacks: { name: 'Crushed' },
    mechanics: { 0: { name: 'Earth Slam', hint: GROUP_HINT } },
    phases: { 0: { name: 'Phase 2', text: 'The colossus cracks open and calls stone guardians!',
      mechanics: { 0: { name: 'Stone Guardians Awaken', hint: 'Area damage clears the guardians before they reach the healers.' }, 1: { name: 'Earth Slam', hint: GROUP_HINT } } } } },
  plagueMaw: { name: 'Morgul', title: 'The Plague Maw', tankStacks: { name: 'Decayed' },
    mechanics: { 0: { name: 'Plague Bite', hint: 'One curse after another: several heroes who cleanse curses, spread across the groups.' },
      1: { name: 'Acid Spray', hint: 'Hits a whole group. Acid resistance helps.' }, 2: { name: 'Ghouls Rise', hint: 'Area damage clears the ghouls.' } } },
  pyra: { name: 'Pyra', title: 'The Flame Tongue',
    mechanics: { 0: { name: 'Sea of Flames', hint: 'Hits the whole raid: interrupt (rogue, hunter/mage with counter talent). Fire resistance helps.' }, 1: { name: 'Pillar of Fire', hint: GROUP_HINT } },
    phases: { 0: { name: 'Phase 2', text: 'Pyra flares up and calls ember imps from the flames!',
      mechanics: { 0: { name: 'Ember Imps', hint: 'The ember imps attack at random: area damage clears them.' }, 1: { name: 'Sea of Flames', hint: 'Hits the whole raid: interrupt it at all costs.' } } } } },
  ashKing: { name: 'The Ash King', title: 'Lord of the Ash Halls', tankStacks: { name: 'Ash Ember' },
    mechanics: { 0: { name: 'Ash Hammer', hint: 'Shields (runeweaver) or Iron Watch (warrior) absorb the hammer.' }, 1: { name: 'Ash Wave', hint: GROUP_HINT } },
    phases: {
      0: { name: 'Phase 2', text: 'The Ash King calls his dragon brood!',
        mechanics: { 0: { name: 'Dragon Brood', hint: 'The young dragons attack at random: area damage clears them.' }, 1: { name: 'Ash Hammer', hint: 'Shields (runeweaver) or Iron Watch (warrior) absorb the hammer.' } } },
      1: { name: 'Final phase', text: 'The Ash King is ablaze! The whole hall is on fire!',
        mechanics: { 0: { name: 'World Fire', hint: FINAL_PHASE } } },
    } },
  hrimvald: { name: 'Hrimvald', title: 'Warden of the Ice Gate', tankStacks: { name: 'Frozen' },
    mechanics: { 0: { name: 'Ice Avalanche', hint: 'Hits a whole group. Ice resistance helps.' }, 1: { name: 'Frost Wolves', hint: 'Area damage clears the wolves.' },
      2: { name: 'Ice Shell', hint: 'Samurai, barbarian or monk break the shell.' } } },
  zyra: { name: 'Zyra', title: 'The Storm Witch',
    mechanics: { 0: { name: 'Storm Surge', hint: 'Hits the whole raid: interrupt (rogue, hunter/mage with counter talent). Water resistance helps.' }, 1: { name: 'Lightning Mark', hint: MANY_CURSES } },
    phases: { 0: { name: 'Phase 2', text: 'Zyra unleashes the storm! Will-o\'-wisps dance through the hall.',
      mechanics: { 0: { name: 'Will-o\'-Wisps', hint: 'The will-o\'-wisps attack at random: area damage clears them.' }, 1: { name: 'Chain Lightning', hint: GROUP_HINT } } } } },
  morvath: { name: 'Morvath', title: 'The Bone Dragon', tankStacks: { name: 'Rotted' },
    mechanics: { 0: { name: 'Death Breath', hint: 'Hits the whole raid: shadow resistance and strong healers help.' }, 1: { name: 'Ghouls Rise', hint: 'Area damage clears the ghouls.' },
      2: { name: 'Bone Rage', hint: 'Bard, chronomancer or warlock calm the rage.' } } },
  umbral: { name: 'Lord Umbral', title: 'Lord of Shadows', tankStacks: { name: 'Shadowed' },
    mechanics: { 0: { name: 'Shadow Shackle', hint: MANY_CURSES }, 1: { name: 'Shadow Strike', hint: GROUP_HINT } },
    phases: { 0: { name: 'Phase 2', text: 'Lord Umbral calls his cultists from the darkness!',
      mechanics: { 0: { name: 'Cultists', hint: 'The cultists attack at random: area damage clears them.' }, 1: { name: 'Shadow Shackle', hint: 'Now a curse every second round.' } } } } },
  vaelor: { name: 'Vaelor', title: 'The World Devourer', tankStacks: { name: 'Devoured' },
    mechanics: { 0: { name: 'World Bite', hint: 'Shields (runeweaver) or Iron Watch (warrior) absorb the bite.' }, 1: { name: 'Void Wave', hint: GROUP_HINT } },
    phases: {
      0: { name: 'Phase 2', text: 'Vaelor tears the world open! Young dragons crawl out of the rifts.',
        mechanics: { 0: { name: 'Void Brood', hint: 'The young dragons attack at random: area damage clears them.' }, 1: { name: 'Starfall', hint: 'Hits the whole raid: interrupt it at all costs.' } } },
      1: { name: 'Phase 3', text: 'Vaelor devours the light! Curses settle on the raid.',
        mechanics: { 0: { name: 'Devouring Void', hint: 'A curse every second round: every curse cleanser is needed.' }, 1: { name: 'Void Wave', hint: 'Hits a whole group.' } } },
      2: { name: 'Final phase', text: 'The end of all things! Vaelor rips the sky apart!',
        mechanics: { 0: { name: 'World\'s End', hint: FINAL_PHASE } } },
    } },
};
