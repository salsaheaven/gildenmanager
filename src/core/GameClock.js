// ============================================================
// GAMECLOCK – die Spieluhr
// Rechnet echte Zeit in Spielzeit um. Kennt Pause und Geschwindigkeit (1x, 2x, 4x).
// ============================================================

import { BALANCING } from '../data/balancing.js';

export class GameClock {
  constructor() {
    this.speed = 1;            // aktuelle Geschwindigkeit
    this.paused = false;       // ist das Spiel pausiert?
    this.totalGameSeconds = 0; // so viele Spielsekunden sind seit Spielbeginn vergangen
  }

  // Wird in jedem Bild aufgerufen. Bekommt die echte vergangene Zeit
  // und gibt zurück, wie viel Spielzeit vergangen ist.
  update(realSeconds) {
    if (this.paused) {
      return 0;
    }
    const gameSeconds = realSeconds * this.speed;
    this.totalGameSeconds += gameSeconds;
    return gameSeconds;
  }

  setSpeed(newSpeed) {
    this.speed = newSpeed;
    this.paused = false; // Wer eine Geschwindigkeit wählt, will weiterspielen
  }

  togglePause() {
    this.paused = !this.paused;
  }

  // Spieltag (beginnt bei 1)
  getDay() {
    const totalMinutes = this.totalGameSeconds * BALANCING.gameMinutesPerSecond;
    return Math.floor(totalMinutes / (24 * 60)) + 1;
  }

  // Uhrzeit als Text, z.B. "08:30". Der erste Tag beginnt um 08:00.
  getTimeText() {
    const totalMinutes = 8 * 60 + this.totalGameSeconds * BALANCING.gameMinutesPerSecond;
    const minutesToday = Math.floor(totalMinutes) % (24 * 60);
    const hours = Math.floor(minutesToday / 60);
    const minutes = minutesToday % 60;
    return String(hours).padStart(2, '0') + ':' + String(minutes).padStart(2, '0');
  }

  toSaveData() {
    return { speed: this.speed, totalGameSeconds: this.totalGameSeconds };
  }

  static fromSaveData(data) {
    const clock = new GameClock();
    clock.speed = data.speed;
    clock.totalGameSeconds = data.totalGameSeconds;
    return clock;
  }
}
