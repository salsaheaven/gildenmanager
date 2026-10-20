# Gildenmanager

Ein Browser-Management-Spiel in Pixel-Art: Du führst eine MMORPG-Gilde, kämpfst aber nicht selbst.
Du heuerst Helden mit eigener Persönlichkeit an, stellst Gruppen aus Tank, Heiler und Schadensausteilern zusammen,
gibst ihnen Anweisungen und schickst sie in Dungeons. Jeder Tag ist eine Runde: planen, „Tag beenden“, zuschauen, wie deine Gruppe sich schlägt,
und mit der Beute stärker werden für den nächsten, schwereren Dungeon.

**Spielen:** https://salsaheaven.github.io/gildenmanager/

## Stand: Version 0.10
- **Tagesplan:** 1 Runde = 1 Tag, jeder Held hat eine Aufgabe pro Tag. Die Startseite zeigt, wer heute in den Dungeon zieht, wer sich auskuriert und wer noch nichts zu tun hat
- **Tagesabschluss:** Nach „Tag beenden“ laufen die Kämpfe als Szene ab (große Skill-Namen, Skills und Abklingzeiten per Maus über dem Helden, Tempo 1x/2x/4x, überspringbar). Danach gibt es eine Zusammenfassung mit Gold, Erfahrung, Level-Ups und der Boss-Kiste
- **Taverne:** Bewerber mit Seltenheit, Eigenschaften und Klasse anheuern, jeden Morgen kommen neue
- **Helden:** 5 Klassen (Krieger, Priester, Runenwirker, Magier, Schurke), Kampf-Anweisungen pro Held, Ausrüstung mit Vergleich und „Bestes anlegen“
- **Dungeons:** Bärenhöhle, Verfallene Kapelle, Brutnester mit Trash-Gruppen, Bossen und ihren Mechaniken. Gruppen aus bis zu 5 Helden, Rückzugsregel, mehrere Gruppen pro Tag
- **Fortschritt:** Erfahrung und Level bis 30, Aufhol-Erfahrung für Nachzügler, Verletzungen für Gefallene, Items mit Item-Level je nach Herkunft
- **Beute:** Boss-Kisten mit Öffnungs-Animation, Seltenheiten von Grau bis Orange, Inventar als Vollbild (auch auf dem Handy)
- **Kampf-Labor:** Gruppe gegen einzelne Bosse antreten lassen, mit Kampfbericht, Schadensmesser und Siegchance aus 200 Simulationen
- Automatisches Speichern, Test-Menü mit **F2**

## Wie es weitergeht
- **Als Nächstes:** Talente, Gegenstände zerlegen und verbessern, Klassen-Sets mit Sammelbuch, schwere Dungeons, in denen Helden sterben können
- **Danach:** Gildenhalle mit Gebäuden, Crafting, weitere Aufgaben für freie Helden (z.B. Kräuter sammeln), rivalisierende KI-Gilden in einer Rangliste
- **Am Ende:** Raids und ein Endboss. Gewertet wird, wie viele Spieltage deine Gilde bis zum Sieg gebraucht hat

Details: [KONZEPT.md](KONZEPT.md) (Spielidee und Entscheidungen) und [PLAN.md](PLAN.md) (Technik und Arbeitsschritte).

## Starten
```bash
npm install
npm run dev     # Spiel unter http://localhost:5173
npm test        # Tests
```
