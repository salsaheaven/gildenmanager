// Tests für Helden: Werte, Ausrüstung, Rekrutierung, Anheuern, Speichern.

import { describe, it, expect } from 'vitest';
import { Random } from '../src/core/Random.js';
import { Game } from '../src/core/Game.js';
import { Hero } from '../src/entities/Hero.js';
import { Item } from '../src/entities/Item.js';
import { Guild } from '../src/entities/Guild.js';
import { RecruitmentSystem } from '../src/systems/RecruitmentSystem.js';
import { HERO_CLASSES } from '../src/data/heroClasses.js';
import { HERO_RARITIES } from '../src/data/heroRarities.js';
import { ABILITIES } from '../src/data/abilities.js';
import { TRAITS } from '../src/data/traits.js';
import { SPRITES } from '../src/data/sprites.js';
import { STAT_NAMES, getItemTemplate } from '../src/data/items.js';
import { BALANCING } from '../src/data/balancing.js';

const LOOKS = { skin: '#f1c39b', hair: '#6b3f17' };

function makeHero(classId, rarityId = 'uncommon', traitIds = []) {
  return new Hero(1, 'Test Held', classId, rarityId, traitIds, LOOKS);
}

function makeItem(id, templateId, stats) {
  return new Item(id, templateId, 'rare', 'Test-Item', stats);
}

describe('Helden-Daten', () => {
  for (const heroClass of HERO_CLASSES) {
    it(`${heroClass.name}: Bild, Skills, Waffen und Werte sind gültig`, () => {
      expect(SPRITES[heroClass.sprite]).toBeDefined();
      expect(heroClass.abilities.length).toBe(3);
      for (const abilityId of heroClass.abilities) {
        expect(ABILITIES[abilityId], abilityId).toBeDefined();
      }
      for (const templateId of heroClass.weapons) {
        expect(() => getItemTemplate(templateId)).not.toThrow();
      }
      for (const statName in heroClass.baseStats) {
        expect(STAT_NAMES[statName]).toBeDefined();
        expect(heroClass.growth[statName]).toBeDefined();
      }
    });
  }

  it('Rekrutierungs-Chancen ergeben zusammen 100 %', () => {
    let sum = 0;
    for (const rarityId in HERO_RARITIES) {
      sum += HERO_RARITIES[rarityId].recruitChance;
    }
    expect(sum).toBe(100);
  });

  it('Eigenschaften benutzen nur bekannte Werte', () => {
    for (const trait of TRAITS) {
      for (const statName in trait.statBonus) {
        expect(STAT_NAMES[statName], trait.name).toBeDefined();
      }
    }
  });
});

describe('Hero', () => {
  it('seltenere Helden haben höhere Grundwerte', () => {
    const green = makeHero('warrior', 'uncommon');
    const orange = makeHero('warrior', 'legendary');
    expect(orange.getStats().health).toBeGreaterThan(green.getStats().health);
  });

  it('Ausrüstung erhöht die Werte', () => {
    const hero = makeHero('warrior');
    const before = hero.getStats().attack;
    hero.equip(makeItem(1, 'sword', { attack: 9 }));
    expect(hero.getStats().attack).toBe(before + 9);
    expect(hero.getGearScore()).toBe(9);
  });

  it('Eigenschaften wirken als Prozent-Bonus', () => {
    const plain = makeHero('warrior');
    const brave = makeHero('warrior', 'uncommon', ['brave']);
    expect(brave.getStats().attack).toBe(Math.round(plain.getStats().attack * 1.1));
  });

  it('Klassen dürfen nur passende Waffen tragen', () => {
    const mage = makeHero('mage');
    expect(mage.canEquip(makeItem(1, 'staff', { magic: 5 }))).toBe(true);
    expect(mage.canEquip(makeItem(2, 'sword', { attack: 5 }))).toBe(false);
    expect(mage.canEquip(makeItem(3, 'shield', { defense: 5 }))).toBe(false);
    expect(mage.canEquip(makeItem(4, 'helmet', { defense: 5 }))).toBe(true);
  });

  it('Upgrade-Wert vergleicht mit dem getragenen Item', () => {
    const hero = makeHero('warrior');
    const weak = makeItem(1, 'sword', { attack: 4 });
    const strong = makeItem(2, 'sword', { attack: 10 });
    expect(hero.getUpgradeValue(weak)).toBe(4);
    hero.equip(strong);
    expect(hero.getUpgradeValue(weak)).toBe(-6);
  });
});

describe('RecruitmentSystem', () => {
  it('Bewerber haben gültige Klasse und so viele verschiedene Eigenschaften wie ihre Seltenheit vorgibt', () => {
    const recruitment = new RecruitmentSystem(new Random(3));
    for (let i = 0; i < 200; i++) {
      const candidate = recruitment.createCandidate(i);
      expect(() => candidate.getClass()).not.toThrow();
      const expectedTraits = HERO_RARITIES[candidate.rarityId].traitCount;
      expect(candidate.traitIds.length).toBe(expectedTraits);
      expect(new Set(candidate.traitIds).size).toBe(expectedTraits);
    }
  });

  it('refreshCandidates füllt die Taverne', () => {
    const guild = new Guild();
    new RecruitmentSystem(new Random(4)).refreshCandidates(guild);
    expect(guild.candidates.length).toBe(BALANCING.candidateCount);
  });
});

describe('Game: Helden', () => {
  it('ein neues Spiel hat Bewerber in der Taverne', () => {
    const game = new Game(1);
    expect(game.guild.candidates.length).toBe(BALANCING.candidateCount);
  });

  it('Anheuern kostet Gold und verschiebt den Bewerber in die Gilde', () => {
    const game = new Game(1);
    const candidate = game.guild.candidates[0];
    game.guild.gold = 10000;

    expect(game.hireHero(candidate.id)).toBe('ok');
    expect(game.guild.heroes).toContain(candidate);
    expect(game.guild.candidates).not.toContain(candidate);
    expect(game.guild.gold).toBe(10000 - candidate.getHireCost());
  });

  it('Anheuern ohne Gold klappt nicht', () => {
    const game = new Game(1);
    game.guild.gold = 0;
    expect(game.hireHero(game.guild.candidates[0].id)).toBe('noGold');
    expect(game.guild.heroes.length).toBe(0);
  });

  it('Anlegen und Ablegen verschiebt Items zwischen Inventar und Held', () => {
    const game = new Game(1);
    const hero = makeHero('warrior');
    game.guild.heroes.push(hero);
    const sword = makeItem(50, 'sword', { attack: 5 });
    const betterSword = makeItem(51, 'sword', { attack: 8 });
    game.guild.addItem(sword);
    game.guild.addItem(betterSword);

    expect(game.equipItem(hero.id, sword.id)).toBe(true);
    expect(hero.equipment.weapon).toBe(sword);
    expect(game.guild.findItem(sword.id)).toBe(null);

    // Besseres Schwert anlegen: das alte kommt zurück ins Inventar
    game.equipItem(hero.id, betterSword.id);
    expect(hero.equipment.weapon).toBe(betterSword);
    expect(game.guild.findItem(sword.id)).toBe(sword);

    expect(game.unequipItem(hero.id, 'weapon')).toBe(true);
    expect(hero.equipment.weapon).toBe(null);
    expect(game.guild.findItem(betterSword.id)).toBe(betterSword);
  });

  it('"Bestes anlegen" wählt pro Platz das stärkste passende Item', () => {
    const game = new Game(1);
    const hero = makeHero('mage');
    game.guild.heroes.push(hero);
    game.guild.addItem(makeItem(60, 'staff', { magic: 5 }));
    game.guild.addItem(makeItem(61, 'staff', { magic: 12 }));
    game.guild.addItem(makeItem(62, 'sword', { attack: 50 })); // darf der Magier nicht

    expect(game.equipBestItems(hero.id)).toBe(1);
    expect(hero.equipment.weapon.id).toBe(61);
  });

  it('Entlassen gibt die Ausrüstung zurück ins Inventar', () => {
    const game = new Game(1);
    const hero = makeHero('warrior');
    game.guild.heroes.push(hero);
    const sword = makeItem(70, 'sword', { attack: 5 });
    hero.equip(sword);

    game.dismissHero(hero.id);
    expect(game.guild.heroes.length).toBe(0);
    expect(game.guild.findItem(sword.id)).toBe(sword);
  });

  it('nach Ablauf der Zeit kommen neue Bewerber', () => {
    const game = new Game(1);
    const oldIds = game.guild.candidates.map((c) => c.id);
    game.advanceTime(BALANCING.candidateRefreshSeconds);
    const newIds = game.guild.candidates.map((c) => c.id);
    expect(newIds).not.toEqual(oldIds);
  });

  it('Helden mit Ausrüstung werden gespeichert und geladen', () => {
    const game = new Game(5);
    game.guild.gold = 10000;
    const candidate = game.guild.candidates[0];
    game.hireHero(candidate.id);
    const items = game.openBox('silver');
    game.equipBestItems(candidate.id);

    const loaded = Game.fromSaveData(JSON.parse(JSON.stringify(game.toSaveData())));
    expect(loaded.toSaveData()).toEqual(game.toSaveData());
    expect(loaded.guild.heroes[0].getStats()).toEqual(game.guild.heroes[0].getStats());
    expect(items.length).toBeGreaterThan(0);
  });

  it('alte Spielstände ohne Helden lassen sich laden', () => {
    const data = new Game(1).toSaveData();
    delete data.guild.heroes;
    delete data.guild.candidates;
    delete data.guild.nextHeroId;
    delete data.candidateTimer;
    const loaded = Game.fromSaveData(data);
    expect(loaded.guild.heroes.length).toBe(0);
    expect(loaded.guild.candidates.length).toBe(BALANCING.candidateCount);
  });
});
