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
      // Vornamen, die es schon gibt (Helden der Gilde und die anderen Bewerber), werden nicht noch einmal vergeben
      const takenNames = guild.heroes.concat(guild.candidates).map((hero) => getFirstName(hero.name));
      guild.candidates.push(this.createCandidate(guild.createHeroId(), null, takenNames));
    }
    return guild.candidates;
  }

  // forcedRarityId = optional eine feste Seltenheit (für das Test-Menü)
  // takenNames     = Vornamen, die nicht noch einmal vorkommen sollen
  createCandidate(heroId, forcedRarityId = null, takenNames = []) {
    const rarityId = forcedRarityId || this.rollRarity();
    const heroClass = this.random.pick(HERO_CLASSES);
    return this.createHero(heroId, heroClass.id, rarityId, takenNames);
  }

  // Ein Held mit fester Klasse und Seltenheit; Eigenschaften, Name und Aussehen werden gewürfelt
  // (für Bewerber und für die Starttruppe)
  // takenNames = Vornamen, die schon vergeben sind (sind alle vergeben, darf sich einer wiederholen)
  createHero(heroId, classId, rarityId, takenNames = []) {
    const traitIds = this.rollTraits(HERO_RARITIES[rarityId].traitCount);
    const freeNames = FIRST_NAMES.filter((firstName) => !takenNames.includes(firstName));
    const name = this.random.pick(freeNames.length > 0 ? freeNames : FIRST_NAMES) + ' ' + this.random.pick(LAST_NAMES);
    const looks = {
      skin: this.random.pick(SKIN_TONES),
      hair: this.random.pick(HAIR_COLORS),
    };
    return new Hero(heroId, name, classId, rarityId, traitIds, looks);
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

// Der Vorname eines Helden ("Rurik Kupferkessel" → "Rurik")
function getFirstName(fullName) {
  return fullName.split(' ')[0];
}
