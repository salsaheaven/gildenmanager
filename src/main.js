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
import { NextTodoBar } from './ui/NextTodoBar.js';
import { DayPlanScreen } from './ui/DayPlanScreen.js';
import { DayEndOverlay } from './ui/DayEndOverlay.js';
import { DebugPanel } from './ui/DebugPanel.js';
import { InventoryOverlay } from './ui/InventoryOverlay.js';
import { CollectionOverlay } from './ui/CollectionOverlay.js';
import { LevelUpBanner } from './ui/LevelUpBanner.js';
import { FoundingScreen } from './ui/FoundingScreen.js';
import { RaidScreen } from './ui/RaidScreen.js';
import { EndEvaluationOverlay } from './ui/EndEvaluationOverlay.js';
import { Sound } from './ui/Sound.js';
import { showToast, holdToasts, releaseToasts } from './ui/Toast.js';
import { t, getLanguage } from './core/Language.js';
import { applyDataLanguage } from './core/DataLanguage.js';
import { loadLanguage, changeLanguage } from './ui/LanguageSetting.js';

// Zuerst die Sprache (alle Texte danach kommen schon in der gewählten Sprache)
loadLanguage();
applyDataLanguage(getLanguage()); // Namen und Texte aus src/data (Klassen, Bosse, Items …) in der gewählten Sprache
document.title = t('page.title');
import { UNLOCKS, getUnlock } from './data/unlocks.js';

// Alle 5 Sekunden automatisch speichern
const AUTOSAVE_SECONDS = 5;

// Die 5 Abschnitte des Spiels, jeder mit seinen Bildschirmen (Unterreitern).
// Inventar und Sammelbuch sind Fenster und hängen als Extra-Knöpfe am Abschnitt "Beute" (siehe unten).
const SECTIONS = [
  { id: 'today', name: t('nav.today'), screens: [{ id: 'plan', name: t('nav.plan') }] },
  { id: 'heroesSection', name: t('nav.heroesSection'), screens: [{ id: 'heroes', name: t('nav.heroes') }, { id: 'tavern', name: t('nav.tavern') }] },
  { id: 'dungeonsSection', name: t('nav.dungeonsSection'), screens: [{ id: 'dungeons', name: t('nav.dungeons') }, { id: 'raid', name: t('nav.raid') }] },
  { id: 'loot', name: t('nav.loot'), screens: [{ id: 'treasury', name: t('nav.treasury') }] },
  { id: 'guildSection', name: t('nav.guildSection'), screens: [{ id: 'hall', name: t('nav.hall') }, { id: 'shop', name: t('nav.shop') }] },
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

// Sprache wechseln: Spielstand sichern, Sprache merken, Seite neu laden
function switchLanguage(language) {
  changeLanguage(language, () => {
    if (game.guild.founded) {
      saveManager.save(game);
    }
  });
}

new TopBar(document.getElementById('top-bar'), game, () => {
  isResetting = true;
  saveManager.deleteSave();
  location.reload();
}, (screenId) => showScreen(screenId), switchLanguage);

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
// "Weiter" zum nächsten offenen Punkt aus "Was gibt es heute zu tun?"
// Zu einem Eintrag aus "Was gibt es heute zu tun?" springen (bei einem neuen Dungeon gleich dessen Karte öffnen,
// bei einem freien Talent gleich den Helden)
function goToTodo(screenId, todo) {
  showScreen(screenId);
  if (todo && todo.dungeonId) {
    dungeonScreen.openDungeon(todo.dungeonId);
  }
  // Freies Talent: gleich den Helden öffnen (der Talent-Bereich klappt dann von selbst auf)
  if (todo && todo.id === 'talents' && todo.heroId) {
    heroScreen.selectHero(todo.heroId);
    heroScreen.scrollToTalents();
  }
}
const nextTodoBar = new NextTodoBar(document.getElementById('next-todo'), game, goToTodo);

// Das Inventar ist ein Vollbild-Fenster, das von überall geöffnet werden kann.
// Das Abzeichen am Knopf zeigt, wie viele frische Items noch nicht angeschaut wurden.
const inventory = new InventoryOverlay(game, (newItemCount) => {
  navBar.setBadge('inventory', newItemCount > 0 ? String(newItemCount) : '');
});
navBar.addExtraButton('loot', 'inventory', t('nav.inventory'), () => inventory.toggle());
// Geschmiedete Items bekommen wie Beute den "neu"-Punkt im Inventar
game.on('itemForged', (item) => inventory.revealItem(item));

const collection = new CollectionOverlay(game);
navBar.addExtraButton('loot', 'collection', t('nav.collection'), () => collection.open());
const lootBoxScreen = new LootBoxScreen(screenElements.treasury, game, inventory, collection);
const heroScreen = new HeroScreen(screenElements.heroes, game, () => showScreen('tavern'), inventory);
new TavernScreen(screenElements.tavern, game);
const combatLabScreen = new CombatLabScreen(screenElements.lab, game);
const dungeonScreen = new DungeonScreen(screenElements.dungeons, game);
new RaidScreen(screenElements.raid, game);
new GuildHallScreen(screenElements.hall, game);
new ShopScreen(screenElements.shop, game);
// "Bericht von gestern" im Tagesplan: fragt den Tagesabschluss (der erst weiter unten entsteht)
const lastReport = {
  has: () => dayEndOverlay !== null && dayEndOverlay.hasLastReport(),
  show: () => dayEndOverlay.showLastReport(),
};
let dayEndOverlay = null;
new DayPlanScreen(screenElements.plan, game, goToTodo, (heroId) => {
  showScreen('heroes');
  heroScreen.selectHero(heroId);
}, lastReport);
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
  nextTodoBar.setScreen(screenId);
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
  // Neue Bewerber sind nur eine Info (leise)
  navBar.setBadge('tavern', tavernHasNews ? '!' : '', true);
  // Helden mit freier Talent-Wahl
  const freeTalents = guild.heroes.filter((hero) => hero.getFreeTalentPicks() > 0).length;
  // Helden mit neuer, passender Ausrüstung im Inventar
  const newGear = guild.heroes.filter((hero) => game.getSlotsWithNewGear(hero.id).length > 0).length;
  navBar.setBadge('heroes', freeTalents > 0 ? '★' : (newGear > 0 ? '▲' : ''));
  const planned = guild.expeditions.length;
  // Neue Berichte und eingeplante Gruppen sind nur eine Info (leise)
  navBar.setBadge('dungeons', dungeonHasNews ? '!' : (planned > 0 ? String(planned) : ''), true);
  // Gildenhalle: Hammer, solange gebaut wird; "!", wenn der Unterhalt fehlt
  const hall = guild.hall;
  // Fehlender Unterhalt braucht eine Entscheidung (rot), eine laufende Baustelle ist nur Info (leise)
  navBar.setBadge('hall', !hall.upkeepPaid ? '!' : (hall.construction !== null ? '⚒' : ''), hall.upkeepPaid);
  // Raid: "!" wenn heute Raid wäre, die Aufstellung aber nicht reicht; leise "⚔", wenn der Raid heute loszieht
  const raidPlan = guild.raidPlan;
  navBar.setBadge('raid', raidPlan.notReadyToday ? '!' : (raidPlan.activeToday ? '⚔' : ''), !raidPlan.notReadyToday);
}

game.on('changed', updateBadges);

// ---------- Schrittweises Freischalten (Tutorial, siehe data/unlocks.js) ----------

// Welcher Bildschirm bzw. Knopf gehört zu welcher Freischaltung?
const SCREENS_BY_UNLOCK = { tavern: 'tavern', shop: 'shop', guildHall: 'hall', collection: 'collection', raid: 'raid' };

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
  showToast(t('main.unlocked', { name: getUnlock(unlockId).name }), '#1eff00');
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
  showToast(t('main.healed', { name: hero.name }), '#1eff00');
});

// Tagesabschluss: Kämpfe als Szene, danach Zusammenfassung mit Beute
// Endauswertung nach dem ersten Sieg über den Endboss: erst nach dem Tagesabschluss zeigen
let pendingEndEvaluation = null;
let dayIsEnding = false; // während des Tagesendes wartet die Endauswertung auf den Tagesabschluss
function showPendingEndEvaluation() {
  if (pendingEndEvaluation) {
    new EndEvaluationOverlay(pendingEndEvaluation);
    pendingEndEvaluation = null;
  }
}
game.on('gameWon', (evaluation) => {
  pendingEndEvaluation = evaluation;
  // Ohne laufenden Tagesabschluss (z.B. über das Test-Menü) sofort
  if (!dayEndOverlay.isOpen() && !dayIsEnding) {
    showPendingEndEvaluation();
  }
});

dayEndOverlay = new DayEndOverlay(game, {
  // Erst in der Zusammenfassung kommen die Level-Up-Banner (sonst verraten sie das Ergebnis)
  onSummaryShown: () => {
    levelUpBanner.release();
    releaseToasts();
  },
  onOpenChest: (boxTypeId) => {
    showScreen('treasury');
    lootBoxScreen.startOpening(boxTypeId);
    showPendingEndEvaluation();
  },
  onClosed: () => {
    levelUpBanner.release();
    releaseToasts();
    showPendingEndEvaluation();
  },
});

game.on('dayEnding', () => {
  levelUpBanner.hold();
  holdToasts(); // Meldungen (Freischaltungen, Bewerber …) erst nach den Kämpfen

  dayIsEnding = true;
});

game.on('dayEnded', (data) => {
  dayIsEnding = false;
  // Ohne Kämpfe und ohne Aufgaben (alle ruhen sich aus) reicht eine kurze Meldung
  const summary = data.summary;
  const somethingHappened = summary.tasks.some((task) => task.taskId !== 'rest') || summary.news.length > 0 ||
    summary.finishedBuilding !== null || summary.wages.paid < summary.wages.total || summary.upkeep.paid < summary.upkeep.total;
  if (data.reports.length === 0 && !data.raidReport && !somethingHappened) {
    releaseToasts();
    Sound.click();
    showToast(t('main.quietDay', { wages: data.summary.wages.paid, day: game.day }), '#ffd23f');
    levelUpBanner.release();
  } else {
    dayEndOverlay.start(data.day, data.reports, data.summary, data.raidReport);
  }
  saveManager.save(game);
});

showScreen('plan');

// Neuer Spielstand: zuerst die Gilde gründen (Name und Starttruppe). Danach geht es im Tagesplan los.
if (!game.guild.founded) {
  new FoundingScreen(game, () => {
    saveManager.save(game);
    showScreen('plan');
  }, switchLanguage);
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

// Nach jeder Aktion kurz danach speichern (gesammelt, damit nicht bei jedem Klick mehrfach gespeichert wird)
let saveTimer = null;
game.on('changed', () => {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    if (!isResetting) {
      saveManager.save(game);
    }
  }, 300);
});

// Beim Schließen oder Wechseln des Tabs speichern.
// Auf dem Handy kommt "beforeunload" oft nicht an, deshalb auch "pagehide" und "Seite unsichtbar".
function saveNow() {
  if (!isResetting) {
    saveManager.save(game);
  }
}
window.addEventListener('beforeunload', saveNow);
window.addEventListener('pagehide', saveNow);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    saveNow();
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
