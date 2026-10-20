# Gildenmanager

Ein Browser-Management-Spiel in Pixel-Art: Du führst eine MMORPG-Gilde. Du rekrutierst Helden, rüstest sie aus,
schickst sie in Dungeons und öffnest die Beute: von Grau bis **Legendär**.

## Stand: Version 0.6
**Spielen:** https://salsaheaven.github.io/gildenmanager/

- **Schatzkammer:** Kisten öffnen (Holz, Silber, Gold, Episch) mit Animation, Sound und Seltenheits-Leuchten, Pity-System, Händler (der Gildenkurier ist abgeschaltet)
- **Taverne:** Bewerber mit Seltenheit (Grün bis Orange), Eigenschaften und Klasse anheuern
- **Helden:** 5 Klassen (Krieger, Priester, Runenwirker, Magier, Schurke), Ausrüstung anlegen mit Vergleich, „Bestes anlegen“
- **Dungeons:** Bärenhöhle, Verfallene Kapelle, Brutnester. Trash-Gruppen und Boss, Gruppe aus 5 Helden, Rückzugsregel, Anweisungen. Der Run läuft als Kampfszene in Spielzeit, auch mehrere Gruppen gleichzeitig. Belohnung: Gold und Boss-Kiste mit garantiertem Boss-Item
- **Fortschritt:** Erfahrung pro gewonnener Begegnung, Level-Up mit Banner und Fanfare, Aufhol-Erfahrung für Nachzügler, Verletzungen für Gefallene
- **Skalierung:** Helden bis Level 30, jeder Dungeon hat eine Stufe, Items haben ein Item-Level nach Herkunft
- **Inventar:** Vollbild mit Kategorien, auch auf dem Handy spielbar
- **Kampf-Labor:** Gruppe gegen Bosse antreten lassen (Grimmzahn, Schwester Morva, Skarrix, Übungspuppe), Kampfbericht mit Schadensmesser, Siegchance aus 200 Simulationen
- Spieluhr mit Pause (Leertaste) und 1x/2x/4x, automatisches Speichern
- Test-Menü mit **F2** (Gold, Kisten, Bewerber, +1 Level, Zeit)

## Starten
```bash
npm install
npm run dev     # Spiel unter http://localhost:5173
npm test        # Tests
```

Der weitere Plan steht in [PLAN.md](PLAN.md).
