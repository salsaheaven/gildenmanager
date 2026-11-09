// ============================================================
// RAIDSCREEN – der Raid (Reiter "Raid" im Abschnitt Dungeons)
//   - ganz oben: Raid wählen (Raid 2 öffnet nach dem ersten vollständigen Sieg in Raid 1)
//   - oben: Raid-Name, ob heute Raid-Tag ist bzw. wann der nächste kommt, Fortschritt der Woche
//     (✓ besiegt, ➜ als Nächstes), ob die Aufstellung reicht, Knöpfe "Auto-Raid" und "Heute aussetzen"
//   - Aufstellung: 4 Gruppen mit je bis zu 5 Helden, darunter "Nicht im Raid".
//     Bedienung: Held antippen (ausgewählt), dann einen anderen Helden antippen = tauschen,
//     oder einen freien Platz "+" bzw. den Gruppen-Kopf antippen = dorthin verschieben.
//   - Bosse: Mechaniken aller Phasen mit Tipp
// Die Regeln stehen in systems/RaidRules.js, die Aktionen in Game (Raid-Abschnitt).
// ============================================================

import { t } from '../core/Language.js';
import { RAID_RULES, RAIDS } from '../data/raids.js';
import { getBoss, MECHANIC_TYPE_TEXTS } from '../data/enemies.js';
import { ROLE_NAMES } from '../data/heroClasses.js';
import { isRaidDay, getRaidBossIds } from '../systems/RaidRules.js';
import { createHeroCanvas, createSpriteCanvas } from './PixelArt.js';
import { Sound } from './Sound.js';
import { showToast } from './Toast.js';

export class RaidScreen {
  constructor(rootElement, game) {
    this.root = rootElement;
    this.game = game;
    this.selectedHeroId = null; // angetippter Held (zum Verschieben oder Tauschen)

    this.root.innerHTML = `
      <div class="raid-screen">
        <section class="panel raid-head">
          <div class="button-row raid-select"></div>
          <h2 class="raid-name"></h2>
          <p class="hint raid-description"></p>
          <div class="raid-day-line"></div>
          <div class="raid-progress"></div>
          <div class="raid-check"></div>
          <div class="button-row raid-actions">
            <button class="auto-raid-button" title="${t('raid.autoInfo')}">${t('raid.auto')}</button>
            <button class="raid-skip-button"></button>
          </div>
        </section>
        <section class="panel">
          <h2>${t('raid.lineup')}</h2>
          <p class="hint raid-select-hint"></p>
          <div class="raid-edit-groups"></div>
          <h3>${t('raid.bench')}</h3>
          <div class="raid-bench"></div>
          <div class="button-row"><button class="raid-remove-button" hidden>${t('raid.remove')}</button></div>
        </section>
        <section class="panel">
          <h2>${t('raid.bosses')}</h2>
          <div class="raid-bosses"></div>
        </section>
      </div>
    `;

    this.root.querySelector('.auto-raid-button').addEventListener('click', () => {
      Sound.click();
      this.selectedHeroId = null;
      this.game.applyAutoRaid();
      showToast('Auto-Raid: ' + this.game.guild.raidPlan.getHeroIds().length + ' Helden aufgestellt', '#1eff00');
    });
    this.root.querySelector('.raid-skip-button').addEventListener('click', () => {
      Sound.click();
      if (this.game.guild.raidPlan.skippedDay === this.game.day) {
        this.game.planRaidToday();
      } else {
        this.game.skipRaidToday();
      }
    });
    this.root.querySelector('.raid-remove-button').addEventListener('click', () => {
      Sound.click();
      this.game.removeRaidHero(this.selectedHeroId);
      this.selectedHeroId = null;
      this.render();
    });

    game.on('changed', () => this.render());
    this.render();
  }

  render() {
    const raid = this.game.getRaid();
    this.renderRaidSelect();
    this.root.querySelector('.raid-name').textContent = raid.name;
    this.root.querySelector('.raid-description').textContent = raid.description;
    this.renderDayLine();
    this.renderProgress();
    this.renderCheck();
    this.renderGroups();
    this.renderBench();
    this.renderBosses();

    const plan = this.game.guild.raidPlan;
    const inRaid = this.selectedHeroId !== null && plan.isMember(this.selectedHeroId);
    this.root.querySelector('.raid-remove-button').hidden = !inRaid;
    this.root.querySelector('.raid-select-hint').textContent = this.selectedHeroId === null
      ? t('raid.selectHint')
      : t('raid.selected', { name: this.game.guild.findHero(this.selectedHeroId).name });
  }

  // Knöpfe zum Wählen des Raids (gesperrte Raids ausgegraut, mit Grund)
  renderRaidSelect() {
    const container = this.root.querySelector('.raid-select');
    container.innerHTML = '';
    const unlocked = this.game.getUnlockedRaids().map((raid) => raid.id);
    for (const raid of RAIDS) {
      const button = document.createElement('button');
      button.className = 'filter-button';
      button.classList.toggle('active', raid.id === this.game.guild.raidPlan.selectedRaidId);
      button.textContent = raid.name + (raid.isFinal ? t('raid.finalBoss') : '');
      button.disabled = !unlocked.includes(raid.id);
      if (button.disabled && raid.unlockAfterRaid) {
        button.title = t('raid.opensAfter', { name: RAIDS.find((entry) => entry.id === raid.unlockAfterRaid).name });
        button.textContent += ' 🔒';
      }
      button.addEventListener('click', () => {
        Sound.click();
        this.game.selectRaid(raid.id);
      });
      container.appendChild(button);
    }
  }

  // "Heute ist Raid-Tag" oder "Nächster Raid-Tag: Tag 13 (in 3 Tagen)"
  renderDayLine() {
    const line = this.root.querySelector('.raid-day-line');
    const skipButton = this.root.querySelector('.raid-skip-button');
    const game = this.game;
    const plan = game.guild.raidPlan;
    skipButton.hidden = true;
    line.className = 'raid-day-line';

    if (!game.isRaidUnlocked()) {
      line.textContent = t('raid.opensAtLevel', { level: game.getRaid().unlockLevel });
      return;
    }
    if (game.isRaidDayToday()) {
      skipButton.hidden = plan.lastFoughtDay === game.day || game.getNextRaidEncounterIndex() === null;
      if (plan.skippedDay === game.day) {
        line.textContent = t('raid.todaySkipped');
        skipButton.textContent = t('raid.raidAnyway');
      } else if (plan.activeToday) {
        line.textContent = t('raid.todayRaid');
        line.classList.add('raid-today');
        skipButton.textContent = t('raid.skipToday');
      } else if (game.getNextRaidEncounterIndex() === null) {
        line.textContent = t('raid.todayAllDone');
      } else {
        line.textContent = t('raid.todayNotReady');
        line.classList.add('raid-warning');
        skipButton.textContent = t('raid.skipToday');
      }
      return;
    }
    let nextDay = game.day + 1;
    while (!isRaidDay(nextDay)) {
      nextDay++;
    }
    const daysAway = nextDay - game.day;
    line.textContent = t('raid.raidDays', { days: RAID_RULES.raidDays.join(t('raid.and')), next: nextDay, away: daysAway });
  }

  // Die Bosse der Woche: ✓ besiegt, ➜ als Nächstes, sonst offen
  renderProgress() {
    const container = this.root.querySelector('.raid-progress');
    container.innerHTML = '';
    const defeated = this.game.getDefeatedRaidBossIds();
    const nextIndex = this.game.getNextRaidEncounterIndex();
    const raid = this.game.getRaid();
    const nextBossId = nextIndex === null ? null : raid.encounters.slice(nextIndex).find((encounter) => encounter.type === 'boss').bossId;
    for (const bossId of getRaidBossIds(raid)) {
      const chip = document.createElement('span');
      chip.className = 'raid-boss-chip';
      const boss = getBoss(bossId);
      if (defeated.includes(bossId)) {
        chip.classList.add('defeated');
        chip.textContent = '✓ ' + boss.name;
      } else if (bossId === nextBossId) {
        chip.classList.add('next');
        chip.textContent = '➜ ' + boss.name;
      } else {
        chip.textContent = boss.name;
      }
      container.appendChild(chip);
    }
    const note = document.createElement('div');
    note.className = 'hint';
    note.textContent = t('raid.lockoutNote');
    container.appendChild(note);
  }

  // Reicht die Aufstellung? "Bereit: 14 Helden · 2 Tanks · 4 Heiler" oder die Probleme in Rot
  renderCheck() {
    const check = this.game.checkRaid();
    const box = this.root.querySelector('.raid-check');
    box.className = 'raid-check ' + (check.ok ? 'ok' : 'bad');
    const counts = t('raid.counts', { count: check.heroCount, max: RAID_RULES.groupCount * RAID_RULES.groupSize, tanks: check.tanks, healers: check.healers });
    box.textContent = check.ok
      ? t('raid.ready', { counts, fewer: check.heroCount < RAID_RULES.groupCount * RAID_RULES.groupSize })
      : t('raid.missing', { counts, problems: check.problems.join(', ') });
  }

  // Die 4 Gruppen mit ihren Helden und freien Plätzen
  renderGroups() {
    const container = this.root.querySelector('.raid-edit-groups');
    container.innerHTML = '';
    const plan = this.game.guild.raidPlan;
    plan.groups.forEach((group, groupIndex) => {
      const box = document.createElement('div');
      box.className = 'raid-edit-group';
      box.innerHTML = '<button class="raid-edit-group-head"></button><div class="raid-edit-tiles"></div>';
      const head = box.querySelector('.raid-edit-group-head');
      const healers = group.filter((heroId) => this.getRole(heroId) === 'healer').length;
      head.textContent = t('raid.groupHead', { number: groupIndex + 1, count: group.length, size: RAID_RULES.groupSize, noHealer: group.length > 0 && healers === 0 });
      head.classList.toggle('no-healer', group.length > 0 && healers === 0);
      head.addEventListener('click', () => this.moveSelectedTo(groupIndex));
      const tiles = box.querySelector('.raid-edit-tiles');
      for (const heroId of group) {
        tiles.appendChild(this.createTile(heroId));
      }
      for (let i = group.length; i < RAID_RULES.groupSize; i++) {
        const slot = document.createElement('button');
        slot.className = 'raid-empty-slot';
        slot.textContent = '+';
        slot.title = t('raid.placeHere');
        slot.addEventListener('click', () => this.moveSelectedTo(groupIndex));
        tiles.appendChild(slot);
      }
      container.appendChild(box);
    });
  }

  // Helden, die nicht im Raid stehen
  renderBench() {
    const container = this.root.querySelector('.raid-bench');
    container.innerHTML = '';
    const plan = this.game.guild.raidPlan;
    const bench = this.game.guild.heroes.filter((hero) => !plan.isMember(hero.id));
    for (const hero of bench) {
      container.appendChild(this.createTile(hero.id));
    }
    if (bench.length === 0) {
      container.innerHTML = '<p class="hint">' + t('raid.allInRaid') + '</p>';
    }
  }

  getRole(heroId) {
    return this.game.guild.findHero(heroId).getClass().role;
  }

  // Kachel eines Helden: Bild, Vorname, Level und Rolle; verletzte blasser
  createTile(heroId) {
    const hero = this.game.guild.findHero(heroId);
    const tile = document.createElement('button');
    tile.className = 'hero-tile raid-hero-tile';
    tile.style.setProperty('--rarity', hero.getRarity().color);
    tile.classList.toggle('selected', heroId === this.selectedHeroId);
    tile.classList.toggle('injured', hero.isInjured());
    tile.title = hero.name + ' · ' + hero.getClass().name + ' · ' + t('common.lv') + ' ' + hero.level + (hero.isInjured() ? t('heroes.injuredShort') : '');
    tile.appendChild(createHeroCanvas(hero, 3));
    tile.insertAdjacentHTML('beforeend', '<span class="hero-tile-name"></span><span class="hero-tile-level"></span>');
    tile.querySelector('.hero-tile-name').textContent = hero.name.split(' ')[0];
    tile.querySelector('.hero-tile-level').textContent = 'Lv ' + hero.level + ' · ' + ROLE_NAMES[hero.getClass().role];
    tile.addEventListener('click', () => this.onTileClicked(heroId));
    return tile;
  }

  // Tippen auf einen Helden: auswählen, abwählen oder mit dem ausgewählten tauschen
  onTileClicked(heroId) {
    Sound.click();
    const plan = this.game.guild.raidPlan;
    const selected = this.selectedHeroId;
    if (selected === null) {
      this.selectedHeroId = heroId;
      this.render();
      return;
    }
    if (selected === heroId) {
      this.selectedHeroId = null;
      this.render();
      return;
    }
    const selectedGroup = plan.getGroupIndexOf(selected);
    const targetGroup = plan.getGroupIndexOf(heroId);
    if (targetGroup !== -1) {
      // Der Ausgewählte nimmt den Platz des Angetippten ein (der wechselt dorthin, wo der Ausgewählte war)
      this.game.moveRaidHero(selected, targetGroup, heroId);
    } else if (selectedGroup !== -1) {
      // Angetippter Held von der Bank kommt für den Ausgewählten in den Raid
      this.game.moveRaidHero(heroId, selectedGroup, selected);
    } else {
      // Beide auf der Bank: nur die Auswahl wechseln
      this.selectedHeroId = heroId;
      this.render();
      return;
    }
    this.selectedHeroId = null;
    this.render();
  }

  // Den ausgewählten Helden in eine Gruppe verschieben (freier Platz oder Gruppen-Kopf)
  moveSelectedTo(groupIndex) {
    if (this.selectedHeroId === null) {
      return;
    }
    Sound.click();
    const result = this.game.moveRaidHero(this.selectedHeroId, groupIndex);
    if (result === 'full') {
      showToast('Gruppe ' + (groupIndex + 1) + ' ist voll. Tippe einen Helden darin an, um zu tauschen.', '#ff6b6b');
      return;
    }
    this.selectedHeroId = null;
    this.render();
  }

  // Bosse mit Bild, Leben und allen Mechaniken (inkl. Phasen)
  renderBosses() {
    const container = this.root.querySelector('.raid-bosses');
    container.innerHTML = '';
    for (const bossId of getRaidBossIds(this.game.getRaid())) {
      const boss = getBoss(bossId);
      const card = document.createElement('details');
      card.className = 'raid-boss-card';
      card.innerHTML = '<summary><span class="raid-boss-sprite"></span><b></b> <span class="hint"></span></summary><ul class="mechanic-list"></ul>';
      card.querySelector('.raid-boss-sprite').appendChild(createSpriteCanvas(boss.sprite, 2, boss.colors || {}));
      card.querySelector('b').textContent = boss.name;
      card.querySelector('.hint').textContent = boss.title;
      const list = card.querySelector('.mechanic-list');
      if (boss.tankStacks) {
        this.addMechanicLine(list, t('raid.tankSwap', { name: boss.tankStacks.name }), t('raid.tankSwapText', { count: boss.tankStacks.swapAt }));
      }
      for (const mechanic of boss.mechanics) {
        this.addMechanicLine(list, mechanic.name, MECHANIC_TYPE_TEXTS[mechanic.type] + '. ' + mechanic.hint);
      }
      for (const phase of boss.phases || []) {
        this.addMechanicLine(list, t('raid.phase', { name: phase.name, percent: Math.round(phase.belowHpPercent * 100) }), phase.text);
        for (const mechanic of phase.mechanics) {
          this.addMechanicLine(list, '· ' + mechanic.name, MECHANIC_TYPE_TEXTS[mechanic.type] + '. ' + mechanic.hint);
        }
      }
      container.appendChild(card);
    }
  }

  addMechanicLine(list, name, text) {
    const line = document.createElement('li');
    line.innerHTML = '<b></b> <span></span>';
    line.querySelector('b').textContent = name;
    line.querySelector('span').textContent = text;
    list.appendChild(line);
  }
}
