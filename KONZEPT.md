# Gildenmanager – Spielkonzept

Man führt eine MMORPG-Gilde, kämpft aber nicht selbst. Man rekrutiert Helden, rüstet sie aus, schickt sie in Dungeons und Raids
und baut die Gildenhalle aus. Am Ende steht ein **Endboss**: Das Spiel hat ein Ende und eine Wertung.

Stand: Konzept-Session 2 – Kampf (2026-10-19), Umstellung auf Runden (2026-10-20)

## Design-Grundsatz: echte Entscheidungen
**Jede Wahlmöglichkeit braucht Vor- und Nachteile.** Ist eine Option in fast jeder Lage die beste, ist sie keine Wahl mehr, sondern eine Pflicht. Dann kann man sie auch gleich weglassen.
Das gilt für Anweisungen, Klassen, Eigenschaften, Talente, Ausrüstungswerte und Verbrauchsgüter.
- Gute Optionen sind **situativ**: gegen einen Boss stark, gegen einen anderen schwach (z.B. „Eiskranz sofort“: gut gegen Grimmzahn, schlecht gegen Skarrix).
- Oder sie haben einen **Preis**: mehr Sicherheit kostet Mana, Tempo oder Schaden, mehr Schaden kostet Sicherheit.
- Beim Balancing für jede Wahl prüfen (im Kampf-Labor bzw. per Simulation), ob nicht eine Option alle anderen in allen Kämpfen schlägt.

## Die drei Loops

**Tages-Loop (der Kern):**
Tag planen (jedem Helden eine Aufgabe geben, Gruppen zusammenstellen) → **„Tag beenden“** → Kämpfe laufen als Szene ab → Tagesabschluss mit Beute, EP und Level-Ups → **Boss-Kisten öffnen** → zerlegen, verbessern, ausrüsten → nächster Tag

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
| Klassen | **Entschieden 2026-10-25** (Design-Review, P9): **15 Klassen**, je **3 pro Position**: Tank, Heiler, Nahkampf-DD, Fernkampf-DD, Support. Jede Klasse hat etwas, das nur sie kann, und eine klare Schwäche. Details siehe [Klassen](#klassen). Alle 15 sind im Spiel. |
| Dungeons | MMO-Klassiker: 5er-Gruppe aus Tank, Heiler und 3 DD. Stufen Normal → Heroisch. Jede Stufe hat ein empfohlenes Ausrüstungsniveau. |
| Aufbau eines Dungeons | Immer **mindestens eine Trash-Gruppe und ein Boss**. Spätere Dungeons haben mehrere Trash-Gruppen und 2 bis 3 Bosse. Leben und Mana werden zwischen den Begegnungen nur teilweise aufgefüllt. Man muss also mit seinen Kräften haushalten. |
| Raids | **Zwei 40-Mann-Raids**, der letzte Raid ist der Endboss (entschieden 2026-10-25). Details werden später gesondert geplant. |
| Umfang (Zielbild) | **Entschieden 2026-10-25:** Roster von etwa **60 Helden**, **10+ Dungeons**, **zwei 40-Mann-Raids**. Der jetzige Stand (10 Helden, 3 Dungeons) ist nur ein Testballon für Loops und Features. Balancing und eine sinnvolle Progression kommen erst, wenn dieser Umfang steht. |
| Siegchance in Dungeons | **Entschieden 2026-10-24** (Design-Review, P1, ersetzt die frühere Idee „erst mit Strategen oder Kartenraum“). Der Dungeon-Bildschirm zeigt **von Anfang an** eine Einschätzung **in Worten** für die gewählte Gruppe: „Sicher / Machbar / Riskant / Aussichtslos“, dazu wie oft Helden fallen. Keine genaue Prozentzahl, damit Entscheidungen keine Rechenaufgabe werden. Berechnet wird sie aus vielen simulierten Kämpfen, sie zeigt also auch, wenn die Gruppenmischung nicht passt. Der **Kartenraum** (Gildenhalle) macht die Einschätzung später genauer und nennt Gründe („Ihr verliert meist bei der Schattenwoge“). |
| Spielablauf | **Rundenbasiert: 1 Runde = 1 Tag.** Es gibt keine Echtzeit, keine Timer und keine Pause- oder Tempo-Knöpfe. Man plant den Tag und drückt „Tag beenden“, dann wird alles aufgelöst. So kann man jederzeit aufhören, und auf dem Handy wartet nichts. |
| Aufgaben | **Jeder Held hat genau eine Aufgabe pro Tag.** Zuerst gibt es nur „Dungeon“ und „Ausruhen“ (wer nichts zu tun hat, ruht sich aus). Wer verletzt ist, kuriert sich aus. Der Reiter **Tagesplan** zeigt alle Aufgaben des Tages und weist auf Helden ohne Aufgabe hin. Später kommen weitere Aufgaben dazu, z.B. Farmen, Kräuter sammeln, Training oder Hilfe beim Crafting. Dadurch ist Zeit knapp: Jeder Held, der in den Dungeon geht, fehlt an diesem Tag woanders. Mehrere Gruppen können am selben Tag in verschiedene Dungeons. |
| Rundenende | „Tag beenden“ löst alles nacheinander auf: Die Kämpfe laufen als Szene ab (überspringbar), danach kommt ein **Tagesabschluss** mit Beute, EP, Level-Ups und Kisten („Jetzt öffnen“). Das ist der „nur noch ein Tag“-Moment. Danach wechseln Händler-Angebot und Bewerber. |
| Scheitern | Normal-Dungeons: Die Helden werden **verletzt** und fallen eine Weile aus. **Permadeath nur in Hardcore-Inhalten** (Heroisch, Raids): Das Risiko geht man freiwillig für bessere Beute ein. |
| Erbe | Stirbt ein Held, kommt seine **komplette Ausrüstung zurück ins Inventar**. Man verliert nur den Helden selbst (Level, Eigenschaften, Seltenheit), so bleibt das Spiel trotz Wipes schaffbar. Gefallene bekommen einen Platz in der **Ehrenhalle**. |
| Aufhol-Erfahrung | Helden unter dem Level-Durchschnitt der Gilde bekommen deutlich mehr Erfahrung, damit Ersatz für Gefallene schnell einsatzbereit ist |
| Wiederbelebung | Spät im Spiel und teuer: Ein Gebäude (z.B. ein Altar in der Gildenhalle) oder ein seltenes Item kann gelegentlich einen Gefallenen zurückholen |
| Beute | Bosse haben feste Beutetabellen, z.B. bestimmte Set-Teile. Ihre Beute kommt in eine **Boss-Kiste**, die man mit der Öffnen-Animation öffnet (direkt aus dem Tagesabschluss mit „Jetzt öffnen“). Jede besiegte Trash-Gruppe bringt etwas Gold, auch wenn der Run danach scheitert. |
| Rüstungsarten | **Entschieden 2026-10-24** (Design-Review, P8), erweitert 2026-10-25 (P9). Rüstung gibt es in drei Arten, jede Klasse trägt **nur ihre eigene**: **Platte** = Krieger, Paladin, Samurai, Schamane. **Leder** = Schurke, Mönch, Barbar, Jäger, Druide. **Stoff** = Priester, Runenwirker, Magier, Hexenmeister, Barde, Chronomant. Jede Art gibt es in Varianten mit den Werten, die ihre Klassen brauchen: Platte (Rüstung und Leben) und **geweihte Platte** (dazu Magie, für Paladin und Schamane), Leder (Angriff) und **Wildleder** (Magie und Mana, für den Druiden), Stoff (Magie und Mana). Zufalls-Items in Kisten haben eine **völlig zufällige** Rüstungsart. Die Beute richtig zuzuordnen ist Aufgabe des Spielers und Teil des Spiels; was niemand tragen kann, wird verkauft (später zerlegt). **Ringe** darf jeder tragen, es gibt sie aber als **Angriffs-Ring** und **Zauber-Ring**. Jede Klasse hat eigene Waffen (z.B. Bogen, Katana, Streitaxt, Faustklinge, Streitkolben, Laute). Der Ausrüstungswert zählt nur Werte, die der Klasse etwas bringen (z.B. keine Magie beim Krieger). |
| Ausrüsten | **Entschieden 2026-10-24.** Ausrüsten ist **Aufgabe des Spielers**: Es gibt keinen Knopf „Bestes anlegen“ und keine Upgrade-Pfeile. Tippt man auf einen Ausrüstungsplatz (belegt oder leer), erscheint eine Liste der passenden Items, **immer nach Item-Level sortiert**, mit dem Unterschied zum angelegten Teil **Wert für Wert** (z.B. „+3 Angriff · −2 Rüstung“), aber ohne Gesamtnote. Frisch gefundene Items sind als „neu“ markiert. |
| Schadensarten und Resistenzen | **Entschieden 2026-10-24** (Design-Review, P4, statt Konter gegen einzelne Mechaniken). Jeder Angriff hat eine **Schadensart**: **Körperlich, Schatten, Licht, Feuer, Eis, Säure, Wasser** (z.B. Säureschwall = Säure, Schattenwoge = Schatten). Beute kann **Resistenzen** gegen Schadensarten tragen, als feste Prozent (z.B. „+10 % Säureresistenz“, mehr bei höherer Seltenheit), **höchstens 50 % pro Held und Schadensart**. **Boss-Items** tragen fest die Resistenz gegen die Schadensart ihres Bosses (Morvas Beute: Schatten), **Zufalls-Items** ab Grün haben manchmal eine zufällige Resistenz. So entsteht „Beute → neuer Plan“: Mit Säure-Teilen wird Skarrix leichter. Resistenzen sind leichter zu balancen als Konter gegen einzelne Mechaniken. |
| Eigenschaften „Gierig“ und „Glückspilz“ | **Entschieden 2026-10-24** (Design-Review, P8). Sie bekommen ihre versprochene Wirkung: **Gierig** = +20 % Gold aus dem Run, **Glückspilz** = 1 zusätzliches Zufalls-Item in der Boss-Kiste. Beides gilt, wenn mindestens ein solcher Held mitkämpft, und stapelt sich nicht. Später können daraus Macken mit Verhalten werden (Idee aus dem Review). |
| Item-Nutzen | **Zerlegen → Material → Verbessern (+1 bis +10)**, ab einer bestimmten Stufe mit Fehlschlag-Chance. Material dient auch als Zutat fürs Crafting, z.B. für Set-Teile. |
| Spielende | **Endboss** als letzter Raid |
| Wertung | **Endauswertung in Spieltagen**: Wie viele Tage (Runden) hat man bis zum Endboss gebraucht? Wie lange man über einen Tag nachdenkt, spielt keine Rolle. Das Ergebnis lässt sich vergleichen („2 Tage schneller als du“). |
| Rivalen | KI-Gilden in einer **Rangliste** mit Server-First-Rennen und Neuigkeiten-Ticker („Die Eisenfäuste besiegen als erste Gilde den Drachen!“). Legt eine KI-Gilde den Endboss zuerst, kann man trotzdem selbst noch zu Ende spielen. |
| Kisten-Quellen | **Es gibt keine automatisch gelieferten Kisten** (der Gildenkurier ist entfernt). Kisten kommen aus Dungeons und Bossen, bis M2 außerdem noch vom Händler. |
| Händler und Gold | **Ab M2 sind Kisten und Ausrüstung nicht mehr kaufbar.** Ausrüstung gibt es nur aus Dungeons und durchs Crafting. Mit Gold kauft man Verbrauchsgüter (Tränke, Fläschchen und Proviant als Buffs für einen Run, z.B. Feuerresistenz gegen den Drachen) und Crafting-Materialien. Außerdem kosten Gold: Helden anheuern, Bewerber neu rufen, Heilen, Verbessern, **Umskillen** (Talente neu verteilen), Gebäude. |
| Wanderhändler | Taucht ab und zu für kurze Zeit auf und bietet 1 bis 2 feste Items zu hohen Preisen an. Das hilft gegen Pech in einem einzelnen Ausrüstungsplatz, ersetzt aber keine Dungeons. |
| Pity-System | Bleibt im Hintergrund exakt, wird dem Spieler aber **bewusst ungenau** angezeigt: keine Zahlen und kein Balken, nur eine Stimmung, die stärker leuchtet („Etwas Großes kündigt sich an!“) |
| Später | New Game+ (die Endauswertung bereitet es vor), Diplomatie |

## Kampf

### Grundprinzip
- **Runden-Simulation:** Ein Dungeon ist eine Kette von Begegnungen (Trash, danach der Boss). Jede Begegnung wird Runde für Runde berechnet.
- **Siegchance:** Vor dem Start simuliert das Spiel den Kampf 200-mal und zeigt Erfolgs- und Todesrisiko genau an, z.B. „78 % Erfolg, 6 % Todesgefahr“.
- **Kein Eingreifen im Kampf:** Man ist Gildenmeister, nicht Spieler. Im Kampf schaut man zu (auch der Rückzug läuft nur über die vorher eingestellte Regel). Die ganze Tiefe steckt in der **Vorbereitung**.
- **Keine Gruppen-Taktik mehr** (entschieden am 2026-10-20): Die Wahl „Vorsichtig / Ausgewogen / Aggressiv“ ist gestrichen. Sie war schwer zu verstehen und hatte zu wenig Einfluss auf den Kampf. Die Vorbereitung besteht aus Gruppe, Ausrüstung, Anweisungen und Rückzugsregel.
- **Anweisungen pro Held** (neu entschieden am 2026-10-29, Design-Review P2): Jede Klasse hat genau **zwei Anweisungen**: eine **Haltung**, die zur Rolle passt (Tanks: Schutz gegen Schaden, Heiler: Mana gegen Heilkraft, Schadensmacher: Schaden gegen Mana/Aggro/Sicherheit, Unterstützer: eigener Schaden gegen Hilfe für die Gruppe), und eine **Eigenheit**, die die besondere Mechanik der Klasse umbaut (z.B. Schurke: Gift oder Klinge, Chronomant: Beschleunigung auf Schadensmacher, Heiler oder Tank). Jede Anweisung hat drei Optionen: **„Ausgewogen“** (Standard, ohne Vor- und Nachteile) und **zwei Extreme mit großem Vorteil und spürbarem Nachteil**. Beides steht grün und rot im Spiel. Einstellen kann man sie am Helden, im Dungeon-Bildschirm und im **Tagesplan** direkt unter der Risiko-Einschätzung, die sofort neu rechnet. So passt man die Gruppe an jeden Dungeon an. Die alten Feineinstellungen („Heilen ab 80 %“, „30 % Mana aufheben“, Skill-Zeitpunkte) sind gestrichen: zu kleine Wirkung, und meist war eine Variante einfach richtig. Später können Talente weitere Optionen freischalten. Die Wirkungen sind ein kleiner Baukasten (Schaden, erlittener Schaden, Heilung, Mana-Kosten, Aggro, Ausweichen, Ziel, einzelne Skills stärker/schwächer/nie, anderes Skill-Ziel) und stehen in `src/data/heroOrders.js`.
- **Rückzug:** Nur automatisch über eine **Rückzugsregel**, die man vor dem Start einstellt. Einen Rückzug per Hand gibt es nicht (entschieden am 2026-10-20). Damit der Tod trotzdem ein Risiko bleibt:
  - Die Regel reagiert **nur auf Gefallene, nicht auf Lebenspunkte**. Wählbar sind „nie“, „nach 1 Gefallenen“ und „nach 2 Gefallenen“.
  - Der Rückzug dauert **2 Runden**, in denen der Boss weiter angreift (auch mit Mechaniken). Die Helden heilen und verteidigen sich nur noch, Schaden machen sie keinen mehr. Auch beim Rückzug kann also noch jemand fallen.
  - Es gibt keine Beute, und alle Überlebenden sind verletzt.
- **Darstellung:** Der vorberechnete Kampf wird am Tagesende als **Kampfszene** abgespielt: Pixel-Helden gegen den Boss, Lebensbalken, aufploppende Schadens- und Heilzahlen wie im MMO, ein Zauberbalken für angekündigte Mechaniken und ein Ticker. Danach folgt der vollständige Kampfbericht. Man soll mitfiebern und sehen, wie Gruppe und Anweisungen wirken.
- **Lesbarkeit der Szene:** Bisher macht Zuschauen zu wenig Spaß. Die Szene läuft deshalb **langsamer**, damit man den Kampf verfolgen und die Skill-Namen lesen kann. Skills bekommen **deutlichere Effekte**: Name groß über dem Helden, kräftigere Animationen, klar erkennbar, wer wen trifft oder heilt. Wer es eilig hat, schaltet auf **2x oder 4x** Tempo. Fährt man mit der Maus über einen Helden (Handy: antippen), sieht man seine Skills und wie lange sie noch abklingen.
- **Überspringen:** Seit der Umstellung auf Runden kostet Zuschauen keine Spielzeit mehr. Die Szene lässt sich deshalb jederzeit überspringen, das Ergebnis bleibt dasselbe. (Die alte Idee „Schnellkampf nach 3 Erfolgen“ fällt weg.)
- **Zwei Reihen:** Vorne stehen Tanks und Nahkämpfer, hinten Fernkämpfer, Heiler und Supporter. Manche Bossfähigkeiten treffen nur eine Reihe.
- **Ressourcen:** Alle Skills haben Abklingzeiten. Heiler und Zauberer brauchen zusätzlich **Mana**. Geht dem Heiler das Mana aus, wird es gefährlich.
- **Tod (nur Hardcore):** Wer auf 0 Leben fällt, ist tot, auch wenn die Gruppe gewinnt. In Normal-Dungeons ist er stattdessen verletzt.

### Bosse
Jeder Boss hat 1 bis 3 **Mechaniken mit Konter**, sodass die Gruppenzusammenstellung eine echte Entscheidung wird. Beispiele:

| Mechanik | Konter |
|---|---|
| Tank-Buster (riesiger Schlag auf den Tank) | Priester (Strom des Lebens), Runenwirker (Runenpanzer), Krieger (Eiserne Wacht) |
| Gefährlicher Zauber | Schurke (Stummschlag unterbricht) |
| Vernichtungsschlag (einmal, auch mit −50 % tödlich) | Paladin (Gottesschild), knapp: Krieger + Runenpanzer |
| Diener-Wellen | Magier (Aschenregen), Jäger (Pfeilfächer), CC |
| Schaden auf die ganze Gruppe | Druide (Hainsegen), Paladin (Schwur der Standhaftigkeit), Schamane (Felsenpfahl) |
| Wutanfall nach X Runden | Genug Schaden: Barde (Lied der Klingen), Hexenmeister (wachsende Flüche) |
| Fluch oder Furcht | Runenwirker (Lösungsrune), Barde (Weckruf) |
| Flammenwelle auf die vordere Reihe | Weniger Nahkämpfer mitnehmen, Feuerresistenz |

### Klassen
Jeder Skill hat eine Abklingzeit und kostet bei Zauberern Mana. Alle Zahlen stehen später in `src/data/abilities.js`.
**M1** = in Meilenstein 1 enthalten.

Jede Klasse hat ein **Alleinstellungsmerkmal** (was nur sie kann) und eine **Schwäche**. Entschieden 2026-10-25 (P9).
Regel für Raids: **Gleiche Buffs zählen nicht doppelt** (zwei Barden geben nicht zweimal +20 %).

| Position | Klasse | Alleinstellung | Schwäche | Skills | M1 |
|---|---|---|---|---|---|
| Tank | **Krieger** (Platte) | Übersteht **häufige** große Schläge: Eiserne Wacht (−50 % Schaden für 3 Runden) ist alle 6 Runden bereit | Kein Notfall gegen einen einzelnen tödlichen Schlag | Bollwerkstoß, Herausforderungsruf, Eiserne Wacht | ✅ |
| Tank | **Paladin** (Platte, braucht Magie) | **Gottesschild:** einmal pro Kampf 1 Runde unverwundbar, genau vor einem großen Schlag. Es gibt Bosse mit einem „Vernichtungsschlag“, den nur er sicher überlebt (ohne Paladin höchstens knapp, z.B. Krieger + Runenpanzer). Heilt sich selbst, Aura: Gruppe nimmt −10 % Schaden | Braucht **Mana**. Hat keinen Spott-Ruf, hält die Aggro nur über viel Aggro pro Treffer | Lichtbrecher (Lichtschaden + viel Aggro), Gelübde der Genesung, Schwur der Standhaftigkeit, Gottesschild | |
| Tank | **Mönch** (Leder, Angriff) | **Ausweichen:** weicht 30 % der normalen Angriffe aus. Wirbeltritt trifft alle Gegner mit viel Aggro: stark gegen viele kleine Gegner (Trash, Diener) | Großen Schlägen und Zaubern kann er nicht ausweichen, wenig Rüstung: schwach gegen Bosse mit Tank-Buster | Handflächenstoß, Wirbeltritt, Fließende Abwehr (+30 % Ausweichen) | |
| Heiler | **Priester** (Stoff) | Riesige Einzelheilung gegen plötzliche Spitzen | Teuer, Mana knapp | Strom des Lebens, Funke der Gnade, Stille Andacht | ✅ |
| Heiler | **Druide** (Leder, braucht Magie) | **Wiederbelebung im Kampf:** einmal pro Kampf einen Gefallenen mit ~30 % Leben zurückholen. Heilt über Zeit, also im Voraus: stark gegen gleichmäßigen Schaden | Kaum schnelle Notfallheilung, schwach gegen Tank-Buster. Teilt sich Leder mit Schurke und Jäger. Kein Ersatz-Tank (keine Bärengestalt) | Moosmantel, Hainsegen, Ruf der Wurzeln | |
| Heiler | **Runenwirker** (Stoff) | Schilde fangen Schaden vorab ab, entfernt Flüche | Schilde verpuffen, wenn kein Schaden kommt | Runenpanzer, Glyphenkreis, Lösungsrune | ✅ |
| Nahkampf-DD | **Schurke** (Leder) | Unterbricht Boss-Zauber | Steht vorne, wird von Frontwellen getroffen | Schattenstich, Stummschlag, Natternbiss | ✅ |
| Nahkampf-DD | **Barbar** (Leder) | **Wundenzorn** (immer aktiv): bis zu doppelter Schaden, je weniger Leben er hat. Blutrausch heilt ihn mit seinem Schaden | Lebt gefährlich, belastet den Heiler | Sensenkreis, Rücksichtsloser Hieb, Blutrausch | |
| Nahkampf-DD | **Samurai** (Platte, Angriff) | **Iaido-Erstschlag:** einmal pro Kampf ein gewaltiger Hieb, dazu **Hinrichtung** von Gegnern unter 30 % Leben. Stark in vielen kurzen Kämpfen (Trash). Gegenstück zum Hexenmeister. Anweisung: Erstschlag für den Boss aufheben oder Diener zuerst mit stärkerer Hinrichtung | In langen Bosskämpfen lässt er nach | Iaido-Erstschlag, Hinrichtung, Mondsichelschnitt | |
| Fernkampf-DD | **Magier** (Stoff) | Flächenschaden und Einfrieren | Wenig Leben | Glutlanze, Aschenregen, Eiskranz | ✅ |
| Fernkampf-DD | **Jäger** (Leder) | **Begleiter als 6. Kämpfer:** bindet einen Trash-Gegner, auch zufällig angreifende (Kultisten, Brutlinge), die der Tank nicht halten kann | Allein schwächer als der Magier. Der Begleiter kann sterben und frisst Heilung | Falkenauge, Pfeilfächer, Fangnetz | |
| Fernkampf-DD | **Hexenmeister** (Stoff) | **Flüche wachsen jede Runde**, die sie auf dem Ziel liegen: In langen Bosskämpfen macht er irgendwann mehr Schaden als alle anderen | Gegen Trash schwach: Die Gegner sterben, bevor die Flüche wirken. (Früher als Support geplant; Boss-Schwächung um Prozente wäre in Raids Pflicht geworden.) | Verderbnis, Seelenbrand (zwei wachsende Flüche), Schattenblitz | |
| Support | **Barde** (Stoff) | **Lied der Klingen:** Gruppe macht +20 % Schaden. Schläfert den stärksten Diener ein | Macht selbst kaum Schaden und heilt nur wenig | Lied der Klingen, Schlummerweise, Ballade der Zuversicht (kleine Heilung über Zeit für alle) | |
| Support | **Schamane** (Platte, Magie) | **Kampfrausch** (Bloodlust): einmal pro Bosskampf +30 % Schaden für die ganze Gruppe. Kettenblitz springt auf 3 Gegner, Felsenpfahl mindert Gruppenschaden | Kampfrausch nur einmal pro Kampf, danach ist er ein mittelmäßiger Schadensmacher | Kampfrausch, Kettenblitz, Felsenpfahl | |
| Support | **Chronomant** (Stoff) | **Zeit:** Zeitsprung beendet alle Abklingzeiten eines Helden, Beschleunigung lässt den stärksten Schadensmacher doppelt handeln, Zeitstillstand hält den Boss 1 Runde an | Wirkt immer nur auf **einen** Helden, damit er in 40er-Raids nicht zu mächtig wird. Ohne starke Mitspieler bringt er wenig | Zeitsprung, Beschleunigung, Zeitstillstand | |

**Weitere Entscheidungen (2026-10-25):**
- **Wiederbelebte Helden sind nach dem Run nicht verletzt.**
- Der Jäger hat **einen festen Begleiter** (Wolf). Verschiedene Begleiter und umfangreiche Skillungen kommen erst in einem möglichen Teil 2.
- Begleiter kämpfen mit und können geheilt werden, zählen aber nicht als Helden: Fallen alle Helden, ist der Kampf verloren.
- „Einmal pro Kampf“ heißt: einmal pro Begegnung (Trash-Gruppe oder Boss).
- Alle 15 Klassen kommen auf einmal ins Spiel. Werte sind grob gesetzt, gebalanced wird am Ende.

## Skalierung
| Thema | Entscheidung |
|---|---|
| Level-Obergrenze | **Level 30** für die erste Version. Jedes Level zählt spürbar, und es gibt weniger Balancing-Arbeit. Eine spätere Erweiterung (z.B. auf 40 oder 60) ist möglich, weil alle Formeln in `src/data/` stehen. |
| Tempo | Die ersten Helden erreichen Level 30 **etwa zur Hälfte des Spiels**. Danach zählen Ausrüstung, Sets, Verbessern und Heroisch (Endgame). |
| Item-Level | Jedes Item hat ein **Item-Level nach Herkunft**: Jeder Dungeon hat eine Stufe und lässt Items dieser Stufe fallen. Ein grünes Item aus einem späteren Dungeon schlägt ein blaues aus einem frühen. Neue Dungeons lohnen sich so immer, und alte Ausrüstung wird ersetzt. |
| Gewicht der Ausrüstung | Am Ende macht die Ausrüstung **etwa die Hälfte** der Stärke eines Helden aus. Am Anfang ist es deutlich weniger (etwa ein Drittel), weil Item-Werte schneller mit dem Item-Level wachsen als die Grundwerte mit dem Helden-Level. |
| Gegner | Gegner wachsen mit der Stufe des Dungeons statt über eine feste Gegnerstärke |
| Mindestlevel und Level-Abzug | **Entschieden 2026-10-25.** Zwei Teile, damit das Level wichtiger wird und die Ausrüstung etwas unwichtiger. **1. Harte Sperre:** Jeder Dungeon hat ein **Mindestlevel** (grob: 2 Level unter seiner Stufe, steht in `dungeons.js`). Darunter darf **kein einzelner Held** mit (nicht der Gruppendurchschnitt, das ist leichter zu verstehen). Der Dungeon-Bildschirm zeigt „ab Level X“, beim Einplanen wird geprüft. **2. Weicher Abzug im Kampf (später):** Helden unter der Stufe des Dungeons verfehlen öfter und machen weniger Schaden (wie in WoW). So bleibt das Wagnis „zu früh rein“ zwischen Mindestlevel und Stufe erhalten, und das Level zählt unabhängig von der Ausrüstung. **Vorteile:** Jeder Dungeon muss beim Endbalancing nur für eine bekannte Level-Spanne passen; Leveln wird ein klares Ziel („noch 2 Level bis zur Kapelle“); passt zum großen Roster und zu den 40-Mann-Raids (genug Helden über dem Mindestlevel nötig). Zahlen werden erst beim Endbalancing eingestellt. |

| Erfahrung | EP gibt es **pro gewonnener Begegnung** (Boss mehr als Trash, höhere Dungeon-Stufe mehr). Scheitert ein Run am Boss, zählen die geschafften Trash-Gruppen trotzdem. Wer mehr als 1 Level über der Stufe des Dungeons liegt, bekommt weniger EP (bis runter auf 10 %), damit sich ewiges Wiederholen des ersten Dungeons nicht lohnt. |
| Aufhol-Erfahrung | Doppelte EP für Helden, die mindestens 2 Level unter dem Durchschnitt der 5 besten Helden der Gilde liegen |
| Tempo am Anfang | Die ersten Level dauern 1 bis 4 Runs, später deutlich mehr. Die Kurve wird endgültig eingestellt, wenn klar ist, wie viele Dungeons es gibt. |
| Verletzungen | Wer im Run fällt, ist danach **verletzt** und kann den nächsten Tag nicht in Dungeons (Ausrüsten geht). Die Dauer in Tagen steht in `experience.js`. Später verkürzen Lazarett (M3) und Verbrauchsgüter (M2) die Heilung. |

| Schwierigkeit | **Gilt erst beim Endbalancing, nicht für den Testballon.** **Entschieden 2026-10-24** (Design-Review, P1, passend zu „Sammelspiel zuerst“). Niederlagen kommen vor, sind aber nicht die Regel. Zielwerte für einen ganzen Dungeon, Standardgruppe auf der Stufe des Dungeons: mit grüner Ausrüstung aus dem vorherigen Dungeon **etwa 85 %**, mit grüner Ausrüstung der eigenen Stufe **etwa 95 %**. **Eine Stufe darunter etwa 50 %**: ein echtes Wagnis, keine Wand. Erster Dungeon: nackte Gruppe auf Level 1 etwa 90 %. **Bewusst in Kauf genommen:** Bei passender Schwierigkeit fallen oft Helden (Brutnester: in fast jedem knappen Sieg). Verletzungen bleiben trotzdem bei jedem Gefallenen, man braucht also mehr als 5 Helden zum Rotieren (passt zu P7 „Mehr Helden als Plätze“). **Gruppenmischung bleibt situativ** (entschieden 2026-10-24, P1 Teil C): Jeder Dungeon belohnt eine andere Mischung (Kapelle: Schurken unterbrechen Morva; Brutnester: Magier aus der hinteren Reihe, weil die Frontwelle vorne trifft). Mit der passenden Mischung fällt kaum jemand. Die Risiko-Anzeige macht die Wahl sichtbar, Morva wird nicht entschärft. |

Alle Formeln und Zahlen dafür stehen in `src/data/` (`scaling.js`, `experience.js`) und werden per Simulation eingestellt.

## Noch offen (nächste Sessions)
- **Endbalancing der Anweisungen:** Jedes Extrem soll irgendwo die beste Wahl sein und irgendwo schaden. Gemessen wird das mit `tools/anweisungen.mjs`. Die Übersicht am Ende markiert Optionen als „situativ“, „nie besser“ oder „immer gut“.
- **Kampf-Feinheiten:** Erste Version steht im Kampf-Labor. Werte: Leben, Mana, Angriff, Magie, Rüstung. Aggro entsteht durch Schaden (beim Tank ×3 bis ×4) und Heilung. Alle Zahlen stehen in `src/data/`. Noch offen: Krit als eigener Wert auf Items? Wie stark fallen Eigenschaften im Kampf ins Gewicht?
- **Umfang:** Zielbild steht (60 Helden, 10+ Dungeons, zwei 40-Mann-Raids). Offen: Wie lange dauert ein Durchlauf bis zum Endboss, in Spieltagen und in echten Stunden?
- **KI-Gilden:** Fortschrittskurve, Namen, Persönlichkeit, Reaktionen
- **Verbrauchsgüter:** Welche Tränke, Fläschchen und Proviant gibt es, und was bewirken sie genau?
- **Wirtschaft:** Woher kommt Gold, wofür gibt man es aus?
