// ============================================================
// SAMMELBUCH – eine Seite pro Dungeon mit den Boss-Items, die dort fallen
// Welche Items auf eine Seite gehören, steht nicht hier, sondern in der Boss-Kiste des Dungeons
// ("bossLoot" in lootBoxes.js). So muss ein neues Boss-Item nur an einer Stelle eingetragen werden.
//
// dungeonId = zu welchem Dungeon die Seite gehört
// title     = Gildentitel, den man bekommt, wenn die Seite voll ist (alle Items mindestens einmal gefunden)
// goldBonus = so viel mehr Gold gibt dieser Dungeon, sobald die Seite voll ist (0.1 = +10 %)
// ============================================================

import { getDungeon } from './dungeons.js';
import { getLootBoxType } from './lootBoxes.js';

export const COLLECTION_PAGES = [
  { dungeonId: 'bearCave', title: 'Bärenbezwinger', goldBonus: 0.1 },
  { dungeonId: 'ruinedChapel', title: 'Schattenbrecher', goldBonus: 0.1 },
  { dungeonId: 'broodNests', title: 'Brutjäger', goldBonus: 0.1 },
  { dungeonId: 'frostPeak', title: 'Frostriesen-Fäller', goldBonus: 0.1 },
  { dungeonId: 'witchMoor', title: 'Hexenbanner', goldBonus: 0.1 },
  { dungeonId: 'sunTemple', title: 'Hüter der letzten Sonne', goldBonus: 0.1 },
];

// Ab dieser Seltenheit gilt ein Item als "glänzend". Sind alle Items einer Seite so selten, glänzt die Seite.
export const SHINY_RARITY = 'epic';

export function getCollectionPage(dungeonId) {
  return COLLECTION_PAGES.find((page) => page.dungeonId === dungeonId) || null;
}

// Die Boss-Items einer Seite (Einträge aus "bossLoot" der Boss-Kiste des Dungeons)
export function getPageItems(page) {
  const chest = getLootBoxType(getDungeon(page.dungeonId).rewards.chest);
  return chest.bossLoot || [];
}

// Alle Boss-Items des Buchs
export function getAllCollectionItems() {
  const all = [];
  for (const page of COLLECTION_PAGES) {
    all.push(...getPageItems(page));
  }
  return all;
}
