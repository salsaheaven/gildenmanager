// ============================================================
// ENGLISCHE INHALTE – Liste aller Übersetzungen: welche deutschen Daten (target) welche Texte bekommen.
// Angewendet wird sie beim Start in core/DataLanguage.js (nur wenn Englisch gewählt ist).
// Ein Test prüft, dass jede englische Angabe einen deutschen Eintrag hat.
// ============================================================

import { RARITIES } from '../rarities.js';
import { TRAITS } from '../traits.js';
import { DAMAGE_TYPES } from '../damageTypes.js';
import { RETREAT_RULES } from '../retreatRules.js';
import { POSITIONS, GROUP_NAMES } from '../groupRules.js';
import { RISK_LEVELS, FALL_LEVELS, UNKNOWN_RISK, PARTIAL_RISK_LEVELS } from '../riskLevels.js';
import { RIVAL_GUILDS } from '../rivalGuilds.js';
import { RANKS } from '../endEvaluation.js';
import { START_TEAM_RULES } from '../startTeam.js';
import { ROLE_NAMES, ROW_NAMES } from '../heroClasses.js';
import { STAT_NAMES, SLOT_NAMES, ARMOR_TYPES, ITEM_SUFFIXES, ITEM_TEMPLATES } from '../items.js';
import { HERO_TASKS, JOB_TEXTS } from '../heroTasks.js';
import { BUILDINGS } from '../buildings.js';
import { CONSUMABLES } from '../consumables.js';
import { MATERIALS } from '../crafting.js';
import { UNLOCKS } from '../unlocks.js';
import { COUNTERS } from '../counters.js';
import { COLLECTION_PAGES } from '../collectionBook.js';
import { RAIDS } from '../raids.js';
import { CAUSE_TIPS, UNKNOWN_CAUSE, CAUSE_NOTES, CLASS_TIPS } from '../defeatCauses.js';
import { SETS, ROLE_BONUSES } from '../sets.js';
import { DUNGEONS } from '../dungeons.js';
import { HERO_CLASSES } from '../heroClasses.js';
import { ABILITIES } from '../abilities.js';
import { TALENTS } from '../talents.js';
import { HERO_ORDERS } from '../heroOrders.js';
import { BOSSES, MINIONS, MECHANIC_TYPE_TEXTS } from '../enemies.js';
import { RAID_BOSSES } from '../raidBosses.js';
import { LOOT_BOXES } from '../lootBoxes.js';
import { BALANCING } from '../balancing.js';
import * as BASICS from './basics.js';
import { LOOT_BOXES_EN, BALANCING_EN } from './lootBoxes.js';
import * as ENEMIES from './enemies.js';
import { RAID_BOSSES_EN } from './raidBosses.js';
import * as CLASSES from './classes.js';
import { TALENTS_EN } from './talents.js';
import { HERO_ORDERS_EN } from './heroOrders.js';
import * as WORLD from './world.js';

export const DATA_TRANSLATIONS_EN = [
  { name: 'RARITIES', target: RARITIES, texts: BASICS.RARITIES_EN },
  { name: 'TRAITS', target: TRAITS, texts: BASICS.TRAITS_EN },
  { name: 'DAMAGE_TYPES', target: DAMAGE_TYPES, texts: BASICS.DAMAGE_TYPES_EN },
  { name: 'RETREAT_RULES', target: RETREAT_RULES, texts: BASICS.RETREAT_RULES_EN },
  { name: 'POSITIONS', target: POSITIONS, texts: BASICS.POSITIONS_EN },
  { name: 'GROUP_NAMES', target: GROUP_NAMES, texts: BASICS.GROUP_NAMES_EN },
  { name: 'RISK_LEVELS', target: RISK_LEVELS, texts: BASICS.RISK_LEVELS_EN },
  { name: 'FALL_LEVELS', target: FALL_LEVELS, texts: BASICS.FALL_LEVELS_EN },
  { name: 'UNKNOWN_RISK', target: UNKNOWN_RISK, texts: BASICS.UNKNOWN_RISK_EN },
  { name: 'PARTIAL_RISK_LEVELS', target: PARTIAL_RISK_LEVELS, texts: BASICS.PARTIAL_RISK_LEVELS_EN },
  { name: 'RIVAL_GUILDS', target: RIVAL_GUILDS, texts: BASICS.RIVAL_GUILDS_EN },
  { name: 'RANKS', target: RANKS, texts: BASICS.RANKS_EN },
  { name: 'START_TEAM_RULES', target: START_TEAM_RULES, texts: BASICS.START_TEAM_RULES_EN },
  { name: 'ROLE_NAMES', target: ROLE_NAMES, texts: BASICS.ROLE_NAMES_EN },
  { name: 'ROW_NAMES', target: ROW_NAMES, texts: BASICS.ROW_NAMES_EN },
  { name: 'STAT_NAMES', target: STAT_NAMES, texts: BASICS.STAT_NAMES_EN },
  { name: 'SLOT_NAMES', target: SLOT_NAMES, texts: BASICS.SLOT_NAMES_EN },
  { name: 'ARMOR_TYPES', target: ARMOR_TYPES, texts: BASICS.ARMOR_TYPES_EN },
  { name: 'ITEM_SUFFIXES', target: ITEM_SUFFIXES, texts: BASICS.ITEM_SUFFIXES_EN },
  { name: 'ITEM_TEMPLATES', target: ITEM_TEMPLATES, texts: BASICS.ITEM_TEMPLATES_EN },
  { name: 'HERO_TASKS', target: HERO_TASKS, texts: WORLD.HERO_TASKS_EN },
  { name: 'JOB_TEXTS', target: JOB_TEXTS, texts: WORLD.JOB_TEXTS_EN },
  { name: 'BUILDINGS', target: BUILDINGS, texts: WORLD.BUILDINGS_EN },
  { name: 'CONSUMABLES', target: CONSUMABLES, texts: WORLD.CONSUMABLES_EN },
  { name: 'MATERIALS', target: MATERIALS, texts: WORLD.MATERIALS_EN },
  { name: 'UNLOCKS', target: UNLOCKS, texts: WORLD.UNLOCKS_EN },
  { name: 'COUNTERS', target: COUNTERS, texts: WORLD.COUNTERS_EN },
  { name: 'COLLECTION_PAGES', target: COLLECTION_PAGES, texts: WORLD.COLLECTION_PAGES_EN },
  { name: 'RAIDS', target: RAIDS, texts: WORLD.RAIDS_EN },
  { name: 'CAUSE_NOTES', target: CAUSE_NOTES, texts: WORLD.CAUSE_NOTES_EN },
  { name: 'CAUSE_TIPS', target: CAUSE_TIPS, texts: WORLD.CAUSE_TIPS_EN },
  { name: 'CLASS_TIPS', target: CLASS_TIPS, texts: WORLD.CLASS_TIPS_EN },
  { name: 'UNKNOWN_CAUSE', target: UNKNOWN_CAUSE, texts: WORLD.UNKNOWN_CAUSE_EN },
  { name: 'SETS', target: SETS, texts: WORLD.SETS_EN },
  { name: 'ROLE_BONUSES', target: ROLE_BONUSES, texts: WORLD.ROLE_BONUSES_EN },
  { name: 'DUNGEONS', target: DUNGEONS, texts: WORLD.DUNGEONS_EN },
  { name: 'HERO_CLASSES', target: HERO_CLASSES, texts: CLASSES.HERO_CLASSES_EN },
  { name: 'ABILITIES', target: ABILITIES, texts: CLASSES.ABILITIES_EN },
  { name: 'TALENTS', target: TALENTS, texts: TALENTS_EN },
  { name: 'HERO_ORDERS', target: HERO_ORDERS, texts: HERO_ORDERS_EN },
  { name: 'BOSSES', target: BOSSES, texts: ENEMIES.BOSSES_EN },
  { name: 'MECHANIC_TYPE_TEXTS', target: MECHANIC_TYPE_TEXTS, texts: ENEMIES.MECHANIC_TYPE_TEXTS_EN },
  { name: 'MINIONS', target: MINIONS, texts: ENEMIES.MINIONS_EN },
  { name: 'RAID_BOSSES', target: RAID_BOSSES, texts: RAID_BOSSES_EN },
  { name: 'LOOT_BOXES', target: LOOT_BOXES, texts: LOOT_BOXES_EN },
  { name: 'BALANCING', target: BALANCING, texts: BALANCING_EN },
];
