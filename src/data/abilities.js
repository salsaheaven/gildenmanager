// ============================================================
// SKILLS (Fähigkeiten) – mit allen Werten für den Kampf
//
// name, description = Anzeige
// type      = was der Skill tut:
//             'damage' (Schaden), 'heal' (Heilung), 'shield' (Schild), 'buff' (Verstärkung),
//             'taunt' (Aggro ziehen), 'mana' (Mana zurück), 'cleanse' (Fluch entfernen),
//             'stun' (betäuben), 'interrupt' (Zauber unterbrechen), 'dot' (Schaden über Zeit)
// target    = wen er trifft:
//             'focus' (Diener zuerst, sonst Boss), 'boss', 'allEnemies',
//             'self', 'lowestAlly' (verletztester Held), 'bossTarget' (wen der Boss gerade angreift),
//             'allAllies', 'debuffedAlly' (Held mit Fluch)
// scaling   = welcher Wert die Stärke bestimmt: 'attack' oder 'magic'
// power     = Faktor: power 2 bei 15 Magie = etwa 30 Schaden/Heilung
// manaCost  = Manakosten
// cooldown  = Abklingzeit in Runden (0 = jede Runde möglich)
// priority  = Reihenfolge, in der die KI Skills prüft (0 = zuerst)
// when      = Bedingung, wann die KI den Skill benutzt (siehe systems/combat/HeroAI.js)
// threat    = Aggro-Faktor (nur Tanks haben hohe Werte)
// critBonus = zusätzliche Chance auf kritische Treffer
// duration  = Dauer in Runden (für Buffs, Betäubung, Gift)
// value     = Stärke eines Buffs bzw. Anteil des Manas
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
    type: 'buff', target: 'self', value: -0.5, duration: 3,
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
};
