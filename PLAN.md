# Gildenmanager – Projektplan

## Context
"Gildenmanager" (Arbeitstitel) ist ein Management-Spiel: Man führt eine typische MMORPG-Gilde, spielt aber nicht selbst in Dungeons. Man rekrutiert Helden, levelt, skillt und rüstet sie aus und schickt sie los. Währenddessen baut man die Gildenhalle aus, craftet und später vielleicht Diplomatie.
Festgelegt:
- **Browser-Spiel** mit **Pixel-Art**
- **Echtzeit mit Pause/Speed**, Kämpfe **simuliert + Kampfbericht**
- **Übungsprojekt fürs Vibecoding:** Der Code muss für Programmier-Einsteiger einfach lesbar und stark modular sein, mit einer Datei pro Konzept wie bei Java-Klassen.
- **Pflicht: ein extrem motivierender Kern-Loop** (Dopamin), also Lootboxen, Seltenheitsstufen, Klassen-Sets zum Sammeln.

Das Projektverzeichnis ist leer → Neustart.

## Tech-Stack (bewusst einfach gehalten)
- **Reines JavaScript mit ES-Klassen**: kein TypeScript, kein React. `class Hero { ... }` liest sich fast wie Java, und Dateien werden per `import` eingebunden.
- **Vite** nur als Dev-Server (`npm run dev` → Browser lädt automatisch neu)
- **HTML + CSS** für die Oberfläche. Pixel-Look über Pixel-Font, `image-rendering: pixelated` und Sprite-Bilder. Effekte wie Kiste öffnen und Glanz macht CSS-Animation.
- **Pixel-Grafiken:** zuerst freie CC0-Asset-Packs (z.B. von itch.io/OpenGameArt) für Helden, Items und Icons, später eigene oder angepasste Grafiken
- **Vitest** für Tests der Spiellogik. Die Tests schreibt Claude.
- Speichern in **localStorage**
- `git init` gleich zu Beginn, damit jeder Schritt rückgängig gemacht werden kann

## Modulare Struktur (eine Datei = ein Konzept)
```
src/
  main.js                 # Startpunkt: erstellt das Spiel, startet die Uhr
  core/
    Game.js               # hält alles zusammen (Gilde, Uhr, Speichern)
    GameClock.js          # Echtzeit, Pause, 1x/2x/4x
    Random.js             # Zufall (auch für Loot-Chancen)
    SaveManager.js        # Speichern/Laden
  entities/               # die "Klassen" im Java-Sinn
    Hero.js               # Held: Name, Klasse, Level, XP, Werte, Ausrüstung
    Guild.js              # Gilde: Gold, Helden-Liste, Inventar, Gebäude
    Item.js               # Gegenstand: Slot, Seltenheit, Werte, Set-Zugehörigkeit
    LootBox.js            # Kiste: Seltenheit, open() → Items
    Expedition.js         # laufender Dungeon-Run mit Restzeit
  systems/                # Regeln / Abläufe
    CombatSimulator.js    # berechnet Kampf → Ergebnis + Bericht
    LootSystem.js         # Drop-Chancen, Pity-Zähler
    SetBonusSystem.js     # prüft, wie viele Set-Teile ein Held trägt
    RecruitmentSystem.js  # Bewerberpool
  data/                   # reine Inhalte, Werte ändern ohne Programmierkenntnisse
    heroClasses.js        # Krieger, Priester, Magier, Jäger ...
    items.js              # Item-Vorlagen
    sets.js               # Klassen-Sets + Boni (2/4/6 Teile)
    dungeons.js           # Dungeons: Stufe, Dauer, Gegner, Loot-Tabelle
    rarities.js           # Grau/Weiß/Grün/Blau/Lila/Orange: Farbe, Chance, Wertebonus
  ui/                     # je Bildschirm eine Datei
    RosterScreen.js, HeroScreen.js, DungeonScreen.js,
    LootBoxScreen.js, GuildHallScreen.js, TopBar.js
  styles/ assets/
```
**Regeln für Claude (kommen in `CLAUDE.md`):**
- Deutsche Kommentare, die jede Datei und jede Methode einfach erklären
- Keine cleveren Tricks, lieber ausführlich und lesbar
- Spielinhalte und Balancing-Werte gehören immer in `data/`, nie in die Logik. So lassen sich Zahlen, Namen und Chancen ändern, ohne die Logik anzufassen.
- Spiellogik (`entities/`, `systems/`) kennt keine UI. Die UI liest nur und ruft Methoden auf.
- Nach jedem Schritt kurz erklären, was wo geändert wurde

## Motivations-Design (Kern-Loop)
**Loop:** Gruppe losschicken → Fortschrittsbalken → **Kiste kommt an** → Kiste öffnen (Animation, Seltenheitsfarbe leuchtet auf) → Held stärker ausrüsten → schwierigeren Dungeon schaffen → bessere Kisten.
- **Seltenheiten** wie im klassischen MMO: Grau, Weiß, Grün, **Blau**, **Lila**, **Orange (legendär)**, jeweils mit eigener Farbe, eigenem Sound und eigenem Effekt
- **Lootboxen** in Stufen (Holz/Silber/Gold/Episch). Das Öffnen ist inszeniert: wackeln, aufspringen, Items erscheinen nacheinander, das seltenste zuletzt.
- **Pity-System:** Nach X Kisten ohne Lila gibt es garantiert eins, damit Pechsträhnen nicht frustrieren
- **Klassen-Sets** (z.B. 6 Teile pro Klasse) mit 2/4/6-Teile-Boni, dazu ein **Sammelbuch**, das fehlende Teile als Silhouette zeigt
- **Ständiges Feedback:** Level-Up-Fanfare, aufsteigende Zahlen, Fortschrittsbalken überall (XP, Set-Sammlung, Gildenrang)
- **Kurze Anfangstimer** (Sekunden), die später auf Minuten wachsen, damit es schnell die ersten Erfolge gibt
- **Mehrere parallele Ziele:** Während eine Gruppe im Dungeon ist, laufen Bau und Crafting, dazu kommt die nächste Kiste. Es gibt immer etwas zu tun.
- Später: Erfolge, tägliche Aufträge, Gildenrang-Stufen mit Freischaltungen

## Meilensteine
**M0 – Fundament:** Setup, `CLAUDE.md`, Spieluhr mit Pause/Speed, Speichern/Laden, Pixel-Grundlayout.

**M1 – Kern-Loop spielbar (wichtigster Meilenstein):**
- 3 Klassen (Krieger/Priester/Magier), Rekrutierung aus Bewerberpool
- 3 Dungeons, Gruppe losschicken, Echtzeit-Fortschritt, Kampfbericht, XP und Level-Ups
- Lootboxen mit Öffnen-Animation, alle 6 Seltenheiten, Ausrüstung anlegen
- **Ziel:** Nach 10 Minuten Spielen will man "noch eine Kiste"

**M2 – Sammeln & Progression:** Klassen-Sets + Sammelbuch, Pity-System, mehr Klassen und Dungeons, Talentpunkte.

**M3 – Gildenhalle & Wirtschaft:** Gebäude ausbauen (Kaserne, Lazarett, Schmiede, Schatzkammer), Rohstoffe, Crafting.

**M4 – Tiefe:** Kampftaktiken, Raids, Persönlichkeit und Moral der Helden, Erfolge und tägliche Aufträge.

**M5 – Optional:** Diplomatie/Rivalengilden, Sound-Feinschliff, eigene Grafiken, Balancing.

Nach M1 testen wir zusammen, ob der Loop Spaß macht, und passen dann an.

## Erste Umsetzungsschritte (nach Freigabe)
1. `git init`, Vite-Projekt (Vanilla JS) anlegen, Ordnerstruktur wie oben
2. `CLAUDE.md` mit Konzept und Regeln für Claude anlegen
3. `GameClock.js` + `TopBar.js`: sichtbare Uhr mit Pause/1x/2x/4x
4. `rarities.js`, `Item.js`, `LootBox.js` + `LootBoxScreen.js`: Kiste öffnen als erstes "Wow"-Erlebnis, auch ohne Dungeons testbar
5. Danach: `Hero.js`, `heroClasses.js`, Rekrutierung → `dungeons.js`, `Expedition.js`, `CombatSimulator.js` → Kampfbericht

## Verifikation
- `npm run test`: Tests für Loot-Chancen (z.B. 10.000 Kisten simulieren und prüfen, ob die Verteilung stimmt), Kampf mit festem Seed, Leveln, Speichern/Laden
- `npm run dev`: Im Browser durchspielen. Kiste öffnen, Held rekrutieren, Dungeon starten, Pause/Speed prüfen, neu laden und prüfen, ob der Spielstand erhalten bleibt.
- Nach jedem Schritt kurz selbst anspielen und Feedback geben
