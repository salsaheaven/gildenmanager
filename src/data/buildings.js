// ============================================================
// GEBÄUDE DER GILDENHALLE – was man bauen kann, was es kostet und was es bewirkt
// Die Regeln (bauen, Bauzeit, Unterhalt) stehen in systems/BuildingSystem.js,
// den Stand der Gilde (welche Stufe, was gerade gebaut wird) hält entities/GuildHall.js.
//
// Jedes Gebäude hat 3 Stufen. Pro Stufe:
//   cost      = Baukosten { gold, dust, crystal } (Material siehe data/crafting.js)
//   buildDays = so viele Tage dauert der Bau (fertig bei "Tag beenden")
//   upkeep    = Unterhalt in Gold pro Tag, solange das Gebäude steht (gilt für diese Stufe, nicht zusätzlich)
//   effects   = Wirkungen auf dieser Stufe (ersetzen die der Stufe davor). Mögliche Felder:
//     extraHeroSlots      = so viele Helden mehr in der Gilde (Kaserne)
//     injuryAvoidChance   = Chance, dass ein Gefallener gar nicht verletzt wird (Lazarett)
//     upgradeChanceBonus  = mehr Erfolgschance beim Verbessern ab +6 (Schmiede, 0.05 = +5 Prozentpunkte)
//     forging, reforging  = schaltet Schmieden / Umschmieden frei (Schmiede, ab M3 Schritt 4)
//     forgeCostFactor     = Anteil der Schmiede-Kosten (0.75 = 25 % billiger, ab M3 Schritt 4)
//     brewTier            = welche Rezepte das Labor brauen kann (Alchemielabor, ab M3 Schritt 4)
//     brewCostFactor      = Anteil der Brau-Kosten (0.8 = 20 % billiger)
//     trainingXpBonus     = mehr EP beim Training (Trainingshalle, 0.25 = +25 %)
//     trainingCostFactor  = Anteil der Trainingskosten (0.8 = 20 % billiger)
//     scoutingRunDays     = für wie viele Kampftage eine Erkundung hält (Kartenraum; ohne Kartenraum 1)
//     defeatForecast      = der Dungeon-Bildschirm zeigt vorab, woran die Gruppe wohl scheitern würde (Kartenraum)
//   text      = kurze Beschreibung der Stufe für die Anzeige
//
// Unterhalt: Reicht das Gold am Abend nicht für den ganzen Unterhalt, wird nichts bezahlt
// und kein Gebäude wirkt am nächsten Tag (bis wieder genug Gold da ist).
// Zahlen grob gesetzt, gebalanced wird am Ende.
// ============================================================

export const BUILDINGS = {
  barracks: {
    name: 'Kaserne',
    description: 'Schlafplätze für mehr Helden',
    levels: [
      { cost: { gold: 200, dust: 10, crystal: 0 }, buildDays: 2, upkeep: 4, effects: { extraHeroSlots: 5 }, text: '+5 Heldenplätze' },
      { cost: { gold: 450, dust: 30, crystal: 3 }, buildDays: 3, upkeep: 8, effects: { extraHeroSlots: 10 }, text: '+10 Heldenplätze' },
      { cost: { gold: 900, dust: 60, crystal: 8 }, buildDays: 4, upkeep: 14, effects: { extraHeroSlots: 15 }, text: '+15 Heldenplätze' },
    ],
  },
  infirmary: {
    name: 'Lazarett',
    description: 'Heiler kümmern sich um Gefallene, damit sie nicht ausfallen',
    levels: [
      { cost: { gold: 150, dust: 10, crystal: 0 }, buildDays: 1, upkeep: 3, effects: { injuryAvoidChance: 0.25 }, text: '25 % der Gefallenen sind gleich wieder fit' },
      { cost: { gold: 400, dust: 25, crystal: 3 }, buildDays: 2, upkeep: 6, effects: { injuryAvoidChance: 0.5 }, text: '50 % der Gefallenen sind gleich wieder fit' },
      { cost: { gold: 800, dust: 50, crystal: 8 }, buildDays: 3, upkeep: 10, effects: { injuryAvoidChance: 0.75 }, text: '75 % der Gefallenen sind gleich wieder fit' },
    ],
  },
  forge: {
    name: 'Schmiede',
    description: 'Ausrüstung herstellen und sicherer verbessern',
    levels: [
      { cost: { gold: 250, dust: 20, crystal: 0 }, buildDays: 2, upkeep: 4, effects: { forging: true, upgradeChanceBonus: 0.05 }, text: 'Schmieden, +5 % Chance beim Verbessern' },
      { cost: { gold: 550, dust: 40, crystal: 5 }, buildDays: 3, upkeep: 8, effects: { forging: true, reforging: true, upgradeChanceBonus: 0.1 }, text: 'Umschmieden, +10 % Chance' },
      { cost: { gold: 1000, dust: 80, crystal: 12 }, buildDays: 4, upkeep: 14, effects: { forging: true, reforging: true, forgeCostFactor: 0.75, upgradeChanceBonus: 0.15 }, text: 'Schmieden 25 % billiger, +15 % Chance' },
    ],
  },
  alchemyLab: {
    name: 'Alchemielabor',
    description: 'Braut Tränke aus gesammelten Kräutern',
    levels: [
      { cost: { gold: 150, dust: 5, crystal: 0 }, buildDays: 1, upkeep: 3, effects: { brewTier: 1, brewCostFactor: 1 }, text: 'Heil- und Manatränke brauen' },
      { cost: { gold: 400, dust: 20, crystal: 2 }, buildDays: 2, upkeep: 6, effects: { brewTier: 2, brewCostFactor: 0.85 }, text: 'Auch Schutztränke, 15 % billiger' },
      { cost: { gold: 800, dust: 40, crystal: 6 }, buildDays: 3, upkeep: 10, effects: { brewTier: 3, brewCostFactor: 0.7 }, text: 'Auch Wutelixier und Steinhaut, 30 % billiger' },
    ],
  },
  trainingHall: {
    name: 'Trainingshalle',
    description: 'Besseres Training für Helden, die nicht kämpfen',
    levels: [
      { cost: { gold: 200, dust: 10, crystal: 0 }, buildDays: 2, upkeep: 4, effects: { trainingXpBonus: 0.25, trainingCostFactor: 0.8 }, text: 'Training +25 % EP, 20 % billiger' },
      { cost: { gold: 450, dust: 25, crystal: 3 }, buildDays: 3, upkeep: 8, effects: { trainingXpBonus: 0.5, trainingCostFactor: 0.6 }, text: 'Training +50 % EP, 40 % billiger' },
      { cost: { gold: 850, dust: 50, crystal: 8 }, buildDays: 4, upkeep: 12, effects: { trainingXpBonus: 0.75, trainingCostFactor: 0.4 }, text: 'Training +75 % EP, 60 % billiger' },
    ],
  },
  mapRoom: {
    name: 'Kartenraum',
    description: 'Karten und Berichte machen Erkundungen wertvoller',
    levels: [
      { cost: { gold: 150, dust: 10, crystal: 0 }, buildDays: 1, upkeep: 3, effects: { scoutingRunDays: 2 }, text: 'Eine Erkundung hält 2 Kampftage' },
      { cost: { gold: 400, dust: 25, crystal: 3 }, buildDays: 2, upkeep: 6, effects: { scoutingRunDays: 3 }, text: 'Eine Erkundung hält 3 Kampftage' },
      { cost: { gold: 800, dust: 50, crystal: 8 }, buildDays: 3, upkeep: 10, effects: { scoutingRunDays: 3, defeatForecast: true }, text: 'Zeigt vorab, woran die Gruppe wohl scheitern würde' },
    ],
  },
};

// Reihenfolge der Gebäude in der Anzeige
export const BUILDING_ORDER = ['barracks', 'infirmary', 'forge', 'alchemyLab', 'trainingHall', 'mapRoom'];

export function getBuilding(buildingId) {
  const building = BUILDINGS[buildingId];
  if (!building) {
    throw new Error('Unbekanntes Gebäude: ' + buildingId);
  }
  return building;
}
