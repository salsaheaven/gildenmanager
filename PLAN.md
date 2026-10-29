# Gildenmanager – Projektplan

## Context
"Gildenmanager" (Arbeitstitel) ist ein Management-Spiel: Man führt eine typische MMORPG-Gilde, spielt aber nicht selbst in Dungeons. Man rekrutiert Helden, levelt, skillt und rüstet sie aus und schickt sie los. Währenddessen baut man die Gildenhalle aus, craftet und später vielleicht Diplomatie.
Festgelegt:
- **Browser-Spiel** mit **Pixel-Art**
- **Rundenbasiert** (1 Runde = 1 Tag, ein Held = eine Aufgabe pro Tag), Kämpfe **simuliert + Kampfszene + Kampfbericht**. Anfangs lief das Spiel in Echtzeit mit Pause/Speed, siehe „Umbau auf Runden“.
- **Übungsprojekt fürs Vibecoding:** Der Code muss für Programmier-Einsteiger einfach lesbar und stark modular sein, mit einer Datei pro Konzept wie bei Java-Klassen.
- **Pflicht: ein extrem motivierender Kern-Loop** (Dopamin), also Lootboxen, Seltenheitsstufen, Klassen-Sets zum Sammeln.

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
**Loop:** Gruppen für den Tag einplanen → „Tag beenden“ → Kämpfe als Szene → **Boss-Kiste** öffnen (Animation, Seltenheitsfarbe leuchtet auf) → Held stärker ausrüsten → schwierigeren Dungeon schaffen → bessere Kisten.
- **Seltenheiten** wie im klassischen MMO: Grau, Weiß, Grün, **Blau**, **Lila**, **Orange (legendär)**, jeweils mit eigener Farbe, eigenem Sound und eigenem Effekt
- **Lootboxen** in Stufen (Holz/Silber/Gold/Episch). Das Öffnen ist inszeniert: wackeln, aufspringen, Items erscheinen nacheinander, das seltenste zuletzt.
- **Pity-System:** Nach X Kisten ohne Lila gibt es garantiert eins, damit Pechsträhnen nicht frustrieren
- **Klassen-Sets** (z.B. 6 Teile pro Klasse) mit 2/4/6-Teile-Boni, dazu ein **Sammelbuch**, das fehlende Teile als Silhouette zeigt
- **Ständiges Feedback:** Level-Up-Fanfare, aufsteigende Zahlen, Fortschrittsbalken überall (XP, Set-Sammlung, Gildenrang)
- **Schnelle erste Erfolge:** Schon die ersten Tage bringen Kisten und Level-Ups
- **Mehrere Ziele pro Tag:** Gruppen im Dungeon, andere Helden farmen oder sammeln, dazu Bau und Crafting. Der Tagesabschluss bringt alles auf einmal.
- Später: Erfolge, tägliche Aufträge, Gildenrang-Stufen mit Freischaltungen

## Meilensteine
Das Spielkonzept, auf dem diese Reihenfolge beruht, steht in [KONZEPT.md](KONZEPT.md).

**M0 – Fundament ✅:** Setup, Spieluhr mit Pause/Speed, Speichern/Laden, Pixel-Grundlayout, Schatzkammer mit Lootboxen und Pity, online auf GitHub Pages.

**M1 – Helden & erster Dungeon ✅:**
In kleinen, jeweils online testbaren Schritten:
1. ✅ **Helden:** 5 Klassen (Krieger, Priester, Runenwirker, Magier, Schurke), Rekrutierung mit Helden-Seltenheit und Eigenschaften, Ausrüstung anlegen
2. ✅ **Kampf-Labor:** Testbildschirm, auf dem eine Gruppe gegen einen Boss antritt. Er zeigt Kampfbericht und Siegchance aus 200 Simulationen und dient zum Testen und Balancen.
3. ✅ **Dungeons:** 3 Normal-Dungeons mit Boss-Mechaniken, Live-Ticker mit Lebensbalken, Rückzug, Boss-Kiste
4. ✅ **Fortschritt:** Erfahrung pro Begegnung, Level-Up mit Banner und Fanfare, Aufhol-Erfahrung, Verletzungen, Test-Menü (F2)

**Als Nächstes (in dieser Reihenfolge):**
- ✅ **Skalierung, Teil A:** Level 30 als Obergrenze, Item-Level nach Herkunft, Dungeon-Stufen (1 / 3 / 5), Gegner wachsen mit der Stufe, alle Formeln in `src/data/scaling.js`. Per Simulation geprüft: Mit Ausrüstung aus dem vorherigen Dungeon gelingt der Einstieg auf jeder Stufe (bis 30) zu etwa 75–85 %. Test-Knopf „+1 Level“ im Test-Menü.
- ✅ **Skalierung, Teil B = Schritt 4** (siehe oben)
- **Umbau auf Runden** (Entscheidung vom 2026-10-20, Details in `KONZEPT.md`). Kampf, Beute, EP, Skalierung und Inventar bleiben unverändert. In vier Schritten, jeder einzeln spielbar:
  1. ✅ **Tageszähler statt Spieluhr:** Knopf „Tag beenden“ statt Pause und Tempo. Ein Dungeon wird für heute eingeplant (absagen möglich) und erst beim Tagesende ausgekämpft, mit der Ausrüstung, die die Helden dann tragen. Verletzungen dauern Tage. Bewerber wechseln täglich. Rückzug per Hand, Schnellkampf und Gildenkurier sind entfernt. Alte Spielstände werden umgerechnet.
  2. ✅ **Tagesabschluss (= Beute sichtbarer machen):** Beim Tagesende laufen die Kämpfe nacheinander als Szene (einzeln oder alle überspringbar), mit großem Ergebnis am Ende jedes Runs. Danach kommt eine Zusammenfassung mit Gold, EP, Level-Ups und den Boss-Kisten samt Knopf „Jetzt öffnen“. Die Level-Up-Banner warten bis zur Zusammenfassung. Jede besiegte Trash-Gruppe bringt etwas Gold (`trashGold` in `dungeons.js`), auch wenn der Run danach scheitert. Noch offen: kleine Item-Drops von Trash (grau/weiß).
  3. ✅ **Kampfszene spannender:** Etwa 2,5-mal langsamer (rund 4 Sekunden pro Runde bei 1x). Großer Skill-Name im Kasten über dem Handelnden. Der Handelnde leuchtet, Ziele bekommen einen roten (Angriff) bzw. grünen (Hilfe) Rahmen. Effekte sind größer und laufen langsamer. Tempo 1x / 2x / 4x wird im Browser gemerkt. Der neueste Ticker-Eintrag ist hervorgehoben. (Rückzug per Hand war schon in Schritt 1 entfallen.)
  4. ✅ **Tagesplan:** Neuer Reiter „Tagesplan“ (Startseite): welcher Held heute was macht (Dungeon, Kuriert sich aus, Ruht sich aus), Hinweis auf freie Helden, Gruppen absagen, „Tag beenden“. Die Leiste oben zeigt, wie viele Helden frei sind. Aufgaben stehen in `heroTasks.js`, dort kommen später Farmen oder Kräuter sammeln dazu.
  - ✅ Dazu: **Skill-Fenster in der Kampfszene.** Maus über einem Helden (Handy: antippen) zeigt seine Skills mit Beschreibung, Mana, Abklingzeit und ob sie gerade bereit sind (läuft im Kampf mit).

- **Design-Review 01** (2026-10-24, Unterlagen in `docs/review01/`, Mess-Werkzeuge in `tools/`). Die Vorschläge werden einzeln entschieden, Entscheidungen stehen in `KONZEPT.md`. Reihenfolge: P8 → P1 → P4 → P9 (vorgezogen, 2026-10-25) → P2 → P3 → Sammelbuch → P6 → P7 → P5.
  - **P8, Schritt 1** ✅ „Gierig“ (+20 % Gold) und „Glückspilz“ (+1 Item in der Boss-Kiste) wirken, wenn so ein Held mitkämpft. Im Tagesabschluss steht, wer den Bonus gebracht hat.
  - **P8, Schritt 2** ✅ Rüstungsarten Platte (Krieger) / Leder (Schurke) / Stoff (Zauberer), umgefärbte Pixelbilder, Kampfring und Zauberring für alle. Upgrade-Pfeile, „Bestes anlegen“ und AW zählen nur Werte, die der Klasse nützen (`usefulStats`). Spielstand-Version 2, alte Stände werden ignoriert.
  - **P4, Schritt 1** ✅ Schadensarten im Kampf (`damageTypes.js`: Körperlich, Schatten, Licht, Feuer, Eis, Säure, Wasser). Morva und Kultisten machen Schatten, Säureschwall und Brutlinge Säure. Resistenzen (Prozent, höchstens 50) werden im Kampf schon berücksichtigt. Farbige Schadenszahlen, Schadensart im Ticker und in der Dungeon-Übersicht.
  - **P4, Schritt 2** ✅ Resistenzen auf Beute (Höhe und Chance pro Seltenheit in `rarities.js`, Boss-Kisten mit `bossResistance`). Anzeige im Inventar, in der Ausrüstungsliste, beim Kistenöffnen und als Summe beim Helden. Dungeon-Bildschirm nennt die Schadensarten. Werkzeug `resistenzen.mjs`, der Bot rüstet vor jedem Run für die Schadensarten des Dungeons aus.
  - **P1, Schritt 1** ✅ Risiko-Anzeige in Worten („Sicher / Machbar / Riskant / Aussichtslos“, dazu „Gefallene: selten / manchmal / oft“) im Dungeon-Bildschirm und bei geplanten Gruppen (auch im Tagesplan). 100 simulierte Runs, Stufen in `riskLevels.js`.
  - **P1, Schritt 2** ✅ Gegner wachsen pro Stufe stärker (Leben +60 %, Angriff +28 %), alle Zielwerte innerhalb ±11 Punkten (`tools/zielwerte.mjs`). Nebenwirkung, bewusst so gelassen: viel mehr Gefallene bei knappen Siegen, im Bot doppelt so viele Tage mit Verletzten.
  - ✅ **Ausrüsten als Spieleraufgabe:** „Bestes anlegen“, Upgrade-Pfeile und Stärke-Zahl entfernt. Ausrüstungsliste pro angetipptem Platz, nach Item-Level sortiert, Vergleich Wert für Wert, „neu“-Markierung.
  - **P1, Schritt 3** ✅ Gruppenmischung neu gemessen: mit realistischer Ausrüstung situativ (Kapelle: 2 Schurken 100 %, Brutnester: 2 Magier 99 %, Standardgruppe je ~86 %). Morva bleibt, wie sie ist.
  - **P9 (vorgezogen), Schritt 1** ✅ Alle 15 Klassen, 3 pro Position (Tank, Heiler, Nahkampf, Fernkampf, Support). Neu: Paladin, Mönch, Druide, Samurai, Barbar, Jäger (mit Wolf), Hexenmeister, Barde, Schamane, Chronomant. Neue Kampf-Bausteine: Heilung über Zeit, Wiederbelebung, Gruppen-Buffs (zählen nicht doppelt), Ausweichen, Unverwundbarkeit, Begleiter, Extra-Zug, wachsende Flüche, „einmal pro Kampf“. Neue Waffen, geweihte Platte und Wildleder. Kampf-Labor: Klassen der Testgruppe frei wählbar. Werte grob gesetzt.
  - **P9, Schritt 2** ✅ 3 neue Dungeons, deren Bosse die neuen Klassen belohnen: **Frostzinne** (Stufe 7: Koboldschwarm für Mönch/Jäger, Hrimgar mit Vernichtungsschlag für den Paladin), **Spukmoor** (Stufe 9: Mutter Grezza mit Dauerflüchen und viel Leben für Druide und Hexenmeister, Irrlichter für den Wolf), **Sonnentempel** (Stufe 11, erster Dungeon mit 2 Bossen: Steinwächter mit häufiger Steinfaust für den Krieger, Azhur mit frühem Wutanfall für Kampfrausch/Barde/Samurai). Neue Kisten mit Boss-Beute für die neuen Waffen und Rüstungsvarianten. Werte nur so weit gesetzt, dass jeder Dungeon mit Ausrüstung schaffbar ist.

- **Ziel:** Nach 10 Minuten Spielen will man „noch einen Run“

**M2 – Progression:** ~~Gildenkurier abschalten~~ (✅ schon erledigt und beim Umbau auf Runden ganz entfernt), Kisten aus dem Händler nehmen; der Laden verkauft Verbrauchsgüter und Mats, dazu der Wanderhändler. Talente, Zerlegen und Verbessern (+1 bis +10), Klassen-Sets + Sammelbuch, Heroisch-Modus mit Permadeath + Ehrenhalle.

**M3 – Rivalen & Gildenhalle:** KI-Gilden, Rangliste, News-Ticker, Gebäude (Kaserne, Lazarett, Schmiede), Crafting.

**M4 – Raids & Endboss:** Zwei 40-Mann-Raids (der letzte ist der Endboss), Endauswertung nach Spieltagen. Zielbild: ~60 Helden im Roster, 10+ Dungeons.

**M5 – Feinschliff:** Balancing, Sounds, Grafik. Optional: Diplomatie, New Game+.

Jetzt (nach M1 und dem Umbau auf Runden) testen wir zusammen, ob der Loop Spaß macht, und passen dann an.

## Balancing & Playtests
**Fahrplan (entschieden 2026-10-29):** Zuerst wird eine spielbare Version mit dem **ganzen Umfang** gebaut (alle Systeme bis Raids und Endboss). Erst danach übernehmen günstige KI-Agenten (z.B. DeepSeek über OpenCode oder Cline) das Balancing mit den Werkzeugen aus `tools/`. Die Aufträge für diese Agenten schreiben wir gemeinsam, mit einer `AGENTS.md`, die auf die Regeln in `CLAUDE.md` verweist.

Das Balancing kommt gesammelt später, wenn genug Ideen zusammen sind. Grundsatz: Jede Wahl braucht Vor- und Nachteile (siehe `KONZEPT.md`). Werkzeuge, von billig nach teuer:

1. **Balancing-Bericht (Skript, ohne KI-Kosten):** ein Node-Skript, das für jeden Boss alle Kombinationen aus Anweisungen und Gruppe per `estimateChances` durchrechnet. Es meldet automatisch **dominante Optionen**, die in allen Kämpfen besser sind (wie zurzeit „Priester heilt früh“), und **nutzlose Optionen**, die nie die beste Wahl sind. Kann jederzeit gebaut werden und liefert in Sekunden Ergebnisse.
2. **Bot-Spieler (Skript, ohne KI-Kosten), sobald Dungeons, Beute und Leveln stehen:** ein regelbasierter Bot spielt das ganze Spiel durch (anheuern, ausrüsten, beste Gruppe losschicken). Er misst, wie viele Spieltage es bis zum Endboss dauert, wo der Fortschritt stockt und wie sich Gold und Beute entwickeln.
3. **KI-Agents als Testspieler (kostet Nutzungslimit), ab etwa M1:** einige Agents spielen im Browser und schreiben Erfahrungsberichte: Was ist spannend, was langweilig, was unverständlich? Diese Fragen kann kein Skript beantworten.
4. **Echte Spieler:** Das Spiel ist öffentlich unter https://salsaheaven.github.io/gildenmanager/ spielbar, der Link lässt sich also einfach teilen. Feedback könnte über **GitHub Issues** im Repo kommen (mit einer kleinen Vorlage für Feedback), oder über einen Feedback-Knopf im Spiel, der dorthin verlinkt. Wann und wie, entscheiden wir später.

## Verifikation
- `npm run test`: Tests für Loot-Chancen (z.B. 10.000 Kisten simulieren und prüfen, ob die Verteilung stimmt), Kampf mit festem Seed, Leveln, Speichern/Laden
- `npm run dev`: Im Browser durchspielen. Kiste öffnen, Held rekrutieren, Dungeon starten, Pause/Speed prüfen, neu laden und prüfen, ob der Spielstand erhalten bleibt.
- Nach jedem Schritt kurz selbst anspielen und Feedback geben
