// ============================================================
// BATTLEEFFECTS – Animationen der Skills in der Kampfszene
// Jeder Skill hat in den Daten ein "fx" (z.B. 'fireBolt'). Hier steht, wie es aussieht:
//   - Geschosse fliegen vom Handelnden zum Ziel (Feuer, Funken, Schatten …)
//   - Ziel-Effekte erscheinen auf dem Getroffenen (Hieb, Heilung, Schild, Gift …)
//   - Eigen-Effekte erscheinen auf dem Handelnden (Ruf, Aura, Mana …)
// Das Aussehen selbst steht in styles/main.css unter "Kampf-Effekte" (Klassen fx-…).
// Neuen Effekt hinzufügen: hier eintragen + CSS-Klasse anlegen.
// ============================================================

// Geschosse: fx-Name → CSS-Klasse
const PROJECTILES = {
  fireBolt: 'fx-fire',
  spark: 'fx-spark',
  holyBolt: 'fx-holy',
  runeBolt: 'fx-rune',
  shadowBolt: 'fx-shadow',
  arrow: 'fx-arrow',
  lightning: 'fx-lightning',
};

// Effekte auf dem Ziel
const TARGET_EFFECTS = {
  slash: 'fx-slash',
  claw: 'fx-claw',
  bite: 'fx-bite',
  shieldBash: 'fx-bash',
  bigImpact: 'fx-impact',
  interrupt: 'fx-interrupt',
  heal: 'fx-heal',
  holyHeal: 'fx-holyheal',
  shield: 'fx-shield',
  cleanse: 'fx-cleanse',
  poison: 'fx-poison',
  curse: 'fx-curse',
  frost: 'fx-frost',
  fireRain: 'fx-firerain',
  shadowWave: 'fx-shadowwave',
  acidWave: 'fx-acid',
};

// Effekte auf dem Handelnden selbst
const SELF_EFFECTS = {
  shout: 'fx-shout',
  aura: 'fx-aura',
  manaGlow: 'fx-mana',
  summon: 'fx-summon',
};

// Diese Effekte lassen zusätzlich das ganze Kampffeld wackeln
const SHAKING_EFFECTS = ['bigImpact', 'shadowWave', 'acidWave'];

// field          = das Kampffeld (Elternelement mit position: relative)
// sourceElement  = Bild des Handelnden
// targetElements = Bilder der Ziele
// duration       = wie lange ein Geschoss fliegt (Millisekunden)
// rate           = Abspielrate der Effekt-Animationen (1 = wie in main.css, 0.5 = halb so schnell)
export function playEffect(field, fx, sourceElement, targetElements, duration, rate = 1) {
  if (!fx) {
    return;
  }
  if (PROJECTILES[fx]) {
    for (const target of targetElements) {
      shootProjectile(field, PROJECTILES[fx], sourceElement, target, duration, rate);
    }
  } else if (TARGET_EFFECTS[fx]) {
    for (const target of targetElements) {
      showEffectAt(field, TARGET_EFFECTS[fx], target, rate);
    }
  } else if (SELF_EFFECTS[fx]) {
    showEffectAt(field, SELF_EFFECTS[fx], sourceElement, rate);
  }

  if (SHAKING_EFFECTS.includes(fx)) {
    field.classList.remove('field-shake');
    void field.offsetWidth; // Animation neu starten
    field.classList.add('field-shake');
    for (const animation of field.getAnimations()) {
      animation.playbackRate = rate;
    }
  }
}

// Mitte eines Elements, gemessen vom Kampffeld aus
function getCenter(field, element) {
  const fieldBox = field.getBoundingClientRect();
  const box = element.getBoundingClientRect();
  return {
    x: box.left - fieldBox.left + box.width / 2,
    y: box.top - fieldBox.top + box.height / 2,
  };
}

function shootProjectile(field, cssClass, sourceElement, targetElement, duration, rate) {
  const from = getCenter(field, sourceElement);
  const to = getCenter(field, targetElement);

  const projectile = document.createElement('div');
  projectile.className = 'fx-projectile ' + cssClass;
  projectile.style.left = from.x + 'px';
  projectile.style.top = from.y + 'px';
  field.appendChild(projectile);

  const flight = projectile.animate(
    [
      { transform: 'translate(-50%, -50%) translate(0, 0)' },
      { transform: 'translate(-50%, -50%) translate(' + (to.x - from.x) + 'px, ' + (to.y - from.y) + 'px)' },
    ],
    { duration: duration, easing: 'ease-in' },
  );
  flight.onfinish = () => {
    projectile.remove();
    showEffectAt(field, cssClass + '-burst', targetElement, rate);
  };
}

function showEffectAt(field, cssClass, element, rate) {
  const center = getCenter(field, element);
  const effect = document.createElement('div');
  effect.className = 'fx-effect ' + cssClass;
  effect.style.left = center.x + 'px';
  effect.style.top = center.y + 'px';
  field.appendChild(effect);
  for (const animation of effect.getAnimations()) {
    animation.playbackRate = rate;
  }
  setTimeout(() => effect.remove(), 900 / rate);
}
