// ============================================================
// FREISCHALTEN – welche Teile des Spiels wann dazukommen (das Tutorial)
// Am Anfang gibt es nur das Nötigste: Tagesplan, Helden, Dungeons, Kisten und Inventar.
// Alles andere erscheint, sobald es gebraucht wird, mit einem kurzen Hinweis in
// "Was gibt es heute zu tun?" (siehe systems/Unlocks.js und ui/TodoBox.js).
//
// id        = Kennung, nach der die Oberfläche fragt (game.isFeatureUnlocked)
// name      = Anzeige im Hinweis ("Neu: Taverne")
// text      = kurze Erklärung beim ersten Auftauchen
// screenId  = wohin der Hinweis springt (null = nirgends)
// condition = freigeschaltet, sobald EINE dieser Bedingungen erfüllt ist:
//   day        = ab diesem Tag
//   clears     = so viele geschaffte Dungeon-Runs insgesamt
//   heroLevel  = ein Held hat dieses Level erreicht
//   bossItems  = so viele Boss-Items stehen im Sammelbuch
// Einmal freigeschaltet bleibt es frei. Zahlen grob gesetzt.
// ============================================================

export const UNLOCKS = [
  {
    id: 'tavern', name: 'Taverne', screenId: 'tavern', condition: { day: 2 },
    text: 'In der Taverne warten jeden Tag neue Bewerber. Mehr Helden bedeuten mehr Gruppen.',
  },
  {
    id: 'shop', name: 'Händler', screenId: 'shop', condition: { day: 3, clears: 1 },
    text: 'Der Händler verkauft Tränke. Jede Gruppe nimmt bis zu 2 Vorräte mit in den Dungeon.',
  },
  {
    id: 'rivals', name: 'Andere Gilden', screenId: 'plan', condition: { day: 3 },
    text: 'Vier andere Gilden kämpfen um dieselben Dungeons. Ticker und Rangliste stehen im Tagesplan.',
  },
  {
    id: 'crafting', name: 'Zerlegen und Verbessern', screenId: 'treasury', condition: { clears: 1, day: 5 },
    text: 'Im Inventar kannst du Items zerlegen und mit dem Material andere verbessern (+1 bis +10).',
  },
  {
    id: 'collection', name: 'Sammelbuch', screenId: 'treasury', condition: { bossItems: 1 },
    text: 'Jedes Boss-Item kommt ins Sammelbuch. Eine volle Seite bringt einen Titel und mehr Gold.',
  },
  {
    id: 'talents', name: 'Talente', screenId: 'heroes', condition: { heroLevel: 5 },
    text: 'Ab Level 5 wählen Helden Talente. Jede Reihe bietet zwei Wege.',
  },
  {
    id: 'raid', name: 'Raid', screenId: 'raid', condition: { heroLevel: 30 },
    text: 'Die Aschenhallen sind offen! An Tag 6 und 7 jeder Woche zieht dein Raid (10 bis 20 Helden) los, an diesen Tagen gibt es keine Dungeons. Stell die Aufstellung im Reiter „Raid“ zusammen.',
  },
  {
    id: 'guildHall', name: 'Gildenhalle', screenId: 'hall', condition: { clears: 3, day: 8 },
    text: 'Baue die Gildenhalle aus: Kaserne, Lazarett, Schmiede und mehr. Neue Aufgaben: Kräuter und Rohstoffe sammeln.',
  },
];

export function getUnlock(unlockId) {
  const unlock = UNLOCKS.find((entry) => entry.id === unlockId);
  if (!unlock) {
    throw new Error('Unbekannte Freischaltung: ' + unlockId);
  }
  return unlock;
}
