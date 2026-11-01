// ============================================================
// DUNGEONKNOWLEDGE – was die Gilde über einen Dungeon weiß
// Wissen gibt es nur durch die Aufgabe "Erkunden": Jede Erkundung deckt einen weiteren Boss auf,
// zusammen mit den Trash-Gruppen davor. Ohne Wissen sieht man nur Name, Stufe, Begegnungen und Bossnamen.
//   none    = noch nichts erkundet: keine Fähigkeiten, keine Schadensarten, Risiko "Unbekannt"
//   partial = einige Bosse bekannt: grobe Einschätzung ("Eher leicht / Eher schwer")
//   full    = alles bekannt: genaue Einschätzung
// Gespeichert wird pro Dungeon, wie viele Bosse aufgedeckt sind (guild.dungeonKnowledge).
// ============================================================

import { getDungeon } from '../data/dungeons.js';
import { getBoss, MINIONS } from '../data/enemies.js';

// Wie viele Teile (Bosse) hat ein Dungeon?
export function getKnowledgeTotal(dungeonId) {
  return getDungeon(dungeonId).encounters.filter((encounter) => encounter.type === 'boss').length;
}

// Wie viele Bosse sind schon aufgedeckt?
export function getKnownCount(guild, dungeonId) {
  return guild.dungeonKnowledge[dungeonId] || 0;
}

// 'none', 'partial' oder 'full'
export function getKnowledgeLevel(guild, dungeonId) {
  const known = getKnownCount(guild, dungeonId);
  if (known === 0) {
    return 'none';
  }
  return known >= getKnowledgeTotal(dungeonId) ? 'full' : 'partial';
}

// Ist eine Begegnung bekannt? Ein Boss ist bekannt, wenn er aufgedeckt ist;
// eine Trash-Gruppe, wenn der nächste Boss nach ihr aufgedeckt ist.
export function isEncounterKnown(guild, dungeonId, encounterIndex) {
  const encounters = getDungeon(dungeonId).encounters;
  let bossNumber = 0;
  for (let i = 0; i < encounters.length; i++) {
    if (encounters[i].type === 'boss') {
      bossNumber++;
    }
    if (i >= encounterIndex && encounters[i].type === 'boss') {
      return bossNumber <= getKnownCount(guild, dungeonId);
    }
  }
  return false;
}

// Deckt den nächsten Boss auf. Gibt die id des aufgedeckten Bosses zurück (null, wenn schon alles bekannt war).
export function revealNextPart(guild, dungeonId) {
  const known = getKnownCount(guild, dungeonId);
  if (known >= getKnowledgeTotal(dungeonId)) {
    return null;
  }
  guild.dungeonKnowledge[dungeonId] = known + 1;
  const bosses = getDungeon(dungeonId).encounters.filter((encounter) => encounter.type === 'boss');
  return bosses[known].bossId;
}

// Schadensarten der bekannten Begegnungen (ohne 'physical'), z.B. ['shadow']
export function getKnownDamageTypes(guild, dungeonId) {
  const types = new Set();
  getDungeon(dungeonId).encounters.forEach((encounter, index) => {
    if (!isEncounterKnown(guild, dungeonId, index)) {
      return;
    }
    if (encounter.type === 'boss') {
      const boss = getBoss(encounter.bossId);
      types.add(boss.attackDamageType);
      for (const mechanic of boss.mechanics) {
        types.add(mechanic.damageType);
        if (mechanic.minion) {
          types.add(MINIONS[mechanic.minion].attackDamageType);
        }
      }
    } else {
      for (const enemyId of encounter.enemies) {
        types.add(MINIONS[enemyId].attackDamageType);
      }
    }
  });
  types.delete(undefined);
  types.delete('physical');
  return [...types];
}

// Namen der Mechaniken von Bossen, die noch nicht aufgedeckt sind ("Woran es lag" bleibt dort vage)
export function getHiddenMechanicNames(guild, dungeonId) {
  const names = [];
  getDungeon(dungeonId).encounters.forEach((encounter, index) => {
    if (encounter.type === 'boss' && !isEncounterKnown(guild, dungeonId, index)) {
      for (const mechanic of getBoss(encounter.bossId).mechanics) {
        names.push(mechanic.name);
      }
    }
  });
  return names;
}
