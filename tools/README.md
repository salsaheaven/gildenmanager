# Mess-Werkzeuge

Kleine Node-Skripte, die die **echte Spiellogik** aus `src/` benutzen, um Balancing-Fragen mit Zahlen zu beantworten.
Sie gehören nicht zum Spiel und werden nicht mit ausgeliefert. Entstanden aus dem Design-Review in `docs/review01/`.

Alle Messungen benutzen feste Seeds. Zwei Varianten werden also mit genau denselben Zufallszahlen verglichen.
Faustregel: Unterschiede bis etwa ±4 Prozentpunkte sind Zufall.

| Werkzeug | Frage | Aufruf |
|---|---|---|
| `bot-durchlauf.mjs` | Wie schnell kommt ein Bot voran? Erfolgsquote, Tage bis zu jedem Dungeon, Gold, Anteil Upgrade-Items | `node tools/bot-durchlauf.mjs 60 20 level 0.5` (Modus `level` oder `push`, letzte Zahl = Wert von 1 % Resistenz, 0 = ignorieren) |
| `siegchance.mjs` | Siegchance der Standardgruppe je Dungeon und Level, nackt und grün ausgerüstet | `node tools/siegchance.mjs` |
| `gruppen-vergleich.mjs` | Wie stark hängt der Erfolg von der Klassenmischung ab? (mit Ausrüstung aus dem vorherigen Dungeon) | `node tools/gruppen-vergleich.mjs` |
| `anweisungen.mjs` | Was bewirkt jedes Extrem einer Anweisung gegenüber „Ausgewogen“, in 4 Gruppen (zusammen alle 15 Klassen) und allen Dungeons? Am Ende: welche Optionen situativ sind, nie helfen oder immer helfen | `node tools/anweisungen.mjs 300` (etwa 1–2 Minuten), schneller für einen Dungeon: `node tools/anweisungen.mjs 200 bearCave` |
| `zielwerte.mjs` | Liegen die Siegchancen bei den Zielwerten aus KONZEPT.md („Schwierigkeit“)? | `node tools/zielwerte.mjs` |
| `resistenzen.mjs` | Was bringen 1–3 Rüstungsteile mit Resistenz gegen die Schadensart eines Dungeons? | `node tools/resistenzen.mjs` |
| `kampfdauer.mjs` | Wie lange dauert ein Run in Runden und Minuten (Tempo 1x), mit Zeitraffer und zum Vergleich ohne? | `node tools/kampfdauer.mjs` |

`messhilfen.mjs` enthält die gemeinsamen Bausteine (Testgruppe bauen, viele Runs messen).

Bei Balancing-Änderungen: vorher und nachher messen und beide Zahlen vergleichen.
