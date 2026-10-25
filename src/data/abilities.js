// ============================================================
// SKILLS (Fähigkeiten) – mit allen Werten für den Kampf
//
// name, description = Anzeige
// type      = was der Skill tut:
//             'damage' (Schaden), 'heal' (Heilung), 'shield' (Schild), 'buff' (Verstärkung, siehe effect),
//             'taunt' (Aggro ziehen), 'mana' (Mana zurück), 'cleanse' (Fluch entfernen),
//             'stun' (betäuben), 'interrupt' (Zauber unterbrechen), 'dot' (Schaden über Zeit),
//             'hot' (Heilung über Zeit), 'revive' (Gefallenen wiederbeleben),
//             'resetCooldowns' (Abklingzeiten eines Helden sofort beenden)
// target    = wen er trifft:
//             'focus' (Diener zuerst, sonst Boss), 'boss', 'allEnemies', 'threeEnemies' (bis zu 3 Gegner),
//             'strongestMinion' (Diener mit dem meisten Leben), 'self', 'lowestAlly' (verletztester Held),
//             'bossTarget' (wen der Boss gerade angreift), 'allAllies', 'debuffedAlly' (Held mit Fluch),
//             'fallenAlly' (ein gefallener Held), 'bestDamageAlly' (stärkster Schadensmacher außer mir),
//             'allyWithCooldowns' (Held, dessen Skills am längsten abklingen, außer mir)
// scaling   = welcher Wert die Stärke bestimmt: 'attack' oder 'magic'
// power     = Faktor: power 2 bei 15 Magie = etwa 30 Schaden/Heilung
//             (bei 'dot' und 'hot': Schaden bzw. Heilung pro Runde)
// manaCost  = Manakosten
// cooldown  = Abklingzeit in Runden (0 = jede Runde möglich)
// oncePerFight = true: nur einmal pro Kampf (jede Begegnung zählt neu)
// priority  = Reihenfolge, in der die KI Skills prüft (0 = zuerst)
// when      = Bedingung, wann die KI den Skill benutzt (siehe systems/combat/HeroAI.js)
// threat    = Aggro-Faktor (nur Tanks haben hohe Werte)
// critBonus = zusätzliche Chance auf kritische Treffer
// duration  = Dauer in Runden (für Buffs, Betäubung, Gift, Heilung über Zeit)
// value     = Stärke eines Buffs, Anteil des Manas bzw. Anteil Leben beim Wiederbeleben
// effect    = nur bei 'buff': welche Verstärkung
//             'damageTaken' (erlittener Schaden, value -0.5 = halb so viel), 'damageDone' (eigener Schaden, 0.2 = +20 %),
//             'dodge' (zusätzliche Ausweichchance), 'lifesteal' (Anteil des Schadens heilt einen selbst),
//             'immune' (unverwundbar), 'haste' (handelt jede Runde zweimal)
//             Der gleiche Buff zählt nie doppelt: Zwei Barden geben nicht zweimal +20 %.
// growth    = nur bei 'dot': der Schaden wächst jede Runde um diesen Anteil (0.25 = +25 % vom Startwert)
// damageType = Schadensart für die Farbe der Zahl (siehe damageTypes.js), ohne Angabe 'physical'
// label     = nur bei 'stun': Wort über dem Gegner (Standard "Eingefroren")
// fx        = Animation in der Kampfszene (siehe ui/BattleEffects.js), z.B. 'fireBolt', 'slash', 'heal'
// ============================================================

export const ABILITIES = {
  // ---------- Krieger ----------
  bulwarkStrike: {
    name: 'Bollwerkstoß', description: 'Schaden und viel Aggro',
    type: 'damage', target: 'focus', scaling: 'attack', power: 1.3, threat: 4,
    manaCost: 0, cooldown: 1, priority: 2, when: 'always', fx: 'shieldBash',
  },
  challengingShout: {
    name: 'Herausforderungsruf', description: 'Zwingt den Gegner, den Krieger anzugreifen',
    type: 'taunt', target: 'self', duration: 2,
    manaCost: 0, cooldown: 4, priority: 1, when: 'notTanking', fx: 'shout',
  },
  ironWatch: {
    name: 'Eiserne Wacht', description: '−50 % erlittener Schaden für 3 Runden',
    type: 'buff', target: 'self', effect: 'damageTaken', value: -0.5, duration: 3,
    manaCost: 0, cooldown: 6, priority: 0, when: 'busterIncomingOrSelfLow', fx: 'aura',
  },

  // ---------- Priester ----------
  streamOfLife: {
    name: 'Strom des Lebens', description: 'Riesige Einzelheilung, kostet viel Mana',
    type: 'heal', target: 'lowestAlly', scaling: 'magic', power: 3.2,
    manaCost: 28, cooldown: 2, priority: 1, when: 'allyBadlyHurt', fx: 'holyHeal',
  },
  sparkOfGrace: {
    name: 'Funke der Gnade', description: 'Schnelle, kleinere und günstige Heilung',
    type: 'heal', target: 'lowestAlly', scaling: 'magic', power: 1.5,
    manaCost: 9, cooldown: 0, priority: 2, when: 'allyHurt', fx: 'heal',
  },
  silentDevotion: {
    name: 'Stille Andacht', description: 'Stellt Mana wieder her',
    type: 'mana', target: 'self', value: 0.35,
    manaCost: 0, cooldown: 8, priority: 0, when: 'lowMana', fx: 'manaGlow',
  },

  // ---------- Runenwirker ----------
  runeArmor: {
    name: 'Runenpanzer', description: 'Schild, der Schaden vorab abfängt',
    type: 'shield', target: 'bossTarget', scaling: 'magic', power: 2.6,
    manaCost: 18, cooldown: 2, priority: 1, when: 'targetUnshielded', fx: 'shield',
  },
  glyphCircle: {
    name: 'Glyphenkreis', description: 'Kleine Schilde für die ganze Gruppe',
    type: 'shield', target: 'allAllies', scaling: 'magic', power: 0.9,
    manaCost: 30, cooldown: 4, priority: 0, when: 'groupThreatened', fx: 'shield',
  },
  releasingRune: {
    name: 'Lösungsrune', description: 'Entfernt einen Fluch oder Debuff',
    type: 'cleanse', target: 'debuffedAlly',
    manaCost: 8, cooldown: 2, priority: 0, when: 'allyDebuffed', fx: 'cleanse',
  },

  // ---------- Magier ----------
  emberLance: {
    name: 'Glutlanze', description: 'Hoher Einzelschaden',
    type: 'damage', target: 'focus', scaling: 'magic', power: 2.0,
    manaCost: 10, cooldown: 0, priority: 2, when: 'always', fx: 'fireBolt',
  },
  ashRain: {
    name: 'Aschenregen', description: 'Flächenschaden auf alle Gegner',
    type: 'damage', target: 'allEnemies', scaling: 'magic', power: 1.1,
    manaCost: 22, cooldown: 2, priority: 1, when: 'multipleEnemies', fx: 'fireRain',
  },
  iceWreath: {
    name: 'Eiskranz', description: 'Friert alle Gegner 1 Runde ein',
    type: 'stun', target: 'allEnemies', duration: 1,
    manaCost: 18, cooldown: 8, priority: 0, when: 'bossCasting', fx: 'frost',
  },

  // ---------- Schurke ----------
  shadowStab: {
    name: 'Schattenstich', description: 'Schaden mit hoher Chance auf kritische Treffer',
    type: 'damage', target: 'focus', scaling: 'attack', power: 1.8, critBonus: 0.3,
    manaCost: 0, cooldown: 1, priority: 2, when: 'always', fx: 'slash',
  },
  silencingBlow: {
    name: 'Stummschlag', description: 'Unterbricht einen Boss-Zauber',
    type: 'interrupt', target: 'boss', scaling: 'attack', power: 0.5,
    manaCost: 0, cooldown: 4, priority: 0, when: 'bossCastingInterruptible', fx: 'interrupt',
  },
  viperBite: {
    name: 'Natternbiss', description: 'Gift, das über mehrere Runden Schaden macht',
    type: 'dot', target: 'focus', scaling: 'attack', power: 0.6, duration: 4,
    manaCost: 0, cooldown: 4, priority: 1, when: 'targetWithoutPoison', fx: 'poison',
  },

  // ---------- Paladin ----------
  lightbreaker: {
    name: 'Lichtbrecher', description: 'Heiliger Schaden und viel Aggro',
    type: 'damage', target: 'focus', scaling: 'magic', power: 1.3, threat: 8, damageType: 'light',
    manaCost: 5, cooldown: 1, priority: 3, when: 'always', fx: 'holyBolt',
  },
  vowOfRecovery: {
    name: 'Gelübde der Genesung', description: 'Heilt sich selbst stark',
    type: 'heal', target: 'self', scaling: 'magic', power: 2.5,
    manaCost: 14, cooldown: 3, priority: 2, when: 'selfHurt', fx: 'holyHeal',
  },
  oathOfSteadfastness: {
    name: 'Schwur der Standhaftigkeit', description: 'Die ganze Gruppe nimmt 4 Runden lang −10 % Schaden',
    type: 'buff', target: 'allAllies', effect: 'damageTaken', value: -0.1, duration: 4,
    manaCost: 10, cooldown: 4, priority: 1, when: 'groupBuffMissing', fx: 'aura',
  },
  divineShield: {
    name: 'Gottesschild', description: 'Einmal pro Kampf 1 Runde unverwundbar, genau vor einem großen Schlag',
    type: 'buff', target: 'self', effect: 'immune', value: 1, duration: 1, oncePerFight: true,
    manaCost: 0, cooldown: 0, priority: 0, when: 'bigHitOnMe', fx: 'shield',
  },

  // ---------- Mönch ----------
  palmStrike: {
    name: 'Handflächenstoß', description: 'Schaden und viel Aggro',
    type: 'damage', target: 'focus', scaling: 'attack', power: 1.2, threat: 4,
    manaCost: 0, cooldown: 1, priority: 3, when: 'always', fx: 'shieldBash',
  },
  whirlKick: {
    name: 'Wirbeltritt', description: 'Trifft alle Gegner, viel Aggro: hält ganze Gruppen fest',
    type: 'damage', target: 'allEnemies', scaling: 'attack', power: 0.7, threat: 5,
    manaCost: 0, cooldown: 2, priority: 2, when: 'multipleEnemies', fx: 'slash',
  },
  flowingGuard: {
    name: 'Fließende Abwehr', description: '+30 % Ausweichen für 3 Runden',
    type: 'buff', target: 'self', effect: 'dodge', value: 0.3, duration: 3,
    manaCost: 0, cooldown: 6, priority: 1, when: 'selfHurt', fx: 'aura',
  },

  // ---------- Druide ----------
  mossMantle: {
    name: 'Moosmantel', description: 'Heilung über 4 Runden',
    type: 'hot', target: 'lowestAlly', scaling: 'magic', power: 1.0, duration: 4,
    manaCost: 9, cooldown: 0, priority: 2, when: 'allyHurtWithoutHot', fx: 'heal',
  },
  groveBlessing: {
    name: 'Hainsegen', description: 'Heilung über 4 Runden für die ganze Gruppe',
    type: 'hot', target: 'allAllies', scaling: 'magic', power: 0.55, duration: 4,
    manaCost: 24, cooldown: 4, priority: 1, when: 'groupThreatened', fx: 'heal',
  },
  callOfRoots: {
    name: 'Ruf der Wurzeln', description: 'Einmal pro Kampf: holt einen Gefallenen mit 30 % Leben zurück',
    type: 'revive', target: 'fallenAlly', value: 0.3, oncePerFight: true,
    manaCost: 25, cooldown: 0, priority: 0, when: 'allyFallen', fx: 'holyHeal',
  },

  // ---------- Samurai ----------
  iaiStrike: {
    name: 'Iaido-Erstschlag', description: 'Einmal pro Kampf: gewaltiger Hieb aus der Scheide',
    type: 'damage', target: 'focus', scaling: 'attack', power: 4.0, critBonus: 0.3, oncePerFight: true,
    manaCost: 0, cooldown: 0, priority: 0, when: 'always', fx: 'bigImpact',
  },
  execution: {
    name: 'Hinrichtung', description: 'Riesiger Schaden an einem Gegner unter 30 % Leben',
    type: 'damage', target: 'focus', scaling: 'attack', power: 3.0,
    manaCost: 0, cooldown: 2, priority: 1, when: 'targetLow', fx: 'slash',
  },
  crescentCut: {
    name: 'Mondsichelschnitt', description: 'Sauberer Schnitt',
    type: 'damage', target: 'focus', scaling: 'attack', power: 1.4,
    manaCost: 0, cooldown: 1, priority: 2, when: 'always', fx: 'slash',
  },

  // ---------- Barbar ----------
  scytheCircle: {
    name: 'Sensenkreis', description: 'Schaden an allen Gegnern',
    type: 'damage', target: 'allEnemies', scaling: 'attack', power: 0.9,
    manaCost: 0, cooldown: 2, priority: 1, when: 'multipleEnemies', fx: 'slash',
  },
  recklessBlow: {
    name: 'Rücksichtsloser Hieb', description: 'Wuchtiger Einzelschlag',
    type: 'damage', target: 'focus', scaling: 'attack', power: 1.7,
    manaCost: 0, cooldown: 1, priority: 2, when: 'always', fx: 'shieldBash',
  },
  bloodFrenzy: {
    name: 'Blutrausch', description: '3 Runden lang heilt ihn 40 % seines Schadens',
    type: 'buff', target: 'self', effect: 'lifesteal', value: 0.4, duration: 3,
    manaCost: 0, cooldown: 6, priority: 0, when: 'selfLow', fx: 'aura',
  },

  // ---------- Jäger ----------
  hawkEye: {
    name: 'Falkenauge', description: 'Gezielter Schuss',
    type: 'damage', target: 'focus', scaling: 'attack', power: 1.5,
    manaCost: 0, cooldown: 1, priority: 3, when: 'always', fx: 'arrow',
  },
  arrowFan: {
    name: 'Pfeilfächer', description: 'Trifft bis zu 3 Gegner',
    type: 'damage', target: 'threeEnemies', scaling: 'attack', power: 0.9,
    manaCost: 0, cooldown: 2, priority: 2, when: 'multipleEnemies', fx: 'arrow',
  },
  snareNet: {
    name: 'Fangnetz', description: 'Hält den stärksten Diener 3 Runden fest',
    type: 'stun', target: 'strongestMinion', duration: 3, label: 'Gefangen',
    manaCost: 0, cooldown: 6, priority: 1, when: 'minionsThere', fx: 'frost',
  },

  // ---------- Hexenmeister ----------
  corruption: {
    name: 'Verderbnis', description: 'Fluch: Schaden über 12 Runden, wächst jede Runde',
    type: 'dot', target: 'focus', scaling: 'magic', power: 0.35, duration: 12, growth: 0.25, damageType: 'shadow',
    manaCost: 12, cooldown: 0, priority: 1, when: 'targetWithoutPoison', fx: 'curse',
  },
  soulfire: {
    name: 'Seelenbrand', description: 'Zweiter Fluch: wächst noch schneller',
    type: 'dot', target: 'focus', scaling: 'magic', power: 0.3, duration: 12, growth: 0.35, damageType: 'fire',
    manaCost: 14, cooldown: 0, priority: 2, when: 'targetWithoutPoison', fx: 'curse',
  },
  shadowBolt: {
    name: 'Schattenblitz', description: 'Direkter Schattenschaden',
    type: 'damage', target: 'focus', scaling: 'magic', power: 1.2, damageType: 'shadow',
    manaCost: 8, cooldown: 0, priority: 3, when: 'always', fx: 'shadowBolt',
  },

  // ---------- Barde ----------
  songOfBlades: {
    name: 'Lied der Klingen', description: 'Die ganze Gruppe macht 3 Runden lang +20 % Schaden',
    type: 'buff', target: 'allAllies', effect: 'damageDone', value: 0.2, duration: 3,
    manaCost: 14, cooldown: 3, priority: 1, when: 'groupBuffMissing', fx: 'shout',
  },
  slumberTune: {
    name: 'Schlummerweise', description: 'Schläfert den stärksten Diener 3 Runden ein',
    type: 'stun', target: 'strongestMinion', duration: 3, label: 'Schläft',
    manaCost: 12, cooldown: 5, priority: 0, when: 'minionsThere', fx: 'manaGlow',
  },
  balladOfHope: {
    name: 'Ballade der Zuversicht', description: 'Kleine Heilung über 3 Runden für alle',
    type: 'hot', target: 'allAllies', scaling: 'magic', power: 0.35, duration: 3,
    manaCost: 16, cooldown: 4, priority: 2, when: 'groupThreatened', fx: 'heal',
  },

  // ---------- Schamane ----------
  bloodlust: {
    name: 'Kampfrausch', description: 'Einmal pro Bosskampf: die ganze Gruppe macht 4 Runden lang +30 % Schaden',
    type: 'buff', target: 'allAllies', effect: 'damageDone', value: 0.3, duration: 4, oncePerFight: true,
    manaCost: 20, cooldown: 0, priority: 0, when: 'bossFightBuffMissing', fx: 'shout',
  },
  chainLightning: {
    name: 'Kettenblitz', description: 'Springt auf bis zu 3 Gegner',
    type: 'damage', target: 'threeEnemies', scaling: 'magic', power: 1.0, damageType: 'water',
    manaCost: 12, cooldown: 1, priority: 2, when: 'always', fx: 'lightning',
  },
  stoneTotem: {
    name: 'Felsenpfahl', description: 'Vor Gruppenschaden: alle nehmen 2 Runden lang −20 % Schaden',
    type: 'buff', target: 'allAllies', effect: 'damageTaken', value: -0.2, duration: 2,
    manaCost: 16, cooldown: 5, priority: 1, when: 'groupHitIncoming', fx: 'aura',
  },

  // ---------- Chronomant ----------
  timeLeap: {
    name: 'Zeitsprung', description: 'Beendet alle Abklingzeiten eines Helden',
    type: 'resetCooldowns', target: 'allyWithCooldowns',
    manaCost: 20, cooldown: 6, priority: 1, when: 'allyOnCooldown', fx: 'manaGlow',
  },
  haste: {
    name: 'Beschleunigung', description: 'Der stärkste Schadensmacher handelt 2 Runden lang doppelt',
    type: 'buff', target: 'bestDamageAlly', effect: 'haste', value: 1, duration: 2,
    manaCost: 18, cooldown: 5, priority: 2, when: 'always', fx: 'aura',
  },
  timeStop: {
    name: 'Zeitstillstand', description: 'Hält den Boss 1 Runde an, wenn er einen Zauber vorbereitet',
    type: 'stun', target: 'boss', duration: 1, label: 'Angehalten',
    manaCost: 15, cooldown: 8, priority: 0, when: 'bossCasting', fx: 'frost',
  },
};
