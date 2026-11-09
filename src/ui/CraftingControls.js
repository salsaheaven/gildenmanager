// ============================================================
// CRAFTINGCONTROLS – Schmieden, Umschmieden und Brauen in der Oberfläche
//   - createForgePanel: Vorlage wählen und "Schmieden" (auf der Karte der Schmiede in der Gildenhalle)
//   - createBrewPanel: Rezeptliste mit "Brauen" (auf der Karte des Alchemielabors)
//   - createReforgeControls: andere Rüstungsart wählen und "Umschmieden" (im Inventar)
//   - createSetReforgeControls: Set-Teil in ein anderes Set umschmieden (mit Aschenessenz aus dem Raid, im Inventar)
// Die Regeln stehen in systems/ForgeSystem.js und systems/AlchemySystem.js,
// die Zahlen in data/crafting.js und data/alchemy.js.
// ============================================================

import { t } from '../core/Language.js';
import { ITEM_TEMPLATES, SLOT_NAMES, ARMOR_TYPES } from '../data/items.js';
import { getConsumable } from '../data/consumables.js';
import { BREW_RECIPES } from '../data/alchemy.js';
import { FORGE_RULES, SET_REFORGE_RULES } from '../data/crafting.js';
import { getSetReforgeTargets, checkSetReforge } from '../systems/ForgeSystem.js';
import { getRarity } from '../data/rarities.js';
import { getForgeCost, getForgeItemLevel, getReforgeTargets, getReforgeCost, checkReforge } from '../systems/ForgeSystem.js';
import { getBrewCost, checkBrew } from '../systems/AlchemySystem.js';
import { describeMaterials } from './UpgradeControls.js';
import { Sound } from './Sound.js';
import { showToast } from './Toast.js';

// Name einer Vorlage mit Rüstungsart, z.B. "Plattenhelm (Platte)" oder "Schwert"
function describeTemplate(template) {
  return template.armorType ? template.name + ' (' + ARMOR_TYPES[template.armorType].name + ')' : template.name;
}

// ---------- Schmieden ----------

// selectedTemplateId = zuletzt gewählte Vorlage (bleibt beim Neuzeichnen erhalten)
// onSelect = wird mit der neuen Vorlage aufgerufen, wenn man eine andere wählt
export function createForgePanel(game, selectedTemplateId, onSelect) {
  const guild = game.guild;
  const panel = document.createElement('div');
  panel.className = 'workshop-panel';
  panel.innerHTML = `
    <div class="workshop-title">${t('hall.forge')}</div>
    <p class="hint workshop-hint"></p>
    <div class="workshop-row">
      <select class="forge-select"></select>
      <button class="forge-button"></button>
    </div>
  `;
  panel.querySelector('.workshop-hint').textContent = t('hall.forgeHint', { level: getForgeItemLevel(guild) });

  // Auswahl nach Platz gruppiert (Waffe, Kopf, Brust …)
  const select = panel.querySelector('.forge-select');
  for (const slot in SLOT_NAMES) {
    const group = document.createElement('optgroup');
    group.label = SLOT_NAMES[slot];
    for (const template of ITEM_TEMPLATES.filter((entry) => entry.slot === slot)) {
      const option = document.createElement('option');
      option.value = template.id;
      option.textContent = describeTemplate(template);
      group.appendChild(option);
    }
    select.appendChild(group);
  }
  select.value = selectedTemplateId || ITEM_TEMPLATES[0].id;
  select.addEventListener('change', () => onSelect(select.value));

  const cost = getForgeCost(guild);
  const button = panel.querySelector('.forge-button');
  button.textContent = t('hall.forgeButton', { materials: describeMaterials(cost) });
  button.disabled = !guild.hasMaterials(cost);
  if (button.disabled) {
    button.title = t('hall.forgeMissing');
  }
  button.addEventListener('click', () => {
    const outcome = game.forgeItem(select.value);
    if (outcome.result === 'ok') {
      Sound.upgradeSuccess(3);
      showToast(t('hall.forged', { name: outcome.item.getDisplayName() }), getRarity(FORGE_RULES.rarityId).color);
    }
  });
  return panel;
}

// ---------- Brauen ----------

// Rezeptliste des Alchemielabors. Rezepte für höhere Labor-Stufen stehen ausgegraut dabei.
export function createBrewPanel(game) {
  const guild = game.guild;
  const panel = document.createElement('div');
  panel.className = 'workshop-panel';
  panel.innerHTML = '<div class="workshop-title"></div><div class="brew-list"></div>';
  panel.querySelector('.workshop-title').textContent = t('hall.brew');
  const list = panel.querySelector('.brew-list');

  for (const recipe of BREW_RECIPES) {
    const consumable = getConsumable(recipe.consumableId);
    const check = checkBrew(guild, recipe.id);
    const row = document.createElement('div');
    row.className = 'brew-row' + (check === 'noLab' ? ' locked' : '');
    row.innerHTML = '<span class="brew-name"></span><button class="brew-button"></button>';
    row.querySelector('.brew-name').textContent = consumable.icon + ' ' + consumable.name +
      t('hall.inStock', { count: guild.countSupply(consumable.id) });
    row.querySelector('.brew-name').style.color = consumable.color;
    row.querySelector('.brew-name').title = consumable.description;

    const button = row.querySelector('.brew-button');
    if (check === 'noLab') {
      button.textContent = t('hall.labLevel', { level: recipe.tier });
      button.disabled = true;
    } else {
      button.textContent = t('hall.brewButton', { materials: describeMaterials(getBrewCost(guild, recipe.id)) });
      button.disabled = check !== 'ok';
      if (button.disabled) {
        button.title = t('hall.brewMissing');
      }
    }
    button.addEventListener('click', () => {
      if (game.brewRecipe(recipe.id) === 'ok') {
        Sound.brew();
        showToast(t('hall.brewed', { name: consumable.name }), consumable.color);
      }
    });
    list.appendChild(row);
  }
  return panel;
}

// ---------- Umschmieden ----------

// Auswahl der neuen Rüstungsart und Knopf "Umschmieden" für ein Rüstungsteil im Inventar.
// Gibt null zurück, wenn das Item keine Rüstung ist. Ohne Schmiede Stufe 2 nur ein Hinweis.
export function createReforgeControls(game, item) {
  const targets = getReforgeTargets(item);
  if (targets.length === 0) {
    return null;
  }
  const container = document.createElement('div');
  container.className = 'reforge-controls';
  if (!game.guild.hall.getEffect('reforging', false)) {
    container.innerHTML = '<p class="hint">' + t('hall.reforgeLocked') + '</p>';
    return container;
  }

  container.innerHTML = '<select class="reforge-select"></select><button class="reforge-button"></button>';
  const select = container.querySelector('.reforge-select');
  for (const target of targets) {
    const option = document.createElement('option');
    option.value = target.id;
    option.textContent = 'zu ' + describeTemplate(target);
    select.appendChild(option);
  }

  const cost = getReforgeCost(item);
  const button = container.querySelector('.reforge-button');
  button.textContent = t('hall.reforgeButton', { materials: describeMaterials(cost) });
  button.disabled = checkReforge(game.guild, item, targets[0].id) !== 'ok';
  if (button.disabled) {
    button.title = t('hall.reforgeMissing');
  }
  button.addEventListener('click', () => {
    const oldName = item.getDisplayName();
    if (game.reforgeItem(item.id, select.value) === 'ok') {
      Sound.upgradeSuccess(5);
      showToast(t('hall.reforged', { oldName, name: item.getDisplayName() }), item.getRarity().color);
    }
  });
  return container;
}

// ---------- Set-Teile umschmieden (Raid-Zutaten) ----------

// Auswahl des Ziel-Sets und Knopf "In Set umschmieden" (null, wenn das Item kein Set-Teil ist).
// Jedes andere Set ist erlaubt, auch eine andere Rüstungsart (z.B. Krieger-Helm → Magier-Kapuze).
export function createSetReforgeControls(game, item) {
  const targets = getSetReforgeTargets(item);
  if (targets.length === 0) {
    return null;
  }
  const container = document.createElement('div');
  container.className = 'reforge-controls set-reforge-controls';
  if (!game.guild.hall.getEffect('setReforging', false)) {
    container.innerHTML = '<p class="hint">' + t('hall.setReforgeLocked') + '</p>';
    return container;
  }
  container.innerHTML = '<div class="hint">' + t('hall.setReforgeLabel') + '</div>' +
    '<select class="reforge-select"></select><button class="reforge-button"></button>';
  const select = container.querySelector('.reforge-select');
  for (const set of targets) {
    const option = document.createElement('option');
    option.value = set.id;
    option.textContent = t('hall.toSet', { set: set.name, armor: ARMOR_TYPES[set.armorType].name });
    select.appendChild(option);
  }
  const button = container.querySelector('.reforge-button');
  button.textContent = t('hall.setReforgeButton', { materials: describeMaterials(SET_REFORGE_RULES.cost) });
  button.disabled = checkSetReforge(game.guild, item, targets[0].id) !== 'ok';
  if (button.disabled) {
    button.title = t('hall.setReforgeMissing');
  }
  button.addEventListener('click', () => {
    const oldName = item.getDisplayName();
    if (game.reforgeSetItem(item.id, select.value) === 'ok') {
      Sound.upgradeSuccess(5);
      showToast(t('hall.reforged', { oldName, name: item.getDisplayName() }), item.getRarity().color);
    }
  });
  return container;
}
