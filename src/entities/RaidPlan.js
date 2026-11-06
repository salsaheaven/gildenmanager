// ============================================================
// RAIDPLAN – die Raid-Aufstellung der Gilde und der Fortschritt pro Raid
//   - groups: 4 Raid-Gruppen mit je bis zu 5 Helden-ids (eine Aufstellung für alle Raids, bleibt gespeichert)
//   - selectedRaidId: in welchen Raid es an Raid-Tagen geht (man wählt frei zwischen den offenen Raids)
//   - Wochen-Sperre pro Raid: lockouts[raidId] = { week, defeatedBossIds }
//   - clears[raidId]: wie oft der Raid ganz geschafft wurde; firstClearDays[raidId]: an welchem Tag zum ersten Mal
//   - skippedDay: an diesem Tag setzt der Raid aus (Knopf "Heute aussetzen")
//   - activeToday, notReadyToday, dungeonsClosedToday: von Game.refreshRaidToday ausgerechnet
//     (nicht gespeichert), damit Tagesplan, "beschäftigt" und Hinweise es ohne Tageszähler wissen.
// Die Regeln (Raid-Tage, Mindestgröße …) stehen in data/raids.js und systems/RaidRules.js.
// ============================================================

import { RAID_RULES } from '../data/raids.js';

export class RaidPlan {
  // selectedRaidId = der Raid, der zuerst gewählt ist (der erste Raid)
  constructor(selectedRaidId) {
    this.selectedRaidId = selectedRaidId;
    this.groups = [];
    for (let i = 0; i < RAID_RULES.groupCount; i++) {
      this.groups.push([]);
    }
    this.lockouts = {};        // Raid-id → { week, defeatedBossIds } (Wochen-Sperre)
    this.clears = {};          // Raid-id → wie oft ganz geschafft
    this.firstClearDays = {};  // Raid-id → Tag des ersten vollständigen Siegs
    this.bossKillDays = {};    // Raid-Boss-id → Tag des ersten Siegs (Rangliste, Raid-Rennen)
    this.skippedDay = 0;       // an diesem Tag setzt der Raid aus (0 = nie)
    this.lastFoughtDay = 0;    // an diesem Tag wurde zuletzt geraidet
    this.activeToday = false;  // zieht der Raid heute los? (siehe Game.refreshRaidToday)
    this.notReadyToday = false;        // heute wäre Raid, aber die Aufstellung reicht nicht (Hinweis im Tagesplan)
    this.dungeonsClosedToday = false;  // heute ist Raid-Tag und ein Raid ist offen: keine Dungeons
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

  // Die besiegten Bosse eines Raids in dieser Woche (eine neue Woche beginnt ohne besiegte Bosse)
  getDefeatedBossIds(raidId, week) {
    const lockout = this.lockouts[raidId];
    return lockout && lockout.week === week ? lockout.defeatedBossIds : [];
  }

  // Ein Boss ist besiegt: bis zum Ende der Woche gesperrt
  markBossDefeated(raidId, bossId, week) {
    if (!this.lockouts[raidId] || this.lockouts[raidId].week !== week) {
      this.lockouts[raidId] = { week: week, defeatedBossIds: [] };
    }
    if (!this.lockouts[raidId].defeatedBossIds.includes(bossId)) {
      this.lockouts[raidId].defeatedBossIds.push(bossId);
    }
  }

  // Der Raid ist ganz geschafft (letzter Boss besiegt)
  recordClear(raidId, day) {
    this.clears[raidId] = (this.clears[raidId] || 0) + 1;
    if (!this.firstClearDays[raidId]) {
      this.firstClearDays[raidId] = day;
    }
  }

  getClears(raidId) {
    return this.clears[raidId] || 0;
  }

  // Entlassene Helden fallen aus der Aufstellung
  removeMissingHeroes(guild) {
    this.groups = this.groups.map((group) => group.filter((heroId) => guild.findHero(heroId)));
  }

  toSaveData() {
    return {
      selectedRaidId: this.selectedRaidId,
      groups: this.groups,
      lockouts: this.lockouts,
      clears: this.clears,
      firstClearDays: this.firstClearDays,
      bossKillDays: this.bossKillDays,
      skippedDay: this.skippedDay,
      lastFoughtDay: this.lastFoughtDay,
    };
  }

  static fromSaveData(data) {
    const plan = new RaidPlan(data.selectedRaidId);
    plan.groups = data.groups;
    plan.lockouts = data.lockouts;
    plan.clears = data.clears;
    plan.firstClearDays = data.firstClearDays;
    plan.bossKillDays = data.bossKillDays;
    plan.skippedDay = data.skippedDay;
    plan.lastFoughtDay = data.lastFoughtDay;
    return plan;
  }
}
