<!--
Zum Einfügen in KONZEPT.md, z.B. direkt nach „Design-Grundsatz: echte Entscheidungen“.
Nur die Zeilen mit Status „entschieden“ sind Entscheidungen des Entwicklers.
Alles mit Status „Vorschlag“ stammt aus dem Design-Review vom 2026-10-21 und ist noch NICHT entschieden.
-->

## Spielerprofil und Meta-Progression

Stand: Design-Review (2026-10-21). **Entschieden** heißt: vom Entwickler festgelegt. **Vorschlag** heißt: noch offen, vor der Umsetzung gemeinsam entscheiden.

### Grundausrichtung
| Thema | Status | Inhalt |
|---|---|---|
| Kern des Spiels | **entschieden** | **Sammelspiel zuerst.** Spannung kommt vor allem aus Beute, Fortschritt und dem Wachsen der eigenen Gilde, nicht aus Angst vor Niederlagen. |
| Wettbewerb | **entschieden** | **Freiwillige Zusatzschicht.** Wer Lust auf Wettbewerb und Druck hat, spielt um einen Platz in der Bestenliste (Wertung in Spieltagen). Wer das nicht will, wird dafür nicht bestraft. |
| Mehrere Durchgänge | **entschieden** | Nach dem Endboss gibt es einen **Incremental-Teil**: Ein Teil des Fortschritts wird in den nächsten Durchgang mitgenommen. |
| Grundregel für alles Weitere | Vorschlag | Die Wettbewerbs-Schicht darf Sammler nie bestrafen. Jede Mechanik, die Tage kostet, muss auch ohne Bestenliste Sinn ergeben. |

### Schwierigkeit und Risiko (Vorschläge)
| Thema | Status | Inhalt |
|---|---|---|
| Erfolgschance bei passendem Level | Vorschlag | Etwa **85–90 %** (heute gemessen: 99 %). Niederlagen kommen vor, sind aber nicht die Regel. |
| Klippe | Vorschlag | Die harte Klippe abflachen (heute Brutnester: Level 3 = 49 %, Level 4 = 99 %). Eine Stufe unter dem Dungeon soll schwer, aber nicht hoffnungslos sein. |
| Risiko-Anzeige | Vorschlag | Vor jedem Run eine Einschätzung **in Worten** („sicher / machbar / riskant / aussichtslos“), keine genaue Prozentzahl. Gilt für beide Spielertypen, von Anfang an. Der Kartenraum (M3) kann sie später genauer machen und Gründe nennen. |
| Freiwilliges Risiko | Vorschlag | **Dungeon-Einsätze** (z.B. „ohne Heiler“, „unter Level“, „in wenigen Runden“) bringen bessere Beute. Sammler nutzen sie für bestimmte Teile, Ehrgeizige für Tempo. Mehr Risiko ist nie Pflicht. |
| Wertung in Tagen | Vorschlag | Bleibt bestehen, ist aber **leise**: sichtbar in der Endauswertung und der Bestenliste, nicht als ständiger Druck im Tagesplan. |
| KI-Rivalen | Vorschlag | Eher **Kulisse** (Ticker, Rangliste zum Vergleichen) als Gegner. Kein Nachteil, wenn eine KI-Gilde schneller ist. |

### Meta-Progression zwischen Durchgängen (Vorschläge)
**Grundidee:** Mitgenommen wird vor allem **Breite** (mehr Möglichkeiten), kaum **Stärke** (höhere Werte). Sonst fühlt sich der erste Durchgang wie ein Tutorial an, und die Bestenliste wird unfair.

| Thema | Status | Inhalt |
|---|---|---|
| Sammelbuch | Vorschlag | **Bleibt über alle Durchgänge bestehen.** Jedes Boss-Item und Set-Teil sammelt man einmal für immer. Das ist der Langzeitmotor für Sammler. |
| Freischaltungen | Vorschlag | Statt Werten: neue Klassen im Bewerberpool, ein Startheld nach Wahl, ein **Erbstück** (ein Item, das man in den nächsten Durchgang mitnimmt). |
| Stärke-Boni | Vorschlag | Höchstens klein, z.B. +5 % EP pro Prestige-Stufe. |
| Bestenliste und Fairness | Vorschlag | Bestenliste **pro Prestige-Stufe**, oder ein **Wochen-Seed ohne Meta-Boni**, auf dem alle gleich starten. Wie die Bestenliste technisch funktioniert (lokal, Code zum Teilen, Server), ist offen. |
| Zeitpunkt | Vorschlag | Prestige und New Game+ **jetzt noch nicht bauen**. |
| Technische Vorbereitung | Vorschlag | Sammelbuch und Freischaltungen von Anfang an **getrennt vom Spielstand** speichern (eigener localStorage-Schlüssel im `SaveManager`), damit später nichts umgebaut werden muss. |

### Folgen für die Reihenfolge (Vorschlag)
Gegenüber dem Review ändern sich die Prioritäten so:
- **Wichtiger:** Boss-Items mit kleinem Konter-Effekt und das Sammelbuch. Ohne bedeutsame Items gibt es nichts, was sich zu sammeln lohnt.
- **Unverändert wichtig:** Klippe abflachen + Risiko-Anzeige, wirksame Anweisungen, kürzere Kampfszene mit „Hauptgrund“ nach einer Niederlage.
- **Weniger dringend:** KI-Rivalen als Druckmittel. Sie kommen später als optionale Bestenliste.
