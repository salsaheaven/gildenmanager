// ============================================================
// CAUSETRACKER – merkt sich während eines Kampfes, WOHER der Schaden an den Helden kommt
// und was schiefging (verpasste Unterbrechungen, Heiler ohne Mana).
// Daraus berechnet DefeatAnalysis.js nach dem Run die "Top 3 Ursachen".
//
// Eine Quelle (source) ist { key, name, type, hint }:
//   type = 'mechanic' (Boss-Mechanik oder Fluch), 'attack' (normale Angriffe des Bosses),
//          'minion' (Diener und Trash), 'enrage' (alles, was der Boss in Raserei austeilt)
//   hint = freiwillig: Tipp aus data/enemies.js, wie man die Mechanik kontert
// ============================================================

export class CauseTracker {
  constructor() {
    this.damageBySource = {};   // key → { key, name, type, hint, damage }
    this.missedInterrupts = {}; // Mechanik-Name → wie oft sie nicht unterbrochen wurde
    this.outOfMana = [];        // Namen der Helden, denen das Mana ausging (jeder nur einmal)
  }

  // Ein Held hat Schaden aus dieser Quelle genommen
  addDamage(source, amount) {
    if (amount <= 0) {
      return;
    }
    if (!this.damageBySource[source.key]) {
      this.damageBySource[source.key] = { key: source.key, name: source.name, type: source.type,
        hint: source.hint || null, damage: 0 };
    }
    this.damageBySource[source.key].damage += amount;
  }

  // Eine Mechanik, die man hätte unterbrechen können, ist durchgekommen
  addMissedInterrupt(mechanicName) {
    this.missedInterrupts[mechanicName] = (this.missedInterrupts[mechanicName] || 0) + 1;
  }

  addOutOfMana(heroName) {
    if (!this.outOfMana.includes(heroName)) {
      this.outOfMana.push(heroName);
    }
  }

  // Für das Ergebnis der Begegnung (einfache Daten, keine Klasse)
  toResult() {
    return {
      damageBySource: Object.values(this.damageBySource),
      missedInterrupts: { ...this.missedInterrupts },
      outOfMana: this.outOfMana.slice(),
    };
  }
}
