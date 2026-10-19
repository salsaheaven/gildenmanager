// ============================================================
// BATTLESCENE – spielt einen fertig berechneten Kampf als Szene ab
//   - Helden links (hintere und vordere Reihe), Boss und Diener rechts
//   - Lebensbalken, Schildanzeige, aufploppende Zahlen wie im MMO
//   - Zauberbalken über dem Boss, wenn er eine Mechanik vorbereitet
//   - Ticker mit den letzten Ereignissen
//
// Die Szene läuft nicht von selbst: Wer sie benutzt, ruft regelmäßig update(spielsekunden) auf.
// Sie läuft im Takt der Spieluhr: Pause hält den Kampf an, 2x und 4x beschleunigen ihn.
// ============================================================

import { getBoss, MINIONS } from '../data/enemies.js';
import { createHeroCanvas, createSpriteCanvas } from './PixelArt.js';
import { playEffect } from './BattleEffects.js';
import { computeEncounterTimeline } from '../systems/combat/BattleTimeline.js';
import { COMBAT_RULES } from '../data/combatRules.js';
import { Sound } from './Sound.js';

const TICKER_LINES = 6;       // so viele Zeilen zeigt der Ticker

// Springt die Zeit weiter als das (z.B. beim späten Zuschauen), wird ohne Animationen nachgeholt
const CATCH_UP_SECONDS = 1.5;

export class BattleScene {
  // result     = Ergebnis von simulateBattle (mit recordLog: true)
  // heroes     = die Hero-Objekte der Gruppe (für Aussehen der Pixelbilder)
  // onFinished = wird am Ende aufgerufen (auch nach "Überspringen")
  // showSkip   = Knopf "Überspringen" anzeigen (im Labor ja, in Dungeons nicht)
  constructor(container, result, heroes, onFinished, showSkip = true) {
    this.container = container;
    this.result = result;
    this.onFinished = onFinished;
    this.heroesById = {};
    for (const hero of heroes) {
      this.heroesById[hero.id] = hero;
    }

    this.time = 0;
    this.speed = 1;  // aktuelle Geschwindigkeit der Spieluhr (für die Dauer der Animationen)
    this.entryIndex = 0;
    this.finished = false;
    this.units = {}; // Kämpfer-id → Elemente der Figur

    this.buildLayout();
    this.container.querySelector('.scene-skip').hidden = !showSkip;
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
          <span class="scene-paused">PAUSE</span>
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
    // Manabalken nur für Helden mit Mana (Heiler und Zauberer)
    if (info.maxMana > 0) {
      unit.querySelector('.unit-bars').insertAdjacentHTML('beforeend', '<div class="unit-mana"><div></div></div>');
    }
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

    this.units[info.id] = { element: unit, maxHp: info.maxHp, maxMana: info.maxMana, isMinion: Boolean(info.minionId) };
    this.setBars(info.id, info.hp, 0);
    this.setMana(info.id, info.mana);
  }

  createUnitCanvas(info) {
    if (info.side === 'hero') {
      return createHeroCanvas(this.heroesById[info.heroId], 4);
    }
    if (info.bossId) {
      return createSpriteCanvas(getBoss(info.bossId).sprite, 6);
    }
    const minion = MINIONS[info.minionId];
    return createSpriteCanvas(minion.sprite, 5, minion.colors || {});
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

  setMana(unitId, mana) {
    const unit = this.units[unitId];
    if (!unit || !unit.maxMana || mana === null || mana === undefined) {
      return;
    }
    unit.element.querySelector('.unit-mana div').style.width = Math.max(0, mana / unit.maxMana) * 100 + '%';
  }

  // Jedes Ereignis bekommt einen Zeitpunkt (dieselbe Rechnung wie für die Dauer eines Runs)
  scheduleEntries() {
    const timeline = computeEncounterTimeline(this.result.log);
    this.entryTimes = timeline.times;
    this.endTime = timeline.duration;
  }

  // ---------- Abspielen ----------

  // Wird regelmäßig aufgerufen. gameSeconds = vergangene Spielzeit seit dem letzten Aufruf
  // (0, wenn das Spiel pausiert ist). isPaused blendet den Pause-Hinweis ein.
  // speed = Geschwindigkeit der Spieluhr, damit Animationen bei 4x auch schneller sind.
  update(gameSeconds, isPaused = false, speed = 1) {
    this.syncTo(this.time + gameSeconds, isPaused, speed);
  }

  // Springt zu einem Zeitpunkt im Kampf (Spielsekunden seit Kampfbeginn).
  // Kleine Schritte werden mit Animationen abgespielt, große Sprünge still nachgeholt.
  syncTo(targetTime, isPaused = false, speed = 1) {
    if (this.finished) {
      return;
    }
    this.speed = speed;
    this.container.querySelector('.battle-scene').classList.toggle('paused', isPaused);
    const quiet = targetTime - this.time > CATCH_UP_SECONDS;
    this.time = targetTime;
    while (this.entryIndex < this.result.log.length && this.entryTimes[this.entryIndex] <= this.time) {
      this.playEntry(this.result.log[this.entryIndex], quiet);
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
    if (entry.kind === 'action') {
      this.playAction(entry.action, quiet);
      return;
    }
    this.addTickerLine(entry);
    if (entry.manaUpdate) {
      this.setMana(entry.manaUpdate.targetId, entry.manaUpdate.mana);
    }

    if (entry.spawn) {
      for (const info of entry.spawn) {
        this.addUnit(info);
      }
    }
    if (entry.cast) {
      this.updateCastBar(entry.cast, quiet);
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

  // Eine Aktion beginnt: Mana anpassen, Ausfallschritt, Skill-Name und Animation
  playAction(action, quiet) {
    this.setMana(action.sourceId, action.manaAfter);
    const source = this.units[action.sourceId];
    if (quiet || !source) {
      return;
    }
    this.lunge(action.sourceId);
    if (action.showName && action.name) {
      const cssClass = source.element.classList.contains('hero-unit') ? 'float-skill' : 'float-skill enemy-skill';
      this.showFloat(action.sourceId, action.name, cssClass);
    }

    const field = this.container.querySelector('.scene-field');
    const sourceSprite = source.element.querySelector('.unit-sprite');
    const targetSprites = [];
    for (const targetId of action.targetIds) {
      if (this.units[targetId]) {
        targetSprites.push(this.units[targetId].element.querySelector('.unit-sprite'));
      }
    }
    // Das Geschoss soll ungefähr dann ankommen, wenn die Zahl aufploppt
    const flightMilliseconds = (COMBAT_RULES.pacing.actionLead * 1000 * 0.9) / Math.max(1, this.speed);
    playEffect(field, action.fx, sourceSprite, targetSprites, flightMilliseconds);
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
