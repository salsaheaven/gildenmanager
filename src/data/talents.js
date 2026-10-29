// ============================================================
// TALENTE – dauerhafte Spezialisierung der Helden
// Jede Klasse hat 3 Talentreihen (Level siehe TALENT_RULES.rowLevels). In jeder Reihe wählt man
// 1 von 2 Talenten. Die beiden ziehen in verschiedene Richtungen (z.B. Schutz oder Schaden).
//   Reihe 1 = kleine Spezialisierung, Reihe 2 = baut einen Skill um, Reihe 3 = große Fähigkeit
// Seltene Helden dürfen in den ersten Reihen beide Talente nehmen ("Doppelwahl").
// Umskillen (alle Talente zurücksetzen) kostet Gold.
//
// Ein Talent: { id, name, description, effects }
// effects benutzt denselben Baukasten wie die Anweisungen (siehe data/heroOrders.js):
//   damageDone, damageTaken, healingDone, manaCost, threat, dodge, targetPriority,
//   abilityPower, abilityWhen, abilityTarget
// und zusätzlich:
//   statBonus       = { wert: Anteil } mehr Werte, z.B. { health: 0.2 } = +20 % Leben
//                     (health, mana, attack, magic, defense)
//   abilityDuration = { skill-id: Runden } der Skill hält so viele Runden länger
//   cheatDeath      = true: einmal pro Kampf überlebt der Held einen tödlichen Treffer mit 1 Leben
//   groupAura       = { damageDone, damageTaken } wirkt auf die ganze Gruppe (auch auf ihn selbst).
//                     Dasselbe Talent zählt in einer Gruppe nur einmal (zwei Krieger = nicht doppelt).
// Zahlen grob gesetzt, gebalanced wird am Ende.
// ============================================================

export const TALENT_RULES = {
  // Auf diesen Leveln schaltet sich die 1., 2. und 3. Reihe frei
  rowLevels: [5, 15, 25],
  // Doppelwahl: in so vielen der ersten Reihen darf ein Held dieser Seltenheit beide Talente nehmen
  doubleRowsByRarity: { uncommon: 0, rare: 0, epic: 1, legendary: 2 },
  // Umskillen kostet so viel Gold pro Level des Helden
  respecCostPerLevel: 10,
};

// Pro Klasse: 3 Reihen mit je 2 Talenten (in der Reihenfolge von rowLevels)
export const TALENTS = {
  // ---------- Tanks ----------
  warrior: [
    [
      { id: 'warShieldMaster', name: 'Schildmeister', description: 'Eiserne Wacht hält 1 Runde länger',
        effects: { abilityDuration: { ironWatch: 1 } } },
      { id: 'warBladeMaster', name: 'Klingenmeister', description: '+15 % Schaden',
        effects: { damageDone: 0.15 } },
    ],
    [
      { id: 'warUnbending', name: 'Unbeugsam', description: '+20 % Leben',
        effects: { statBonus: { health: 0.2 } } },
      { id: 'warChallenger', name: 'Herausforderer', description: 'Herausforderungsruf hält 1 Runde länger, Bollwerkstoß +30 % (mehr Aggro)',
        effects: { abilityDuration: { challengingShout: 1 }, abilityPower: { bulwarkStrike: 0.3 } } },
    ],
    [
      { id: 'warLastStand', name: 'Letztes Gefecht', description: 'Einmal pro Kampf überlebt er einen tödlichen Treffer mit 1 Leben',
        effects: { cheatDeath: true } },
      { id: 'warWarlord', name: 'Kriegsherr', description: 'Die ganze Gruppe macht +5 % Schaden',
        effects: { groupAura: { damageDone: 0.05 } } },
    ],
  ],

  paladin: [
    [
      { id: 'palLightStrike', name: 'Lichtschlag', description: 'Lichtbrecher +25 %',
        effects: { abilityPower: { lightbreaker: 0.25 } } },
      { id: 'palRecovery', name: 'Genesung', description: 'Gelübde der Genesung heilt 30 % mehr',
        effects: { abilityPower: { vowOfRecovery: 0.3 } } },
    ],
    [
      { id: 'palLongOath', name: 'Langer Schwur', description: 'Schwur der Standhaftigkeit hält 2 Runden länger',
        effects: { abilityDuration: { oathOfSteadfastness: 2 } } },
      { id: 'palHallowedShield', name: 'Geweihter Schild', description: '+15 % Rüstung',
        effects: { statBonus: { defense: 0.15 } } },
    ],
    [
      { id: 'palDevotionAura', name: 'Aura der Hingabe', description: 'Die ganze Gruppe nimmt −5 % Schaden',
        effects: { groupAura: { damageTaken: -0.05 } } },
      { id: 'palMartyr', name: 'Märtyrer', description: 'Einmal pro Kampf überlebt er einen tödlichen Treffer mit 1 Leben',
        effects: { cheatDeath: true } },
    ],
  ],

  monk: [
    [
      { id: 'monWhirlwind', name: 'Wirbelwind', description: 'Wirbeltritt +30 %',
        effects: { abilityPower: { whirlKick: 0.3 } } },
      { id: 'monHardPalm', name: 'Harte Hand', description: 'Handflächenstoß +25 %',
        effects: { abilityPower: { palmStrike: 0.25 } } },
    ],
    [
      { id: 'monFlow', name: 'Fließen', description: 'Fließende Abwehr hält 2 Runden länger',
        effects: { abilityDuration: { flowingGuard: 2 } } },
      { id: 'monLightFoot', name: 'Leichtfüßig', description: '+8 % Ausweichen',
        effects: { dodge: 0.08 } },
    ],
    [
      { id: 'monInnerCalm', name: 'Innere Ruhe', description: '+20 % Leben',
        effects: { statBonus: { health: 0.2 } } },
      { id: 'monFistMaster', name: 'Meister der Faust', description: '+20 % Schaden',
        effects: { damageDone: 0.2 } },
    ],
  ],

  // ---------- Heiler ----------
  priest: [
    [
      { id: 'priDevout', name: 'Andächtig', description: 'Stille Andacht gibt 50 % mehr Mana',
        effects: { abilityPower: { silentDevotion: 0.5 } } },
      { id: 'priZealous', name: 'Eifrig', description: '+10 % Heilung',
        effects: { healingDone: 0.1 } },
    ],
    [
      { id: 'priStreamOfGrace', name: 'Strom der Gnade', description: 'Strom des Lebens heilt 30 % mehr',
        effects: { abilityPower: { streamOfLife: 0.3 } } },
      { id: 'priQuickSpark', name: 'Schneller Funke', description: 'Funke der Gnade heilt 30 % mehr',
        effects: { abilityPower: { sparkOfGrace: 0.3 } } },
    ],
    [
      { id: 'priHolyGlow', name: 'Heiliger Schein', description: 'Die ganze Gruppe nimmt −5 % Schaden',
        effects: { groupAura: { damageTaken: -0.05 } } },
      { id: 'priInspiration', name: 'Göttliche Eingebung', description: '−25 % Mana-Kosten',
        effects: { manaCost: -0.25 } },
    ],
  ],

  runeweaver: [
    [
      { id: 'runRuneLore', name: 'Runenkunde', description: 'Runenpanzer +25 %',
        effects: { abilityPower: { runeArmor: 0.25 } } },
      { id: 'runGlyphLore', name: 'Glyphenkunde', description: 'Glyphenkreis +25 %',
        effects: { abilityPower: { glyphCircle: 0.25 } } },
    ],
    [
      { id: 'runEternalGlyphs', name: 'Ewige Glyphen', description: '−20 % Mana-Kosten',
        effects: { manaCost: -0.2 } },
      { id: 'runStrongRunes', name: 'Starke Runen', description: '+15 % stärkere Schilde',
        effects: { healingDone: 0.15 } },
    ],
    [
      { id: 'runRuneWall', name: 'Runenwall', description: 'Die ganze Gruppe nimmt −5 % Schaden',
        effects: { groupAura: { damageTaken: -0.05 } } },
      { id: 'runDeepMana', name: 'Tiefe Quelle', description: '+30 % Mana',
        effects: { statBonus: { mana: 0.3 } } },
    ],
  ],

  druid: [
    [
      { id: 'druThickMoss', name: 'Dichtes Moos', description: 'Moosmantel heilt 25 % mehr',
        effects: { abilityPower: { mossMantle: 0.25 } } },
      { id: 'druWideGrove', name: 'Weiter Hain', description: 'Hainsegen heilt 25 % mehr',
        effects: { abilityPower: { groveBlessing: 0.25 } } },
    ],
    [
      { id: 'druLongGrowth', name: 'Langes Wachsen', description: 'Moosmantel und Hainsegen halten 1 Runde länger',
        effects: { abilityDuration: { mossMantle: 1, groveBlessing: 1 } } },
      { id: 'druFrugal', name: 'Genügsam', description: '−20 % Mana-Kosten',
        effects: { manaCost: -0.2 } },
    ],
    [
      { id: 'druDeepRoots', name: 'Tiefe Wurzeln', description: 'Ruf der Wurzeln holt Gefallene mit doppelt so viel Leben zurück',
        effects: { abilityPower: { callOfRoots: 1 } } },
      { id: 'druForestHeart', name: 'Herz des Waldes', description: 'Die ganze Gruppe nimmt −5 % Schaden',
        effects: { groupAura: { damageTaken: -0.05 } } },
    ],
  ],

  // ---------- Schadensmacher ----------
  mage: [
    [
      { id: 'magEmber', name: 'Glut', description: 'Glutlanze +20 %',
        effects: { abilityPower: { emberLance: 0.2 } } },
      { id: 'magAsh', name: 'Asche', description: 'Aschenregen +25 %',
        effects: { abilityPower: { ashRain: 0.25 } } },
    ],
    [
      { id: 'magEternalIce', name: 'Ewiges Eis', description: 'Eiskranz friert 1 Runde länger ein',
        effects: { abilityDuration: { iceWreath: 1 } } },
      { id: 'magManaFlow', name: 'Manafluss', description: '+30 % Mana',
        effects: { statBonus: { mana: 0.3 } } },
    ],
    [
      { id: 'magFirestorm', name: 'Feuersturm', description: '+15 % Schaden, aber +20 % Aggro',
        effects: { damageDone: 0.15, threat: 0.2 } },
      { id: 'magArchmage', name: 'Erzmagier', description: '+15 % Magie',
        effects: { statBonus: { magic: 0.15 } } },
    ],
  ],

  rogue: [
    [
      { id: 'rogSharpBlade', name: 'Scharfe Klinge', description: 'Schattenstich +20 %',
        effects: { abilityPower: { shadowStab: 0.2 } } },
      { id: 'rogDeadlyPoison', name: 'Tödliches Gift', description: 'Natternbiss +30 %',
        effects: { abilityPower: { viperBite: 0.3 } } },
    ],
    [
      { id: 'rogLingeringPoison', name: 'Zähes Gift', description: 'Natternbiss wirkt 2 Runden länger',
        effects: { abilityDuration: { viperBite: 2 } } },
      { id: 'rogEvasion', name: 'Ausweichkünstler', description: '+10 % Ausweichen',
        effects: { dodge: 0.1 } },
    ],
    [
      { id: 'rogShadowDance', name: 'Schattentanz', description: 'Einmal pro Kampf überlebt er einen tödlichen Treffer mit 1 Leben',
        effects: { cheatDeath: true } },
      { id: 'rogAssassin', name: 'Meuchler', description: '+15 % Schaden',
        effects: { damageDone: 0.15 } },
    ],
  ],

  samurai: [
    [
      { id: 'samFlashBlade', name: 'Blitzende Klinge', description: 'Iaido-Erstschlag +30 %',
        effects: { abilityPower: { iaiStrike: 0.3 } } },
      { id: 'samCrescent', name: 'Mondsichel', description: 'Mondsichelschnitt +25 %',
        effects: { abilityPower: { crescentCut: 0.25 } } },
    ],
    [
      { id: 'samExecutioner', name: 'Henker', description: 'Hinrichtung +30 %',
        effects: { abilityPower: { execution: 0.3 } } },
      { id: 'samBushido', name: 'Bushido', description: '−10 % erlittener Schaden',
        effects: { damageTaken: -0.1 } },
    ],
    [
      { id: 'samHonorCode', name: 'Ehrenkodex', description: 'Einmal pro Kampf überlebt er einen tödlichen Treffer mit 1 Leben',
        effects: { cheatDeath: true } },
      { id: 'samMasterSword', name: 'Meisterschwert', description: '+15 % Angriff',
        effects: { statBonus: { attack: 0.15 } } },
    ],
  ],

  barbarian: [
    [
      { id: 'barWideScythe', name: 'Breite Sense', description: 'Sensenkreis +30 %',
        effects: { abilityPower: { scytheCircle: 0.3 } } },
      { id: 'barMight', name: 'Wucht', description: 'Rücksichtsloser Hieb +25 %',
        effects: { abilityPower: { recklessBlow: 0.25 } } },
    ],
    [
      { id: 'barBloodthirst', name: 'Blutdurst', description: 'Blutrausch hält 2 Runden länger',
        effects: { abilityDuration: { bloodFrenzy: 2 } } },
      { id: 'barThickHide', name: 'Dickes Fell', description: '+20 % Leben',
        effects: { statBonus: { health: 0.2 } } },
    ],
    [
      { id: 'barUndyingRage', name: 'Unsterbliche Wut', description: 'Einmal pro Kampf überlebt er einen tödlichen Treffer mit 1 Leben',
        effects: { cheatDeath: true } },
      { id: 'barWarCry', name: 'Schlachtruf', description: 'Die ganze Gruppe macht +5 % Schaden',
        effects: { groupAura: { damageDone: 0.05 } } },
    ],
  ],

  hunter: [
    [
      { id: 'hunEagleEye', name: 'Adlerblick', description: 'Falkenauge +25 %',
        effects: { abilityPower: { hawkEye: 0.25 } } },
      { id: 'hunArrowHail', name: 'Pfeilhagel', description: 'Pfeilfächer +30 %',
        effects: { abilityPower: { arrowFan: 0.3 } } },
    ],
    [
      { id: 'hunToughNet', name: 'Zähes Netz', description: 'Fangnetz hält 2 Runden länger',
        effects: { abilityDuration: { snareNet: 2 } } },
      { id: 'hunMarksman', name: 'Scharfschütze', description: '+10 % Angriff',
        effects: { statBonus: { attack: 0.1 } } },
    ],
    [
      { id: 'hunPackLeader', name: 'Jagdfieber', description: '+15 % Schaden',
        effects: { damageDone: 0.15 } },
      { id: 'hunCamouflage', name: 'Tarnung', description: '−50 % Aggro, +10 % Ausweichen',
        effects: { threat: -0.5, dodge: 0.1 } },
    ],
  ],

  warlock: [
    [
      { id: 'wloRot', name: 'Fäulnis', description: 'Verderbnis +30 %',
        effects: { abilityPower: { corruption: 0.3 } } },
      { id: 'wloSoulEmber', name: 'Seelenglut', description: 'Seelenbrand +30 %',
        effects: { abilityPower: { soulfire: 0.3 } } },
    ],
    [
      { id: 'wloShadowArrow', name: 'Schattenpfeil', description: 'Schattenblitz +30 %',
        effects: { abilityPower: { shadowBolt: 0.3 } } },
      { id: 'wloDarkPact', name: 'Dunkler Pakt', description: '−25 % Mana-Kosten',
        effects: { manaCost: -0.25 } },
    ],
    [
      { id: 'wloSoulHarvest', name: 'Seelenernte', description: '+15 % Magie',
        effects: { statBonus: { magic: 0.15 } } },
      { id: 'wloShadowWard', name: 'Schattenschild', description: 'Einmal pro Kampf überlebt er einen tödlichen Treffer mit 1 Leben',
        effects: { cheatDeath: true } },
    ],
  ],

  // ---------- Unterstützer ----------
  bard: [
    [
      { id: 'brdCuttingSong', name: 'Schneidendes Lied', description: 'Lied der Klingen +25 %',
        effects: { abilityPower: { songOfBlades: 0.25 } } },
      { id: 'brdGentleBallad', name: 'Sanfte Ballade', description: 'Ballade der Zuversicht heilt 30 % mehr',
        effects: { abilityPower: { balladOfHope: 0.3 } } },
    ],
    [
      { id: 'brdLongChorus', name: 'Langer Refrain', description: 'Lied der Klingen hält 1 Runde länger',
        effects: { abilityDuration: { songOfBlades: 1 } } },
      { id: 'brdDeepSlumber', name: 'Tiefer Schlummer', description: 'Schlummerweise hält 2 Runden länger',
        effects: { abilityDuration: { slumberTune: 2 } } },
    ],
    [
      { id: 'brdHeroicEpic', name: 'Heldenepos', description: 'Die ganze Gruppe macht +5 % Schaden',
        effects: { groupAura: { damageDone: 0.05 } } },
      { id: 'brdShieldSong', name: 'Schutzlied', description: 'Die ganze Gruppe nimmt −5 % Schaden',
        effects: { groupAura: { damageTaken: -0.05 } } },
    ],
  ],

  shaman: [
    [
      { id: 'shaThunder', name: 'Gewitter', description: 'Kettenblitz +30 %',
        effects: { abilityPower: { chainLightning: 0.3 } } },
      { id: 'shaRock', name: 'Fels', description: 'Felsenpfahl schützt 30 % stärker',
        effects: { abilityPower: { stoneTotem: 0.3 } } },
    ],
    [
      { id: 'shaLongRage', name: 'Langer Rausch', description: 'Kampfrausch hält 1 Runde länger',
        effects: { abilityDuration: { bloodlust: 1 } } },
      { id: 'shaEarthbound', name: 'Erdverbunden', description: 'Felsenpfahl hält 1 Runde länger',
        effects: { abilityDuration: { stoneTotem: 1 } } },
    ],
    [
      { id: 'shaAncestor', name: 'Ahnengeist', description: 'Die ganze Gruppe macht +5 % Schaden',
        effects: { groupAura: { damageDone: 0.05 } } },
      { id: 'shaStoneskin', name: 'Steinhaut', description: 'Die ganze Gruppe nimmt −5 % Schaden',
        effects: { groupAura: { damageTaken: -0.05 } } },
    ],
  ],

  chronomancer: [
    [
      { id: 'chrStretch', name: 'Zeitdehnung', description: 'Beschleunigung hält 1 Runde länger',
        effects: { abilityDuration: { haste: 1 } } },
      { id: 'chrSandgrain', name: 'Sandkorn', description: '−20 % Mana-Kosten',
        effects: { manaCost: -0.2 } },
    ],
    [
      { id: 'chrTimeTrap', name: 'Zeitfalle', description: 'Zeitstillstand hält 1 Runde länger',
        effects: { abilityDuration: { timeStop: 1 } } },
      { id: 'chrTimeShield', name: 'Zeitschild', description: '+20 % Leben',
        effects: { statBonus: { health: 0.2 } } },
    ],
    [
      { id: 'chrTimeless', name: 'Zeitlose Gruppe', description: 'Die ganze Gruppe macht +5 % Schaden',
        effects: { groupAura: { damageDone: 0.05 } } },
      { id: 'chrRewind', name: 'Rückspulen', description: 'Einmal pro Kampf überlebt er einen tödlichen Treffer mit 1 Leben',
        effects: { cheatDeath: true } },
    ],
  ],
};

// Die 3 Talentreihen einer Klasse (leere Liste, wenn sie keine hat)
export function getTalentRows(classId) {
  return TALENTS[classId] || [];
}

// Ein Talent anhand seiner id (oder null)
export function findTalent(talentId) {
  for (const classId in TALENTS) {
    for (const row of TALENTS[classId]) {
      const talent = row.find((entry) => entry.id === talentId);
      if (talent) {
        return talent;
      }
    }
  }
  return null;
}
