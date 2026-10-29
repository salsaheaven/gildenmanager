// ============================================================
// GUILDHALL – die Gildenhalle: welche Gebäude auf welcher Stufe stehen und was gerade gebaut wird
// Was die Gebäude kosten und bewirken, steht in data/buildings.js.
// Die Abläufe (Bau starten, Bautag, Unterhalt) stehen in systems/BuildingSystem.js.
// ============================================================

import { BUILDINGS } from '../data/buildings.js';

export class GuildHall {
  constructor() {
    this.levels = {};          // Gebäude-id → gebaute Stufe (fehlt = noch nicht gebaut)
    this.construction = null;  // laufender Bau: { buildingId, targetLevel, daysLeft } oder null (nur eine Baustelle gleichzeitig)
    this.upkeepPaid = true;    // false = der Unterhalt wurde gestern nicht bezahlt, dann wirkt heute kein Gebäude
  }

  // Auf welcher Stufe steht das Gebäude? (0 = noch nicht gebaut)
  getLevel(buildingId) {
    return this.levels[buildingId] || 0;
  }

  // Wirkung aller Gebäude für ein Feld, z.B. getEffect('extraHeroSlots', 0).
  // Gibt den Standardwert zurück, wenn kein Gebäude das Feld hat oder der Unterhalt nicht bezahlt ist.
  getEffect(fieldName, defaultValue) {
    if (!this.upkeepPaid) {
      return defaultValue;
    }
    for (const buildingId in this.levels) {
      const level = this.getLevel(buildingId);
      if (level === 0) {
        continue;
      }
      const effects = BUILDINGS[buildingId].levels[level - 1].effects;
      if (fieldName in effects) {
        return effects[fieldName];
      }
    }
    return defaultValue;
  }

  toSaveData() {
    return {
      levels: this.levels,
      construction: this.construction,
      upkeepPaid: this.upkeepPaid,
    };
  }

  static fromSaveData(data) {
    const hall = new GuildHall();
    hall.levels = data.levels;
    hall.construction = data.construction;
    hall.upkeepPaid = data.upkeepPaid;
    return hall;
  }
}
