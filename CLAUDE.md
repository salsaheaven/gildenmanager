# Gildenmanager

Browser-Management-Spiel (Arbeitstitel): Man managt eine MMORPG-Gilde, kämpft aber nicht selbst.
Man rekrutiert, levelt, skillt und rüstet Helden aus, schickt sie in Dungeons, baut die Gildenhalle aus und craftet.
Pixel-Art. Rundenbasiert: 1 Runde = 1 Tag, jeder Held hat eine Aufgabe pro Tag. Kämpfe werden simuliert, als Szene abgespielt und als Bericht angezeigt.
Es gibt keine Spieluhr: Alles, was Zeit braucht, passiert in `Game.endDay()` (Knopf „Tag beenden“). Die Bild-Schleife in `main.js` treibt nur Animationen an.

**Oberstes Ziel: ein extrem motivierender Kern-Loop.** Dazu gehören Lootboxen, die Seltenheiten Grau → Weiß → Grün → Blau → Lila → Orange,
Klassen-Sets zum Sammeln, ein Pity-System und ständiges Feedback durch Sounds, Animationen und Fortschrittsbalken.
Bei jedem Feature fragen: Fühlt es sich gut an?

Das Spielkonzept (Entscheidungen, Loops, offene Fragen) steht in `KONZEPT.md`. Technik und Meilensteine beschreibt `PLAN.md`.
Neue Konzept-Entscheidungen immer in `KONZEPT.md` festhalten.

## Code-Stil
Das Projekt ist ein Vibecoding-Übungsprojekt. Der Code soll auch für Programmier-Einsteiger lesbar bleiben:
- **Eine Datei = ein Konzept** (wie Java-Klassen): `Hero.js`, `Item.js`, `LootBox.js` …
- **Deutsche Kommentare**, die jede Datei und jede Methode einfach erklären
- **Keine cleveren Tricks.** Lieber ausführlich und gut lesbar.
- **Inhalte und Zahlen stehen immer in `src/data/`**, nie in der Logik. So lassen sich Namen, Werte und Chancen ändern, ohne die Logik anzufassen.
- Nach jeder Änderung kurz und laienverständlich erklären, was in welcher Datei passiert ist

## Design-Grundsatz
**Jede Wahlmöglichkeit im Spiel braucht Vor- und Nachteile** (Anweisungen, Klassen, Eigenschaften, Talente …).
Eine Option, die immer die beste ist, ist keine Wahl. Neue Optionen deshalb per Simulation prüfen: Ist eine Option gegen alle Bosse besser als die anderen, braucht sie einen Nachteil. Details stehen in `KONZEPT.md`.

## Arbeitsweise
- **Klein und spielbar:** Große Features in Schritte zerlegen, die jeweils einzeln spielbar sind. Nach jedem Schritt pushen. GitHub Pages veröffentlicht dann automatisch, und man kann sofort online testen.
- **Modular, auch um Token zu sparen:** Kleine Dateien mit einer klaren Aufgabe. Für eine Änderung nur die betroffenen Dateien lesen, nicht das ganze Projekt. Die Übersicht unten zeigt, wo was liegt.
- Testhilfen wie ein Test-Menü oder ein Kampf-Labor sind ausdrücklich erwünscht, damit spätere Inhalte schnell prüfbar sind

## Aufbau
```
src/core/      Grundgerüst: Game (hält alles zusammen, alle Aktionen, Tageszähler, endDay), Random, SaveManager
src/entities/  Spielobjekte: Guild, Hero, Item, LootBox, Expedition (für heute geplanter Dungeon-Run, wird bei endDay ausgekämpft)
src/systems/   Regeln/Abläufe: LootSystem, RecruitmentSystem, ExperienceSystem (EP, Aufhol-Erfahrung, Verletzungen nach einem Run)
src/systems/combat/  Kampf: CombatSimulator (Rundenablauf; simulateBattle = ein Bosskampf,
               simulateRun = ganzer Dungeon mit Trash, Bossen, Erholung und Rückzug),
               BattleTimeline (wann passiert was → Dauer eines Runs), Battle (Zustand + Zielwahl),
               Combatant (ein Kämpfer), HeroAI (welcher Skill?), EnemyAI (Boss-Mechaniken),
               AbilityEffects (was ein Skill bewirkt), ChanceEstimator (200 Kämpfe → Siegchance),
               TestGroup (Standard-Gruppe fürs Labor)
src/data/      Reine Inhalte: rarities, items, lootBoxes, balancing, sprites (Pixel-Art als Text),
               heroClasses, abilities (inkl. Kampfwerte), heroRarities, traits, heroNames,
               enemies (Bosse + Diener/Trash), combatRules, heroOrders (Kampf-Anweisungen pro Klasse),
               dungeons (Begegnungen, Stufe, Belohnung), retreatRules,
               scaling (Level-Obergrenze, Wachstum von Items und Gegnern pro Stufe, Rüstungs-Konstante),
               experience (EP pro Begegnung, EP-Kurve, Aufhol-Erfahrung, Dauer von Verletzungen)
src/ui/        Ein Bildschirm/Bauteil pro Datei. Bildschirme: LootBoxScreen (Schatzkammer),
               HeroScreen (+ HeroDetailPanel, EquipPanel), TavernScreen, CombatLabScreen,
               DungeonScreen (+ RunViewer = Bericht eines beendeten Runs zeigen).
               DayEndOverlay = Tagesabschluss nach „Tag beenden“: Kämpfe als Szene, danach Zusammenfassung mit Beute.
               LevelUpBanner = großes „Level Up!“ mit Fanfare (nacheinander bei mehreren Helden, während des Tagesabschlusses zurückgehalten).
               InventoryOverlay = Inventar als Vollbild-Fenster mit Kategorien (Knopf „Inventar“ in der Reiterleiste).
               CombatReport = Ergebnis, Schadensmesser und Kampfbericht (wiederverwendbar).
               BattleScene = Kampf als Szene abspielen (Zahlen, Balken, Zauberbalken); läuft über update(sekunden).
               BattleEffects = Skill-Animationen (fx-Name aus den Daten → CSS-Klasse fx-… in main.css).
               OrdersPanel = Auswahllisten für Anweisungen (Labor + Heldenbildschirm).
               Leisten: TopBar, NavBar. Helfer: PixelArt, Sound, Toast, format, TraitChip.
               DebugPanel = Test-Menü (Taste F2)
tests/         Vitest-Tests (prüfen auch, ob die Daten gültig sind)
```
- Die Logik (`core/`, `entities/`, `systems/`) kennt **keine** UI und kein `document`.
- Die UI ruft Methoden von `Game` auf und hört auf `game.on('changed')` bzw. auf weitere Events.
- Jede Klasse, die gespeichert wird, hat `toSaveData()` und `static fromSaveData()`.
- Zufall läuft immer über `Random`, nie direkt über `Math.random()`. So bleibt er testbar und wird mitgespeichert.
- Balancing des Kampfs: Im Kampf-Labor ausprobieren, oder per Node-Skript mit `estimateChances` viele Varianten durchrechnen.
  Zielwerte (ganzer Dungeon): Bärenhöhle mit nackter Level-1-Gruppe ~90 %. Für jeden weiteren Dungeon gilt:
  Gruppe auf der Stufe des Dungeons mit grüner Ausrüstung aus dem vorherigen Dungeon ~75–85 %, mit Ausrüstung der eigenen Stufe ~95 %.
- Die Oberfläche muss auch auf dem Handy funktionieren (Breite ~390 px). Handy-Regeln stehen am Ende von `main.css` (`@media (max-width: 700px)`).
- Pixel-Art steht als Text-Raster in `src/data/sprites.js`. Ein Zeichen ist ein Pixel, die Farben stehen in `PALETTE`.

## Befehle
- `npm run dev`: startet das Spiel unter http://localhost:5173
- `npm test`: führt alle Tests aus. Nach jeder Änderung ausführen.
- `npm run build`: erzeugt die fertige Version in `dist/`
