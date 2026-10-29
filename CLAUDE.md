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
Eine Option, die immer die beste ist, ist keine Wahl. Geprüft wird das per Simulation erst beim Endbalancing, nicht jetzt. Details stehen in `KONZEPT.md`.

## Arbeitsweise
- **Klein und spielbar:** Große Features in Schritte zerlegen, die jeweils einzeln spielbar sind. Nach jedem Schritt lokal committen. **Gepusht (und damit von GitHub Pages veröffentlicht) wird nur bei Meilensteinen**, z.B. wenn ein Review-Vorschlag komplett umgesetzt ist, nicht bei jeder kleinen Änderung.
- **Modular, auch um Token zu sparen:** Kleine Dateien mit einer klaren Aufgabe. Für eine Änderung nur die betroffenen Dateien lesen, nicht das ganze Projekt. Die Übersicht unten zeigt, wo was liegt.
- Testhilfen wie ein Test-Menü oder ein Kampf-Labor sind ausdrücklich erwünscht, damit spätere Inhalte schnell prüfbar sind
- **Kein Balancing, keine Progressions-Arbeit – aktuell ein reiner Testballon.** Ziel des fertigen Spiels: Roster von ~60 Helden, 10+ Dungeons,
  zwei 40-Mann-Raids (der letzte Raid ist der Endboss). Mit 10 Helden und 3 Dungeons ist Balancing sinnlos.
  Jetzt werden **Gameplay-Loops und Features** eingebaut. Die Progression muss weder Sinn ergeben noch motivieren.
  Keine Zielwert-Messungen, keine Parameter-Suchen, kein Nachtunen von Gegnern oder Chancen, auch nicht „nur kurz“.
  Erlaubt ist nur: prüfen, dass ein neues Feature nicht kaputt ist (Tests grün, kein Absturz). Zahlen einfach grob setzen und weitermachen.
- **Keine Abwärtskompatibilität während der Entwicklung:** Alte Spielstände müssen nicht weiter funktionieren. Kein Umrechnungs-Code für alte Speicherformate; stattdessen `SAVE_VERSION` in `SaveManager.js` erhöhen, dann werden alte Stände ignoriert. Beim Testen einfach „Neu“ drücken.

## Aufbau
```
src/core/      Grundgerüst: Game (hält alles zusammen, alle Aktionen, Tageszähler, endDay), Random, SaveManager
src/entities/  Spielobjekte: Guild, Hero, Item, LootBox, CollectionBook (Sammelbuch: beste gefundene Seltenheit je Boss-Item, Titel, Gold-Bonus), Expedition (für heute geplanter Dungeon-Run, wird bei endDay ausgekämpft)
src/systems/   Regeln/Abläufe: LootSystem, RecruitmentSystem, ExperienceSystem (EP, Aufhol-Erfahrung, Verletzungen nach einem Run),
               DayPlan (welcher Held hat heute welche Aufgabe), TraitEffects (Eigenschaften, die nach einem Run wirken: Gierig, Glückspilz)
src/systems/combat/  Kampf: CombatSimulator (Rundenablauf; simulateBattle = ein Bosskampf,
               simulateRun = ganzer Dungeon mit Trash, Bossen, Erholung und Rückzug),
               BattleTimeline (wann passiert was → Dauer eines Runs, mit Zeitraffer für Trash und ruhige Runden), Battle (Zustand + Zielwahl),
               Combatant (ein Kämpfer), HeroAI (welcher Skill?), EnemyAI (Boss-Mechaniken),
               AbilityEffects (was ein Skill bewirkt), OrderSettings (gewählte Anweisungen → ein Paket mit Wirkungen für den Kampf),
               CauseTracker (woher der Schaden an den Helden kommt), DefeatAnalysis („Woran es lag“: Top 3 Ursachen + Tipp), ChanceEstimator (200 Kämpfe → Siegchance; estimateRunChances = ganzer Dungeon),
               TestGroup (Testgruppe fürs Labor, Klassen frei wählbar)
src/data/      Reine Inhalte: rarities, items (Vorlagen, Rüstungsarten Platte/Leder/Stoff), lootBoxes, balancing, sprites (Pixel-Art als Text),
               heroClasses (15 Klassen inkl. Rüstungsart, nützliche Werte, Dauer-Fähigkeit `passive` und Begleiter `pet`), abilities (inkl. Kampfwerte), heroRarities, traits, heroNames,
               enemies (Bosse + Diener/Trash), combatRules, heroOrders (Kampf-Anweisungen: pro Klasse Haltung + Eigenheit, je Ausgewogen + zwei Extreme mit Vor- und Nachteil),
               dungeons (Begegnungen, Stufe, Belohnung), retreatRules,
               scaling (Level-Obergrenze, Wachstum von Items und Gegnern pro Stufe, Rüstungs-Konstante),
               experience (EP pro Begegnung, EP-Kurve, Aufhol-Erfahrung, Dauer von Verletzungen),
               heroTasks (Aufgaben pro Tag: Dungeon, Kuriert sich aus, Ruht sich aus),
               riskLevels (Risiko-Einschätzung in Worten: Grenzen, Wörter, Farben),
               damageTypes (Schadensarten mit Farbe, Obergrenze für Resistenzen),
               defeatCauses (Tipps und Hinweise für „Woran es lag“),
               collectionBook (Sammelbuch-Seiten pro Dungeon mit Titel und Gold-Bonus; die Items kommen aus `bossLoot` in lootBoxes)
src/ui/        Ein Bildschirm/Bauteil pro Datei. Bildschirme: DayPlanScreen (Tagesplan, Startseite), LootBoxScreen (Schatzkammer),
               HeroScreen (+ HeroDetailPanel, EquipPanel = Ausrüstungsliste für den angetippten Platz, nach Item-Level sortiert,
               Vergleich pro Wert, bewusst ohne „bestes Item“), TavernScreen, CombatLabScreen,
               DungeonScreen (+ RunViewer = Bericht eines beendeten Runs zeigen).
               DayEndOverlay = Tagesabschluss nach „Tag beenden“: Kämpfe als Szene, danach Zusammenfassung mit Beute.
               LevelUpBanner = großes „Level Up!“ mit Fanfare (nacheinander bei mehreren Helden, während des Tagesabschlusses zurückgehalten).
               InventoryOverlay = Inventar als Vollbild-Fenster mit Kategorien (Knopf „Inventar“ in der Reiterleiste).
               CombatReport = Ergebnis, Schadensmesser und Kampfbericht (wiederverwendbar).
               DefeatCausesView = Kasten „Woran es lag“ (Ursachen mit Balken, Hinweise, Tipp) im Tagesabschluss und im Bericht.
               BattleScene = Kampf als Szene abspielen (Zahlen, Balken, Zauberbalken, großer Skill-Name, Tempo 1x/2x/4x); läuft über update(sekunden).
               SkillTooltip = Fenster mit Skills und Abklingzeiten, wenn die Maus über einem Helden der Szene steht (Handy: antippen).
               Tempo der Szene: `pacing` (inkl. Zeitraffer `trashSpeed`, `quietRoundSpeed`), `sceneSpeeds` und `sceneAnimationRate` in `combatRules.js`.
               BattleEffects = Skill-Animationen (fx-Name aus den Daten → CSS-Klasse fx-… in main.css).
               RiskBadge = Einschätzung eines Runs in Worten („Riskant · Gefallene: oft“).
               OrdersPanel = Auswahllisten für Anweisungen mit Vorteil (grün) und Nachteil (rot) (Labor, Dungeon, Tagesplan, Heldenbildschirm).
               Leisten: TopBar, NavBar. Helfer: PixelArt, Sound, Toast, format, TraitChip.
               DebugPanel = Test-Menü (Taste F2)
tests/         Vitest-Tests (prüfen auch, ob die Daten gültig sind)
tools/         Mess-Werkzeuge für Balancing (Node-Skripte mit der echten Spiellogik, siehe tools/README.md)
```
- Die Logik (`core/`, `entities/`, `systems/`) kennt **keine** UI und kein `document`.
- Die UI ruft Methoden von `Game` auf und hört auf `game.on('changed')` bzw. auf weitere Events.
- Jede Klasse, die gespeichert wird, hat `toSaveData()` und `static fromSaveData()`.
- Zufall läuft immer über `Random`, nie direkt über `Math.random()`. So bleibt er testbar und wird mitgespeichert.
- Balancing (erst ganz am Ende, wenn Roster, Dungeons und Raids stehen): Kampf-Labor und Mess-Werkzeuge in `tools/`. Die Zielwerte stehen unter „Schwierigkeit“ in KONZEPT.md.
- Die Oberfläche muss auch auf dem Handy funktionieren (Breite ~390 px). Handy-Regeln stehen am Ende von `main.css` (`@media (max-width: 700px)`).
- Pixel-Art steht als Text-Raster in `src/data/sprites.js`. Ein Zeichen ist ein Pixel, die Farben stehen in `PALETTE`.

## Befehle
- `npm run dev`: startet das Spiel unter http://localhost:5173
- `npm test`: führt alle Tests aus. Nach jeder Änderung ausführen.
- `npm run build`: erzeugt die fertige Version in `dist/`
