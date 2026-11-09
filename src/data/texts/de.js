// ============================================================
// TEXTE AUF DEUTSCH – alle Texte der Oberfläche, sortiert nach Bildschirm
// Nachgeschlagen werden sie mit t('bereich.name') (siehe core/Language.js).
// Ein Text kann eine Funktion sein: Sie bekommt Werte (z.B. { count }) und baut daraus den Satz.
// Die englischen Texte stehen in en.js unter denselben Namen.
// ============================================================

export const TEXTS_DE = {
  // Leiste oben (TopBar)
  topBar: {
    endDay: 'Tag beenden ▶',
    day: ({ day }) => 'Tag ' + day,
    perDay: ({ costs }) => ' (−' + costs + '/Tag)',
    costsInfo: ({ wages, upkeep }) => 'Jeden Abend fällig: Sold ' + wages + ' Gold' + (upkeep > 0 ? ' + Unterhalt der Gebäude ' + upkeep + ' Gold' : ''),
    noGroup: 'Keine Gruppe eingeplant',
    groupsGo: ({ count }) => count === 1 ? '1 Gruppe zieht los' : count + ' Gruppen ziehen los',
    raidGoes: 'Der Raid zieht los',
    raidNotReady: 'Raid-Tag: Aufstellung reicht nicht',
    free: ({ count }) => ' · ' + count + ' frei',
    soundOn: 'Ton: an',
    soundOff: 'Ton: aus',
    reset: 'Neu',
    resetConfirm: 'Sicher?',
    languageInfo: 'Sprache wechseln (die Seite lädt neu)',
  },

  // Navigation: Abschnitte und Unterreiter (Liste SECTIONS in main.js)
  nav: {
    today: 'Heute',
    plan: 'Tagesplan',
    heroesSection: 'Helden',
    heroes: 'Übersicht',
    tavern: 'Taverne',
    dungeonsSection: 'Dungeons',
    dungeons: 'Dungeons',
    raid: 'Raid',
    loot: 'Beute',
    treasury: 'Kisten',
    inventory: 'Inventar',
    collection: 'Sammelbuch',
    guildSection: 'Gilde',
    hall: 'Gildenhalle',
    shop: 'Händler',
  },

  // Startbildschirm "Gründe deine Gilde"
  founding: {
    title: 'Gründe deine Gilde',
    nameLabel: 'Name der Gilde',
    hint: 'Diese fünf Helden schließen sich dir an. Weitere Helden findest du später in der Taverne.',
    start: 'Los geht\'s!',
  },

  // Kasten "Was gibt es heute zu tun?" (TodoBox) und die Leiste "Weiter" (NextTodoBar)
  todo: {
    title: 'Was gibt es heute zu tun?',
    allDone: 'Alles erledigt. Zeit, den Tag zu beenden!',
    unlockNew: ({ name }) => 'Neu: ' + name,
    look: 'Ansehen ›',
    groupMissing: ({ count }) => count === 1 ? 'Einer Gruppe fehlt heute jemand (Ersatz einsetzen?)' : count + ' Gruppen fehlt heute jemand (Ersatz einsetzen?)',
    raidNotReady: 'Heute ist Raid-Tag, aber die Raid-Aufstellung reicht noch nicht',
    boxes: ({ count }) => count === 1 ? '1 Kiste wartet aufs Öffnen' : count + ' Kisten warten aufs Öffnen',
    newGear: ({ count }) => count === 1 ? '1 Held hat neue Ausrüstung' : count + ' Helden haben neue Ausrüstung',
    talents: ({ count }) => count === 1 ? '1 Held kann ein Talent wählen' : count + ' Helden können ein Talent wählen',
    building: 'Ein Gebäude ist fertig. Was baust du als Nächstes?',
    upkeep: 'Unterhalt nicht bezahlt: Heute wirkt kein Gebäude',
    unhappy: ({ count }) => count === 1 ? '1 Held ist unzufrieden (kein Sold)' : count + ' Helden sind unzufrieden (kein Sold)',
    groups: ({ count }) => count === 1 ? '1 vollständige Gruppe könnte noch los' : count + ' vollständige Gruppen könnten noch los',
    candidate: 'Ein seltener Bewerber wartet in der Taverne',
    newDungeon: ({ name }) => 'Neuer Dungeon offen: ' + name,
    nextBar: ({ count, text }) => 'Noch ' + count + ' offen · Weiter: ' + text + ' ›',
  },

  // Nachfrage bei "Tag beenden" (EndDayCheck)
  endDayCheck: {
    title: 'Noch offen',
    back: 'Zurück',
    confirm: 'Trotzdem beenden ▶',
    idleHeroes: ({ count }) => count === 1 ? '1 Held hat keine Aufgabe' : count + ' Helden haben keine Aufgabe',
    groupMissing: ({ count }) => count === 1 ? 'Einer Gruppe fehlt jemand' : count + ' Gruppen fehlt jemand',
    raidNotReady: 'Raid-Tag, aber die Raid-Aufstellung reicht nicht: Der Raid fällt heute aus',
  },

  // Kurze Meldungen aus main.js
  main: {
    unlocked: ({ name }) => 'Neu freigeschaltet: ' + name,
    healed: ({ name }) => name + ' ist wieder fit!',
    quietDay: ({ wages, day }) => 'Ein ruhiger Tag. Sold: −' + wages + ' Gold. Tag ' + day + ' beginnt.',
  },
};
