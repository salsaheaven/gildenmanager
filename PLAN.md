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
Das Spielkonzept, auf dem diese Reihenfolge beruht, steht in [KONZEPT.md](KONZEPT.md).

**M0 – Fundament ✅:** Setup, Spieluhr mit Pause/Speed, Speichern/Laden, Pixel-Grundlayout, Schatzkammer mit Lootboxen und Pity, online auf GitHub Pages.

**M1 – Helden & erster Dungeon (wichtigster Meilenstein):**
In kleinen, jeweils online testbaren Schritten:
1. ✅ **Helden:** 5 Klassen (Krieger, Priester, Runenwirker, Magier, Schurke), Rekrutierung mit Helden-Seltenheit und Eigenschaften, Ausrüstung anlegen
2. ✅ **Kampf-Labor:** Testbildschirm, auf dem eine Gruppe gegen einen Boss antritt. Er zeigt Kampfbericht und Siegchance aus 200 Simulationen und dient zum Testen und Balancen.
3. **Dungeons:** 3 Normal-Dungeons mit Boss-Mechaniken, Taktikwahl, Live-Ticker mit Lebensbalken, Rückzug, Boss-Kiste
4. **Fortschritt:** XP und Level, Verletzungen, Test-Menü (F2) für Gold, Kisten und Zeit
- **Ziel:** Nach 10 Minuten Spielen will man „noch einen Run“

**M2 – Progression:** Gildenkurier abschalten und Kisten aus dem Händler nehmen; der Laden verkauft Verbrauchsgüter und Mats, dazu der Wanderhändler. Talente, Zerlegen und Verbessern (+1 bis +10), Klassen-Sets + Sammelbuch, Heroisch-Modus mit Permadeath + Ehrenhalle.

**M3 – Rivalen & Gildenhalle:** KI-Gilden, Rangliste, News-Ticker, Gebäude (Kaserne, Lazarett, Schmiede), Crafting.

**M4 – Raids & Endboss:** 10er-Raids, Endboss, Endauswertung nach Spieltagen.

**M5 – Feinschliff:** Balancing, Sounds, Grafik. Optional: Diplomatie, New Game+.

Nach M1 testen wir zusammen, ob der Loop Spaß macht, und passen dann an.

## Verifikation
- `npm run test`: Tests für Loot-Chancen (z.B. 10.000 Kisten simulieren und prüfen, ob die Verteilung stimmt), Kampf mit festem Seed, Leveln, Speichern/Laden
- `npm run dev`: Im Browser durchspielen. Kiste öffnen, Held rekrutieren, Dungeon starten, Pause/Speed prüfen, neu laden und prüfen, ob der Spielstand erhalten bleibt.
- Nach jedem Schritt kurz selbst anspielen und Feedback geben
