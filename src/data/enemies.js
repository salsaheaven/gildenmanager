// ============================================================
// GEGNER – Bosse und ihre Diener
//
// Boss:
//   name, title  = Anzeige
//   sprite       = Pixelbild aus sprites.js (colors = freiwillig andere Farben für dasselbe Bild, wie bei den Dienern)
//   stats        = health (Leben), attack (Angriff), defense (Rüstung)
//   attackDamageType = Schadensart des normalen Angriffs (siehe damageTypes.js), ohne Angabe 'physical'
//   enrageRound  = ab dieser Runde rast der Boss (doppelter Schaden). null = nie.
//   isDummy      = Übungspuppe: greift nicht an, nur zum Schaden-Messen
//   mechanics    = besondere Fähigkeiten (siehe unten)
//
// Mechanik:
//   type          = 'tankBuster' (riesiger Schlag auf den, den er angreift)
//                   'groupCast'  (Schaden an der ganzen Gruppe)
//                   'frontWave'  (Schaden an der vorderen Reihe)
//                   'summon'     (ruft Diener)
//                   'curse'      (Fluch: Schaden über Zeit auf einen zufälligen Helden)
//                   'groupStrike' (nur Raid: trifft eine ganze Raid-Gruppe, siehe raidBosses.js)
//   name          = Anzeigename
//   firstAt       = in welcher Runde zum ersten Mal
//   every         = danach alle so viele Runden
//   power         = Faktor auf den Angriff des Bosses
//   damageType    = Schadensart (siehe damageTypes.js), ohne Angabe 'physical'
//   castTime      = 1: wird eine Runde vorher angekündigt ("bereitet vor"), 0: sofort
//   interruptible = kann ein Schurke den Zauber unterbrechen?
//   duration      = Dauer des Fluchs in Runden
//   minion, count = welche und wie viele Diener
//   hint          = Tipp für den Spieler, wie man die Mechanik kontert
//   fx            = Animation in der Kampfszene
//
// attackFx = Animation des normalen Angriffs (Boss und Diener)
// Raid-Bosse stehen in raidBosses.js.
// ============================================================

import { RAID_BOSSES } from './raidBosses.js';

export const BOSSES = [
  {
    id: 'trainingDummy',
    name: 'Übungspuppe',
    title: 'Schaden messen',
    sprite: 'bossDummy',
    stats: { health: 100000, attack: 0, defense: 10 },
    enrageRound: null,
    isDummy: true,
    dummyRounds: 20,
    mechanics: [],
  },
  {
    id: 'grimfang',
    name: 'Grimmzahn',
    title: 'Der Höhlenbär',
    sprite: 'bossBear',
    attackFx: 'claw',
    stats: { health: 1250, attack: 27, defense: 10 },
    enrageRound: 25,
    mechanics: [
      {
        type: 'tankBuster', name: 'Zermalmender Prankenhieb',
        firstAt: 4, every: 5, power: 3.5, castTime: 1, interruptible: false, fx: 'bigImpact',
        hint: 'Schilde (Runenwirker) oder Eiserne Wacht (Krieger) fangen den Hieb ab.',
      },
    ],
  },
  {
    id: 'morva',
    name: 'Schwester Morva',
    title: 'Die Schattenruferin',
    sprite: 'bossCultist',
    attackFx: 'shadowBolt',
    attackDamageType: 'shadow',
    stats: { health: 1250, attack: 25, defense: 5 },
    enrageRound: 30,
    mechanics: [
      {
        type: 'groupCast', name: 'Schattenwoge', damageType: 'shadow',
        firstAt: 3, every: 4, power: 2.3, castTime: 1, interruptible: true, fx: 'shadowWave',
        hint: 'Ein Schurke kann die Woge mit Stummschlag unterbrechen.',
      },
      {
        type: 'curse', name: 'Fluch der Fäulnis', damageType: 'shadow',
        firstAt: 5, every: 6, power: 0.5, duration: 6, castTime: 0, fx: 'curse',
        hint: 'Der Runenwirker entfernt Flüche mit der Lösungsrune.',
      },
    ],
  },
  {
    id: 'skarrix',
    name: 'Skarrix',
    title: 'Die Brutmutter',
    sprite: 'bossBroodmother',
    attackFx: 'claw',
    stats: { health: 1500, attack: 26, defense: 8 },
    enrageRound: 30,
    mechanics: [
      {
        type: 'summon', name: 'Brut schlüpft',
        firstAt: 2, every: 6, minion: 'broodling', count: 2, castTime: 0, fx: 'summon',
        hint: 'Flächenschaden (Aschenregen des Magiers) räumt die Brut schnell weg.',
      },
      {
        type: 'frontWave', name: 'Säureschwall', damageType: 'acid',
        firstAt: 6, every: 7, power: 2.1, castTime: 1, interruptible: false, fx: 'acidWave',
        hint: 'Trifft nur die vordere Reihe: weniger Nahkämpfer mitnehmen.',
      },
    ],
  },
  {
    id: 'hrimgar',
    name: 'Hrimgar',
    title: 'Der Frostriese',
    sprite: 'bossFrostGiant',
    attackFx: 'claw',
    attackDamageType: 'ice',
    stats: { health: 1600, attack: 28, defense: 12 },
    enrageRound: 30,
    mechanics: [
      {
        type: 'groupCast', name: 'Frostatem', damageType: 'ice',
        firstAt: 4, every: 6, power: 1.4, castTime: 1, interruptible: false, fx: 'frost',
        hint: 'Felsenpfahl (Schamane), Glyphenkreis und Eisresistenz mildern den Atem.',
      },
      {
        type: 'tankBuster', name: 'Vernichtungsschlag',
        firstAt: 8, every: 12, power: 9, castTime: 1, interruptible: false, fx: 'bigImpact',
        hint: 'Tödlich für jeden Tank. Nur der Gottesschild des Paladins fängt ihn sicher ab, knapp geht es mit Eiserner Wacht + Runenpanzer.',
      },
    ],
  },
  {
    id: 'grezza',
    name: 'Mutter Grezza',
    title: 'Die Moorhexe',
    sprite: 'bossWitch',
    attackFx: 'shadowBolt',
    attackDamageType: 'water',
    stats: { health: 2400, attack: 22, defense: 6 },
    enrageRound: 40,
    mechanics: [
      {
        type: 'curse', name: 'Sumpffieber', damageType: 'water',
        firstAt: 2, every: 3, power: 0.45, duration: 8, castTime: 0, fx: 'curse',
        hint: 'Ständige Flüche: Heilung über Zeit (Druide) oder die Lösungsrune (Runenwirker) halten die Gruppe am Leben.',
      },
      {
        type: 'curse', name: 'Fluch der Kröte', damageType: 'shadow',
        firstAt: 5, every: 5, power: 0.7, duration: 5, castTime: 0, fx: 'curse',
        hint: 'Ein langer Kampf mit viel Leben: Hier glänzen die wachsenden Flüche des Hexenmeisters.',
      },
      {
        type: 'summon', name: 'Irrlichter rufen',
        firstAt: 6, every: 8, minion: 'wisp', count: 2, castTime: 0, fx: 'summon',
        hint: 'Irrlichter greifen zufällig an. Der Wolf des Jägers oder Schlummerweise (Barde) halten sie fest.',
      },
    ],
  },
  {
    id: 'stoneGuardian',
    name: 'Der Steinwächter',
    title: 'Hüter des Tores',
    sprite: 'bossGolem',
    attackFx: 'claw',
    stats: { health: 1700, attack: 23, defense: 14 },
    enrageRound: 30,
    mechanics: [
      {
        type: 'tankBuster', name: 'Steinfaust',
        firstAt: 3, every: 5, power: 3.0, castTime: 1, interruptible: false, fx: 'bigImpact',
        hint: 'Sehr häufige große Schläge: Die Eiserne Wacht des Kriegers ist oft genug bereit, der Gottesschild nur einmal.',
      },
      {
        type: 'frontWave', name: 'Beben',
        firstAt: 6, every: 7, power: 1.6, castTime: 1, interruptible: false, fx: 'bigImpact',
        hint: 'Trifft die vordere Reihe. Fernkämpfer stehen sicher.',
      },
    ],
  },
  {
    id: 'azhur',
    name: 'Hohepriester Azhur',
    title: 'Die letzte Sonne',
    sprite: 'bossSunPriest',
    attackFx: 'fireBolt',
    attackDamageType: 'fire',
    stats: { health: 1500, attack: 27, defense: 8 },
    enrageRound: 18,
    mechanics: [
      {
        type: 'groupCast', name: 'Sonnenfeuer', damageType: 'fire',
        firstAt: 3, every: 5, power: 2.0, castTime: 1, interruptible: true, fx: 'fireRain',
        hint: 'Ein Schurke kann das Sonnenfeuer unterbrechen, der Chronomant hält Azhur mit Zeitstillstand an.',
      },
      {
        type: 'summon', name: 'Akolythen rufen',
        firstAt: 7, every: 9, minion: 'sunAcolyte', count: 2, castTime: 0, fx: 'summon',
        hint: 'Früher Wutanfall (Runde 18): Viel Schaden in kurzer Zeit nötig. Kampfrausch, Lied der Klingen und der Erstschlag des Samurai helfen.',
      },
    ],
  },
  {
    id: 'vorrak',
    name: 'Vorrak',
    title: 'Der Schmiedeherr',
    sprite: 'bossForgeLord',
    attackFx: 'bigImpact',
    attackDamageType: 'fire',
    stats: { health: 1300, attack: 26, defense: 10 },
    enrageRound: 24,
    mechanics: [
      {
        type: 'tankBuster', name: 'Glühender Hammer', damageType: 'fire',
        firstAt: 4, every: 5, power: 3.4, castTime: 1, interruptible: false, fx: 'bigImpact',
        hint: 'Schilde (Runenwirker) oder Eiserne Wacht (Krieger) fangen den Hammer ab, Feuerresistenz hilft dem Tank.',
      },
      {
        type: 'frontWave', name: 'Schlackewelle', damageType: 'fire',
        firstAt: 6, every: 6, power: 1.9, castTime: 1, interruptible: false, fx: 'fireRain',
        hint: 'Trifft nur die vordere Reihe: weniger Nahkämpfer oder Feuerschutz-Tränke mitnehmen.',
      },
    ],
  },
  {
    id: 'ignara',
    name: 'Ignara',
    title: 'Die Drachenmutter',
    sprite: 'bossDragon',
    attackFx: 'fireBolt',
    attackDamageType: 'fire',
    stats: { health: 1500, attack: 27, defense: 8 },
    enrageRound: 26,
    mechanics: [
      {
        type: 'groupCast', name: 'Feuersturm', damageType: 'fire',
        firstAt: 3, every: 5, power: 2.2, castTime: 1, interruptible: true, fx: 'fireRain',
        hint: 'Ein Schurke kann den Feuersturm unterbrechen. Feuerresistenz auf allen hilft.',
      },
      {
        type: 'curse', name: 'Drachenbrand', damageType: 'fire',
        firstAt: 5, every: 6, power: 0.6, duration: 5, castTime: 0, fx: 'curse',
        hint: 'Der Runenwirker löscht den Drachenbrand mit der Lösungsrune.',
      },
      {
        type: 'summon', name: 'Brut wecken',
        firstAt: 8, every: 9, minion: 'drakeling', count: 2, castTime: 0, fx: 'summon',
        hint: 'Die Jungdrachen greifen zufällig an: Flächenschaden räumt sie schnell weg.',
      },
    ],
  },
  // ---------- Set-Dungeons (Stufe 30) ----------
  {
    id: 'ferron',
    name: 'Kommandant Ferron',
    title: 'Der eiserne Wall',
    sprite: 'bossForgeLord',
    colors: { o: '#d8dee9', O: '#4a5268' },
    attackFx: 'bigImpact',
    stats: { health: 1500, attack: 28, defense: 16 },
    enrageRound: 26,
    mechanics: [
      {
        type: 'tankBuster', name: 'Belagerungshieb',
        firstAt: 3, every: 4, power: 3.2, castTime: 1, interruptible: false, fx: 'bigImpact',
        hint: 'Schilde (Runenwirker) oder Eiserne Wacht (Krieger) fangen den Hieb ab. Ein zweiter Heiler hilft.',
      },
      {
        type: 'frontWave', name: 'Schildwall-Stoß',
        firstAt: 6, every: 6, power: 1.8, castTime: 1, interruptible: false, fx: 'bigImpact',
        hint: 'Trifft nur die vordere Reihe: weniger Nahkämpfer mitnehmen.',
      },
    ],
  },
  {
    id: 'skaar',
    name: 'Skaar',
    title: 'Die Urbestie',
    sprite: 'bossBear',
    colors: { b: '#6f8a4a', B: '#3a4a22' },
    attackFx: 'claw',
    stats: { health: 1300, attack: 26, defense: 8 },
    enrageRound: 24,
    mechanics: [
      {
        type: 'groupCast', name: 'Urschrei',
        firstAt: 4, every: 5, power: 1.9, castTime: 1, interruptible: true, fx: 'bigImpact',
        hint: 'Ein Schurke kann den Urschrei unterbrechen.',
      },
      {
        type: 'summon', name: 'Rudel rufen',
        firstAt: 6, every: 10, minion: 'wildWolf', count: 1, castTime: 0, fx: 'summon',
        hint: 'Der Wolf geht auf den Tank los: Flächenschaden räumt ihn weg.',
      },
    ],
  },
  {
    id: 'mythrel',
    name: 'Mythrel',
    title: 'Der Archivar',
    sprite: 'bossSunPriest',
    colors: { o: '#7ab8ff', g: '#b07ce8', G: '#5a2a8a' },
    attackFx: 'shadowBolt',
    attackDamageType: 'shadow',
    stats: { health: 1400, attack: 27, defense: 6 },
    enrageRound: 24,
    mechanics: [
      {
        type: 'groupCast', name: 'Arkane Flut', damageType: 'shadow',
        firstAt: 3, every: 5, power: 2.0, castTime: 1, interruptible: true, fx: 'shadowWave',
        hint: 'Ein Schurke kann die Arkane Flut unterbrechen. Schattenresistenz hilft.',
      },
      {
        type: 'curse', name: 'Vergessen', damageType: 'shadow',
        firstAt: 5, every: 5, power: 0.6, duration: 5, castTime: 0, fx: 'curse',
        hint: 'Der Runenwirker löst den Fluch mit der Lösungsrune.',
      },
    ],
  },
];

// Gegner ohne Boss-Mechaniken: Diener (vom Boss gerufen) und Trash (Gegnergruppen vor dem Boss)
//   name, sprite = Anzeige (colors = andere Farben für dasselbe Pixelbild, z.B. rote Kultisten)
//   stats        = health, attack, defense
//   attackFx     = Animation des Angriffs
//   attackDamageType = Schadensart des Angriffs (siehe damageTypes.js), ohne Angabe 'physical'
//   targeting    = 'threat': greift den mit der meisten Aggro an (der Tank kann ihn halten)
//                  'random': greift zufällig an (der Tank kann ihn nicht abfangen)
export const MINIONS = {
  broodling: {
    name: 'Brutling',
    sprite: 'minionBroodling',
    attackFx: 'bite',
    attackDamageType: 'acid',
    targeting: 'random',
    stats: { health: 65, attack: 13, defense: 0 },
  },
  caveWolf: {
    name: 'Höhlenwolf',
    sprite: 'trashWolf',
    colors: { B: '#6b6b7b' },
    attackFx: 'bite',
    targeting: 'threat',
    stats: { health: 90, attack: 13, defense: 4 },
  },
  cultist: {
    name: 'Kultist',
    sprite: 'bossCultist',
    colors: { P: '#7a2020', p: '#d06060' },
    attackFx: 'shadowBolt',
    attackDamageType: 'shadow',
    targeting: 'random',
    stats: { health: 80, attack: 12, defense: 2 },
  },
  ghoul: {
    name: 'Ghul',
    sprite: 'trashGhoul',
    colors: { v: '#8fa38a' },
    attackFx: 'claw',
    targeting: 'threat',
    stats: { health: 140, attack: 16, defense: 6 },
  },
  armoredBeetle: {
    name: 'Panzerkäfer',
    sprite: 'minionBroodling',
    colors: { v: '#5a5a6e', V: '#2a2a38' },
    attackFx: 'bite',
    targeting: 'threat',
    stats: { health: 120, attack: 12, defense: 30 },
  },
  iceKobold: {
    name: 'Eiskobold',
    sprite: 'minionKobold',
    attackFx: 'bite',
    attackDamageType: 'ice',
    targeting: 'random',
    stats: { health: 45, attack: 9, defense: 0 },
  },
  frostWolf: {
    name: 'Frostwolf',
    sprite: 'trashWolf',
    colors: { B: '#8ab8e0' },
    attackFx: 'bite',
    attackDamageType: 'ice',
    targeting: 'threat',
    stats: { health: 95, attack: 13, defense: 5 },
  },
  bogCorpse: {
    name: 'Moorleiche',
    sprite: 'trashGhoul',
    colors: { v: '#7a8a5a', B: '#3a4a2a' },
    attackFx: 'claw',
    targeting: 'threat',
    stats: { health: 160, attack: 14, defense: 6 },
  },
  wisp: {
    name: 'Irrlicht',
    sprite: 'minionWisp',
    attackFx: 'spark',
    attackDamageType: 'light',
    targeting: 'random',
    stats: { health: 40, attack: 11, defense: 0 },
  },
  templeConstruct: {
    name: 'Tempelkonstrukt',
    sprite: 'bossGolem',
    colors: { S: '#b89a5a', s: '#e0c890' },
    attackFx: 'claw',
    targeting: 'threat',
    stats: { health: 150, attack: 14, defense: 25 },
  },
  ironGuard: {
    name: 'Eisengardist',
    sprite: 'bossGolem',
    colors: { S: '#5a6478', s: '#a8b0c0' },
    attackFx: 'slash',
    targeting: 'threat',
    stats: { health: 140, attack: 14, defense: 22 },
  },
  wildWolf: {
    name: 'Wildwolf',
    sprite: 'trashWolf',
    colors: { B: '#5a7a3a' },
    attackFx: 'bite',
    targeting: 'threat',
    stats: { health: 95, attack: 14, defense: 5 },
  },
  livingTome: {
    name: 'Lebendes Buch',
    sprite: 'minionWisp',
    colors: { y: '#b07ce8', w: '#e8d8ff' },
    attackFx: 'shadowBolt',
    attackDamageType: 'shadow',
    targeting: 'random',
    stats: { health: 60, attack: 13, defense: 0 },
  },
  emberImp: {
    name: 'Glutwicht',
    sprite: 'minionKobold',
    colors: { i: '#ffb03a', I: '#a02a1a' },
    attackFx: 'fireBolt',
    attackDamageType: 'fire',
    targeting: 'random',
    stats: { health: 70, attack: 13, defense: 2 },
  },
  drakeling: {
    name: 'Jungdrache',
    sprite: 'minionBroodling',
    colors: { v: '#ff7a3a', V: '#a02a1a' },
    attackFx: 'bite',
    attackDamageType: 'fire',
    targeting: 'random',
    stats: { health: 85, attack: 14, defense: 3 },
  },
  sunAcolyte: {
    name: 'Sonnenakolyth',
    sprite: 'bossCultist',
    colors: { P: '#c89020', p: '#ffd060' },
    attackFx: 'fireBolt',
    attackDamageType: 'fire',
    targeting: 'random',
    stats: { health: 75, attack: 12, defense: 2 },
  },
};

// Was eine Mechanik-Art bewirkt, in Worten (für den Dungeonführer)
export const MECHANIC_TYPE_TEXTS = {
  tankBuster: 'Riesiger Schlag auf den, den er angreift',
  groupCast: 'Trifft die ganze Gruppe',
  frontWave: 'Trifft die vordere Reihe',
  summon: 'Ruft Diener herbei',
  curse: 'Fluch: Schaden über Zeit auf einen Helden',
  groupStrike: 'Trifft eine ganze Raid-Gruppe',
};

// Sucht einen Boss, auch unter den Raid-Bossen (siehe raidBosses.js)
export function getBoss(bossId) {
  for (const boss of BOSSES.concat(RAID_BOSSES)) {
    if (boss.id === bossId) {
      return boss;
    }
  }
  throw new Error('Unbekannter Boss: ' + bossId);
}
