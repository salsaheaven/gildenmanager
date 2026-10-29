// ============================================================
// EXPEDITION – ein Dungeon-Run, der für heute geplant ist
//
// Ablauf (rundenbasiert, 1 Runde = 1 Tag):
//   1. Tagsüber plant man den Run: Dungeon, Helden, Rückzugsregel und Vorräte (Verbrauchsgüter).
//      Bis zum Tagesende darf man die Helden noch umrüsten und ihre Anweisungen ändern.
//   2. Bei "Tag beenden" wird der Run ausgekämpft (resolve): Die Helden werden so,
//      wie sie gerade sind, als Abbild festgehalten, und der Run wird mit festem Seed berechnet.
//
// Das Abbild (heroSnapshots) wird mitgespeichert. So lässt sich ein beendeter Run
// später genau gleich noch einmal ansehen (Bericht, Kampfszene).
// ============================================================

import { Hero } from './Hero.js';
import { simulateRun } from '../systems/combat/CombatSimulator.js';

export class Expedition {
  // heroIds = die Helden der Gruppe, seed = fester Zufall für diesen Run
  // supplies = mitgenommene Verbrauchsgüter (Liste von ids, höchstens SUPPLY_SLOTS)
  constructor(id, dungeonId, heroIds, retreatRuleId, seed, supplies = []) {
    this.id = id;
    this.dungeonId = dungeonId;
    this.heroIds = heroIds;
    this.retreatRuleId = retreatRuleId;
    this.seed = seed;
    this.supplies = supplies;
    this.scouted = false;      // war der Dungeon erkundet? (wird beim Auskämpfen festgelegt, siehe Game.finishExpedition)
    this.heroSnapshots = null; // Abbild der Helden beim Auskämpfen (null = noch nicht ausgekämpft)
    this.result = null;        // berechnetes Ergebnis (wird nicht gespeichert, sondern neu berechnet)
  }

  getHeroIds() {
    return this.heroIds;
  }

  // Kämpft den Run aus. heroes = die echten Hero-Objekte der Gruppe.
  resolve(heroes) {
    this.heroSnapshots = heroes.map((hero) => hero.toSaveData());
    this.result = null;
    return this.getResult();
  }

  // Ergebnis des Runs (nur beim ersten Mal berechnen, danach aus dem Zwischenspeicher)
  getResult() {
    if (this.heroSnapshots === null) {
      throw new Error('Der Run wurde noch nicht ausgekämpft');
    }
    if (this.result === null) {
      this.result = simulateRun({
        heroes: this.heroSnapshots.map((snapshot) => Hero.fromSaveData(snapshot)),
        dungeonId: this.dungeonId,
        retreatRuleId: this.retreatRuleId,
        seed: this.seed,
        recordLog: true,
        supplies: this.supplies,
        scouted: this.scouted,
      });
    }
    return this.result;
  }

  toSaveData() {
    return {
      id: this.id,
      dungeonId: this.dungeonId,
      heroIds: this.heroIds,
      retreatRuleId: this.retreatRuleId,
      seed: this.seed,
      supplies: this.supplies,
      scouted: this.scouted,
      heroSnapshots: this.heroSnapshots,
    };
  }

  static fromSaveData(data) {
    // Alte Spielstände (Echtzeit) hatten nur das Abbild vom Start, aber keine heroIds
    const heroIds = data.heroIds || data.heroSnapshots.map((snapshot) => snapshot.id);
    const expedition = new Expedition(data.id, data.dungeonId, heroIds, data.retreatRuleId, data.seed, data.supplies);
    // Ein alter, noch laufender Run steht jetzt einfach in der Planung und wird am Tagesende
    // neu ausgekämpft (resolve). Alte Berichte behalten ihr Abbild, damit man sie weiter ansehen kann.
    expedition.heroSnapshots = data.heroSnapshots || null;
    expedition.scouted = data.scouted;
    return expedition;
  }
}
