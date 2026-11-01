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
import { GuildHallScreen } from './ui/GuildHallScreen.js';
import { ShopScreen } from './ui/ShopScreen.js';
import { DayPlanScreen } from './ui/DayPlanScreen.js';
import { DayEndOverlay } from './ui/DayEndOverlay.js';
import { DebugPanel } from './ui/DebugPanel.js';
import { InventoryOverlay } from './ui/InventoryOverlay.js';
import { CollectionOverlay } from './ui/CollectionOverlay.js';
import { LevelUpBanner } from './ui/LevelUpBanner.js';
import { FoundingScreen } from './ui/FoundingScreen.js';
import { Sound } from './ui/Sound.js';
import { showToast } from './ui/Toast.js';
import { UNLOCKS, getUnlock } from './data/unlocks.js';

// Alle 5 Sekunden automatisch speichern
const AUTOSAVE_SECONDS = 5;

// Die 5 Abschnitte des Spiels, jeder mit seinen Bildschirmen (Unterreitern).
// Inventar und Sammelbuch sind Fenster und hängen als Extra-Knöpfe am Abschnitt "Beute" (siehe unten).
const SECTIONS = [
  { id: 'today', name: 'Heute', screens: [{ id: 'plan', name: 'Tagesplan' }] },
  { id: 'heroesSection', name: 'Helden', screens: [{ id: 'heroes', name: 'Übersicht' }, { id: 'tavern', name: 'Taverne' }] },
  { id: 'dungeonsSection', name: 'Dungeons', screens: [{ id: 'dungeons', name: 'Dungeons' }] },
  { id: 'loot', name: 'Beute', screens: [{ id: 'treasury', name: 'Kisten' }] },
  { id: 'guildSection', name: 'Gilde', screens: [{ id: 'hall', name: 'Gildenhalle' }, { id: 'shop', name: 'Händler' }] },
];

// Bildschirme ohne Abschnitt: nur über das Test-Menü erreichbar (Entwickler-Werkzeug)
const HIDDEN_SCREENS = ['lab'];

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
const screenIds = [];
for (const section of SECTIONS) {
  for (const screen of section.screens) {
    screenIds.push(screen.id);
  }
}
for (const screenId of screenIds.concat(HIDDEN_SCREENS)) {
  const element = document.createElement('div');
  element.hidden = true;
  screenArea.appendChild(element);
  screenElements[screenId] = element;
}

const navBar = new NavBar(document.getElementById('nav-bar'), document.getElementById('sub-nav'), SECTIONS, showScreen);

// Das Inventar ist ein Vollbild-Fenster, das von überall geöffnet werden kann.
// Das Abzeichen am Knopf zeigt, wie viele frische Items noch nicht angeschaut wurden.
const inventory = new InventoryOverlay(game, (newItemCount) => {
  navBar.setBadge('inventory', newItemCount > 0 ? String(newItemCount) : '');
});
navBar.addExtraButton('loot', 'inventory', 'Inventar', () => inventory.toggle());
// Geschmiedete Items bekommen wie Beute den "neu"-Punkt im Inventar
game.on('itemForged', (item) => inventory.revealItem(item));

const collection = new CollectionOverlay(game);
navBar.addExtraButton('loot', 'collection', 'Sammelbuch', () => collection.open());
const lootBoxScreen = new LootBoxScreen(screenElements.treasury, game, inventory, collection);
const heroScreen = new HeroScreen(screenElements.heroes, game, () => showScreen('tavern'), inventory);
new TavernScreen(screenElements.tavern, game);
const combatLabScreen = new CombatLabScreen(screenElements.lab, game);
new DungeonScreen(screenElements.dungeons, game);
new GuildHallScreen(screenElements.hall, game);
new ShopScreen(screenElements.shop, game);
new DayPlanScreen(screenElements.plan, game, showScreen, (heroId) => {
  showScreen('heroes');
  heroScreen.selectHero(heroId);
});
// Das Kampf-Labor ist ein Entwickler-Werkzeug: Es öffnet sich über das Test-Menü (F2)
new DebugPanel(game, () => showScreen('lab'));

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

// Abzeichen an den Reitern: Kisten, freie Talente, neue Bewerber, geplante Runs
// (neue Items zeigt der Inventar-Knopf selbst an)
function updateBadges() {
  const guild = game.guild;
  navBar.setBadge('treasury', guild.boxes.length > 0 ? String(guild.boxes.length) : '');
  navBar.setBadge('tavern', tavernHasNews ? '!' : '');
  // Helden mit freier Talent-Wahl
  const freeTalents = guild.heroes.filter((hero) => hero.getFreeTalentPicks() > 0).length;
  // Helden mit neuer, passender Ausrüstung im Inventar
  const newGear = guild.heroes.filter((hero) => game.getSlotsWithNewGear(hero.id).length > 0).length;
  navBar.setBadge('heroes', freeTalents > 0 ? '★' : (newGear > 0 ? '▲' : ''));
  const planned = guild.expeditions.length;
  navBar.setBadge('dungeons', dungeonHasNews ? '!' : (planned > 0 ? String(planned) : ''));
  // Gildenhalle: Hammer, solange gebaut wird; "!", wenn der Unterhalt fehlt
  const hall = guild.hall;
  navBar.setBadge('hall', !hall.upkeepPaid ? '!' : (hall.construction !== null ? '⚒' : ''));
}

game.on('changed', updateBadges);

// ---------- Schrittweises Freischalten (Tutorial, siehe data/unlocks.js) ----------

// Welcher Bildschirm bzw. Knopf gehört zu welcher Freischaltung?
const SCREENS_BY_UNLOCK = { tavern: 'tavern', shop: 'shop', guildHall: 'hall', collection: 'collection' };

// Blendet aus, was noch gesperrt ist: Reiter über die NavBar, alles andere über CSS-Klassen am <body>
// (z.B. "locked-crafting" versteckt Zerlegen und Verbessern, siehe main.css)
function applyUnlocks() {
  const hidden = [];
  for (const unlock of UNLOCKS) {
    const locked = !game.isFeatureUnlocked(unlock.id);
    document.body.classList.toggle('locked-' + unlock.id, locked);
    if (locked && SCREENS_BY_UNLOCK[unlock.id]) {
      hidden.push(SCREENS_BY_UNLOCK[unlock.id]);
    }
  }
  navBar.setHidden(hidden);
}
game.on('changed', applyUnlocks);
applyUnlocks();

// Etwas Neues ist frei: kurze Fanfare und Meldung (der Hinweis steht dann in "Was gibt es heute zu tun?")
game.on('featureUnlocked', (unlockId) => {
  Sound.collectionPage();
  showToast('Neu freigeschaltet: ' + getUnlock(unlockId).name, '#1eff00');
});

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
  const summary = data.summary;
  const somethingHappened = summary.tasks.some((task) => task.taskId !== 'rest') || summary.news.length > 0 ||
    summary.finishedBuilding !== null || summary.wages.paid < summary.wages.total || summary.upkeep.paid < summary.upkeep.total;
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

// Neuer Spielstand: zuerst die Gilde gründen (Name und Starttruppe). Danach geht es im Tagesplan los.
if (!game.guild.founded) {
  new FoundingScreen(game, () => {
    saveManager.save(game);
    showScreen('plan');
  });
}

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
