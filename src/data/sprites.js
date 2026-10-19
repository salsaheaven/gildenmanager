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
};
