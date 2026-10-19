# Gildenmanager – Spielkonzept

Man führt eine MMORPG-Gilde, kämpft aber nicht selbst. Man rekrutiert Helden, rüstet sie aus, schickt sie in Dungeons und Raids
und baut die Gildenhalle aus. Am Ende steht ein **Endboss**: Das Spiel hat ein Ende und eine Wertung.

Stand: Konzept-Session 1 (2026-10-19)

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
| Klassen | Krieger (Tank), Priester (Heiler), Magier und Jäger (DD). Weitere kommen später. |
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

## Noch offen (nächste Sessions)
- **Kampf:** Wie läuft er genau ab? Welche Werte gibt es, wie wirken die Rollen, und wie ergibt sich die Erfolgs- bzw. Todeschance?
- **Umfang:** Wie viele Dungeons und Raids gibt es? Wie lange dauert ein Durchlauf bis zum Endboss, in Spieltagen und in echten Stunden?
- **KI-Gilden:** Fortschrittskurve, Namen, Persönlichkeit, Reaktionen
- **Kurier und Händler aus M0:** Vorschlag: Der Kurier ist nur eine Starthilfe, der Händler bleibt als Gold-Senke
- **Wirtschaft:** Woher kommt Gold, wofür gibt man es aus?
