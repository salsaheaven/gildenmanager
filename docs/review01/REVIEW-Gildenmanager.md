# Gildenmanager – Kritischer Game-Design-Review

Stand des Codes: `main` von salsaheaven/gildenmanager, 21.10.2026 (nach M1 und dem Umbau auf Runden).

## 0. Wie dieser Review entstanden ist

Ich habe `CLAUDE.md`, `KONZEPT.md`, `PLAN.md` und den Quellcode gelesen (vor allem `src/core/Game.js`, `src/entities/`, `src/systems/`, `src/data/` und die wichtigsten UI-Dateien) und alle 156 Tests laufen lassen (grün).

**Ich habe das Spiel nicht im Browser gespielt.** Ich kann deshalb nichts darüber sagen, wie sich Szene, Sound, Kisten-Animation oder die Handy-Bedienung *anfühlen*. Was ich stattdessen getan habe: drei kleine Node-Skripte, die die **echte Spiellogik** benutzen (keine Nachbauten):

1. **Bot-Durchlauf:** Ein Bot heuert eine Gruppe an (je eine der 5 Klassen), schickt sie jeden Tag in einen Dungeon, öffnet alle Kisten und drückt sinngemäß „Bestes anlegen“. 20 Spielstände à 60 Tage, in zwei Strategien: „immer den höchsten freigeschalteten Dungeon“ und „den höchsten Dungeon, dessen Stufe ≤ Gruppenlevel ist“.
2. **Siegchance-Tabelle:** Testgruppe auf Level 1–7 mit grüner Ausrüstung gegen jeden ganzen Dungeon, je 300 Runs.
3. **Anweisungs-Check:** Jede einzelne Nicht-Standard-Anweisung gegen die Standard-Einstellung, je 300 Runs pro Dungeon.

Alles, was unten als **„gemessen“** markiert ist, stammt aus diesen Skripten. Alles andere ist Designkritik aus Erfahrung und als solche gekennzeichnet. Die Skripte liegen im Arbeitsordner und können als Startpunkt für den in `PLAN.md` geplanten „Balancing-Bericht“ dienen.

---

## 1. Was das Spiel heute ist (nur Überprüfbares)

**Implementiert und im Code nachvollziehbar**
- Rundenablauf: Tag planen → „Tag beenden“ → alle Runs werden ausgekämpft (`Game.endDay`), Szene + Zusammenfassung (`DayEndOverlay`), Level-Up-Banner.
- 5 Klassen (Krieger, Priester, Runenwirker, Magier, Schurke) mit je 3 Skills und 1–3 Anweisungen (`heroOrders.js`).
- Rekrutierung: 4 Bewerber pro Tag, Helden-Seltenheit Grün bis Orange, 1–3 Eigenschaften, Reroll für 20 Gold.
- 3 Normal-Dungeons (Stufe 1 / 3 / 5): Bärenhöhle, Kapelle, Brutnester – mit 3 Bossen und insgesamt 5 Mechaniken (Tank-Buster, Gruppenzauber, Fluch, Beschwörung, Frontwelle).
- Rückzugsregel (nie / nach 1 / nach 2 Gefallenen), Verletzung = 1 Tag Pause.
- Erfahrung pro Begegnung, Überlevel-Abzug, Aufhol-Erfahrung.
- Boss-Kisten mit einem garantierten, benannten Boss-Item (mind. Blau) plus Zufallsitems; Pity nach 25 Items ohne Lila.
- Händler, der weiterhin Holz-/Silber-/Gold-/Epische Kisten für Gold verkauft (Item-Level 1).
- Inventar, Verkaufen, „Bestes anlegen“-Knopf, Upgrade-Pfeile, Kampf-Labor mit Siegchance, Test-Menü.

**Im Konzept festgelegt, aber nicht implementiert**
Sets + Sammelbuch, Zerlegen/Verbessern/Crafting, Talente, Umskillen, Verbrauchsgüter, Heroisch + Permadeath + Ehrenhalle, Gildenhalle, weitere Aufgaben (Farmen usw.), KI-Rivalen, Raids, Endboss, Endwertung, Siegchance/Kartenraum im Dungeon-Bildschirm, 7 weitere Klassen.

**Halb implementiert**
- Die Eigenschaften **„Gierig“ und „Glückspilz“ haben keine Wirkung** (sie werden nirgends außer in `traits.js` und dem Tooltip gelesen). Der Tooltip sagt „wirkt ab den Dungeons“ – Dungeons gibt es inzwischen. Wer einen „Glückspilz“ für 250 Gold anheuert, hat sich ein leeres Versprechen gekauft.

**Offene Designentscheidungen** (laut `KONZEPT.md`): Siegchance ja/nein, Wirtschaft, Verbrauchsgüter, Umfang, KI-Gilden, „Priester heilt früh“.

### Das Spielerlebnis heute, in meinen Worten
Man heuert fünf Helden an, schickt sie jeden Tag in den höchsten Dungeon, den sie schaffen, schaut 2–4 Minuten einem Kampf zu, öffnet eine Kiste, drückt „Bestes anlegen“ und beendet den nächsten Tag. Nach gut zwei Wochen Spielzeit (Spieltage) ist alles gesehen.

### Das Spielerlebnis nach allen Meilensteinen (Vermutung)
Ein Loot-Manager mit Set-Jagd, Gilden-Ausbau und einem Wettrennen gegen KI-Gilden zum Endboss, gewertet in Spieltagen. Das kann gut werden – aber nur, wenn das, was heute schon da ist, echte Entscheidungen erzeugt. Im Moment tut es das kaum, und genau darauf konzentriert sich dieser Review.

---

## 2. Die Messergebnisse in Kürze (gemessen)

| Frage | Ergebnis |
|---|---|
| Erfolgsquote bei vernünftiger Dungeon-Wahl (Stufe ≤ Level) | **99 %** über 1028 Runs, längste Pechsträhne 2 |
| Erfolgsquote, wenn man immer den höchsten Dungeon nimmt | **22 %**, Pechsträhnen bis 24 Runs, an der Hälfte aller Tage fehlt jemand verletzt |
| Wann ist alles geschafft? | Bärenhöhle Tag 1, Kapelle Tag ~6, Brutnester Tag ~14 |
| Was passiert danach? | Level steigt von ~7 (Tag 30) auf ~8 (Tag 60) und bleibt dann stehen; es gibt nichts Neues |
| Gold | ~1 500 an Tag 20, ~6 500 an Tag 60, ~10 300 an Tag 90 – ohne sinnvolle Ausgabe |
| Siegchance-Klippe Brutnester (grün, gleiche Stufe) | Level 3: 49 % · Level 4: 99 % · Level 5: 100 % |
| Bärenhöhle | Level 1 mit grüner Ausrüstung: 100 % (Ziel laut `CLAUDE.md`: nackt ~90 %) |
| Anweisungen (14 Nicht-Standard-Optionen, 3 Dungeons) | **Nur eine verbessert etwas** („Priester heilt früh“, +4/+5 Punkte). Viele sind neutral, viele sind Fallen: „Priester spät“ −44, „Eiskranz ab 3 Gegnern“ −33, „Eiserne Wacht sofort“ −22, „Natternbiss nie“ −16 |
| Länge eines Runs | Ø 27 Kampfrunden (Bärenhöhle) bis 52 (Brutnester). Bei ~4 s pro Runde (1x) sind das **~2 bis 3½ Minuten Zuschauen pro Run** |
| Kistenwert (5-Helden-Gilde) | 43 % aller Items sind für irgendwen ein Upgrade; 25 % der Kisten enthalten gar keins |

Die wichtigste Erkenntnis daraus: **Das Spiel ist im Moment fast deterministisch, sobald man die eine offensichtliche Regel kennt („geh nur dahin, wo dein Level passt“).** Wer sie befolgt, gewinnt praktisch immer. Wer sie bricht, verliert fast immer. Dazwischen gibt es kaum ein Feld, in dem Vorbereitung den Ausschlag gibt.

Einschränkung: Die Anweisungs-Messung nutzt die Standardgruppe mit allen fünf Klassen. In Gruppen ohne Schurke oder ohne Runenwirker könnten einzelne Optionen anders abschneiden. Das ist eine sinnvolle nächste Messung, ändert aber den Befund nicht grundsätzlich: In der häufigsten Gruppe sind die Abweichungen von der Standard-Einstellung fast nie besser.

---

## 3. Macht das Spiel Spaß?

**1. Stärkster Aspekt:** Die **Fantasie** „Ich bin Gildenmeister, nicht Spieler“ und der **Tagesrhythmus**. Planen → Auflösen → Belohnung ist ein klares, handytaugliches Format ohne Timer-Stress. Die Boss-Mechaniken mit Konter (z.B. Schurke unterbricht Morvas Schattenwoge) sind die richtige Idee, um Gruppenbau bedeutsam zu machen. Auch handwerklich ist das Fundament stark: saubere Datenhaltung, Kampf-Labor, Tests, deterministischer Zufall. Das ist für ein Lernprojekt ungewöhnlich diszipliniert.

**2. Langfristige Motivation (Potenzial):** Eine eigene, gewachsene Gilde mit Geschichten (wer ist gefallen, wer hat den Drachen gelegt), ein Wettrennen gegen Rivalen und eine Wertung in Tagen. Die Wertung in Tagen ist meiner Meinung nach die originellste Entscheidung im ganzen Konzept (siehe Abschnitt 13).

**3. Wann wird es langweilig?**
- *Nach 10 Minuten:* Wenn der zweite Bärenhöhlen-Run genauso aussieht wie der erste. Ich vermute, dass das Zuschauen zum ersten Mal kippt, sobald man das Ergebnis vorher kennt (und das kennt man – 99 %).
- *Nach einer Stunde:* Wenn man gemerkt hat, dass Anweisungen nichts verbessern und „Bestes anlegen“ jede Ausrüstungsfrage beantwortet. Dann bleibt als einzige Handlung: „Tag beenden“.
- *Nach mehreren Stunden:* Heute gibt es keine mehreren Stunden; der Inhalt endet um Tag 15.

**4. Echte Entscheidungen vs. Verwaltung**
- *Echt:* Wen heuere ich an (Seltenheit vs. Klasse vs. Gold)? Welchen Dungeon riskiere ich? Wen nehme ich gegen Skarrix (Frontwelle) mit?
- *Scheinbar:* Fast alle Anweisungen (gemessen), Rückzugsregel (bei 99 % Erfolg egal), Item-Vergleich (der Knopf löst ihn), Helden-Eigenschaften (+10 % auf einen Wert, zwei davon wirkungslos).
- *Verwaltung:* Kisten öffnen, Schrott verkaufen, ausrüsten.

**5. Arbeit statt Spiel:** Das tägliche Ritual „Gruppe zusammenklicken → Tag beenden → 3 Minuten Szene → Kiste → Bestes anlegen“, wenn keiner dieser Schritte überrascht. Mit zwei Gruppen verdoppelt sich die Zuschauzeit.

**6. Spannung, Vorfreude, Stolz:** Entsteht heute vor allem beim **ersten** Sieg über einen neuen Boss und beim Aufblitzen einer lila/orangen Farbe. Stolz („meine Entscheidung hat den Kampf gedreht“) entsteht kaum, weil es diese Entscheidung kaum gibt.

**7. Frustration, Leerlauf:** Wer zu früh in einen höheren Dungeon geht, läuft in eine Wand (22 % Erfolg) mit Verletzungs-Pausen. Ohne Siegchance im Dungeon-Bildschirm sieht man die Wand nicht kommen; man sieht nur „Empf. AW“.

**8. Was greift ineinander, was ist isoliert?**
- Gut verzahnt: Boss-Mechanik ↔ Klasse ↔ Gruppenbau; Item-Level ↔ Dungeon-Stufe.
- Isoliert: Gold (kein Abfluss), Händlerkisten (Item-Level 1, also ab Tag ~6 Ballast), Eigenschaften, Helden-Seltenheit (gemessen nicht, aber bei +5 %/+10 % Grundwerten vermutlich kaum spürbar), Pity (bei 25 Items und 3–4 Items pro Kiste greift es etwa alle 7 Kisten – häufig genug, dass Lila früh normal wird).

**9. Eigene Identität?** Noch nicht. Heute ist es eine saubere Sammlung bekannter MMO-Bausteine (Holy-Trinity, Farben, Boss-Kiste, Set-Boni geplant). Das Eigenständige steckt in zwei Dingen, die noch kaum ausgespielt sind: „Ich steuere nur über Vorbereitung“ und „Gewertet wird in Tagen“.

**10. Würde ich weiterspielen?** Im jetzigen Zustand: Ich würde bis zum ersten Skarrix-Sieg spielen, weil ich wissen will, ob die Gruppe es packt – und dann aufhören, weil nichts mehr kommt und die Kämpfe mir nichts mehr beibringen. Mit den Änderungen aus Abschnitt 14 (echte Risiko-Wahl, kürzere Szenen, Anweisungen mit Wirkung) würde ich es deutlich länger spielen.

**Getrennte Bewertung**
- Potenzial der Idee: **gut (7/10).** Die Nische „Gildenmeister mit MMO-Nostalgie“ hat Fans, und das Runden-Format passt.
- Aktueller Stand: **technisch solide, spielerisch noch dünn (4/10).** Der Kern-Loop läuft, erzeugt aber kaum Entscheidungen.
- Geplante Gesamtversion: **hängt fast ganz an einer Frage** – ob Vorbereitung den Ausgang spürbar beeinflusst. Wenn ja, 7–8/10. Wenn nein, werden Sets, Gebäude und Rivalen nur mehr Zahlen auf dieselbe Leere stapeln.

---

## 4. Der Tages-Loop, Phase für Phase

| Phase | Befund | Schwere |
|---|---|---|
| 1–2 Planen / Gruppe bauen | Mit 5 Helden gibt es nichts zu planen: alle fünf in den passenden Dungeon. Echte Planung entsteht erst mit 7–10 Helden, mehreren Gruppen und Verletzten. | hoch |
| 3 Tag beenden | Emotional neutral, weil das Ergebnis vorhersehbar ist (99 % oder ~20 %). | hoch |
| 4 Szene | 2–3½ Minuten pro Run bei 1x. Für ein bekanntes Ergebnis zu lang. Das Überspringen ist richtig, aber wenn der Spieler die Szene *meistens* überspringt, ist sie Kosmetik. | hoch |
| 5 Belohnung | Gold, EP, Level-Ups, Kiste – sichtbar und gut gebündelt. Gold ist aber bedeutungslos (siehe Wirtschaft). | mittel |
| 6 Kiste öffnen | Der Höhepunkt ist eine Farbe, kein Gegenstand. Weil Items nur „größere Zahl“ sind, ist Blau einfach „etwas mehr als Grün“. Ein Item, das *etwas anderes* kann, gibt es nicht. | hoch |
| 7 Vergleichen / Anlegen | Durch „Bestes anlegen“ gelöst. Das ist ehrlich – ohne Zielkonflikte wäre manuelles Vergleichen reine Arbeit. Aber es zeigt, dass Ausrüstung heute keine Entscheidung ist. | mittel |
| 8 Sets | Nicht implementiert. | – |
| 9 Vorbereiten auf Schwereres | Heißt heute: Level abwarten. Die Klippe (L3 49 % → L4 99 %) bedeutet, dass ein Tag mehr Leveln fast alles entscheidet. | hoch |
| 10 Nächster Tag | Identisch zum vorigen. | – |

**Übergänge:** Der Übergang Szene → Zusammenfassung → Kiste ist gut gelöst („Jetzt öffnen“). Der schwächste Übergang ist *Kiste → nächster Tag*: Die Beute verändert nichts an der nächsten Planung. Ein gutes Item sollte einen neuen Plan *auslösen* („Mit dem Chitinschild trau ich mich an Skarrix“), nicht nur einen Wert erhöhen.

**Funktioniert der Loop bei Misserfolg?** Teilweise: Trash-Gold und Trash-EP gibt es auch bei Niederlage. Aber eine Niederlage lehrt nichts Neues, weil der Grund fast immer „Level zu niedrig“ ist.

**Sollte man den Loop vereinfachen?** Ja, an einer Stelle: **die Szene**. Statt jeden Run voll abzuspielen, standardmäßig nur die **entscheidenden Momente** zeigen (Boss-Mechaniken, Beinahe-Tode, Tode, die letzte Runde) und den vollen Kampf auf Wunsch. Siehe Priorität 3.

---

## 5. Strategische Tiefe

**Der Grundsatz „jede Wahl hat Vor- und Nachteile“ ist richtig – wird aber an der falschen Stelle geprüft.** Die Messung zeigt: Das Problem ist nicht nur „Priester früh ist dominant“. Das größere Problem ist, dass **die Standard-Optionen in fast allen Fällen die beste Wahl sind** und Alternativen Verschlechterungen. Das ist das Gegenteil des Problems, das `KONZEPT.md` beschreibt, und genauso schädlich: Der Spieler lernt „Finger weg von den Anweisungen“.

Warum das so ist (Vermutung aus dem Code): Die Standard-Bedingungen in `HeroAI.js` sind bereits „klug“ (z.B. Eiserne Wacht bei großen Schlägen *und* wenig Leben). Jede Alternative ist eine *dümmere* Teilmenge davon. Eine echte Alternative müsste etwas **anderes** priorisieren, nicht dasselbe schlechter.

**Interessant, weil situativ (sollte man ausbauen):** Gruppenzusammenstellung gegen Mechaniken. Skarrix' Frontwelle bestraft Nahkämpfer, Morvas Woge belohnt einen Schurken. Hier lebt der Grundsatz wirklich.

**Wahrscheinlich offensichtlich optimal:** Die Gruppe Krieger/Priester/Runenwirker/Magier/Schurke (die Testgruppe) – weil es nur 5 Klassen gibt und jede genau eine Lücke füllt. Mit 5 Klassen gibt es praktisch eine Gruppe.

**Nur scheinbar wichtig:** Rückzugsregel (bei 99/22 % entscheidet sie selten), Eigenschaften (±10 %), „Ziel: Boss zuerst“.

**Was automatisieren?** Item-Vergleich (bereits), Schrott verkaufen (automatisch oder ein Schalter), Gruppenbildung als „letzte Gruppe wiederholen“. **Selbst entscheiden** sollte der Spieler: welchen Dungeon, welches Risiko, wer mitgeht, und *eine* echte taktische Ansage pro Kampf.

**Wie viel Tiefe ist sinnvoll?** Für ein Projekt dieser Größe: lieber **3 Entscheidungen pro Tag, die jeweils 10–20 Prozentpunkte bewegen**, als 15, die je 1 Punkt bewegen. Eine gute Faustregel für den Balancing-Bericht: Jede Option sollte gegen **mindestens einen** Boss die beste sein und gegen **mindestens einen** spürbar schlechter (≥5 Punkte).

**Siegchance anzeigen?** Mein Vorschlag (Designpräferenz, aber begründet): **Ja, aber als Spanne mit Worten**, nicht als exakte Zahl – und zwar *von Anfang an*, nicht erst mit Gebäude. Grund: Die gemessene Klippe ist so steil, dass Spieler ohne Anzeige blind in 22 %-Runs laufen. Konkret:
- „Sicher“ (> 90 %), „Machbar“ (65–90 %), „Riskant“ (35–65 %), „Selbstmord“ (< 35 %), dazu „Risiko Gefallene: niedrig/mittel/hoch“.
- Der Kartenraum (M3) kann die Spanne später schärfen und **den Grund** nennen („Ihr verliert meist bei der 3. Schattenwoge“). Das ist wertvoller als eine genauere Zahl.
- Die exakte Prozentzahl würde ich dem Spieler nie zeigen. Sie macht aus jeder Entscheidung eine Rechenaufgabe („Anweisung A: 81 %, B: 83 % → B“) und nimmt die Entdeckung weg.

Technisch billig: `ChanceEstimator` existiert, ein ganzer Run mit 50–100 Wiederholungen dürfte schnell genug sein (bitte einmal im Browser messen).

---

## 6. Kampfsystem und Inszenierung

**Ist Zuschauen befriedigend?** Nur, wenn **Ungewissheit** und **Ursache** sichtbar sind. Zuschauen bei 99 % Sieg ist ein Ladebildschirm. Zuschauen bei 60 % mit einer Ansage, die man selbst gemacht hat („Runenpanzer nur vor großen Schlägen“), ist Mitfiebern. Die Inszenierung (`BattleScene`) ist auf dem richtigen Weg; ihr fehlt das Spannungsmaterial, nicht die Effekte.

**Länge:** 27–52 Runden à ~4 s sind zu viel. Vorschläge mit wenig Aufwand:
- Trash-Begegnungen standardmäßig im Zeitraffer (z.B. 4x automatisch), Boss in 1x.
- Runden ohne „Ereignis“ (keine Mechanik, niemand unter 30 %) schneller abspielen. `BattleTimeline` berechnet die Dauer ohnehin zentral.
- Langfristig: Kämpfe kürzer machen (weniger Boss-Leben, mehr Schaden pro Runde). 15–20 Runden pro Boss reichen für 3 Mechanik-Zyklen.

**Damit Entscheidungen sichtbar wirken**, braucht die Szene „Kausal-Momente“ – kurze Einblendungen, wenn eine Vorbereitung gegriffen hat:
- „Stummschlag! Schattenwoge unterbrochen“ (gibt es vermutlich schon im Ticker – größer machen)
- „Runenpanzer fängt 340 Schaden ab“
- „Ohne Schurke: Schattenwoge trifft alle (−180)“ – also auch **verpasste** Konter benennen.

**Bericht nach einer Niederlage:** Eine einzige Zeile „Hauptgrund“ ist mehr wert als der ganze Schadensmesser. Etwa: „Mana des Priesters war in Runde 22 leer“, „Tank fiel durch Zermalmenden Prankenhieb (kein Schild aktiv)“, „Wutanfall in Runde 30 – zu wenig Schaden“. Das lässt sich aus dem Kampfprotokoll mit ein paar einfachen Regeln ableiten (letzte große Schadensquelle vor dem ersten Tod, Mana-Stand, Wutanfall erreicht ja/nein).

**Knapper vs. deutlicher Sieg:** Ein knapper Sieg sollte **mehr** bringen (Bonus-Item, „Heldenmoment“ eines Helden, Eintrag in eine Gildenchronik). Das macht Spannung zur Belohnung statt zum Risiko.

**Überspringen:** Richtig, dass es jederzeit geht. Aber wenn die Szene gut ist, überspringt man nicht – messen, wie oft Tester überspringen (siehe Abschnitt 12).

**Anweisungen als taktisches System:** Heute zu feingranular (14 Optionen) und fast wirkungslos. Ich würde sie **reduzieren und schärfen**: pro Klasse **eine** Anweisung mit 2–3 *gegensätzlichen* Optionen, die eine Ressource gegen eine andere tauschen (siehe Priorität 2).

---

## 7. Progression, Loot, Motivation

**Kurzfristig (pro Tag):** Level-Ups und Kisten kommen häufig – das funktioniert. **Mittelfristig (pro Woche):** neue Dungeons, die nach ~14 Tagen ausgehen. **Langfristig:** fehlt komplett (Sets, Rivalen, Endboss nicht da).

**Ist die Dungeon-Belohnung groß genug?** In Menge ja (3–4 Items pro Run, 99 % Erfolg ⇒ ~1 Kiste pro Tag). In *Bedeutung* nein. Ein Item ist heute „+x Rüstung, +y Leben“ – dieselben zwei Werte auf Helm, Harnisch und Stiefel, für jede Klasse gleich.

**Konkrete Probleme im Item-System (gemessen bzw. im Code):**
- `Item.getPower()` addiert alle Werte unabhängig von der Klasse. Ein Ring mit Magie zählt für den Krieger genauso viel wie für den Magier. „Bestes anlegen“ und die Upgrade-Pfeile empfehlen deshalb teilweise Unsinn.
- Rüstungsteile haben keine Varianten (immer Rüstung + Leben). Es gibt keinen Grund, ein Teil mit *niedrigerer* Gesamtstärke zu wählen.
- Boss-Items sind nur benannte Zufallsitems. „Grimmzahns Fangzahn“ ist ein Ring wie jeder andere.

**Mein Vorschlag (die wichtigste Loot-Idee in diesem Review):** **Jedes Boss-Item bekommt einen kleinen Effekt, der an eine Mechanik andockt.** Beispiele, die nur Daten in `lootBoxes.js` plus eine Handvoll Effekt-Typen im Kampf brauchen:
- Chitinschild: „−30 % Schaden durch Säureschwall“ (Konter gegen Skarrix, ohne Nahkämpfer zu streichen)
- Kapuze der Schwester: „Fluch dauert 2 Runden kürzer“
- Grimmzahns Fangzahn: „+15 % Schaden gegen Diener“

Dann ist ein Boss-Item interessant, *auch wenn es schwächer ist*, und es entsteht genau die Schleife „Beute → neuer Plan“. Das ist auch die natürliche Brücke zu den Sets: Ein Set-Bonus ist dann einfach ein Effekt, der erst ab 2/4 Teilen greift.

**Seltene Items bedeutungslos oder unverzichtbar?** Heute: Weil Item-Level die Seltenheit schlägt (gewollt), sind Lila-Items aus der Bärenhöhle ab Dungeon 2 weitgehend Ballast. Das ist ein bewusster, vernünftiger Kompromiss – aber dann sollte der Lila-Moment nicht der Hauptreiz sein. Ein lila Item sollte **eher einen zusätzlichen Effekt** bekommen als nur ×2,3 auf die Werte.

**Sets:** Gute langfristige Motivation, aber Vorsicht vor starren Entscheidungen: Ein 6er-Bonus, der so stark ist, dass man ihn immer trägt, killt die Item-Vielfalt. Empfehlung: **2er- und 4er-Boni situativ** (Effekt gegen eine Mechanik-Art), kein 6er-Bonus in der ersten Version. Bei 6 Plätzen und 6 Set-Teilen hieße ein 6er-Set ohnehin: Für diesen Helden ist Ausrüstung gelöst.

**Sammelbuch:** Sinnvoll und billig, *wenn* es mehr ist als eine Checkliste: Jede vollständige Seite schaltet etwas frei (Titel, kosmetische Rahmenfarbe, kleine Gildenboni). Später erwägen.

**Doppelte/schwache Beute:** Heute nur Verkaufen für 1–20 Gold, was nichts wert ist. Mit Zerlegen → Material → Verbessern bekommt Schrott Sinn. Ich würde aber **ein Material** statt mehrerer einführen und Verbessern **ohne** Fehlschlag-Chance beginnen (siehe Abschnitt 10).

**Pity:** Die „Stimmung statt Zahl“-Idee ist charmant. Aber bei 25 Items ist sie so häufig, dass sie kaum Gewicht hat, und weil sie Lila garantiert, *nicht* einen gewünschten Gegenstand, hilft sie nicht gegen das eigentliche Pech („ich brauche den Chitinschild“). Besser: **Pity pro Boss-Item** (Boss-Kisten bevorzugen Boss-Items, die man noch nicht hat). Das deckt sich mit dem Sammelbuch.

**Lootboxen grundsätzlich:** Die Kiste als *Inszenierung* von Dungeon-Beute ist gut. Die **kaufbaren** Kisten würde ich sofort entfernen (steht für M2 ohnehin im Plan), weil sie Gold in Item-Level-1-Ballast verwandeln und das Gefühl „Beute kommt aus Leistung“ verwässern. Ein Wort zur Außenwirkung: „Lootbox“ ist ein belasteter Begriff. Da es kein Echtgeld gibt, ist das unproblematisch, aber „Boss-Beute“ oder „Truhe“ klingt im Spiel ehrlicher.

**Mehrere Fortschrittsbalken überlagern:** Ziel sollte sein, dass an jedem Tag *ein anderer* Balken kurz vor dem Ziel steht: Heldenlevel, nächster Dungeon, ein Set-Teil, ein Rivalen-Platz, ein Gebäude. Heute gibt es nur den EP-Balken.

---

## 8. Zeitmanagement und Tagesplanung

**Ist Zeit knapp?** Nein, heute nicht. Mit 5 Helden und nur „Dungeon“ oder „Ausruhen“ gibt es keine Abwägung. Verletzung = genau 1 Tag; das ist kein Dilemma, sondern ein Skip.

**Wo das Potenzial liegt:** Die Tagesstruktur wird zur Stärke, sobald **drei Spannungen** gleichzeitig wirken:
1. *Mehr Helden als Plätze* (z.B. 8 Helden, 5er-Gruppen),
2. *eine zweite sinnvolle Aufgabe* (z.B. „Training“: +EP ohne Risiko; „Erkunden“: Info über den nächsten Boss; „Handwerk“: Material → Verbesserung),
3. *Ermüdung oder Verletzung*, die Rotation erzwingt.

Dann lautet die Frage jeden Morgen: „Schicke ich die A-Gruppe nochmal, obwohl der Tank angeschlagen ist, oder lasse ich die B-Gruppe ran?“ Das ist ein echter Manager-Moment.

**Zu kleinteilig?** Ja, wenn jede Aufgabe pro Held einzeln angeklickt werden muss. Lösungen: Gruppen sind **feste Teams**, die man als Ganzes einplant; „wie gestern“ ist ein Knopf; freie Helden bekommen automatisch eine Standardaufgabe, die man einstellen kann.

**Ist die Tagesstruktur eine echte Stärke?** Als Rahmen: ja (Pausieren jederzeit, handytauglich, Wertung in Tagen). Als Entscheidung: noch nicht.

---

## 9. Schwierigkeit, Scheitern, Risiko

**Verständlich und fair?** Heute ist Risiko **binär** und **unsichtbar**: passende Stufe = sicher, höhere Stufe = Wand, und vorher zeigt nichts außer „Empf. AW“ den Unterschied. Das fühlt sich vermutlich nicht nach eingegangenem Risiko an, sondern nach Bestrafung.

**Verletzungen:** 1 Tag Pause ist bloße Wartezeit. Interessanter: Verletzung als **Zustand mit Wahl** – z.B. „angeschlagen“ (−20 % Leben, kann kämpfen) vs. „ausruhen“. Dann entscheidet der Spieler, ob er das Risiko trägt.

**Permadeath vs. Sammelmotivation:** Das „Erbe“ (Ausrüstung bleibt) und die Aufhol-EP sind gut durchdacht und entschärfen den Widerspruch. Das verbleibende Risiko: Ein Held mit seltener Seltenheit (Orange, 0,5 % Rekrutierchance) ist kaum ersetzbar. Entweder Helden-Seltenheit schwächer machen (sie ist es heute schon: +20 % Grundwerte, +50 % Wachstum) oder legendäre Helden nicht in Hardcore schicken lassen – letzteres wäre eine interessante Entscheidung an sich.

**Bewusstes Risiko statt Zufallsstrafe:** Dafür braucht es die Risiko-Anzeige (Abschnitt 5) und eine **Belohnung, die mit dem Risiko steigt**. Heute ist „Riskant“ ein Fehler, keine Option. Vorschlag: Ein Dungeon kann mit einem **Einsatz** gestartet werden („Ohne Heiler“, „Unter Level“, „Schneller als 20 Runden“) und gibt dafür eine bessere Kiste. Das ist das Prinzip der Mythic-Plus-Affixe in klein und passt perfekt zum Gildenmeister: Ich wähle das Risiko, die Helden tragen es.

**Gescheiterte Runs:** Trash-Gold und -EP sind ein guter Anfang. Zusätzlich: Wissen. Nach einer Niederlage gegen einen Boss sollte die Gilde etwas über ihn „gelernt“ haben (z.B. wird die Risiko-Anzeige für diesen Boss genauer, oder der Hinweis zum Konter erscheint erst jetzt). Damit fühlt sich Scheitern wie Erkunden an.

**Trennung Normal / Hardcore:** Sinnvoll. Ich würde Permadeath aber erst einbauen, wenn Normal-Inhalte echte Risiko-Abwägungen haben – sonst testet man ein Hardcore-System auf einem Fundament, das selbst noch keine Spannung erzeugt.

---

## 10. Wirtschaft, Gildenhalle, Zusatzsysteme

**Gold heute (gemessen):** ~1 500 bei Tag 20, ~6 500 bei Tag 60. Die einzigen Ausgaben sind Anheuern (40–600), Reroll (20) und Kisten mit Item-Level 1. **Gold ist ab Woche 2 wertlos.**

**Welche Rolle sollte Gold haben?** Ein **Engpass zwischen zwei guten Dingen**. Konkrete Ausgaben, die echte Entscheidungen erzeugen:
- Verbrauchsgut vor einem Run, das genau eine Mechanik kontert (Feuerresistenz-Trank gegen die Frontwelle). Situativ, also gute Entscheidung.
- Verbessern eines Items vs. neuen Helden anheuern vs. Gebäude.
- Laufende Kosten (Sold für Helden pro Tag) als Abfluss, der eine große Gilde teuer macht – das macht „wie viele Helden halte ich?“ zur Frage. *Risiko:* fühlt sich wie Steuer an; nur testen, wenn Gold wirklich überläuft.

**Gildenhalle:** Gebäude sollten **Regeln ändern**, nicht nur Zahlen. Beispiele:
- Kartenraum: macht die Risiko-Anzeige genauer und nennt Gründe (schon im Konzept – gut).
- Trainingsplatz: schaltet die Aufgabe „Training“ frei (neue Tagesoption statt +X %).
- Lazarett: Verletzte können „angeschlagen“ kämpfen.
- Kaserne: zweite Gruppe pro Tag.
Ein Gebäude, das „+10 % EP“ gibt, ist ein unsichtbarer Balken und sollte vermieden werden.

**KI-Rivalen ohne Online-System:** Ja, das geht sehr billig: Jede KI-Gilde ist nur eine **Liste von Tagen**, an denen sie einen Boss besiegt (mit etwas Zufall). Eine Rangliste und ein Ticker daraus sind ein Nachmittag Arbeit und erzeugen echten Zeitdruck in Spieltagen. Das ist das System mit dem besten Verhältnis von Nutzen zu Aufwand im ganzen Plan – ich würde es **vorziehen** (siehe Priorität 5).

**Wie viel Inhalt für eine erste vollständige Version?** Mein Vorschlag für „Version 1.0, aber klein“:
- 6–8 Dungeons (Stufe 1–15), jeder Boss mit 2 Mechaniken, davon jede Mechanik-Art mindestens zweimal,
- 7–8 Klassen (dazu Paladin, Druide, Barde – je eine Alternative pro Rolle),
- 1 Endboss-Raid als Abschluss, KI-Rivalen, Wertung in Tagen.
- Ziel: 3–5 Stunden bis zum Endboss, ca. 60–90 Spieltage. Level 30 halte ich dafür für zu hoch: Mit 6–8 Dungeons reicht **Level 15**, jedes Level zählt dann noch mehr.

**Essenziell / optional / streichen**
- *Essenziell:* Risiko-Anzeige, wirksame Anweisungen, Boss-Item-Effekte, mehr Dungeons, KI-Rivalen, Endboss, Wertung.
- *Optional:* Sets, Sammelbuch, Verbrauchsgüter, Gildenhalle (2–3 Gebäude), Verbessern.
- *Vorerst streichen oder verschieben:* Crafting mit Rezepten, Fehlschlag-Chance beim Verbessern, Umskillen, Diplomatie, New Game+, 10er-Raids mit eigener Planung (lieber *ein* Endboss-Raid mit 2 Gruppen), Wanderhändler.

Grundsätzlich: **Weniger Systeme mit mehr Wechselwirkung sind hier klar besser.** Jedes neue System sollte mindestens zwei bestehende berühren (z.B. Verbrauchsgut ↔ Mechanik ↔ Gold).

---

## 11. Benutzerführung und Präsentation

(Nicht im Browser getestet – Einschätzung aus Code und Struktur.)

- **Versteht ein Neuling, was er tun soll?** Der Tagesplan als Startseite mit Hinweis auf freie Helden ist ein guter Leitfaden. Was fehlt, ist eine **„Nächster Schritt“-Zeile** („Heuere einen Heiler an“, „Deine Gruppe ist bereit für die Kapelle“).
- **Warum ist ein Held stark?** Der Ausrüstungswert (AW) mischt Werte, die für die Klasse nutzlos sind (Magie beim Krieger). Er ist deshalb ein irreführendes Signal. Mindestens: Power pro Klasse gewichten (Krieger: Angriff/Rüstung/Leben, Magier: Magie/Mana/Leben …). Das ist eine kleine Änderung in `Item.getPower`/`Hero.getUpgradeValue` mit großer Wirkung auf Upgrade-Pfeile und „Bestes anlegen“.
- **Seltenheit vs. Item-Level:** „Grün aus Dungeon 3 schlägt Blau aus Dungeon 1“ ist für MMO-Spieler intuitiv, für andere nicht. Item-Level sichtbar in die Ecke des Icons schreiben.
- **Immer sichtbar:** Tag, Gold, freie/verletzte Helden, nächste Bedrohung (Risiko der geplanten Runs). **In Details:** Werte, Skills, Anweisungen.
- **Klicks reduzieren:** „Gruppe wie gestern“, „Alle Kisten öffnen“ (mit Highlight-Moment nur beim besten Item), Schrott automatisch verkaufen.
- **Handy:** Kritisch sind vermutlich die Kampfszene mit 5 Helden + Gegnern auf 390 px, Tooltips (Antippen statt Hover ist gelöst) und das Inventar. Bitte gezielt auf einem echten Handy testen, bevor neue Bildschirme dazukommen.
- **Visuelle Identität:** Die Pixel-Sprites als Text-Raster sind charmant. Identität entsteht aber eher durch **Ton und Geschichten** als durch Grafik: Helden-Kommentare im Ticker, eine Gildenchronik („Tag 14: Brakka hält Skarrix' Säureschwall mit letzter Kraft“), Ehrenhalle. Das ist billig (Text) und macht den Gildenmeister-Gedanken fühlbar.

Optischer Feinschliff (später): Effekte, Sounds, Animationen. **Spielverbessernd (jetzt):** Risiko-Anzeige, Kausal-Momente, Hauptgrund im Bericht, klassenbezogener AW.

---

## 12. Entwicklungsstrategie

**1. Was als Nächstes testen?** Ob eine *echte Wahl vor dem Run* das Spielgefühl ändert. Nicht ob Sets Spaß machen – das hängt davon ab.

**2. Riskanteste Annahmen**
- „Zuschauen macht Spaß“ – nur bei Ungewissheit, und die gibt es heute nicht.
- „Vorbereitung ist taktische Tiefe“ – gemessen: kaum.
- „Lootboxen + Farben tragen die Motivation“ – Farben tragen ~1 Stunde, Bedeutung trägt länger.

**3. Selbst testen:** Eine Woche lang jeden Abend 10 Spieltage spielen und nach jedem Tag eine Zeile notieren: „Habe ich heute etwas entschieden? Was?“ Wenn die Antwort meist „nein“ ist, ist das der wichtigste Befund.

**4. Per Simulation prüfbar (ohne KI-Kosten)**
- Anweisungs-Bericht (dominant / nutzlos / Falle) – siehe Abschnitt 2; die Skripte existieren schon.
- Bot-Durchlauf: Tage bis zu jedem Dungeon, Gold-Kurve, Erfolgsquote, Anteil Upgrade-Items.
- Zielwerte, die ein Test automatisch prüfen kann: „Bei passendem Level 65–85 % statt 99 %“, „keine Anweisung ist gegen alle Bosse die beste“, „jede Anweisung ist gegen mindestens einen Boss die beste“.

**5. Menschen brauchst du für:** Wird die Szene übersprungen? Versteht man, warum man verloren hat? Will man „noch einen Tag“?

**6. Mit wenigen Testern viel lernen:** 3–5 Personen, je 20 Minuten, *beobachtet* (Bildschirm teilen, laut denken lassen). Nicht erklären. Danach drei Fragen: „Was war der beste Moment?“, „Wann hast du dich gelangweilt?“, „Was hättest du gern anders entschieden?“

**7. Kennzahlen für einen kurzen Playtest** (lassen sich lokal im Spielstand mitzählen, ohne Server):
- Gespielte Tage pro Sitzung; aufgehört an welchem Tag/Bildschirm.
- Anteil übersprungener Szenen und durchschnittliche Zuschaudauer.
- Wie oft Anweisungen geändert werden (und wie oft wieder zurück).
- Anteil Runs, die als „riskant“ gestartet werden.
- Zeit zwischen Kiste und „Tag beenden“ (zeigt, ob ausgerüstet/geplant wird oder nur durchgeklickt).
Ein Knopf „Testdaten kopieren“ im Test-Menü reicht, Tester schicken den Text.

**8. Eigenes Interesse vs. Belohnungsreiz:** Achte darauf, ob Tester **über Entscheidungen reden** („ich hätte den Schurken mitnehmen sollen“) oder nur über Beute („wieder nur grün“). Ersteres ist intrinsische Motivation. Ein weiteres Zeichen: Spielen sie weiter, wenn du ihnen sagst, dass die nächsten zwei Tage garantiert keine lila Items bringen?

**9. Features klein schneiden:** Jede Idee zuerst als **Daten-only-Version**: ein Boss-Item-Effekt, eine neue Anweisung, ein neuer Dungeon. Wenn eine Idee neue Bildschirme braucht, zuerst im Kampf-Labor oder Test-Menü ausprobieren.

**10. Vorerst nicht bauen:** siehe Abschnitt 14 unten.

---

## 13. Eigene Ideen

Bewertet nach Nutzen / Aufwand / Risiko.

**A. Die Wertung in Tagen zum Kern machen** (Nutzen hoch / Aufwand niedrig / Risiko niedrig)
Das ist das potenzielle Alleinstellungsmerkmal: ein **Speedrun-Management-Spiel**. Jeder Tag kostet, jede Verletzung kostet, jedes Zurückfallen kostet. Dann wird „riskiere ich heute die Brutnester mit 60 %?“ eine echte Frage: Sieg spart zwei Tage, Niederlage kostet einen. Mit KI-Rivalen als Tempo-Markierung („Die Eisenfäuste waren an Tag 18 hier“) entsteht ohne Online-System ein Wettrennen. Dazu ein fester **Tages-Seed** pro Woche, damit Freunde dieselbe Welt spielen und Tage vergleichen können.

**B. Die Gildenchronik** (Nutzen mittel–hoch / Aufwand niedrig / Risiko niedrig)
Aus dem Kampfprotokoll automatisch 1–3 Sätze pro Tag erzeugen („Velra unterbricht zum dritten Mal Morvas Woge“). Daraus wachsen Lieblingshelden, die Ehrenhalle wird bedeutsam, und Permadeath tut emotional weh – im guten Sinn.

**C. Eine „Ansage“ pro Kampf statt vieler Anweisungen** (Nutzen hoch / Aufwand mittel / Risiko mittel)
Statt 14 Detail-Optionen wählt der Gildenmeister vor dem Run **eine von drei Gruppen-Ansagen** pro Boss, die eine Ressource tauschen, z.B. „Durchziehen“ (schneller, Heiler-Mana knapp), „Auf die Mechanik spielen“ (Konter-Skills werden aufgespart, weniger Schaden), „Diener ignorieren“. Das ist im Prinzip die gestrichene Gruppen-Taktik – der Unterschied wäre, dass jede Ansage **genau einen sichtbaren Effekt** hat und gegen einen bestimmten Boss klar besser ist. Wichtig: erst messen, dann bauen.

**D. Erkunden als Tagesaufgabe** (Nutzen mittel / Aufwand niedrig / Risiko niedrig)
Ein Held geht einen Tag „spähen“ und enthüllt Mechaniken, Konter-Hinweise oder eine genauere Risiko-Spanne für einen Dungeon. Das macht freie Helden nützlich, gibt Information als Ressource und verknüpft Tagesplanung mit Kampf. Ersetzt teilweise den Kartenraum.

**E. Einsätze/Modifikatoren für Dungeons** (Nutzen hoch / Aufwand mittel / Risiko mittel)
Siehe Abschnitt 9. Aus dem Genre der Roguelikes (Hades' „Hitze“, WoW Mythic+): freiwillige Erschwernis gegen bessere Belohnung. Hält alte Dungeons relevant und gibt dem Endgame Inhalt ohne neue Dungeons.

**F. Helden-Macken mit Wirkung** (Nutzen mittel / Aufwand mittel / Risiko mittel)
Eigenschaften, die *Verhalten* ändern statt Werte: „Hitzkopf: greift immer den Boss an“, „Feigling: zieht sich bei 30 % Leben zurück“, „Gierig: +Gold, aber verlässt die Gilde nach 3 Tagen ohne Beute“. Das passt zur Anweisungs-Logik in `HeroAI` und macht Helden zu Persönlichkeiten. Die zwei wirkungslosen Eigenschaften wären der Startpunkt.

**Streichen oder vereinfachen**
- Kaufbare Kisten (sofort).
- 6er-Set-Boni, Fehlschlag-Chance beim Verbessern, separates Crafting-System mit Rezepten (vorerst).
- Level 30 → 15 für Version 1 erwägen.

---

## 14. Priorisierung

### P1 – Echte Risiko-Wahl vor dem Run (Risiko-Anzeige + flachere Klippe)
- **Problem:** Erfolg ist binär (99 % bei passendem Level, ~20–50 % darüber) und vorher unsichtbar.
- **Begründung:** „Tag beenden“ wird nur spannend, wenn man mit Ungewissheit startet, die man selbst gewählt hat.
- **Lösung:** (a) Risiko-Spanne in Worten im Dungeon-Bildschirm (`estimateChances` mit ~50 Runs, eingefärbt), (b) Zielwerte ändern: passende Stufe ~70–80 % statt 99 %, eine Stufe darunter ~40–55 % statt ~0–50 %. Das geht über die Zahlen in `scaling.js`/`enemies.js`.
- **Nutzen:** hoch. **Aufwand:** niedrig–mittel. **Risiko:** mehr Niederlagen fühlen sich schlecht an, wenn Scheitern nichts bringt → zusammen mit „Hauptgrund im Bericht“ (P3) einführen.
- **Validierung:** Bot-Erfolgsquote 70–85 %; in Playtests: Wie oft starten Spieler bewusst „riskant“?
- **Priorität:** Jetzt testen.

### P2 – Anweisungen umbauen: weniger, schärfer, situativ
- **Problem:** Von 14 Alternativen verbessert nur eine; viele sind Fallen bis −44 Punkte.
- **Begründung:** Eine Option, die nur verschlechtern kann, ist keine Wahl (euer eigener Grundsatz).
- **Lösung:** Pro Klasse eine Anweisung mit 2–3 Optionen, die etwas *anderes* priorisieren (Mana vs. Tempo, Schutz vs. Schaden). Den Balancing-Bericht als Test einbauen: Jede Option muss gegen mindestens einen Boss die beste sein.
- **Nutzen:** hoch. **Aufwand:** mittel (meist `heroOrders.js` + Bedingungen in `HeroAI.js`). **Risiko:** Mit nur 3 Bossen ist „situativ“ schwer herzustellen → zusammen mit P4.
- **Validierung:** Anweisungs-Bericht zeigt pro Boss eine andere beste Kombination.
- **Priorität:** Jetzt testen.

### P3 – Kampfszene kürzen und Ursachen zeigen
- **Problem:** 2–3½ Minuten pro Run, Ausgang meist bekannt, Grund einer Niederlage unklar.
- **Begründung:** Zuschauen lohnt sich nur, wenn es etwas erklärt oder spannend ist.
- **Lösung:** Trash automatisch im Zeitraffer; „ereignislose“ Runden schneller; Kausal-Einblendungen (Konter gegriffen / verpasst); im Bericht eine Zeile „Hauptgrund“.
- **Nutzen:** hoch. **Aufwand:** niedrig–mittel (`BattleTimeline`, `combatRules.pacing`, `CombatReport`). **Risiko:** Zu schnell → nicht mehr lesbar.
- **Validierung:** Anteil übersprungener Szenen sinkt; Tester können nach einer Niederlage den Grund nennen.
- **Priorität:** Jetzt testen.

### P4 – Boss-Items mit Effekt (Beute → neuer Plan)
- **Problem:** Items sind nur größere Zahlen; „Bestes anlegen“ löst alles; Kisten sind Farbe statt Bedeutung.
- **Begründung:** Ein Item, das eine Mechanik kontert, verändert die nächste Gruppenplanung. Das schließt den Loop.
- **Lösung:** Jedes der 9 Boss-Items bekommt einen kleinen Effekt (Datenfeld `effect` in `lootBoxes.js`, 3–4 Effekt-Typen im Kampf). Dazu: Power pro Klasse gewichten (`getPower`).
- **Nutzen:** hoch. **Aufwand:** mittel. **Risiko:** Effekte zu stark → Pflicht-Items.
- **Validierung:** Im Labor: Boss-Item-Effekt bewegt die Chance gegen *seinen* Boss um 5–15 Punkte, gegen andere kaum.
- **Priorität:** Bald umsetzen.

### P5 – KI-Rivalen und Tage-Wertung früh einbauen
- **Problem:** Es gibt kein langfristiges Ziel und keinen Zeitdruck.
- **Begründung:** Macht jeden Tag zu einer Ressource und gibt der Risiko-Wahl (P1) Gewicht.
- **Lösung:** 3–4 KI-Gilden als einfache Tageslisten in `src/data/`, Rangliste + Ticker im Tagesplan.
- **Nutzen:** hoch. **Aufwand:** niedrig–mittel. **Risiko:** Druck fühlt sich stressig an → Rivalen zunächst nur als Vergleich, nicht als Niederlage.
- **Validierung:** Erwähnen Tester die Rivalen ungefragt?
- **Priorität:** Bald umsetzen (vor Sets und Gildenhalle).

### P6 – Gold-Abfluss und kaufbare Kisten entfernen
- **Problem:** Tausende Gold ohne Nutzen; Händlerkisten mit Item-Level 1.
- **Lösung:** Kisten aus dem Händler nehmen; 2–3 situative Verbrauchsgüter (je eines gegen eine Mechanik-Art).
- **Nutzen:** mittel. **Aufwand:** niedrig. **Risiko:** gering.
- **Validierung:** Bot-Goldkurve flacht ab; Spieler kaufen vor schweren Runs gezielt.
- **Priorität:** Bald umsetzen.

### P7 – Mehr Helden als Plätze + eine zweite Tagesaufgabe
- **Problem:** Tagesplanung hat keine Abwägung.
- **Lösung:** Eine Aufgabe „Erkunden“ oder „Training“ in `heroTasks.js`, Verletzung als „angeschlagen“ mit Wahl.
- **Nutzen:** mittel–hoch. **Aufwand:** mittel. **Risiko:** Klickaufwand → „wie gestern“-Knopf mitbauen.
- **Validierung:** Spieler halten freiwillig mehr als 5 Helden.
- **Priorität:** Bald umsetzen.

### P8 – Kleine Fehler und Ehrlichkeit der Anzeige
- **Problem:** „Gierig“ und „Glückspilz“ wirken nicht; AW zählt klassenfremde Werte.
- **Lösung:** Beide Eigenschaften implementieren oder ausblenden; AW pro Klasse gewichten.
- **Nutzen:** mittel. **Aufwand:** niedrig. **Risiko:** keins.
- **Priorität:** Jetzt (Kleinkram).

### P9 – Inhalt: 3 weitere Dungeons + 2–3 Klassen
- **Problem:** Nach ~14 Tagen ist alles gesehen; mit 5 Klassen gibt es praktisch eine Gruppe.
- **Lösung:** Erst nach P1–P4, damit neuer Inhalt auf einem tragfähigen Kern steht.
- **Nutzen:** hoch. **Aufwand:** mittel–hoch. **Risiko:** Content vor Kern.
- **Priorität:** Später erwägen (nach den Experimenten).

### Ausdrücklich

**Drei Dinge, die du beibehalten solltest**
1. Rundenbasiert mit „Tag beenden“ und Wertung in Tagen – der stärkste, eigenständigste Rahmen.
2. Boss-Mechaniken mit Konter durch Klassen – der einzige Ort, an dem der Entscheidungs-Grundsatz heute wirklich lebt.
3. Die Arbeitsweise: Daten in `src/data/`, Kampf-Labor, Tests, kleine spielbare Schritte. Sie ermöglicht genau die Experimente, die jetzt nötig sind.

**Drei größte Risiken**
1. **Vorbereitung bewegt den Ausgang kaum** (gemessen: Anweisungen fast wirkungslos oder schädlich, Level entscheidet). Dann wird jedes weitere System Verwaltung.
2. **Zuschauen ohne Ungewissheit** – lange Szenen mit bekanntem Ergebnis.
3. **Feature-Breite vor Kern-Tiefe** – Sets, Gildenhalle, Crafting, Raids auf einem Loop, der noch keine Spannung erzeugt.

**Drei nächste Experimente**
1. **Klippe abflachen + Risiko-Anzeige** (P1): nur Zahlen in `src/data/` und eine Anzeige. Frage: Fühlt sich „Tag beenden“ anders an?
2. **Anweisungs-Bericht als automatischer Test**, danach 2 Klassen testweise auf je eine situative Anweisung umbauen (P2). Frage: Ändern Spieler die Anweisung je nach Boss?
3. **Szene kürzen + Hauptgrund** (P3) und 3 Tester beobachten. Frage: Wie oft wird übersprungen, und können sie sagen, warum sie verloren haben?

**Drei Features, die du vorerst nicht bauen solltest**
1. Crafting mit Rezepten und Fehlschlag-Chance beim Verbessern.
2. 10er-Raids als eigenes System (vorerst ein Endboss mit zwei Gruppen reicht).
3. 6er-Set-Boni und das komplette Sammelbuch – zuerst müssen einzelne Items bedeutsam sein (P4).

---

## 15. Nachtrag: Ausrichtung als Sammelspiel (2026-10-21)

**Entscheidung des Entwicklers:** Das Spiel ist in erster Linie ein **Sammelspiel**. Wettbewerb ist eine **freiwillige Zusatzschicht** (Bestenliste in Spieltagen). Nach dem Endboss gibt es einen **Incremental-Teil** für den nächsten Durchgang.

Was das für diesen Review ändert (alles Vorschläge, noch nicht entschieden):

- **P1 (Risiko-Wahl):** bleibt wichtig, aber mit anderem Ziel. Bei passendem Level eher **85–90 %** Erfolg statt 70–80 %. Die Klippe muss trotzdem weg, und die Risiko-Anzeige brauchen beide Spielertypen. Mehr Risiko kommt über **freiwillige Dungeon-Einsätze** (Idee E aus Abschnitt 13), die bessere Beute bringen.
- **P4 (Boss-Items mit Effekt):** rückt nach oben, direkt hinter P1. Ohne bedeutsame Items gibt es nichts, was sich zu sammeln lohnt.
- **Sammelbuch:** wird vom „später erwägen“ zum Langzeitmotor. Vorschlag: Es bleibt über alle Durchgänge bestehen.
- **P5 (KI-Rivalen):** rutscht nach hinten. Rivalen sind eher Kulisse und später eine optionale Bestenliste, kein Druckmittel. Die Tage-Wertung bleibt, aber leise (Endauswertung, Bestenliste).
- **Meta-Progression:** mitnehmen sollte man vor allem **Breite** (Klassen, Startheld, ein Erbstück), kaum **Stärke**. Bestenliste pro Prestige-Stufe oder ein Wochen-Seed ohne Meta-Boni, damit sie fair bleibt. **Jetzt noch nicht bauen**, aber Sammelbuch und Freischaltungen schon getrennt vom Spielstand speichern.
- **Abschnitt 14, „Drei Features, die du vorerst nicht bauen solltest“:** Punkt 3 gilt weiter für die 6er-Boni, aber eine einfache Version des Sammelbuchs darf früher kommen, sobald Boss-Items Effekte haben.

**Neue Reihenfolge (Vorschlag):** P8 (kleine Fehler) → P1 → P4 → P2 → P3 → einfaches Sammelbuch → P6 → P7 → P9 → P5.

Der Textbaustein für `KONZEPT.md` liegt als eigene Datei bei (`KONZEPT-Abschnitt-Spielerprofil.md`).
