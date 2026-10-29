// ============================================================
// BATTLESCENE – spielt einen fertig berechneten Kampf als Szene ab
//   - Helden links (hintere und vordere Reihe), Boss und Diener rechts
//   - Lebensbalken, Schildanzeige, aufploppende Zahlen wie im MMO
//   - Zauberbalken über dem Boss, wenn er eine Mechanik vorbereitet
//   - Ticker mit den letzten Ereignissen
//   - großer Skill-Name über dem, der handelt; Handelnder und Ziele leuchten kurz auf
//   - Maus über einem Helden (Handy: antippen) zeigt seine Skills und Abklingzeiten (SkillTooltip)
//
// Die Szene läuft nicht von selbst: Wer sie benutzt, ruft in jedem Bild update(sekunden) auf.
// Mit den Knöpfen 1x / 2x / 4x läuft sie schneller. Die Wahl wird im Browser gemerkt.
// Zeitraffer: Trash und ruhige Runden laufen zusätzlich schneller (siehe BattleTimeline.js),
// dann steht oben "Zeitraffer ⏩".
// ============================================================

import { getBoss, MINIONS } from '../data/enemies.js';
import { createHeroCanvas, createSpriteCanvas } from './PixelArt.js';
import { playEffect } from './BattleEffects.js';
import { computeEncounterTimeline } from '../systems/combat/BattleTimeline.js';
import { COMBAT_RULES } from '../data/combatRules.js';
import { Sound } from './Sound.js';
import { SkillTooltip } from './SkillTooltip.js';
import { getDamageType } from '../data/damageTypes.js';

const TICKER_LINES = 6;       // so viele Zeilen zeigt der Ticker

// Springt die Zeit weiter als das (z.B. wenn der Browser-Tab im Hintergrund war), wird ohne Animationen nachgeholt
const CATCH_UP_SECONDS = 1.5;

// Unter diesem Namen merkt sich der Browser die gewählte Geschwindigkeit
const SPEED_STORAGE_KEY = 'gildenmanager-scene-speed';

export class BattleScene {
  // result     = Ergebnis von simulateBattle (mit recordLog: true)
  // heroes     = die Hero-Objekte der Gruppe (für Aussehen der Pixelbilder)
  // onFinished = wird am Ende aufgerufen (auch nach "Überspringen")
  // showSkip   = Knopf "Überspringen" anzeigen
  constructor(container, result, heroes, onFinished, showSkip = true) {
    this.container = container;
    this.result = result;
    this.onFinished = onFinished;
    this.heroesById = {};
    for (const hero of heroes) {
      this.heroesById[hero.id] = hero;
    }

    this.time = 0;
    this.speed = loadSpeed();  // Abspiel-Geschwindigkeit (1, 2 oder 4)
    this.entryIndex = 0;
    this.finished = false;
    this.units = {}; // Kämpfer-id → Elemente der Figur
    this.round = 0;  // aktuelle Kampfrunde (für die Abklingzeiten im Skill-Fenster)
    this.timeLapse = 1; // Zeitraffer-Faktor der aktuellen Runde (1 = normal)

    this.buildLayout();
    this.renderSpeedButtons();
    this.tooltip = new SkillTooltip(this.container.querySelector('.scene-field'));
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
          <span class="scene-timelapse" hidden>Zeitraffer ⏩</span>
          <span class="scene-speeds"></span>
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

  // Knöpfe 1x / 2x / 4x
  renderSpeedButtons() {
    const container = this.container.querySelector('.scene-speeds');
    container.innerHTML = '';
    for (const speed of COMBAT_RULES.sceneSpeeds) {
      const button = document.createElement('button');
      button.textContent = speed + 'x';
      button.classList.toggle('active', speed === this.speed);
      button.addEventListener('click', () => {
        Sound.click();
        this.speed = speed;
        saveSpeed(speed);
        this.renderSpeedButtons();
      });
      container.appendChild(button);
    }
  }

  // Wie schnell die Szene gerade wirklich läuft: gewähltes Tempo × Zeitraffer
  getPlaybackSpeed() {
    return this.speed * this.timeLapse;
  }

  // Wie schnell CSS-Animationen (Effekte, Zahlen) gerade laufen sollen
  getAnimationRate() {
    return COMBAT_RULES.sceneAnimationRate * this.getPlaybackSpeed();
  }

  // Alle laufenden CSS-Animationen eines Elements an das Tempo anpassen
  applyAnimationRate(element) {
    const rate = this.getAnimationRate();
    for (const animation of element.getAnimations({ subtree: true })) {
      animation.playbackRate = rate;
    }
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

    // usedRounds = Skill-id → Runde, in der er zuletzt benutzt wurde
    this.units[info.id] = {
      element: unit, maxHp: info.maxHp, maxMana: info.maxMana, isMinion: Boolean(info.minionId),
      name: info.name, classId: info.classId, mana: info.mana, usedRounds: {},
      manaCostFactor: info.manaCostFactor || 1,
    };
    // Skill-Fenster nur für Helden, Begleiter haben keine Skills
    if (info.side === 'hero' && !info.isPet) {
      this.addTooltipEvents(info.id, unit);
    }
    this.setBars(info.id, info.hp, 0);
    this.setMana(info.id, info.mana);
  }

  // Skill-Fenster: Am PC per Maus darüber, auf dem Handy per Antippen (noch mal tippen schließt es)
  addTooltipEvents(unitId, unitElement) {
    unitElement.addEventListener('pointerenter', (event) => {
      if (event.pointerType === 'mouse') {
        this.showTooltip(unitId);
      }
    });
    unitElement.addEventListener('pointerleave', (event) => {
      if (event.pointerType === 'mouse') {
        this.tooltip.hide();
      }
    });
    unitElement.addEventListener('click', (event) => {
      if (event.pointerType === 'mouse') {
        return;
      }
      if (this.tooltip.isOpenFor(unitId)) {
        this.tooltip.hide();
      } else {
        this.showTooltip(unitId);
      }
    });
  }

  showTooltip(unitId) {
    this.tooltip.show(unitId, this.units[unitId].element, this.getTooltipState(unitId));
  }

  // Was das Skill-Fenster über einen Helden wissen muss
  getTooltipState(unitId) {
    const unit = this.units[unitId];
    return { name: unit.name, classId: unit.classId, mana: unit.maxMana > 0 ? unit.mana : null,
      round: this.round, usedRounds: unit.usedRounds, manaCostFactor: unit.manaCostFactor };
  }

  createUnitCanvas(info) {
    if (info.isPet) {
      return createSpriteCanvas(info.petSprite.sprite, 3, info.petSprite.colors);
    }
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
    unit.mana = mana;
    unit.element.querySelector('.unit-mana div').style.width = Math.max(0, mana / unit.maxMana) * 100 + '%';
  }

  // Jedes Ereignis bekommt einen Zeitpunkt (dieselbe Rechnung wie für die Dauer eines Runs)
  scheduleEntries() {
    const timeline = computeEncounterTimeline(this.result.log, this.result.encounterType);
    this.entryTimes = timeline.times;
    this.entrySpeeds = timeline.speeds;
    this.endTime = timeline.duration;
  }

  // ---------- Abspielen ----------

  // Wird in jedem Bild aufgerufen. seconds = vergangene echte Zeit seit dem letzten Aufruf.
  // Bei 2x vergeht in der Szene doppelt so viel Zeit.
  update(seconds) {
    this.syncTo(this.time + seconds * this.speed);
  }

  // Springt zu einem Zeitpunkt im Kampf (Sekunden seit Kampfbeginn, bei 1x gemessen).
  // Kleine Schritte werden mit Animationen abgespielt, große Sprünge still nachgeholt.
  syncTo(targetTime) {
    if (this.finished) {
      return;
    }
    const quiet = targetTime - this.time > CATCH_UP_SECONDS * this.speed;
    this.time = targetTime;
    while (this.entryIndex < this.result.log.length && this.entryTimes[this.entryIndex] <= this.time) {
      this.setTimeLapse(this.entrySpeeds[this.entryIndex]);
      this.playEntry(this.result.log[this.entryIndex], quiet);
      this.entryIndex++;
    }
    if (this.entryIndex >= this.result.log.length && this.time >= this.endTime) {
      this.finish();
    }
  }

  // Zeitraffer an oder aus (Schild oben in der Szene)
  setTimeLapse(factor) {
    if (factor === this.timeLapse) {
      return;
    }
    this.timeLapse = factor;
    this.container.querySelector('.scene-timelapse').hidden = factor <= 1;
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
    this.container.querySelector('.scene-timelapse').hidden = true;
    this.onFinished(this.result);
  }

  // quiet = true: nur Balken aktualisieren, keine Animationen und Töne (beim Überspringen)
  playEntry(entry, quiet) {
    if (entry.round > 0) {
      this.round = entry.round;
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

  // Eine Aktion beginnt: Mana anpassen, Ausfallschritt, Skill-Name, Hervorhebung und Animation
  playAction(action, quiet) {
    this.setMana(action.sourceId, action.manaAfter);
    const source = this.units[action.sourceId];
    // Abklingzeit merken und ein offenes Skill-Fenster auffrischen (auch beim Überspringen)
    if (source && action.abilityId) {
      source.usedRounds[action.abilityId] = this.round;
    }
    if (this.tooltip.unitId !== null) {
      this.tooltip.refresh(this.getTooltipState(this.tooltip.unitId));
    }
    if (quiet || !source) {
      return;
    }
    this.lunge(action.sourceId);
    if (action.showName && action.name) {
      this.showSkillCallout(source, action.name);
    }
    this.highlightAction(action);

    const field = this.container.querySelector('.scene-field');
    const sourceSprite = source.element.querySelector('.unit-sprite');
    const targetSprites = [];
    for (const targetId of action.targetIds) {
      if (this.units[targetId]) {
        targetSprites.push(this.units[targetId].element.querySelector('.unit-sprite'));
      }
    }
    // Das Geschoss soll ungefähr dann ankommen, wenn die Zahl aufploppt
    const flightMilliseconds = (COMBAT_RULES.pacing.actionLead * 1000 * 0.9) / this.getPlaybackSpeed();
    playEffect(field, action.fx, sourceSprite, targetSprites, flightMilliseconds, this.getAnimationRate());
  }

  // Großer Skill-Name über dem Handelnden (Helden goldgelb, Gegner orange-rot)
  showSkillCallout(source, name) {
    const callout = document.createElement('div');
    callout.className = 'skill-callout' + (source.element.classList.contains('hero-unit') ? '' : ' enemy-callout');
    callout.textContent = name;
    source.element.querySelector('.unit-floats').appendChild(callout);
    this.keepInsideField(callout);
    // Bei 1x etwa 1,6 Sekunden sichtbar, bei 4x entsprechend kürzer
    for (const animation of callout.getAnimations()) {
      animation.playbackRate = this.getPlaybackSpeed();
    }
    setTimeout(() => callout.remove(), 1600 / this.getPlaybackSpeed());
  }

  // Ragt ein Skill-Name links oder rechts aus dem Kampffeld heraus, wird er hineingeschoben
  keepInsideField(element) {
    // Gemessen wird ohne Animation (sonst ist der Name gerade noch klein gezoomt)
    element.style.animation = 'none';
    const field = this.container.querySelector('.scene-field').getBoundingClientRect();
    const box = element.getBoundingClientRect();
    // Auf dem Handy ist die Szene verkleinert: Bildschirm-Pixel in CSS-Pixel umrechnen
    const zoom = element.offsetWidth > 0 ? box.width / element.offsetWidth : 1;
    const margin = 4;
    if (box.left < field.left + margin) {
      element.style.marginLeft = (field.left + margin - box.left) / zoom + 'px';
    } else if (box.right > field.right - margin) {
      element.style.marginLeft = (field.right - margin - box.right) / zoom + 'px';
    }
    element.style.animation = '';
  }

  // Der Handelnde leuchtet auf, seine Ziele bekommen einen Rahmen:
  // grün, wenn er Verbündeten hilft, rot, wenn er Gegner angreift
  highlightAction(action) {
    const source = this.units[action.sourceId];
    const sourceIsHero = source.element.classList.contains('hero-unit');
    const marked = [{ element: source.element, cssClass: 'acting' }];
    for (const targetId of action.targetIds) {
      const target = this.units[targetId];
      if (!target || targetId === action.sourceId) {
        continue;
      }
      const targetIsHero = target.element.classList.contains('hero-unit');
      marked.push({ element: target.element, cssClass: sourceIsHero === targetIsHero ? 'targeted-friend' : 'targeted-foe' });
    }
    for (const mark of marked) {
      mark.element.classList.add(mark.cssClass);
    }
    const milliseconds = (COMBAT_RULES.pacing.actionLead + COMBAT_RULES.pacing.effectTime) * 1000 / this.getPlaybackSpeed() + 150;
    setTimeout(() => {
      for (const mark of marked) {
        mark.element.classList.remove(mark.cssClass);
      }
    }, milliseconds);
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
    this.applyAnimationRate(unit.element);
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
        // Nicht-körperlicher Schaden bekommt die Farbe seiner Schadensart (z.B. Säure grün)
        const color = hit.damageType && hit.damageType !== 'physical' ? getDamageType(hit.damageType).color : null;
        this.showFloat(hit.targetId, '-' + hit.amount + (hit.crit ? '!' : ''), hit.crit ? 'float-crit' : 'float-damage', color);
        unit.element.classList.remove('hit');
        void unit.element.offsetWidth;
        unit.element.classList.add('hit');
        this.applyAnimationRate(unit.element);
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
  // color = freiwillig: eigene Farbe für die Zahl (z.B. die Farbe der Schadensart)
  showFloat(unitId, text, cssClass, color = null) {
    const unit = this.units[unitId];
    if (!unit) {
      return;
    }
    const float = document.createElement('div');
    float.className = 'float-text ' + cssClass;
    float.textContent = text;
    if (color) {
      float.style.color = color;
    }
    // leicht versetzt, damit sich mehrere Zahlen nicht genau überdecken
    float.style.left = 30 + Math.random() * 40 + '%';
    unit.element.querySelector('.unit-floats').appendChild(float);
    this.applyAnimationRate(float);
    setTimeout(() => float.remove(), 1100 / this.getAnimationRate());
  }
}

// ---------- Gemerkte Geschwindigkeit ----------
// Liegt nur im Browser des Spielers (kein Teil des Spielstands). Kann blockiert sein, daher try/catch.

function loadSpeed() {
  try {
    const saved = Number(localStorage.getItem(SPEED_STORAGE_KEY));
    if (COMBAT_RULES.sceneSpeeds.includes(saved)) {
      return saved;
    }
  } catch (error) {
    // nichts gemerkt: Standard-Tempo
  }
  return COMBAT_RULES.sceneSpeeds[0];
}

function saveSpeed(speed) {
  try {
    localStorage.setItem(SPEED_STORAGE_KEY, String(speed));
  } catch (error) {
    // nicht schlimm, dann gilt beim nächsten Mal wieder 1x
  }
}
