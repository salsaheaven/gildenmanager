# Auftrag: Design-Review prüfen und gemeinsam entscheiden

Du arbeitest im Repository „Gildenmanager“. Lies zuerst `CLAUDE.md`, `KONZEPT.md` und `PLAN.md` und halte dich an deren Regeln (deutsche Kommentare, Inhalte in `src/data/`, kleine spielbare Schritte, Tests nach jeder Änderung).

In diesem Ordner liegen drei Dinge aus einem externen Design-Review:
- `REVIEW-Gildenmanager.md`: Kritik, Messergebnisse und eine priorisierte Vorschlagsliste (P1–P9, Abschnitt 14 und Nachtrag 15)
- `KONZEPT-Abschnitt-Spielerprofil.md`: ein Textbaustein für `KONZEPT.md`
- `messskripte/`: drei Node-Skripte, mit denen die Zahlen im Review gemessen wurden

## Wichtig: Nichts davon ist beschlossen

Der Review ist eine **Meinung von außen**, kein Plan. **Entschieden** ist nur, was im Textbaustein ausdrücklich als „entschieden“ markiert ist: Sammelspiel zuerst, Wettbewerb als freiwillige Zusatzschicht, später ein Incremental-Teil für den nächsten Durchgang. Alles andere sind Vorschläge.

Deine Aufgabe ist **prüfen und mit mir entscheiden**, nicht umsetzen. Ändere keinen Spielcode, solange ich einen Schritt nicht ausdrücklich freigegeben habe.

## Schritt 1: Den Review prüfen

1. **Behauptungen gegen den Code prüfen.** Stimmt es zum Beispiel, dass die Eigenschaften „Gierig“ und „Glückspilz“ keine Wirkung haben, dass `Item.getPower` klassenfremde Werte mitzählt und dass der Händler noch Kisten verkauft? Der Code kann sich seit dem Review geändert haben.
2. **Die Messungen wiederholen.** Kopiere die Skripte aus `messskripte/` ins Hauptverzeichnis des Repos (sie importieren `./src/...`) und führe sie aus:
   - `node bot-durchlauf.mjs 60 20 level` und `node bot-durchlauf.mjs 60 20 push`
   - `node siegchance-und-anweisungen.mjs`
   - `node kampfdauer.mjs`
   Die Skripte sind schnelle Wegwerf-Werkzeuge. Prüfe, ob sie das messen, was der Review behauptet. Wenn ein Skript einen Denkfehler hat, sag das und korrigiere es. Danach wieder löschen oder, nach Rückfrage, sauber als Werkzeug ins Repo aufnehmen.
3. **Eine eigene Messung ergänzen**, die im Review fehlt: Wirken die Anweisungen in Gruppen ohne Schurke oder ohne Runenwirker anders als in der Standardgruppe?
4. **Bericht an mich**, kurz und laienverständlich:
   - Was hat sich bestätigt?
   - Wo widersprichst du dem Review, und warum?
   - Was sieht der Review deiner Meinung nach falsch oder übertrieben?
   - Was fehlt im Review?

Erst danach geht es weiter.

## Schritt 2: Entscheidungen gemeinsam treffen

Geh die Vorschläge **einzeln** durch, in der Reihenfolge aus dem Nachtrag (Abschnitt 15). Für jeden Vorschlag:
- Erkläre in 2–3 Sätzen, welches Problem er lösen soll.
- Nenne **2–3 Möglichkeiten** mit Vor- und Nachteilen. „Gar nicht machen“ ist immer eine Möglichkeit.
- Sag, welche du empfiehlst und warum.
- **Warte auf meine Entscheidung.** Nicht mehrere Vorschläge auf einmal entscheiden lassen.

Getroffene Entscheidungen trägst du in `KONZEPT.md` ein (Status „entschieden“, mit Datum). Abgelehnte Vorschläge kommen kurz mit Begründung unter „Noch offen“ oder werden gestrichen, je nachdem, was ich sage. Den Textbaustein `KONZEPT-Abschnitt-Spielerprofil.md` fügst du erst ein, wenn ich ihn freigegeben habe, und dann nur die Zeilen, die ich bestätige.

## Schritt 3: Umsetzen, erst nach Freigabe

- Pro freigegebenem Vorschlag einen kleinen, einzeln spielbaren Schritt planen und mir den Plan zeigen, bevor du anfängst.
- Bei Balancing-Änderungen vorher und nachher messen (mit den Skripten bzw. `estimateChances`) und mir beide Zahlen nennen.
- Nach jedem Schritt: Tests laufen lassen, kurz erklären, was in welcher Datei passiert ist, und mir sagen, was ich im Spiel ausprobieren soll.
- Wenn sich während der Umsetzung zeigt, dass ein Vorschlag nicht funktioniert, aufhören und mit mir reden, statt ihn passend zu machen.
