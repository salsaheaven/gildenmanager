// ============================================================
// STANDINGGROUP – eine stehende Gruppe: wird einmal gebildet und zieht jeden Tag in ihren Dungeon,
// bis man sie auflöst. Jeden Morgen wird sie automatisch für den Tag eingeplant (siehe systems/StandingGroups.js).
// Wer verletzt ist, fehlt an dem Tag; sein Platz bleibt leer (oder man setzt einen Ersatz für heute ein).
// ============================================================

export class StandingGroup {
  // heroIds = feste Mitglieder, supplies = Vorräte, die jeden Tag mitgenommen werden (wenn sie da sind)
  constructor(id, name, dungeonId, heroIds, retreatRuleId, supplies = []) {
    this.id = id;
    this.name = name;
    this.dungeonId = dungeonId;
    this.heroIds = heroIds;
    this.retreatRuleId = retreatRuleId;
    this.supplies = supplies;
  }

  toSaveData() {
    return {
      id: this.id,
      name: this.name,
      dungeonId: this.dungeonId,
      heroIds: this.heroIds,
      retreatRuleId: this.retreatRuleId,
      supplies: this.supplies,
    };
  }

  static fromSaveData(data) {
    return new StandingGroup(data.id, data.name, data.dungeonId, data.heroIds, data.retreatRuleId, data.supplies);
  }
}
