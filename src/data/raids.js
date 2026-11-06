// ============================================================
// RAIDS – große Kämpfe mit bis zu 20 Helden in 4 Gruppen (siehe "Raids" in KONZEPT.md)
//
// RAID_RULES = Regeln für alle Raids:
//   raidDays     = an welchen Wochentagen geraidet wird (1 = erster Tag der Woche … 7 = letzter).
//                  An Raid-Tagen gibt es keine Dungeon-Runs (5 Dungeon-Tage, 2 Raid-Tage pro Woche).
//   daysPerWeek  = so viele Tage hat eine Woche (die Wochen-Sperre gilt pro Woche)
//   groupCount   = so viele Raid-Gruppen
//   groupSize    = so viele Helden pro Gruppe
//   minHeroes    = mit weniger Helden darf der Raid nicht los (mit weniger als 20 wird es deutlich schwerer)
//   minTanks     = so viele Tanks braucht der Raid mindestens (wegen des Tankwechsels)
//   minHealers   = so viele Heiler braucht der Raid mindestens
//
// Ein Raid (RAIDS):
//   id, name, description = Anzeige
//   level        = Stufe der Gegner
//   unlockLevel  = der Raid öffnet, sobald ein Held dieses Level hat
//   encounters   = Begegnungen in Reihenfolge, wie bei den Dungeons:
//                  { type: 'trash', name, enemies: [Gegner-ids aus MINIONS] } oder { type: 'boss', bossId }
//                  (Raid-Bosse stehen in raidBosses.js, 1–2 Trash-Gruppen vor jedem Boss)
//   bossGold     = Gold für jeden besiegten Boss
//   trashGold    = Gold für jede besiegte Trash-Gruppe
//
// Ablauf eines Raid-Tags: Der Raid kämpft sich Begegnung für Begegnung vor, bis zum ersten Wipe.
// Besiegte Bosse bleiben bis zum Ende der Woche besiegt (Wochen-Sperre), der nächste Raid-Tag macht
// beim nächsten Boss weiter (mit dem Trash davor). Jede Woche beginnt der Raid von vorn.
// Zahlen grob gesetzt (Testballon, kein Balancing).
// ============================================================

export const RAID_RULES = {
  raidDays: [6, 7],
  daysPerWeek: 7,
  groupCount: 4,
  groupSize: 5,
  minHeroes: 10,
  minTanks: 2,
  minHealers: 4,
};

export const RAIDS = [
  {
    id: 'ashHalls',
    name: 'Die Aschenhallen',
    description: 'Unter dem erloschenen Vulkan herrscht der Aschenkönig. Vier Wächter stehen zwischen deiner Gilde und seinem Thron.',
    level: 30,
    unlockLevel: 30,
    encounters: [
      { type: 'trash', name: 'Vorhof der Asche', enemies: ['templeConstruct', 'templeConstruct', 'templeConstruct', 'emberImp', 'emberImp', 'emberImp'] },
      { type: 'trash', name: 'Steinerne Wache', enemies: ['ironGuard', 'ironGuard', 'ironGuard', 'ironGuard', 'emberImp', 'emberImp'] },
      { type: 'boss', bossId: 'stoneColossus' },
      { type: 'trash', name: 'Seuchengruben', enemies: ['ghoul', 'ghoul', 'ghoul', 'ghoul', 'bogCorpse', 'bogCorpse'] },
      { type: 'boss', bossId: 'plagueMaw' },
      { type: 'trash', name: 'Glutkammer', enemies: ['emberImp', 'emberImp', 'emberImp', 'emberImp', 'drakeling', 'drakeling'] },
      { type: 'trash', name: 'Feuerchor', enemies: ['sunAcolyte', 'sunAcolyte', 'sunAcolyte', 'sunAcolyte', 'drakeling', 'drakeling'] },
      { type: 'boss', bossId: 'pyra' },
      { type: 'trash', name: 'Thronwache', enemies: ['ironGuard', 'ironGuard', 'ironGuard', 'drakeling', 'drakeling', 'drakeling'] },
      { type: 'boss', bossId: 'ashKing' },
    ],
    bossGold: 300,
    trashGold: 40,
  },
];

export function getRaid(raidId) {
  const raid = RAIDS.find((entry) => entry.id === raidId);
  if (!raid) {
    throw new Error('Unbekannter Raid: ' + raidId);
  }
  return raid;
}
