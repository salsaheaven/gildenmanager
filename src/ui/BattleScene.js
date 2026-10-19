// ============================================================
// BATTLESCENE – spielt einen fertig berechneten Kampf als Szene ab
//   - Helden links (hintere und vordere Reihe), Boss und Diener rechts
//   - Lebensbalken, Schildanzeige, aufploppende Zahlen wie im MMO
//   - Zauberbalken über dem Boss, wenn er eine Mechanik vorbereitet
//   - Ticker mit den letzten Ereignissen
//
// Die Szene läuft nicht von selbst: Wer sie benutzt, ruft regelmäßig update(sekunden) auf.
// Im Kampf-Labor ist das die echte Zeit, in Dungeons später die Spielzeit.
// ============================================================

import { getBoss, MINIONS } from '../data/enemies.js';
import { createHeroCanvas, createSpriteCanvas } from './PixelArt.js';
import { Sound } from './Sound.js';

// Zeitplan (Sekunden bei Geschwindigkeit 1x)
const START_DELAY = 0.5;      // kurze Pause vor dem ersten Ereignis
const ACTION_TIME = 0.22;     // Abstand zwischen zwei Aktionen
const INFO_TIME = 0.1;        // Abstand nach reinen Textzeilen
const ROUND_PAUSE = 0.35;     // Pause zwischen zwei Runden
const END_DELAY = 0.8;        // Pause vor dem Ergebnis
const TICKER_LINES = 6;       // so viele Zeilen zeigt der Ticker
const SPEEDS = [1, 2, 4];

export class BattleScene {
  // result     = Ergebnis von simulateBattle (mit recordLog: true)
  // heroes     = die Hero-Objekte der Gruppe (für Aussehen der Pixelbilder)
  // onFinished = wird am Ende aufgerufen (auch nach "Überspringen")
  constructor(container, result, heroes, onFinished) {
    this.container = container;
    this.result = result;
    this.onFinished = onFinished;
    this.heroesById = {};
    for (const hero of heroes) {
      this.heroesById[hero.id] = hero;
    }

    this.time = 0;
    this.speed = 2;
    this.entryIndex = 0;
    this.finished = false;
    this.units = {}; // Kämpfer-id → Elemente der Figur

    this.buildLayout();
    for (const info of result.startingCombatants) {
      this.addUnit(info);
    }
    this.scheduleEntries();
  }

  // ---------- Aufbau ----------

  buildLayout() {
    this.container.innerHTML = `
      <div class="battle-scene">
        <div class="scene-top">
          <span class="scene-round">Bereit …</span>
          <div class="scene-speed"></div>
          <button class="scene-skip">Überspringen</button>
        </div>
        <div class="scene-field">
          <div class="cast-bar" hidden><span class="cast-name"></span><div class="cast-fill"></div></div>
          <div class="scene-heroes">
            <div class="scene-column back"></div>
            <div class="scene-column front"></div>
          </div>
          <div class="scene-enemies">
            <div class="scene-boss"></div>
            <div class="scene-minions"></div>
          </div>
        </div>
        <div class="scene-ticker"></div>
      </div>
    `;

    const speedContainer = this.container.querySelector('.scene-speed');
    for (const speed of SPEEDS) {
      const button = document.createElement('button');
      button.className = 'filter-button';
      button.textContent = speed + 'x';
      button.classList.toggle('active', speed === this.speed);
      button.addEventListener('click', () => {
        this.speed = speed;
        for (const other of speedContainer.children) {
          other.classList.toggle('active', other === button);
        }
      });
      speedContainer.appendChild(button);
    }
    this.container.querySelector('.scene-skip').addEventListener('click', () => this.skip());
  }

  // Eine Figur (Held, Boss oder Diener) mit Bild, Name und Balken
  addUnit(info) {
    const unit = document.createElement('div');
    unit.className = 'scene-unit ' + (info.side === 'hero' ? 'hero-unit' : 'enemy-unit');
    unit.innerHTML = `
      <div class="unit-floats"></div>
      <div class="unit-sprite"></div>
      <div class="unit-name"></div>
      <div class="unit-bars">
        <div class="unit-shield"><div></div></div>
        <div class="unit-hp"><div></div><span></span></div>
      </div>
    `;
    unit.querySelector('.unit-name').textContent = info.name;
    unit.querySelector('.unit-sprite').appendChild(this.createUnitCanvas(info));

    let parent;
    if (info.side === 'hero') {
      parent = this.container.querySelector('.scene-column.' + info.row);
    } else if (info.bossId) {
      parent = this.container.querySelector('.scene-boss');
      unit.classList.add('boss-unit');
    } else {
      parent = this.container.querySelector('.scene-minions');
    }
    parent.appendChild(unit);

    this.units[info.id] = { element: unit, maxHp: info.maxHp, isMinion: Boolean(info.minionId) };
    this.setBars(info.id, info.hp, 0);
  }

  createUnitCanvas(info) {
    if (info.side === 'hero') {
      return createHeroCanvas(this.heroesById[info.heroId], 4);
    }
    if (info.bossId) {
      return createSpriteCanvas(getBoss(info.bossId).sprite, 6);
    }
    return createSpriteCanvas(MINIONS[info.minionId].sprite, 5);
  }

  setBars(unitId, hp, shield) {
    const unit = this.units[unitId];
    if (!unit) {
      return;
    }
    const hpPercent = Math.max(0, hp / unit.maxHp) * 100;
    const shieldPercent = Math.min(1, shield / unit.maxHp) * 100;
    unit.element.querySelector('.unit-hp div').style.width = hpPercent + '%';
    unit.element.querySelector('.unit-hp span').textContent = hp;
    unit.element.querySelector('.unit-shield div').style.width = shieldPercent + '%';
    unit.element.classList.toggle('dead', hp <= 0);
  }

  // Jedes Ereignis bekommt einen Zeitpunkt
  scheduleEntries() {
    this.entryTimes = [];
    let time = START_DELAY;
    let currentRound = 0;
    for (const entry of this.result.log) {
      if (entry.round !== currentRound) {
        currentRound = entry.round;
        time += ROUND_PAUSE;
      }
      this.entryTimes.push(time);
      const isAction = entry.hits || entry.labels || entry.spawn || entry.cast;
      time += isAction ? ACTION_TIME : INFO_TIME;
    }
    this.endTime = time + END_DELAY;
  }

  // ---------- Abspielen ----------

  // Wird regelmäßig aufgerufen. realSeconds = vergangene Zeit seit dem letzten Aufruf.
  update(realSeconds) {
    if (this.finished) {
      return;
    }
    this.time += realSeconds * this.speed;
    while (this.entryIndex < this.result.log.length && this.entryTimes[this.entryIndex] <= this.time) {
      this.playEntry(this.result.log[this.entryIndex], false);
      this.entryIndex++;
    }
    if (this.entryIndex >= this.result.log.length && this.time >= this.endTime) {
      this.finish();
    }
  }

  // Alles Restliche sofort und ohne Effekte abspielen
  skip() {
    while (this.entryIndex < this.result.log.length) {
      this.playEntry(this.result.log[this.entryIndex], true);
      this.entryIndex++;
    }
    this.finish();
  }

  finish() {
    if (this.finished) {
      return;
    }
    this.finished = true;
    this.container.querySelector('.scene-skip').disabled = true;
    this.container.querySelector('.cast-bar').hidden = true;
    this.onFinished(this.result);
  }

  // quiet = true: nur Balken aktualisieren, keine Animationen und Töne (beim Überspringen)
  playEntry(entry, quiet) {
    if (entry.round > 0) {
      this.container.querySelector('.scene-round').textContent = 'Runde ' + entry.round;
    }
    this.addTickerLine(entry);

    if (entry.spawn) {
      for (const info of entry.spawn) {
        this.addUnit(info);
      }
    }
    if (entry.cast) {
      this.updateCastBar(entry.cast, quiet);
    }
    if (entry.sourceId && !quiet) {
      this.lunge(entry.sourceId);
    }
    if (entry.hits) {
      for (const hit of entry.hits) {
        this.showHit(hit, quiet);
      }
    }
    if (entry.labels && !quiet) {
      for (const label of entry.labels) {
        this.showFloat(label.targetId, label.text, 'float-label');
      }
    }
  }

  addTickerLine(entry) {
    const ticker = this.container.querySelector('.scene-ticker');
    const line = document.createElement('div');
    line.className = 'log-line log-' + entry.kind;
    line.textContent = entry.text;
    ticker.appendChild(line);
    while (ticker.children.length > TICKER_LINES) {
      ticker.firstChild.remove();
    }
  }

  updateCastBar(cast, quiet) {
    const bar = this.container.querySelector('.cast-bar');
    if (cast.state === 'start') {
      bar.querySelector('.cast-name').textContent = cast.name + ' wird vorbereitet!';
      bar.hidden = false;
      // Animation neu starten
      const fill = bar.querySelector('.cast-fill');
      fill.style.animation = 'none';
      void fill.offsetWidth;
      fill.style.animation = '';
      if (!quiet) {
        Sound.warning();
      }
    } else {
      bar.hidden = true;
    }
  }

  // Kleiner Ausfallschritt der handelnden Figur
  lunge(unitId) {
    const unit = this.units[unitId];
    if (!unit) {
      return;
    }
    unit.element.classList.remove('lunge');
    void unit.element.offsetWidth;
    unit.element.classList.add('lunge');
  }

  showHit(hit, quiet) {
    const unit = this.units[hit.targetId];
    if (!unit) {
      return;
    }
    const wasAlive = !unit.element.classList.contains('dead');
    this.setBars(hit.targetId, hit.hpAfter, hit.shieldAfter);

    // Besiegte Diener verschwinden nach kurzer Zeit, damit die Szene übersichtlich bleibt
    if (unit.isMinion && wasAlive && hit.hpAfter <= 0) {
      this.removeUnitLater(hit.targetId, quiet ? 0 : 900);
    }
    if (quiet) {
      return;
    }

    if (hit.kind === 'damage') {
      if (hit.amount > 0) {
        this.showFloat(hit.targetId, '-' + hit.amount + (hit.crit ? '!' : ''), hit.crit ? 'float-crit' : 'float-damage');
        unit.element.classList.remove('hit');
        void unit.element.offsetWidth;
        unit.element.classList.add('hit');
      }
      if (hit.absorbed > 0) {
        this.showFloat(hit.targetId, '(' + hit.absorbed + ')', 'float-shield');
      }
      if (hit.crit) {
        Sound.hit(true);
      }
    } else if (hit.kind === 'heal') {
      if (hit.amount > 0) {
        this.showFloat(hit.targetId, '+' + hit.amount + (hit.crit ? '!' : ''), 'float-heal');
      }
    } else if (hit.kind === 'shield') {
      this.showFloat(hit.targetId, '+' + hit.amount, 'float-shield');
    }

    if (wasAlive && hit.hpAfter <= 0) {
      Sound.fall();
    }
  }

  removeUnitLater(unitId, milliseconds) {
    const unit = this.units[unitId];
    setTimeout(() => {
      unit.element.remove();
      delete this.units[unitId];
    }, milliseconds);
  }

  // Aufploppende Zahl oder Wort über einer Figur
  showFloat(unitId, text, cssClass) {
    const unit = this.units[unitId];
    if (!unit) {
      return;
    }
    const float = document.createElement('div');
    float.className = 'float-text ' + cssClass;
    float.textContent = text;
    // leicht versetzt, damit sich mehrere Zahlen nicht genau überdecken
    float.style.left = 30 + Math.random() * 40 + '%';
    unit.element.querySelector('.unit-floats').appendChild(float);
    setTimeout(() => float.remove(), 1100);
  }
}
