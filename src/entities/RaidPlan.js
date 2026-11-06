// ============================================================
// RAIDPLAN – die Raid-Aufstellung der Gilde und der Fortschritt der Woche
//   - groups: 4 Raid-Gruppen mit je bis zu 5 Helden-ids (bleibt von Woche zu Woche gespeichert)
//   - Wochen-Sperre: welche Bosse in dieser Woche schon besiegt sind (lockoutWeek + defeatedBossIds)
//   - skippedDay: an diesem Tag setzt der Raid aus (Knopf "Heute aussetzen")
//   - activeToday: zieht der Raid heute los? Wird von Game.refreshRaidToday ausgerechnet
//     (nicht gespeichert), damit der Tagesplan und "beschäftigt" es ohne Tageszähler wissen.
// Die Regeln (Raid-Tage, Mindestgröße …) stehen in data/raids.js und systems/RaidRules.js.
// ============================================================

import { RAID_RULES } from '../data/raids.js';

export class RaidPlan {
  constructor(raidId) {
    this.raidId = raidId;
    this.groups = [];
    for (let i = 0; i < RAID_RULES.groupCount; i++) {
      this.groups.push([]);
    }
    this.lockoutWeek = 0;      // für diese Woche gilt defeatedBossIds
    this.defeatedBossIds = []; // in der Woche lockoutWeek besiegte Bosse
    this.skippedDay = 0;       // an diesem Tag setzt der Raid aus (0 = nie)
    this.lastFoughtDay = 0;    // an diesem Tag wurde zuletzt geraidet
    this.activeToday = false;  // zieht der Raid heute los? (siehe Game.refreshRaidToday)
  }

  // Alle Helden-ids der Aufstellung (Gruppe für Gruppe)
  getHeroIds() {
    return this.groups.flat();
  }

  isMember(heroId) {
    return this.getHeroIds().includes(heroId);
  }

  // In welcher Gruppe steht der Held? (-1 = in keiner)
  getGroupIndexOf(heroId) {
    return this.groups.findIndex((group) => group.includes(heroId));
  }

  // Die besiegten Bosse der angegebenen Woche (eine neue Woche beginnt ohne besiegte Bosse)
  getDefeatedBossIds(week) {
    return week === this.lockoutWeek ? this.defeatedBossIds : [];
  }

  // Ein Boss ist besiegt: bis zum Ende der Woche gesperrt
  markBossDefeated(bossId, week) {
    if (week !== this.lockoutWeek) {
      this.lockoutWeek = week;
      this.defeatedBossIds = [];
    }
    if (!this.defeatedBossIds.includes(bossId)) {
      this.defeatedBossIds.push(bossId);
    }
  }

  // Entlassene Helden fallen aus der Aufstellung
  removeMissingHeroes(guild) {
    this.groups = this.groups.map((group) => group.filter((heroId) => guild.findHero(heroId)));
  }

  toSaveData() {
    return {
      raidId: this.raidId,
      groups: this.groups,
      lockoutWeek: this.lockoutWeek,
      defeatedBossIds: this.defeatedBossIds,
      skippedDay: this.skippedDay,
      lastFoughtDay: this.lastFoughtDay,
    };
  }

  static fromSaveData(data) {
    const plan = new RaidPlan(data.raidId);
    plan.groups = data.groups;
    plan.lockoutWeek = data.lockoutWeek;
    plan.defeatedBossIds = data.defeatedBossIds;
    plan.skippedDay = data.skippedDay;
    plan.lastFoughtDay = data.lastFoughtDay;
    return plan;
  }
}
