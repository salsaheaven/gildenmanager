// ============================================================
// DEBUGPANEL – Test-Menü (Taste F2)
// Zum schnellen Ausprobieren: Gold, Kisten, Bewerber und Level.
// Gehört nicht zum eigentlichen Spiel.
// ============================================================

import { LOOT_BOXES } from '../data/lootBoxes.js';
import { HERO_RARITIES } from '../data/heroRarities.js';
import { getRarity } from '../data/rarities.js';
import { SCALING } from '../data/scaling.js';
import { showToast } from './Toast.js';

export class DebugPanel {
  constructor(game) {
    this.game = game;

    this.root = document.createElement('div');
    this.root.className = 'panel debug-panel';
    this.root.hidden = true;
    this.root.innerHTML = '<h2>Test-Menü (F2)</h2><div class="debug-buttons"></div>';
    document.body.appendChild(this.root);

    this.addButton('+1000 Gold', () => {
      game.guild.addGold(1000);
    });
    this.addButton('+1 Kiste jeder Art', () => {
      for (const boxType of LOOT_BOXES) {
        game.guild.addBox(boxType.id);
      }
    });
    // Zum Ausprobieren des Sammelbuchs: genug Boss-Kisten, um eine Seite zu füllen (mit etwas Glück)
    this.addButton('+3 Boss-Kisten Bärenhöhle', () => {
      for (let i = 0; i < 3; i++) {
        game.guild.addBox('chestGrimfang', 1);
      }
    });
    // Zum Ausprobieren des Verbesserns: genug Material für einige Stufen
    this.addButton('+100 Staub, +20 Kristalle', () => {
      game.guild.addMaterials({ dust: 100, crystal: 20 });
    });
    this.addButton('Neue Bewerber (gratis)', () => {
      game.refreshCandidates();
    });
    for (const rarityId in HERO_RARITIES) {
      this.addButton(getRarity(rarityId).name + 'er Bewerber', () => {
        const candidate = game.recruitmentSystem.createCandidate(game.guild.createHeroId(), rarityId);
        game.guild.candidates.push(candidate);
      });
    }
    // Zum Ausprobieren der Eigenschaften, die nach einem Run wirken
    this.addButton('Bewerber: Gierig + Glückspilz', () => {
      const candidate = game.recruitmentSystem.createCandidate(game.guild.createHeroId(), 'epic');
      candidate.traitIds = ['greedy', 'lucky'];
      game.guild.candidates.push(candidate);
    });
    // Vorläufig, bis es Erfahrung gibt: alle Helden ein Level höher (höchstens bis zum Maximum)
    this.addButton('+1 Level (alle Helden)', () => {
      for (const hero of game.guild.heroes) {
        hero.level = Math.min(SCALING.maxLevel, hero.level + 1);
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'F2') {
        event.preventDefault();
        this.root.hidden = !this.root.hidden;
      }
    });
  }

  addButton(label, action) {
    const button = document.createElement('button');
    button.textContent = label;
    button.addEventListener('click', () => {
      action();
      this.game.emit('changed');
      showToast('Test: ' + label, '#ff6b6b');
    });
    this.root.querySelector('.debug-buttons').appendChild(button);
  }
}
