// ============================================================
// PIXEL-ART
// Jedes Bild ist eine Liste von Textzeilen. Jedes Zeichen ist ein Pixel.
// Welches Zeichen welche Farbe hat, steht in PALETTE.
// '.' bedeutet durchsichtig.
//
// Besondere Zeichen, die das Spiel beim Zeichnen austauscht:
//   R = Seltenheitsfarbe (bei Items) bzw. Hauptfarbe (bei Kisten)
//   D = dunkle Kistenfarbe
//   L = Leuchten aus der offenen Kiste
//   h = Hautfarbe, H = Haarfarbe, C = Klassenfarbe (bei Helden)
//
// Alle Zeilen eines Bildes müssen gleich lang sein (ein Test prüft das).
// Tipp: Zeichne neue Bilder einfach hier im Text!
// ============================================================

export const PALETTE = {
  k: '#1a1426', // Umriss (fast schwarz)
  s: '#d8dee9', // Stahl hell
  S: '#8a93a6', // Stahl dunkel
  b: '#9a6434', // Holz/Leder hell
  B: '#5e3a1c', // Holz/Leder dunkel
  g: '#ffd23f', // Gold hell
  G: '#b8860b', // Gold dunkel
  w: '#ffffff', // Weiß (Glanzpunkt)
  R: '#ff00ff', // wird ersetzt
  D: '#800080', // wird ersetzt
  L: '#ffffff', // wird ersetzt
  r: '#5ef2ff', // Runen-Leuchten
  h: '#f1c39b', // Haut (wird pro Held ersetzt)
  H: '#6b3f17', // Haare (wird pro Held ersetzt)
  C: '#888888', // Kleidung (wird durch die Klassenfarbe ersetzt)
  e: '#ff3b3b', // glühende Augen
  P: '#5a2a8a', // Lila dunkel
  p: '#b07ce8', // Lila hell
  v: '#6fc25a', // Grün hell
  V: '#2e6b2e', // Grün dunkel
  y: '#e2c275', // Stroh hell
  Y: '#a8873e', // Stroh dunkel
};

export const SPRITES = {
  sword: [
    '..........kk',
    '.........ksk',
    '........kssk',
    '.......kssk.',
    '......kssk..',
    '.k...kssk...',
    '.kk.kssk....',
    '..kRssk.....',
    '..kRRk......',
    '.kbkkRk.....',
    'kbk...kk....',
    'kk..........',
  ],

  staff: [
    '........kkk.',
    '.......kRRRk',
    '.......kRwRk',
    '.......kRRRk',
    '......kbkkk.',
    '.....kbk....',
    '....kbk.....',
    '...kbk......',
    '..kbk.......',
    '.kbk........',
    'kbk.........',
    'kk..........',
  ],

  shield: [
    '..kkkkkkkk..',
    '.kssssssssk.',
    '.ksSSRRSSsk.',
    '.ksSRRRRSsk.',
    '.ksSRRRRSsk.',
    '.ksSSRRSSsk.',
    '.ksSSSSSSsk.',
    '..ksSSSSsk..',
    '..ksSSSSsk..',
    '...ksSSsk...',
    '....kssk....',
    '.....kk.....',
  ],

  helmet: [
    '............',
    '....kkkk....',
    '...kssssk...',
    '..kssRRssk..',
    '.kssssssssk.',
    '.ksSSSSSSsk.',
    '.ksk....ksk.',
    '.ksk.kk.ksk.',
    '.ksk.kk.ksk.',
    '.kssk..kssk.',
    '..kkk..kkk..',
    '............',
  ],

  armor: [
    '............',
    '.kkk....kkk.',
    'kSssk..kssSk',
    'kSsssRRsssSk',
    'kkSssRRssSkk',
    '.kSsRRRRsSk.',
    '.kSssRRssSk.',
    '.kSSssssSSk.',
    '.kSSSSSSSSk.',
    '.kkkkkkkkkk.',
    '............',
    '............',
  ],

  boots: [
    '............',
    '...kkkk.....',
    '...kbbk.....',
    '...kbbk.....',
    '...kbbk.....',
    '...kRRk.....',
    '...kbbk.....',
    '...kbbbkk...',
    '...kbbbbbk..',
    '..kBBBBBBk..',
    '..kkkkkkkk..',
    '............',
  ],

  ring: [
    '............',
    '.....kk.....',
    '....kRRk....',
    '....kRRk....',
    '.....kk.....',
    '....kggk....',
    '...kgkkgk...',
    '..kgk..kgk..',
    '..kgk..kgk..',
    '...kgkkgk...',
    '....kggk....',
    '............',
  ],

  chestClosed: [
    '..............',
    '..kkkkkkkkkk..',
    '.kRDRRRRRRDRk.',
    'kRDRRRRRRRRDRk',
    'kRDRRRRRRRRDRk',
    'kkkkkkggkkkkkk',
    'kDRRRRgGRRRRDk',
    'kDRRRRggRRRRDk',
    'kDRRRRRRRRRRDk',
    'kDDDDDDDDDDDDk',
    'kDRRRRRRRRRRDk',
    'kkkkkkkkkkkkkk',
  ],

  chestOpen: [
    '..kkkkkkkkkk..',
    '.kRDRRRRRRDRk.',
    'kRDRRRRRRRRDRk',
    'kkkkkkkkkkkkkk',
    'kLLLLLLLLLLLLk',
    'kkkkkkggkkkkkk',
    'kDRRRRgGRRRRDk',
    'kDRRRRggRRRRDk',
    'kDRRRRRRRRRRDk',
    'kDDDDDDDDDDDDk',
    'kDRRRRRRRRRRDk',
    'kkkkkkkkkkkkkk',
  ],

  coin: [
    '..kkkk..',
    '.kggggk.',
    'kgwgggGk',
    'kgggggGk',
    'kgggggGk',
    'kggggGGk',
    '.kGGGGk.',
    '..kkkk..',
  ],

  // ---------- Helden (12 x 14 Pixel) ----------

  heroWarrior: [
    '....kkkk....',
    '...kssssk...',
    '..kssssssk..',
    '..kShhhhSk..',
    '..kSkhhkSk..',
    '..kShhhhSk..',
    '...kkhhkk...',
    '..kCCCCCCk..',
    '.ksCCCCCCsk.',
    '.khCCCCCChk.',
    '..kSSSSSSk..',
    '..kSSkkSSk..',
    '..kSk..kSk..',
    '..kkk..kkk..',
  ],

  heroPriest: [
    '....kkkk....',
    '...kwwwwk...',
    '..kwwwwwwk..',
    '..kwhhhhwk..',
    '..kwkhhkwk..',
    '..kwhhhhwk..',
    '...kwhhwk...',
    '..kCwwwwCk..',
    '.kCCwwwwCCk.',
    '.khCCwwCChk.',
    '..kCCwwCCk..',
    '..kCCwwCCk..',
    '..kCCCCCCk..',
    '..kkkkkkkk..',
  ],

  heroRuneweaver: [
    '....kkkk....',
    '...kHHHHk...',
    '..kHHHHHHk..',
    '..kggggggk..',
    '..khkhhkhk..',
    '..khhhhhhk..',
    '...khhhhk...',
    '..kCCCCCCk..',
    '.kCCCrrCCCk.',
    '.khCCrrCChk.',
    '..kCCCCCCk..',
    '..kCCCCCCk..',
    '..kCCCCCCk..',
    '..kkkkkkkk..',
  ],

  heroMage: [
    '.....kk.....',
    '....kCCk....',
    '...kCCCCk...',
    '.kkCCCCCCkk.',
    '..khhhhhhk..',
    '..khkhhkhk..',
    '..kHhhhhHk..',
    '..kCCCCCCk..',
    '.kCCCggCCCk.',
    '.khCCCCCChk.',
    '..kCCCCCCk..',
    '..kCCCCCCk..',
    '..kCCCCCCk..',
    '..kkkkkkkk..',
  ],

  heroRogue: [
    '....kkkk....',
    '...kCCCCk...',
    '..kCCCCCCk..',
    '..kChhhhCk..',
    '..kCkhhkCk..',
    '..kCkkkkCk..',
    '...kkkkkk...',
    '..kCCCCCCk..',
    '.kCCCCCCCCk.',
    '.khCCCCCChk.',
    '..kBBgBBBk..',
    '..kBBkkBBk..',
    '..kBk..kBk..',
    '..kkk..kkk..',
  ],

  // ---------- Gegner ----------

  bossBear: [
    '..kk........kk..',
    '.kBBk......kBBk.',
    '.kBbbkkkkkkbbBk.',
    '..kbbbbbbbbbbk..',
    '.kbbbbbbbbbbbbk.',
    '.kbbkebbbbekbbk.',
    '.kbbbbbbbbbbbbk.',
    '.kbbbkwwwwkbbbk.',
    '..kbbbkkkkbbbk..',
    '.kBbbbbbbbbbbBk.',
    'kBBbbbbbbbbbbBBk',
    'kBbbbbbbbbbbbbBk',
    'kBbbbbbbbbbbbbBk',
    '.kBBbbbbbbbbBBk.',
    '.kwkBBkkkkBBkwk.',
    '..k.kk....kk.k..',
  ],

  bossCultist: [
    '......kkkk......',
    '.....kPPPPk.....',
    '....kPPPPPPk....',
    '...kPPkkkkPPk...',
    '...kPkekkekPk...',
    '...kPkkkkkkPk...',
    '..kPPPkkkkPPPk..',
    '..kPPPPPPPPPPk..',
    '.kPPpPPPPPPpPPk.',
    '.khPPpPPPPpPPhk.',
    '.kPPPPpPPpPPPPk.',
    '..kPPPPppPPPPk..',
    '..kPPPPPPPPPPk..',
    '.kPPPPPPPPPPPPk.',
    '.kPPPPPPPPPPPPk.',
    '.kkkkkkkkkkkkkk.',
  ],

  bossBroodmother: [
    '....k......k....',
    '.....k....k.....',
    '......kkkk......',
    '.....kvvvvk.....',
    '....kvekkevk....',
    '....kvvvvvvk....',
    '..k.kVvvvvVk.k..',
    '.k.kVVvvvvVVk.k.',
    'k.kVVvvvvvvVVk.k',
    '.kVVvvVvvVvvVVk.',
    'kkVvvvVvvVvvvVkk',
    '.kVVvvvvvvvvVVk.',
    'k.kVVvvvvvvVVk.k',
    '.k.kVVVVVVVVk.k.',
    '..k.kkkkkkkk.k..',
    '................',
  ],

  minionBroodling: [
    '..k..k..',
    '...kk...',
    '..kvvk..',
    '.kveevk.',
    'k.kvvk.k',
    '.kVvvVk.',
    'k.kVVk.k',
    '........',
  ],

  bossDummy: [
    '....kkkk....',
    '...kyyyyk...',
    '...kykkyk...',
    '...kyyyyk...',
    '....kyyk....',
    'kkkkkbbkkkkk',
    'kYyyybbyyyYk',
    'kkkkybbykkkk',
    '...kyyyyk...',
    '...kYyyYk...',
    '....kbbk....',
    '....kbbk....',
    '...kbbbbk...',
    '..kkkkkkkk..',
  ],

  trashWolf: [
    '..k.k.........',
    '.kBkBk........',
    '.kBBBBk.......',
    'kBeBBBBkkkkk..',
    'kBBBBBBBBBBBk.',
    '.kkBBBBBBBBBBk',
    '...kBBBBBBBBk.',
    '...kBk.kBk.kBk',
    '...kBk.kBk..k.',
    '...kk..kk.....',
  ],

  trashGhoul: [
    '....kkkk....',
    '...kvvvvk...',
    '..kvvvvvvk..',
    '..kvekkevk..',
    '..kvvvvvvk..',
    '..kvkwwkvk..',
    '...kvvvvk...',
    '..kBBBBBBk..',
    '.kvBBBBBBvk.',
    'kvkBBBBBBkvk',
    'k.kBBBBBBk.k',
    '..kBBkkBBk..',
    '..kvk..kvk..',
    '..kkk..kkk..',
  ],
};
