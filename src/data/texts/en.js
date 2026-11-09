// ============================================================
// TEXTE AUF ENGLISCH – dieselben Namen wie in de.js, nur übersetzt.
// Fehlt hier ein Text, zeigt das Spiel den deutschen (siehe core/Language.js).
// ============================================================

export const TEXTS_EN = {
  topBar: {
    endDay: 'End day ▶',
    day: ({ day }) => 'Day ' + day,
    perDay: ({ costs }) => ' (−' + costs + '/day)',
    costsInfo: ({ wages, upkeep }) => 'Due every evening: wages ' + wages + ' gold' + (upkeep > 0 ? ' + building upkeep ' + upkeep + ' gold' : ''),
    noGroup: 'No group planned',
    groupsGo: ({ count }) => count === 1 ? '1 group sets out' : count + ' groups set out',
    raidGoes: 'The raid sets out',
    raidNotReady: 'Raid day: lineup not ready',
    free: ({ count }) => ' · ' + count + ' idle',
    soundOn: 'Sound: on',
    soundOff: 'Sound: off',
    reset: 'New',
    resetConfirm: 'Sure?',
    languageInfo: 'Change language (the page reloads)',
  },

  nav: {
    today: 'Today',
    plan: 'Day plan',
    heroesSection: 'Heroes',
    heroes: 'Overview',
    tavern: 'Tavern',
    dungeonsSection: 'Dungeons',
    dungeons: 'Dungeons',
    raid: 'Raid',
    loot: 'Loot',
    treasury: 'Chests',
    inventory: 'Inventory',
    collection: 'Collection',
    guildSection: 'Guild',
    hall: 'Guild hall',
    shop: 'Merchant',
  },

  founding: {
    title: 'Found your guild',
    nameLabel: 'Guild name',
    hint: 'These five heroes join you. You will find more heroes in the tavern later.',
    start: 'Let\'s go!',
  },

  todo: {
    title: 'What needs doing today?',
    allDone: 'All done. Time to end the day!',
    unlockNew: ({ name }) => 'New: ' + name,
    look: 'Show me ›',
    groupMissing: ({ count }) => count === 1 ? 'A group is missing someone today (use a substitute?)' : count + ' groups are missing someone today (use a substitute?)',
    raidNotReady: 'It\'s raid day, but the raid lineup isn\'t ready yet',
    boxes: ({ count }) => count === 1 ? '1 chest waiting to be opened' : count + ' chests waiting to be opened',
    newGear: ({ count }) => count === 1 ? '1 hero has new gear' : count + ' heroes have new gear',
    talents: ({ count }) => count === 1 ? '1 hero can pick a talent' : count + ' heroes can pick a talent',
    building: 'A building is finished. What will you build next?',
    upkeep: 'Upkeep not paid: no building works today',
    unhappy: ({ count }) => count === 1 ? '1 hero is unhappy (no wages)' : count + ' heroes are unhappy (no wages)',
    groups: ({ count }) => count === 1 ? '1 full group could still set out' : count + ' full groups could still set out',
    candidate: 'A rare applicant is waiting in the tavern',
    newDungeon: ({ name }) => 'New dungeon open: ' + name,
    nextBar: ({ count, text }) => count + ' open · Next: ' + text + ' ›',
  },

  endDayCheck: {
    title: 'Still open',
    back: 'Back',
    confirm: 'End anyway ▶',
    idleHeroes: ({ count }) => count === 1 ? '1 hero has nothing to do' : count + ' heroes have nothing to do',
    groupMissing: ({ count }) => count === 1 ? 'A group is missing someone' : count + ' groups are missing someone',
    raidNotReady: 'Raid day, but the raid lineup isn\'t ready: no raid today',
  },

  main: {
    unlocked: ({ name }) => 'Unlocked: ' + name,
    healed: ({ name }) => name + ' is fit again!',
    quietDay: ({ wages, day }) => 'A quiet day. Wages: −' + wages + ' gold. Day ' + day + ' begins.',
  },
};
