// ============================================================
// RANDOM – der Zufallsgenerator des Spiels
// Wir benutzen einen eigenen Zufall statt Math.random(), weil
//  - man ihn mit einer Startzahl ("Seed") wiederholbar machen kann (wichtig für Tests)
//  - sein Zustand mitgespeichert wird (Neuladen bringt keinen neuen Loot)
// ============================================================

export class Random {
  constructor(seed) {
    // Der aktuelle Zustand. Aus ihm wird die nächste Zufallszahl berechnet.
    this.state = seed >>> 0;
  }

  // Gibt eine Zufallszahl zwischen 0 (inklusive) und 1 (exklusive) zurück.
  // (Rechenverfahren "mulberry32". Man muss es nicht verstehen, es liefert einfach gute Zufallszahlen.)
  next() {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  // Kommazahl zwischen min und max
  between(min, max) {
    return min + this.next() * (max - min);
  }

  // Ganze Zahl zwischen min und max (beide inklusive)
  integer(min, max) {
    return Math.floor(this.between(min, max + 1));
  }

  // Zufälliges Element aus einer Liste
  pick(list) {
    return list[Math.floor(this.next() * list.length)];
  }

  // Wählt einen Schlüssel nach Gewicht aus.
  // Beispiel: pickWeighted({ a: 90, b: 10 }) → "a" in 90 % der Fälle, "b" in 10 %
  pickWeighted(weights) {
    let total = 0;
    for (const key in weights) {
      total += weights[key];
    }

    let roll = this.next() * total;
    for (const key in weights) {
      roll -= weights[key];
      if (roll < 0) {
        return key;
      }
    }

    // Sicherheitsnetz wegen Rundung: letzten Schlüssel mit Gewicht > 0 nehmen
    const keys = Object.keys(weights).filter((key) => weights[key] > 0);
    return keys[keys.length - 1];
  }
}
