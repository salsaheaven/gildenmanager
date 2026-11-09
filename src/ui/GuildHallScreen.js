// ============================================================
// GUILDHALLSCREEN – die Gildenhalle: Gebäude bauen und ausbauen
//   - oben: Unterhalt pro Tag, Materialbestand und die laufende Baustelle mit Fortschrittsbalken
//   - darunter eine Karte pro Gebäude: Stufe (3 Kästchen), Wirkung jetzt und auf der nächsten Stufe,
//     Kosten, Bauzeit, Unterhalt und der Knopf "Bauen"
//   - an der Schmiede und am Alchemielabor (sobald gebaut): Schmieden bzw. Brauen (siehe CraftingControls.js)
// Es gibt nur eine Baustelle gleichzeitig. Fertig wird ein Bau bei "Tag beenden".
// Die Zahlen stehen in data/buildings.js, die Regeln in systems/BuildingSystem.js.
// ============================================================

import { t } from '../core/Language.js';
import { BUILDING_ORDER, getBuilding } from '../data/buildings.js';
import { getNextLevel, canAffordCost } from '../systems/BuildingSystem.js';
import { describeMaterials } from './UpgradeControls.js';
import { getSalvageYield } from '../systems/CraftingSystem.js';
import { createForgePanel, createBrewPanel } from './CraftingControls.js';
import { Sound } from './Sound.js';
import { showToast } from './Toast.js';

export class GuildHallScreen {
  constructor(rootElement, game) {
    this.root = rootElement;
    this.game = game;
    this.forgeTemplateId = null; // zuletzt gewählte Vorlage beim Schmieden

    this.root.innerHTML = `
      <div class="hall-screen">
        <section class="panel hall-header">
          <h2>${t('hall.title')}</h2>
          <div class="hall-info"></div>
          <div class="hall-dust-hint" hidden></div>
          <div class="hall-warning" hidden>${t('hall.upkeepWarning')}</div>
          <div class="hall-construction"></div>
        </section>
        <section class="hall-list"></section>
      </div>
    `;

    game.on('changed', () => this.render());
    this.render();
  }

  render() {
    const guild = this.game.guild;
    const hall = guild.hall;

    // Kopf: Unterhalt und Material
    const upkeep = this.game.getDailyUpkeep();
    this.root.querySelector('.hall-info').textContent = t('hall.header', { upkeep, materials: describeMaterials(guild.materials, true) });
    this.root.querySelector('.hall-warning').hidden = hall.upkeepPaid;
    this.renderDustHint();
    this.renderConstruction();

    const list = this.root.querySelector('.hall-list');
    list.innerHTML = '';
    for (const buildingId of BUILDING_ORDER) {
      const card = this.createBuildingCard(buildingId);
      this.addWorkshop(card, buildingId);
      list.appendChild(card);
    }
  }

  // Fehlt Staub für das nächste Gebäude? Dann erklären, woher er kommt, und Schrott gleich hier zerlegen lassen.
  renderDustHint() {
    const guild = this.game.guild;
    const hint = this.root.querySelector('.hall-dust-hint');
    const dustMissing = BUILDING_ORDER.some((buildingId) => {
      const nextLevel = getNextLevel(guild.hall, buildingId);
      return nextLevel && (nextLevel.cost.dust || 0) > guild.materials.dust;
    });
    hint.hidden = !dustMissing;
    if (!dustMissing) {
      return;
    }
    hint.innerHTML = '<span></span>';
    hint.querySelector('span').textContent = t('hall.dustHint');
    const junk = this.game.getJunkItems();
    if (junk.length === 0) {
      hint.querySelector('span').textContent += t('hall.dustHintNoJunk');
      return;
    }
    const total = {};
    for (const item of junk) {
      const materials = getSalvageYield(item);
      for (const materialId in materials) {
        total[materialId] = (total[materialId] || 0) + materials[materialId];
      }
    }
    const button = document.createElement('button');
    button.className = 'hall-salvage-button';
    button.textContent = t('loot.salvageJunk', { count: junk.length, materials: describeMaterials(total) });
    button.addEventListener('click', () => {
      const result = this.game.salvageItems(junk.map((item) => item.id));
      Sound.click();
      showToast(t('loot.junkSalvaged', { count: result.count, materials: describeMaterials(result.materials) }), '#c084fc');
    });
    hint.appendChild(button);
  }

  // Die laufende Baustelle mit Balken, z.B. "Baustelle: Kaserne Stufe 2 · noch 2 Tage"
  renderConstruction() {
    const container = this.root.querySelector('.hall-construction');
    container.innerHTML = '';
    const construction = this.game.guild.hall.construction;
    if (construction === null) {
      container.innerHTML = '<p class="hint">' + t('hall.noConstruction') + '</p>';
      return;
    }
    const building = getBuilding(construction.buildingId);
    container.appendChild(createConstructionLine(building, construction));
  }

  createBuildingCard(buildingId) {
    const building = getBuilding(buildingId);
    const hall = this.game.guild.hall;
    const level = hall.getLevel(buildingId);
    const nextLevel = getNextLevel(hall, buildingId);
    const construction = hall.construction;
    const isBuildingThis = construction !== null && construction.buildingId === buildingId;

    const card = document.createElement('div');
    card.className = 'panel hall-card' + (level > 0 ? ' built' : '') + (isBuildingThis ? ' under-construction' : '');
    card.innerHTML = `
      <div class="hall-card-head">
        <b class="hall-card-name"></b>
        <span class="hall-pips"></span>
      </div>
      <div class="hall-card-description hint"></div>
      <div class="hall-card-now"></div>
      <div class="hall-card-next"></div>
      <div class="hall-card-action"></div>
    `;
    card.querySelector('.hall-card-name').textContent = building.name;
    card.querySelector('.hall-card-description').textContent = building.description;

    // Stufe als 3 Kästchen: gefüllt = gebaut, blinkend = wird gerade gebaut
    const pips = card.querySelector('.hall-pips');
    for (let i = 1; i <= building.levels.length; i++) {
      const pip = document.createElement('span');
      pip.className = 'hall-pip' + (i <= level ? ' filled' : '') + (isBuildingThis && i === construction.targetLevel ? ' building' : '');
      pips.appendChild(pip);
    }

    card.querySelector('.hall-card-now').textContent = level > 0
      ? t('hall.now', { level, text: building.levels[level - 1].text })
      : t('hall.notBuilt');

    if (nextLevel === null) {
      card.querySelector('.hall-card-next').textContent = t('hall.maxed');
      return card;
    }
    card.querySelector('.hall-card-next').textContent = t('hall.nextLevel', { level: level + 1, text: nextLevel.text });

    const action = card.querySelector('.hall-card-action');
    if (isBuildingThis) {
      action.appendChild(createConstructionLine(building, construction));
      return card;
    }

    // Kosten, Bauzeit und Unterhalt der nächsten Stufe
    const costLine = document.createElement('div');
    costLine.className = 'hall-cost';
    const materialText = describeMaterials(nextLevel.cost);
    costLine.textContent = t('hall.cost', { gold: nextLevel.cost.gold, materials: materialText, days: formatDays(nextLevel.buildDays), upkeep: nextLevel.upkeep });
    action.appendChild(costLine);

    const button = document.createElement('button');
    button.className = 'hall-build-button';
    button.textContent = level === 0 ? t('hall.build') : t('hall.upgrade', { level: level + 1 });
    const affordable = canAffordCost(this.game.guild, nextLevel.cost);
    if (construction !== null) {
      button.disabled = true;
      button.title = t('hall.busy');
    } else if (!affordable) {
      button.disabled = true;
      button.title = t('hall.missing');
    }
    button.addEventListener('click', () => this.build(buildingId));
    action.appendChild(button);
    return card;
  }

  // Schmiede und Labor sind auch Werkstätten: Sobald sie stehen und der Unterhalt bezahlt ist,
  // kommt unter die Karte der Bereich zum Schmieden bzw. Brauen
  addWorkshop(card, buildingId) {
    const hall = this.game.guild.hall;
    if (buildingId === 'forge' && hall.getEffect('forging', false)) {
      card.appendChild(createForgePanel(this.game, this.forgeTemplateId, (templateId) => {
        this.forgeTemplateId = templateId;
      }));
    }
    if (buildingId === 'alchemyLab' && hall.getEffect('brewTier', 0) > 0) {
      card.appendChild(createBrewPanel(this.game));
    }
  }

  // Bau starten: Hammer-Ton und kurze Meldung
  build(buildingId) {
    const result = this.game.buildBuilding(buildingId);
    if (result === 'ok') {
      Sound.buildStart();
      const construction = this.game.guild.hall.construction;
      showToast(t('hall.started', { name: getBuilding(buildingId).name, level: construction.targetLevel, days: formatDays(construction.daysLeft) }), '#ffd23f');
    }
  }
}

// Zeile "Kaserne Stufe 2 · noch 2 Tage" mit Fortschrittsbalken (auch für den Tagesplan nutzbar)
export function createConstructionLine(building, construction) {
  const totalDays = building.levels[construction.targetLevel - 1].buildDays;
  const doneDays = totalDays - construction.daysLeft;
  const line = document.createElement('div');
  line.className = 'hall-construction-line';
  line.innerHTML = '<span class="hall-construction-text"></span><div class="bar"><div class="bar-fill"></div></div>';
  line.querySelector('.hall-construction-text').textContent = t('hall.construction',
    { name: building.name, level: construction.targetLevel, days: formatDays(construction.daysLeft) });
  // Mindestens ein kleiner Anfang, damit man den Balken sieht
  line.querySelector('.bar-fill').style.width = Math.max(5, Math.round(doneDays / totalDays * 100)) + '%';
  return line;
}

// "1 Tag" / "3 Tage"
function formatDays(days) {
  return t('hall.days', { days });
}
