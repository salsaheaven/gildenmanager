// ============================================================
// DEBUGPANEL – Test-Menü (Taste F2)
// Zum schnellen Ausprobieren: Gold, Kisten, Bewerber und Zeit.
// Gehört nicht zum eigentlichen Spiel.
// ============================================================

import { LOOT_BOXES } from '../data/lootBoxes.js';
import { HERO_RARITIES } from '../data/heroRarities.js';
import { getRarity } from '../data/rarities.js';
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
    this.addButton('Neue Bewerber (gratis)', () => {
      game.candidateTimer = 0;
      game.refreshCandidates();
    });
    for (const rarityId in HERO_RARITIES) {
      this.addButton(getRarity(rarityId).name + 'er Bewerber', () => {
        const candidate = game.recruitmentSystem.createCandidate(game.guild.createHeroId(), rarityId);
        game.guild.candidates.push(candidate);
      });
    }
    this.addButton('+10 Minuten Spielzeit', () => {
      game.clock.totalGameSeconds += 600;
      game.advanceTime(600);
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
