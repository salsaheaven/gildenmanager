// ============================================================
// UPGRADECONTROLS – Zerlegen und Verbessern in der Oberfläche
// Benutzt im Inventar (InventoryOverlay) und in der Ausrüstungsliste des Helden (EquipPanel).
//   - describeMaterials: Material als kurzer Text, z.B. "✧ 12 · ◆ 3"
//   - createUpgradeButton: Knopf "Verbessern auf +4 (✧ 12 · 40 Gold)" mit Chance ab +6
//   - playUpgradeEffect: Funken (geklappt) oder Riss (fehlgeschlagen) über einem Bereich
//   - applyUpgradeGlow: verbesserte Items leuchten stärker und zeigen "+3"
// Die Regeln stehen in systems/CraftingSystem.js, die Zahlen in data/crafting.js.
// ============================================================

import { MATERIALS, UPGRADE_RULES } from '../data/crafting.js';
import { getUpgradeCost, canAffordUpgrade } from '../systems/CraftingSystem.js';
import { Sound } from './Sound.js';
import { showToast } from './Toast.js';

// Wie lange Funken oder Riss zu sehen sind (Millisekunden, passend zur Animation in main.css)
const EFFECT_DURATION = 900;

// Material als kurzer Text. Leere Sorten werden weggelassen, z.B. "✧ 6 · ◆ 1" oder "✧ 2".
// showZero = true zeigt auch "◆ 0" (für den Bestand oben im Inventar)
export function describeMaterials(materials, showZero = false) {
  const parts = [];
  for (const materialId in MATERIALS) {
    const amount = materials[materialId] || 0;
    if (amount > 0 || showZero) {
      parts.push(MATERIALS[materialId].icon + ' ' + amount);
    }
  }
  return parts.join(' · ');
}

// Text für den Knopf, z.B. "Verbessern auf +7 (✧ 21 · ◆ 2 · 70 Gold · 65 %)"
function describeUpgradeCost(cost) {
  const parts = [describeMaterials(cost), cost.gold + ' Gold'];
  if (cost.chance < 1) {
    parts.push(Math.round(cost.chance * 100) + ' %');
  }
  return 'Verbessern auf +' + cost.targetLevel + ' (' + parts.join(' · ') + ')';
}

// Baut den Verbessern-Knopf für ein Item.
// effectTarget = Bereich, über dem Funken oder Riss erscheinen (muss beim Neuzeichnen erhalten bleiben)
export function createUpgradeButton(game, item, effectTarget) {
  const button = document.createElement('button');
  button.className = 'upgrade-button';
  const cost = getUpgradeCost(item);

  if (cost === null) {
    button.textContent = 'Höchste Stufe (+' + UPGRADE_RULES.maxLevel + ')';
    button.disabled = true;
    return button;
  }

  button.textContent = describeUpgradeCost(cost);
  const affordable = canAffordUpgrade(game.guild, cost);
  button.disabled = !affordable;
  if (!affordable) {
    button.title = 'Zu wenig Material oder Gold. Material bekommst du durchs Zerlegen.';
  }
  if (cost.chance < 1) {
    button.classList.add('risky');
  }

  button.addEventListener('click', () => {
    const result = game.upgradeItem(item.id);
    if (result === 'success') {
      Sound.upgradeSuccess(item.upgradeLevel);
      showToast(item.getDisplayName() + '!', item.getRarity().color);
      playUpgradeEffect(effectTarget, 'success');
    } else if (result === 'failed') {
      Sound.upgradeFail();
      showToast('Fehlgeschlagen! Material weg, ' + item.getDisplayName() + ' bleibt', '#ff5a5a');
      playUpgradeEffect(effectTarget, 'failed');
    }
  });
  return button;
}

// Funken (result = 'success') oder Riss (result = 'failed') über dem Bereich.
// Die Animation steckt in main.css (Klassen upgrade-sparks und upgrade-crack).
export function playUpgradeEffect(element, result) {
  const className = result === 'success' ? 'upgrade-sparks' : 'upgrade-crack';
  element.classList.remove('upgrade-sparks', 'upgrade-crack');
  void element.offsetWidth; // erzwingt einen Neustart der Animation, wenn man schnell hintereinander klickt
  element.classList.add(className);
  setTimeout(() => element.classList.remove(className), EFFECT_DURATION);
}

// Verbesserte Items leuchten stärker (je höher die Stufe, desto mehr) und zeigen ihre Stufe als "+3".
export function applyUpgradeGlow(element, item) {
  if (item.upgradeLevel <= 0) {
    return;
  }
  element.classList.add('upgraded');
  element.style.setProperty('--upgrade-glow', String(item.upgradeLevel));
  const badge = document.createElement('span');
  badge.className = 'upgrade-badge';
  badge.textContent = '+' + item.upgradeLevel;
  element.appendChild(badge);
}
