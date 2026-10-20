// ============================================================
// MAIN – der Startpunkt
// Lädt den Spielstand (oder startet neu), baut die Oberfläche auf
// und startet die Bild-Schleife (für Animationen wie die Kampfszene im Labor).
// Das Spiel selbst ist rundenbasiert: Es geht erst weiter, wenn man "Tag beenden" drückt.
// ============================================================

import { Game } from './core/Game.js';
import { SaveManager } from './core/SaveManager.js';
import { TopBar } from './ui/TopBar.js';
import { NavBar } from './ui/NavBar.js';
import { LootBoxScreen } from './ui/LootBoxScreen.js';
import { HeroScreen } from './ui/HeroScreen.js';
import { TavernScreen } from './ui/TavernScreen.js';
import { CombatLabScreen } from './ui/CombatLabScreen.js';
import { DungeonScreen, outcomeText } from './ui/DungeonScreen.js';
import { getDungeon } from './data/dungeons.js';
import { DebugPanel } from './ui/DebugPanel.js';
import { InventoryOverlay } from './ui/InventoryOverlay.js';
import { LevelUpBanner } from './ui/LevelUpBanner.js';
import { Sound } from './ui/Sound.js';
import { showToast } from './ui/Toast.js';

// Alle 5 Sekunden automatisch speichern
const AUTOSAVE_SECONDS = 5;

// Die Reiter des Spiels
const TABS = [
  { id: 'treasury', name: 'Schatzkammer' },
  { id: 'heroes', name: 'Helden' },
  { id: 'tavern', name: 'Taverne' },
  { id: 'dungeons', name: 'Dungeons' },
  { id: 'lab', name: 'Kampf-Labor' },
];

// ---------- Spielstand laden ----------

const saveManager = new SaveManager(getBrowserStorage());
const savedData = saveManager.load();
let game;
if (savedData) {
  game = Game.fromSaveData(savedData);
} else {
  game = new Game();
}

// ---------- Oberfläche aufbauen ----------

let isResetting = false;

new TopBar(document.getElementById('top-bar'), game, () => {
  isResetting = true;
  saveManager.deleteSave();
  location.reload();
});

// Jeder Bildschirm bekommt einen eigenen Bereich. Sichtbar ist immer nur einer.
const screenArea = document.getElementById('screen');
const screenElements = {};
for (const tab of TABS) {
  const element = document.createElement('div');
  element.hidden = true;
  screenArea.appendChild(element);
  screenElements[tab.id] = element;
}

const navBar = new NavBar(document.getElementById('nav-bar'), TABS, showScreen);

// Das Inventar ist ein Vollbild-Fenster, das von überall geöffnet werden kann.
// Das Abzeichen am Knopf zeigt, wie viele frische Items noch nicht angeschaut wurden.
const inventory = new InventoryOverlay(game, (newItemCount) => {
  navBar.setBadge('inventory', newItemCount > 0 ? String(newItemCount) : '');
});
navBar.addExtraButton('inventory', 'Inventar', () => inventory.toggle());

new LootBoxScreen(screenElements.treasury, game, inventory);
new HeroScreen(screenElements.heroes, game, () => showScreen('tavern'));
new TavernScreen(screenElements.tavern, game);
const combatLabScreen = new CombatLabScreen(screenElements.lab, game);
new DungeonScreen(screenElements.dungeons, game);
new DebugPanel(game);

let currentScreen = null;
let tavernHasNews = false;
let dungeonHasNews = false;

function showScreen(screenId) {
  currentScreen = screenId;
  for (const id in screenElements) {
    screenElements[id].hidden = id !== screenId;
  }
  navBar.setActive(screenId);
  if (screenId === 'tavern') {
    tavernHasNews = false;
  }
  if (screenId === 'dungeons') {
    dungeonHasNews = false;
  }
  updateBadges();
}

// Abzeichen an den Reitern: Kisten, Helden mit Upgrade, neue Bewerber
function updateBadges() {
  const guild = game.guild;
  navBar.setBadge('treasury', guild.boxes.length > 0 ? String(guild.boxes.length) : '');

  let heroesWithUpgrade = 0;
  for (const hero of guild.heroes) {
    const hasUpgrade = guild.inventory.some((item) => hero.canEquip(item) && hero.getUpgradeValue(item) > 0);
    if (hasUpgrade) {
      heroesWithUpgrade++;
    }
  }
  navBar.setBadge('heroes', heroesWithUpgrade > 0 ? '▲' + heroesWithUpgrade : '');
  navBar.setBadge('tavern', tavernHasNews ? '!' : '');
  const planned = guild.expeditions.length;
  navBar.setBadge('dungeons', dungeonHasNews ? '!' : (planned > 0 ? String(planned) : ''));
}

game.on('changed', updateBadges);

game.on('candidatesRefreshed', () => {
  if (currentScreen !== 'tavern') {
    tavernHasNews = true;
    updateBadges();
  }
});

game.on('expeditionFinished', (report) => {
  const dungeon = getDungeon(report.dungeonId);
  if (report.outcome === 'success') {
    Sound.itemReveal(report.firstClear ? 4 : 3);
    showToast(dungeon.name + ': Erfolg! Die Beute wartet in der Schatzkammer.', '#1eff00');
  } else {
    Sound.fall();
    showToast(dungeon.name + ': ' + outcomeText(report.outcome), '#ff6b6b');
  }
  if (currentScreen !== 'dungeons') {
    dungeonHasNews = true;
    updateBadges();
  }
});

// Level-Up: großes Banner mit Fanfare
const levelUpBanner = new LevelUpBanner();
game.on('heroLevelUp', (data) => {
  levelUpBanner.show(data.hero, data.newLevel);
});

game.on('heroHealed', (hero) => {
  showToast(hero.name + ' ist wieder fit!', '#1eff00');
});

// Ein neuer Tag beginnt
game.on('dayEnded', (data) => {
  if (data.reports.length === 0) {
    Sound.click();
    showToast('Ein ruhiger Tag. Tag ' + game.day + ' beginnt.', '#ffd23f');
  }
  saveManager.save(game);
});

showScreen('treasury');

// ---------- Bild-Schleife ----------
// Läuft etwa 60-mal pro Sekunde. Sie treibt nur Animationen an (Kampfszene im Labor)
// und speichert regelmäßig. Spielzeit vergeht dabei keine.

let lastFrameTime = performance.now();
let secondsSinceSave = 0;

function frameLoop(now) {
  // Vergangene echte Zeit seit dem letzten Bild (höchstens 1 Sekunde,
  // falls der Browser-Tab zwischendurch im Hintergrund war)
  const realSeconds = Math.min((now - lastFrameTime) / 1000, 1);
  lastFrameTime = now;

  combatLabScreen.update(realSeconds);

  secondsSinceSave += realSeconds;
  if (secondsSinceSave >= AUTOSAVE_SECONDS) {
    secondsSinceSave = 0;
    saveManager.save(game);
  }

  requestAnimationFrame(frameLoop);
}
requestAnimationFrame(frameLoop);

// Beim Schließen oder Wechseln des Tabs speichern
window.addEventListener('beforeunload', () => {
  if (!isResetting) {
    saveManager.save(game);
  }
});

// ---------- Hilfsfunktionen ----------

// localStorage kann in manchen Browsern (z.B. privates Fenster) blockiert sein.
// Dann benutzen wir einen Ersatz, der nur im Speicher lebt.
function getBrowserStorage() {
  try {
    localStorage.setItem('gildenmanager-test', '1');
    localStorage.removeItem('gildenmanager-test');
    return localStorage;
  } catch (error) {
    const memory = {};
    return {
      getItem: (key) => (key in memory ? memory[key] : null),
      setItem: (key, value) => { memory[key] = value; },
      removeItem: (key) => { delete memory[key]; },
    };
  }
}
