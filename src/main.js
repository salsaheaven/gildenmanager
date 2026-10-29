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
import { DungeonScreen } from './ui/DungeonScreen.js';
import { DayPlanScreen } from './ui/DayPlanScreen.js';
import { DayEndOverlay } from './ui/DayEndOverlay.js';
import { DebugPanel } from './ui/DebugPanel.js';
import { InventoryOverlay } from './ui/InventoryOverlay.js';
import { CollectionOverlay } from './ui/CollectionOverlay.js';
import { LevelUpBanner } from './ui/LevelUpBanner.js';
import { Sound } from './ui/Sound.js';
import { showToast } from './ui/Toast.js';

// Alle 5 Sekunden automatisch speichern
const AUTOSAVE_SECONDS = 5;

// Die Reiter des Spiels
const TABS = [
  { id: 'plan', name: 'Tagesplan' },
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

const collection = new CollectionOverlay(game);
const lootBoxScreen = new LootBoxScreen(screenElements.treasury, game, inventory, collection);
new HeroScreen(screenElements.heroes, game, () => showScreen('tavern'), inventory);
new TavernScreen(screenElements.tavern, game);
const combatLabScreen = new CombatLabScreen(screenElements.lab, game);
new DungeonScreen(screenElements.dungeons, game);
new DayPlanScreen(screenElements.plan, game, showScreen);
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

// Abzeichen an den Reitern: Kisten, neue Bewerber, geplante Runs
// (neue Items zeigt der Inventar-Knopf selbst an)
function updateBadges() {
  const guild = game.guild;
  navBar.setBadge('treasury', guild.boxes.length > 0 ? String(guild.boxes.length) : '');
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

// Ergebnisse zeigt der Tagesabschluss. Hier nur das Abzeichen für neue Berichte.
game.on('expeditionFinished', () => {
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

// Tagesabschluss: Kämpfe als Szene, danach Zusammenfassung mit Beute
const dayEndOverlay = new DayEndOverlay(game, {
  // Erst in der Zusammenfassung kommen die Level-Up-Banner (sonst verraten sie das Ergebnis)
  onSummaryShown: () => levelUpBanner.release(),
  onOpenChest: (boxTypeId) => {
    showScreen('treasury');
    lootBoxScreen.startOpening(boxTypeId);
  },
  onClosed: () => levelUpBanner.release(),
});

game.on('dayEnding', () => levelUpBanner.hold());

game.on('dayEnded', (data) => {
  // Ohne Kämpfe und ohne Aufgaben (alle ruhen sich aus) reicht eine kurze Meldung
  const somethingHappened = data.summary.tasks.some((task) => task.taskId !== 'rest') || data.summary.news.length > 0;
  if (data.reports.length === 0 && !somethingHappened) {
    Sound.click();
    showToast('Ein ruhiger Tag. Sold: −' + data.summary.wages.paid + ' Gold. Tag ' + game.day + ' beginnt.', '#ffd23f');
    levelUpBanner.release();
  } else {
    dayEndOverlay.start(data.day, data.reports, data.summary);
  }
  saveManager.save(game);
});

showScreen('plan');

// ---------- Bild-Schleife ----------
// Läuft etwa 60-mal pro Sekunde. Sie treibt nur Animationen an (Kampfszenen im Labor und am Tagesende)
// und speichert regelmäßig. Spielzeit vergeht dabei keine.

let lastFrameTime = performance.now();
let secondsSinceSave = 0;

function frameLoop(now) {
  // Vergangene echte Zeit seit dem letzten Bild (höchstens 1 Sekunde,
  // falls der Browser-Tab zwischendurch im Hintergrund war)
  const realSeconds = Math.min((now - lastFrameTime) / 1000, 1);
  lastFrameTime = now;

  combatLabScreen.update(realSeconds);
  dayEndOverlay.update(realSeconds);

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
