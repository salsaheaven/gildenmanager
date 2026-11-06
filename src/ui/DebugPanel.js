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
import { DUNGEONS } from '../data/dungeons.js';
import { getKnowledgeTotal } from '../systems/DungeonKnowledge.js';
import { Sound } from './Sound.js';
import { advanceConstruction } from '../systems/BuildingSystem.js';
import { isRaidDay } from '../systems/RaidRules.js';
import { createEndEvaluation } from '../systems/EndEvaluation.js';
import { ITEM_TEMPLATES } from '../data/items.js';
import { getSuitableClasses } from '../data/heroClasses.js';

// Klassen für "Raid-Test": genug Tanks und Heiler, damit Auto-Raid eine gültige Aufstellung findet
const RAID_TEST_CLASSES = ['paladin', 'druid', 'priest', 'monk', 'mage', 'hunter', 'warlock', 'samurai', 'barbarian', 'bard',
  'shaman', 'chronomancer', 'rogue', 'runeweaver', 'warrior'];

export class DebugPanel {
  // onOpenLab = öffnet das Kampf-Labor (ein Entwickler-Werkzeug, das nur über dieses Menü erreichbar ist)
  constructor(game, onOpenLab) {
    this.game = game;

    this.root = document.createElement('div');
    this.root.className = 'panel debug-panel';
    this.root.hidden = true;
    this.root.innerHTML = '<h2>Test-Menü (F2)</h2><div class="debug-buttons"></div>';
    document.body.appendChild(this.root);

    this.addButton('Kampf-Labor öffnen', () => {
      this.root.hidden = true;
      onOpenLab();
    });
    // Tutorial überspringen: alle Teile des Spiels sofort frei
    this.addButton('Alles freischalten', () => {
      game.unlockEverything();
    });
    // Zum Ausprobieren des Dungeonführers: alle Bosse aller Dungeons aufgedeckt
    this.addButton('Alle Dungeons erkunden', () => {
      for (const dungeon of DUNGEONS) {
        game.guild.dungeonKnowledge[dungeon.id] = getKnowledgeTotal(dungeon.id);
      }
    });
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
    // Zum Ausprobieren von Schmieden und Brauen
    this.addButton('+50 Rohstoffe, +50 Kräuter', () => {
      game.guild.addMaterials({ raw: 50, herbs: 50 });
    });
    // Zum Ausprobieren der Gildenhalle: die laufende Baustelle sofort fertig (wie nach den restlichen Bautagen)
    this.addButton('Baustelle sofort fertig', () => {
      const construction = game.guild.hall.construction;
      if (construction !== null) {
        construction.daysLeft = 1;
        advanceConstruction(game.guild.hall);
        Sound.buildingDone();
      }
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
    // Zum Ausprobieren des Raids: die Gilde auf 20 Helden auffüllen (gemischte Klassen), alle auf Level 30,
    // leere Plätze bekommen ein grünes Item der Stufe 30
    this.addButton('Raid-Test: 20 Helden auf Level 30', () => {
      let index = 0;
      while (game.guild.heroes.length < 20) {
        const hero = game.recruitmentSystem.createCandidate(game.guild.createHeroId(), 'uncommon');
        hero.classId = RAID_TEST_CLASSES[index % RAID_TEST_CLASSES.length];
        game.guild.heroes.push(hero);
        index++;
      }
      for (const hero of game.guild.heroes) {
        hero.level = SCALING.maxLevel;
        for (const template of ITEM_TEMPLATES) {
          const suitable = getSuitableClasses(template).some((heroClass) => heroClass.id === hero.classId);
          const slot = template.slot;
          if (suitable && !hero.equipment[slot]) {
            hero.equip(game.lootSystem.createItem('uncommon', game.guild.createItemId(), SCALING.maxLevel, template));
          }
        }
      }
      game.updateUnlocks();
    });
    // Zum Ausprobieren der Raid-Beute: je eine Raid-Kiste pro Boss, eine Set-Kiste (Platte) und Aschenessenz
    this.addButton('Raid-Beute-Test: Raid-Kisten + Set-Kiste', () => {
      for (const chestId of ['raidChestColossus', 'raidChestMorgul', 'raidChestPyra', 'raidChestAshKing']) {
        game.guild.addBox(chestId, SCALING.maxLevel);
      }
      game.guild.addBox('chestFerron', SCALING.maxLevel);
      game.guild.addMaterials({ ashEssence: 10, dust: 100 });
      game.guild.hall.levels.forge = 3; // Set-Umschmieden braucht Schmiede Stufe 3
    });
    // Zum Ausprobieren der Endauswertung (trägt den Lauf auch in die Bestenliste ein)
    this.addButton('Endauswertung testen', () => {
      game.emit('gameWon', createEndEvaluation(game.guild, game.day));
    });
    // Springt ohne Tagesende zum nächsten Raid-Tag (Helden heilen dabei nicht, Sold fällt keiner an)
    this.addButton('Zum nächsten Raid-Tag springen', () => {
      game.day++;
      while (!isRaidDay(game.day)) {
        game.day++;
      }
      game.planStandingGroups();
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
