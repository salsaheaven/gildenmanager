// ============================================================
// RECRUITMENTSYSTEM – erzeugt Bewerber für die Taverne
// Würfelt Seltenheit, Klasse, Eigenschaften, Name und Aussehen aus.
// ============================================================

import { Hero } from '../entities/Hero.js';
import { HERO_CLASSES } from '../data/heroClasses.js';
import { HERO_RARITIES } from '../data/heroRarities.js';
import { TRAITS } from '../data/traits.js';
import { FIRST_NAMES, LAST_NAMES, SKIN_TONES, HAIR_COLORS } from '../data/heroNames.js';
import { BALANCING } from '../data/balancing.js';

export class RecruitmentSystem {
  constructor(random) {
    this.random = random;
  }

  // Ersetzt alle Bewerber der Gilde durch neue
  refreshCandidates(guild) {
    guild.candidates = [];
    for (let i = 0; i < BALANCING.candidateCount; i++) {
      guild.candidates.push(this.createCandidate(guild.createHeroId()));
    }
    return guild.candidates;
  }

  // forcedRarityId = optional eine feste Seltenheit (für das Test-Menü)
  createCandidate(heroId, forcedRarityId = null) {
    const rarityId = forcedRarityId || this.rollRarity();
    const heroClass = this.random.pick(HERO_CLASSES);
    const traitIds = this.rollTraits(HERO_RARITIES[rarityId].traitCount);
    const name = this.random.pick(FIRST_NAMES) + ' ' + this.random.pick(LAST_NAMES);
    const looks = {
      skin: this.random.pick(SKIN_TONES),
      hair: this.random.pick(HAIR_COLORS),
    };
    return new Hero(heroId, name, heroClass.id, rarityId, traitIds, looks);
  }

  rollRarity() {
    const chances = {};
    for (const rarityId in HERO_RARITIES) {
      chances[rarityId] = HERO_RARITIES[rarityId].recruitChance;
    }
    return this.random.pickWeighted(chances);
  }

  // Wählt verschiedene Eigenschaften aus (keine doppelt)
  rollTraits(count) {
    const available = TRAITS.map((trait) => trait.id);
    const chosen = [];
    while (chosen.length < count && available.length > 0) {
      const index = Math.floor(this.random.next() * available.length);
      chosen.push(available[index]);
      available.splice(index, 1);
    }
    return chosen;
  }
}
