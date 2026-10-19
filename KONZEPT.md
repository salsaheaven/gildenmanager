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
| Tank-Buster (riesiger Schlag auf den Tank) | Priester (große Heilung), Runenwirker (Schild), Krieger (Schildwall) |
| Gefährlicher Zauber | Schurke (Tritt unterbricht) |
| Diener-Wellen | Magier (Flächenschaden), Jäger (Mehrfachschuss), CC |
| Schaden auf die ganze Gruppe | Druide (Flächenheilung), Paladin (Aura), Schamane (Totem) |
| Wutanfall nach X Runden | Genug Schaden: Barde (Kriegslied), Hexenmeister (Flüche) |
| Fluch oder Furcht | Runenwirker (Bannrune), Barde (Heldenballade) |
| Flammenwelle auf die vordere Reihe | Weniger Nahkämpfer mitnehmen, Feuerresistenz |

### Klassen
Jeder Skill hat eine Abklingzeit und kostet bei Zauberern Mana. Alle Zahlen stehen später in `src/data/abilities.js`.
**M1** = in Meilenstein 1 enthalten.

| Rolle | Klasse | Skill 1 | Skill 2 | Skill 3 | M1 |
|---|---|---|---|---|---|
| Tank | **Krieger** | Schildschlag (Schaden + viel Aggro) | Spott (zwingt den Gegner, ihn anzugreifen) | Schildwall (−50 % Schaden für 3 Runden) | ✅ |
| Tank | **Paladin** | Heiliger Hieb (Schaden + Aggro) | Handauflegen (heilt sich selbst stark) | Aura der Hingabe (die ganze Gruppe nimmt −10 % Schaden) | |
| Heiler | **Priester** | Große Heilung (riesige Einzelheilung, teuer) | Blitzheilung (schnell, kleiner, günstig) | Gebet der Hoffnung (stellt Mana wieder her) | ✅ |
| Heiler | **Druide** | Verjüngung (Heilung über Zeit) | Wildwuchs (Heilung über Zeit für alle) | Wiedergeburt (belebt einen Gefallenen einmal pro Kampf) | |
| Heiler | **Runenwirker** | Runenschild (fängt Schaden vorab ab) | Schutzzeichen (kleine Schilde für alle) | Bannrune (entfernt einen Fluch oder Debuff) | ✅ |
| DD hinten | **Magier** | Feuerball (hoher Einzelschaden) | Flammensturm (Flächenschaden auf alle Gegner) | Frostnova (friert alle Gegner 1 Runde ein, CC) | ✅ |
| DD hinten | **Jäger** | Gezielter Schuss (konstanter Einzelschaden) | Mehrfachschuss (trifft 3 Ziele) | Eisfalle (setzt einen Diener 3 Runden fest, CC) | |
| DD vorne | **Schurke** | Meucheln (hohe Krit-Chance) | Tritt (unterbricht einen Boss-Zauber) | Giftklinge (Schaden über Zeit) | ✅ |
| DD vorne | **Barbar** | Wirbelwind (Schaden an allen Gegnern vorne) | Blutrausch (mehr Schaden, je weniger Leben er hat) | Unbändig (ignoriert 2 Runden lang Betäubung und Furcht) | |
| Support | **Barde** | Kriegslied (+20 % Schaden für die Gruppe) | Wiegenlied (schläfert einen Gegner ein, CC) | Heldenballade (beendet Furcht und Betäubung) | |
| Support | **Schamane** | Totem der Stärke (+Angriff für die vordere Reihe) | Manaquell-Totem (Mana für alle Heiler und Zauberer) | Erdwall-Totem (−Flächenschaden für die Gruppe) | |
| Support | **Hexenmeister** | Fluch der Schwäche (Boss macht −20 % Schaden) | Fluch der Verwundbarkeit (Boss nimmt +15 % Schaden) | Seelenentzug (Schaden, heilt den Hexenmeister) | |

## Noch offen (nächste Sessions)
- **Kampf-Feinheiten:** Werteliste (Leben, Angriff, Magie, Rüstung, Krit, Mana …), Aggro-Formel, die genaue Wirkung der Taktiken
- **Umfang:** Wie viele Dungeons und Raids gibt es? Wie lange dauert ein Durchlauf bis zum Endboss, in Spieltagen und in echten Stunden?
- **KI-Gilden:** Fortschrittskurve, Namen, Persönlichkeit, Reaktionen
- **Kurier und Händler aus M0:** Vorschlag: Der Kurier ist nur eine Starthilfe, der Händler bleibt als Gold-Senke
- **Wirtschaft:** Woher kommt Gold, wofür gibt man es aus?
