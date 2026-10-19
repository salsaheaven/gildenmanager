# Gildenmanager – Spielkonzept

Man führt eine MMORPG-Gilde, kämpft aber nicht selbst. Man rekrutiert Helden, rüstet sie aus, schickt sie in Dungeons und Raids
und baut die Gildenhalle aus. Am Ende steht ein **Endboss**: Das Spiel hat ein Ende und eine Wertung.

Stand: Konzept-Session 2 – Kampf (2026-10-19)

## Die drei Loops

**Minuten-Loop (der Kern):**
Gruppe zusammenstellen → Dungeon (Fortschrittsbalken, Live-Ticker) → **Boss-Kiste öffnen** → zerlegen, verbessern, ausrüsten → nächster Run

**Stunden-Loop:**
Helden leveln und Talente vergeben · Klassen-Sets vervollständigen (2/4/6-Boni, Sammelbuch) · Gildenhalle ausbauen ·
neue Dungeon-Stufen freischalten · Hardcore-Risiko abwägen

**Spiel-Loop:**
Raids → Endboss · Rangliste gegen KI-Gilden · Endauswertung

## Entscheidungen

| Thema | Entscheidung |
|---|---|
| Helden | Persönlichkeiten: zufällige Bewerber mit Namen, **Seltenheit** (Grün bis Orange) und Eigenschaften (z.B. „Gierig“, „Mutig“) |
| Helden-Seltenheit | Bewirkt mehr Wachstum pro Level und mehr Eigenschafts- bzw. Talentplätze. Gute Ausrüstung kann eine niedrige Seltenheit ausgleichen. |
| Klassen | 12 Klassen in 4 Rollen, Details siehe [Kampf](#kampf). M1 startet mit 5 Klassen. |
| Dungeons | MMO-Klassiker: 5er-Gruppe aus Tank, Heiler und 3 DD. Stufen Normal → Heroisch → Raids (10 und mehr Helden). Jede Stufe hat ein empfohlenes Ausrüstungsniveau. |
| Tempo | Aktiv mit kurzen Timern: Dungeons dauern 30 Sekunden bis wenige Minuten, dazu gibt es Pause und Speed |
| Scheitern | Normal-Dungeons: Die Helden werden **verletzt** und fallen eine Weile aus. **Permadeath nur in Hardcore-Inhalten** (Heroisch, Raids): Das Risiko geht man freiwillig für bessere Beute ein. |
| Erbe | Stirbt ein Held, wird für jedes seiner Ausrüstungsteile einzeln gewürfelt, ob es zurückkommt. Die Chance steht in `data/`. Gefallene bekommen einen Platz in der **Ehrenhalle**. |
| Beute | Bosse haben feste Beutetabellen, z.B. bestimmte Set-Teile. Ihre Beute kommt in eine **Boss-Kiste**, die man mit der Öffnen-Animation öffnet. |
| Item-Nutzen | **Zerlegen → Material → Verbessern (+1 bis +10)**, ab einer bestimmten Stufe mit Fehlschlag-Chance. Material dient auch als Zutat fürs Crafting, z.B. für Set-Teile. |
| Spielende | **Endboss** als letzter Raid |
| Wertung | **Endauswertung in Spieltagen**: Wie viele Spieltage hat man bis zum Endboss gebraucht? Gezählt wird Spielzeit, also bringen Pause und Speed keinen Vorteil. Das Ergebnis lässt sich vergleichen („2 Tage schneller als du“). |
| Rivalen | KI-Gilden in einer **Rangliste** mit Server-First-Rennen und Neuigkeiten-Ticker („Die Eisenfäuste besiegen als erste Gilde den Drachen!“). Legt eine KI-Gilde den Endboss zuerst, kann man trotzdem selbst noch zu Ende spielen. |
| Kisten-Quellen | Bis M1 bringt der Gildenkurier regelmäßig Gratis-Kisten. Das ist nur eine Starthilfe zum Testen. **Ab M2 gibt es keine automatisch gelieferten Kisten mehr.** Kisten kommen dann nur noch aus Dungeons und Bossen. |
| Händler und Gold | **Ab M2 sind Kisten und Ausrüstung nicht mehr kaufbar.** Ausrüstung gibt es nur aus Dungeons und durchs Crafting. Mit Gold kauft man Verbrauchsgüter (Tränke, Fläschchen und Proviant als Buffs für einen Run, z.B. Feuerresistenz gegen den Drachen) und Crafting-Materialien. Außerdem kosten Gold: Helden anheuern, Bewerber neu rufen, Heilen, Verbessern, **Umskillen** (Talente neu verteilen), Gebäude. |
| Wanderhändler | Taucht ab und zu für kurze Zeit auf und bietet 1 bis 2 feste Items zu hohen Preisen an. Das hilft gegen Pech in einem einzelnen Ausrüstungsplatz, ersetzt aber keine Dungeons. |
| Pity-System | Bleibt im Hintergrund exakt, wird dem Spieler aber **bewusst ungenau** angezeigt: keine Zahlen und kein Balken, nur eine Stimmung, die stärker leuchtet („Etwas Großes kündigt sich an!“) |
| Später | New Game+ (die Endauswertung bereitet es vor), Diplomatie |

## Kampf

### Grundprinzip
- **Runden-Simulation:** Ein Dungeon ist eine Kette von Begegnungen (Trash, danach der Boss). Jede Begegnung wird Runde für Runde berechnet.
- **Siegchance:** Vor dem Start simuliert das Spiel den Kampf 200-mal und zeigt Erfolgs- und Todesrisiko genau an, z.B. „78 % Erfolg, 6 % Todesgefahr“.
- **Taktik vor dem Start:** Vorsichtig, Ausgewogen oder Aggressiv. Die Taktik beeinflusst, wann Heilungen und Abklingzeiten eingesetzt werden.
- **Rückzug:** Jederzeit während des Runs möglich. Es gibt dann keine Beute, aber alle, die noch stehen, überleben.
- **Darstellung:** Der vorberechnete Kampf wird in Spielzeit als **Live-Ticker** abgespielt, mit Lebensbalken für Gruppe und Gegner. Danach folgt der vollständige Kampfbericht.
- **Zwei Reihen:** Vorne stehen Tanks und Nahkämpfer, hinten Fernkämpfer, Heiler und Supporter. Manche Bossfähigkeiten treffen nur eine Reihe.
- **Ressourcen:** Alle Skills haben Abklingzeiten. Heiler und Zauberer brauchen zusätzlich **Mana**. Geht dem Heiler das Mana aus, wird es gefährlich.
- **Tod (nur Hardcore):** Wer auf 0 Leben fällt, ist tot, auch wenn die Gruppe gewinnt. In Normal-Dungeons ist er stattdessen verletzt.

### Bosse
Jeder Boss hat 1 bis 3 **Mechaniken mit Konter**, sodass die Gruppenzusammenstellung eine echte Entscheidung wird. Beispiele:

| Mechanik | Konter |
|---|---|
| Tank-Buster (riesiger Schlag auf den Tank) | Priester (Strom des Lebens), Runenwirker (Runenpanzer), Krieger (Eiserne Wacht) |
| Gefährlicher Zauber | Schurke (Stummschlag unterbricht) |
| Diener-Wellen | Magier (Aschenregen), Jäger (Pfeilfächer), CC |
| Schaden auf die ganze Gruppe | Druide (Hainsegen), Paladin (Schwur der Standhaftigkeit), Schamane (Felsenpfahl) |
| Wutanfall nach X Runden | Genug Schaden: Barde (Lied der Klingen), Hexenmeister (Bruchmal) |
| Fluch oder Furcht | Runenwirker (Lösungsrune), Barde (Weckruf) |
| Flammenwelle auf die vordere Reihe | Weniger Nahkämpfer mitnehmen, Feuerresistenz |

### Klassen
Jeder Skill hat eine Abklingzeit und kostet bei Zauberern Mana. Alle Zahlen stehen später in `src/data/abilities.js`.
**M1** = in Meilenstein 1 enthalten.

| Rolle | Klasse | Skill 1 | Skill 2 | Skill 3 | M1 |
|---|---|---|---|---|---|
| Tank | **Krieger** | Bollwerkstoß (Schaden + viel Aggro) | Herausforderungsruf (zwingt den Gegner, ihn anzugreifen) | Eiserne Wacht (−50 % Schaden für 3 Runden) | ✅ |
| Tank | **Paladin** | Lichtbrecher (Schaden + Aggro) | Gelübde der Genesung (heilt sich selbst stark) | Schwur der Standhaftigkeit (die ganze Gruppe nimmt −10 % Schaden) | |
| Heiler | **Priester** | Strom des Lebens (riesige Einzelheilung, teuer) | Funke der Gnade (schnell, kleiner, günstig) | Stille Andacht (stellt Mana wieder her) | ✅ |
| Heiler | **Druide** | Moosmantel (Heilung über Zeit) | Hainsegen (Heilung über Zeit für alle) | Ruf der Wurzeln (belebt einen Gefallenen einmal pro Kampf) | |
| Heiler | **Runenwirker** | Runenpanzer (fängt Schaden vorab ab) | Glyphenkreis (kleine Schilde für alle) | Lösungsrune (entfernt einen Fluch oder Debuff) | ✅ |
| DD hinten | **Magier** | Glutlanze (hoher Einzelschaden) | Aschenregen (Flächenschaden auf alle Gegner) | Eiskranz (friert alle Gegner 1 Runde ein, CC) | ✅ |
| DD hinten | **Jäger** | Falkenauge (konstanter Einzelschaden) | Pfeilfächer (trifft 3 Ziele) | Fangnetz (setzt einen Diener 3 Runden fest, CC) | |
| DD vorne | **Schurke** | Schattenstich (hohe Krit-Chance) | Stummschlag (unterbricht einen Boss-Zauber) | Natternbiss (Schaden über Zeit) | ✅ |
| DD vorne | **Barbar** | Sensenkreis (Schaden an allen Gegnern vorne) | Wundenzorn (mehr Schaden, je weniger Leben er hat) | Steinherz (ignoriert 2 Runden lang Betäubung und Furcht) | |
| Support | **Barde** | Lied der Klingen (+20 % Schaden für die Gruppe) | Schlummerweise (schläfert einen Gegner ein, CC) | Weckruf (beendet Furcht und Betäubung) | |
| Support | **Schamane** | Bärenpfahl (+Angriff für die vordere Reihe) | Quellpfahl (Mana für alle Heiler und Zauberer) | Felsenpfahl (−Flächenschaden für die Gruppe) | |
| Support | **Hexenmeister** | Welkfluch (Boss macht −20 % Schaden) | Bruchmal (Boss nimmt +15 % Schaden) | Zehrender Griff (Schaden, heilt den Hexenmeister) | |

## Noch offen (nächste Sessions)
- **Kampf-Feinheiten:** Erste Version steht im Kampf-Labor. Werte: Leben, Mana, Angriff, Magie, Rüstung. Aggro entsteht durch Schaden (beim Tank ×3 bis ×4) und Heilung. Die Taktiken verschieben Heilschwelle und Schaden. Alle Zahlen stehen in `src/data/`. Noch offen: Krit als eigener Wert auf Items? Wie stark fallen Eigenschaften im Kampf ins Gewicht?
- **Umfang:** Wie viele Dungeons und Raids gibt es? Wie lange dauert ein Durchlauf bis zum Endboss, in Spieltagen und in echten Stunden?
- **KI-Gilden:** Fortschrittskurve, Namen, Persönlichkeit, Reaktionen
- **Verbrauchsgüter:** Welche Tränke, Fläschchen und Proviant gibt es, und was bewirken sie genau?
- **Wirtschaft:** Woher kommt Gold, wofür gibt man es aus?
