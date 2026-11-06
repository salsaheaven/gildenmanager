// ============================================================
// RIVALGUILD – eine KI-Gilde im Spielstand: welche Dungeons sie an welchem Tag geschafft hat
// Name, Farbe und Persönlichkeit stehen in data/rivalGuilds.js.
// ============================================================

import { RAIDS } from '../data/raids.js';
import { DUNGEONS } from '../data/dungeons.js';
import { getRivalGuild } from '../data/rivalGuilds.js';

export class RivalGuild {
  constructor(rivalId) {
    this.rivalId = rivalId;
    this.clears = {}; // Dungeon-id → Tag, an dem sie ihn zum ersten Mal geschafft hat
    this.raidKills = {};    // Raid-Boss-id → Tag des ersten Siegs (Raid-Rennen)
    this.raidAttempts = {}; // Raid-Boss-id → Zahl der gescheiterten Versuche
  }

  // Der nächste Raid-Boss, den sie noch nicht besiegt hat (Raid für Raid in Reihenfolge), oder null
  // Erst wenn sie alle Dungeons geschafft hat.
  getNextRaidBoss() {
    if (this.getNextDungeon() !== null) {
      return null;
    }
    for (const raid of RAIDS) {
      for (const encounter of raid.encounters) {
        if (encounter.type === 'boss' && this.raidKills[encounter.bossId] === undefined) {
          return { raid: raid, bossId: encounter.bossId };
        }
      }
    }
    return null;
  }

  getData() {
    return getRivalGuild(this.rivalId);
  }

  // Der nächste Dungeon, den sie noch nicht geschafft hat (oder null, wenn sie alle hat)
  getNextDungeon() {
    return DUNGEONS.find((dungeon) => this.clears[dungeon.id] === undefined) || null;
  }

  toSaveData() {
    return { rivalId: this.rivalId, clears: this.clears, raidKills: this.raidKills, raidAttempts: this.raidAttempts };
  }

  static fromSaveData(data) {
    const rival = new RivalGuild(data.rivalId);
    rival.clears = data.clears;
    rival.raidKills = data.raidKills;
    rival.raidAttempts = data.raidAttempts;
    return rival;
  }
}
