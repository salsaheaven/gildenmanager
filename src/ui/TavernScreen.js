// ============================================================
// TAVERNSCREEN – die Taverne: hier warten Bewerber darauf, angeheuert zu werden.
// Neue Bewerber kommen jeden Morgen (nach "Tag beenden") oder sofort gegen Gold.
// Seltene Bewerber werden mit Sound und Leuchten angekündigt.
// ============================================================

import { BALANCING } from '../data/balancing.js';
import { ROLE_NAMES, ROW_NAMES } from '../data/heroClasses.js';
import { ABILITIES } from '../data/abilities.js';
import { createHeroCanvas, createSpriteCanvas } from './PixelArt.js';
import { formatStats } from './format.js';
import { Sound } from './Sound.js';
import { showToast } from './Toast.js';
import { createTraitChip } from './TraitChip.js';

export class TavernScreen {
  constructor(rootElement, game) {
    this.root = rootElement;
    this.game = game;

    this.root.innerHTML = `
      <div class="tavern-screen">
        <section class="panel tavern-header">
          <h2>Taverne „Zum durstigen Greif“</h2>
          <div class="tavern-info">
            <span class="hero-count"></span>
            <div class="tavern-timer">Neue Bewerber kommen jeden Morgen.</div>
            <button class="reroll-button"></button>
          </div>
        </section>
        <section class="candidate-list"></section>
      </div>
    `;

    const rerollButton = this.root.querySelector('.reroll-button');
    rerollButton.prepend(createSpriteCanvas('coin', 2));
    rerollButton.append(' Sofort neue Bewerber (' + BALANCING.candidateRerollCost + ')');
    rerollButton.addEventListener('click', () => {
      if (this.game.rerollCandidates()) {
        Sound.coin();
      }
    });

    game.on('changed', () => this.render(false));
    game.on('candidatesRefreshed', (candidates) => this.announce(candidates));
    this.render(false);
  }

  // Neue Bewerber: Karten springen nacheinander herein, seltene mit Fanfare
  announce(candidates) {
    this.render(true);
    let bestCandidate = candidates[0];
    for (const candidate of candidates) {
      if (candidate.getRarityRank() > bestCandidate.getRarityRank()) {
        bestCandidate = candidate;
      }
    }
    if (bestCandidate.getRarityRank() >= 4) {
      Sound.itemReveal(bestCandidate.getRarityRank());
      showToast(bestCandidate.getRarity().name + 'er Bewerber in der Taverne: ' + bestCandidate.name + '!',
        bestCandidate.getRarity().color);
    }
  }

  render(animate) {
    const guild = this.game.guild;
    this.root.querySelector('.hero-count').textContent = 'Helden: ' + guild.heroes.length + ' / ' + BALANCING.maxHeroes;
    this.root.querySelector('.reroll-button').disabled = !guild.canAfford(BALANCING.candidateRerollCost);

    const list = this.root.querySelector('.candidate-list');
    list.innerHTML = '';
    for (let i = 0; i < guild.candidates.length; i++) {
      const card = this.createCandidateCard(guild.candidates[i]);
      if (animate) {
        card.classList.add('card-enter');
        card.style.animationDelay = i * 0.15 + 's';
      }
      list.appendChild(card);
    }
    if (guild.candidates.length === 0) {
      list.innerHTML = '<p class="empty">Gerade ist niemand da. Bald kommen neue Bewerber!</p>';
    }
  }

  createCandidateCard(candidate) {
    const heroClass = candidate.getClass();
    const rarity = candidate.getRarity();

    const card = document.createElement('div');
    card.className = 'panel hero-card rarity-' + candidate.rarityId;
    card.style.setProperty('--rarity', rarity.color);
    card.innerHTML = `
      <div class="hero-card-portrait"></div>
      <div class="hero-card-name"></div>
      <div class="hero-card-rarity">${rarity.name}</div>
      <div class="hero-card-class">${heroClass.name} · ${ROLE_NAMES[heroClass.role]} · ${ROW_NAMES[heroClass.row]}</div>
      <div class="trait-list"></div>
      <div class="hero-card-stats"></div>
      <div class="hero-card-skills"></div>
      <button class="hire-button"></button>
    `;
    card.querySelector('.hero-card-portrait').appendChild(createHeroCanvas(candidate, 7));
    card.querySelector('.hero-card-name').textContent = candidate.name;
    card.querySelector('.hero-card-stats').textContent = formatStats(candidate.getStats());
    card.querySelector('.hero-card-skills').textContent =
      heroClass.abilities.map((abilityId) => ABILITIES[abilityId].name).join(' · ');

    const traitList = card.querySelector('.trait-list');
    for (const trait of candidate.getTraits()) {
      traitList.appendChild(createTraitChip(trait));
    }

    const hireButton = card.querySelector('.hire-button');
    hireButton.prepend(createSpriteCanvas('coin', 2));
    hireButton.append(' Anheuern (' + candidate.getHireCost() + ')');
    hireButton.disabled = !this.game.guild.canAfford(candidate.getHireCost()) || !this.game.guild.hasRoomForHero();
    hireButton.addEventListener('click', () => {
      const result = this.game.hireHero(candidate.id);
      if (result === 'ok') {
        Sound.itemReveal(candidate.getRarityRank());
        showToast(candidate.name + ' tritt der Gilde bei!', rarity.color);
      }
    });
    return card;
  }
}

