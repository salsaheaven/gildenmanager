// ============================================================
// RIVALGUILD – eine KI-Gilde im Spielstand: welche Dungeons sie an welchem Tag geschafft hat
// Name, Farbe und Persönlichkeit stehen in data/rivalGuilds.js.
// ============================================================

import { DUNGEONS } from '../data/dungeons.js';
import { getRivalGuild } from '../data/rivalGuilds.js';

export class RivalGuild {
  constructor(rivalId) {
    this.rivalId = rivalId;
    this.clears = {}; // Dungeon-id → Tag, an dem sie ihn zum ersten Mal geschafft hat
  }

  getData() {
    return getRivalGuild(this.rivalId);
  }

  // Der nächste Dungeon, den sie noch nicht geschafft hat (oder null, wenn sie alle hat)
  getNextDungeon() {
    return DUNGEONS.find((dungeon) => this.clears[dungeon.id] === undefined) || null;
  }

  toSaveData() {
    return { rivalId: this.rivalId, clears: this.clears };
  }

  static fromSaveData(data) {
    const rival = new RivalGuild(data.rivalId);
    rival.clears = data.clears;
    return rival;
  }
}
