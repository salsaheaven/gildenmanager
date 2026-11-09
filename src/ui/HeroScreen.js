// ============================================================
// HEROSCREEN – die Heldenübersicht
// Links: Übersicht nach Position mit Gruppen-Zähler (RoleOverview). Mitte: Details des gewählten Helden
// mit Blättern (‹ ›). Rechts: Ausrüstungsliste für den Platz, auf den man in der Mitte getippt hat.
// Auf dem Handy gibt es zwei Ansichten: erst die Übersicht, ein Tipp auf einen Helden öffnet seine Details
// ("‹ Übersicht" führt zurück). Die Ausrüstungsliste öffnet sich dort als Fenster von unten.
// ============================================================

import { t } from '../core/Language.js';
import { POSITIONS } from '../data/groupRules.js';
import { HeroDetailPanel } from './HeroDetailPanel.js';
import { EquipPanel } from './EquipPanel.js';
import { renderRoleOverview } from './RoleOverview.js';
import { Sound } from './Sound.js';

export class HeroScreen {
  // onGoToTavern = Funktion, die zur Taverne wechselt (für den Hinweis bei leerer Gilde)
  // inventory    = das InventoryOverlay (für die "neu"-Markierung in der Ausrüstungsliste)
  constructor(rootElement, game, onGoToTavern, inventory) {
    this.root = rootElement;
    this.game = game;
    this.selectedHeroId = null;
    this.selectedSlot = null;   // Ausrüstungsplatz, dessen Liste gerade offen ist
    this.showingDetail = false; // Handy: true = Details eines Helden, false = Übersicht

    this.root.innerHTML = `
      <div class="hero-screen">
        <section class="panel roster">
          <h2>${t('heroes.title')} <span class="roster-count"></span></h2>
          <div class="role-overview"></div>
        </section>
        <section class="panel hero-detail">
          <div class="hero-nav">
            <button class="hero-nav-back">${t('heroes.back')}</button>
            <button class="hero-nav-prev" title="${t('heroes.prev')}">‹</button>
            <span class="hero-nav-position"></span>
            <button class="hero-nav-next" title="${t('heroes.next')}">›</button>
          </div>
          <div class="hero-detail-body"></div>
        </section>
        <section class="panel equip-panel"></section>
      </div>
    `;

    this.detailPanel = new HeroDetailPanel(this.root.querySelector('.hero-detail-body'), game, {
      onSlotClicked: (slot) => {
        // Handy: Das Fenster von unten bekommt einen Eintrag im Browser-Verlauf,
        // damit die Zurück-Geste es schließt statt die Seite zu verlassen
        if (this.selectedSlot === null && isPhone()) {
          history.pushState({ equipSheet: true }, '');
        }
        this.selectedSlot = slot;
        this.render();
      },
      onDismissed: () => {
        this.selectedHeroId = null;
        this.showingDetail = false;
        this.render();
      },
      onGoToTavern: onGoToTavern,
    });
    // onClose: Das Fenster von unten (Handy) wird geschlossen
    this.equipPanel = new EquipPanel(this.root.querySelector('.equip-panel'), game, inventory, () => this.closeSheet());
    // Zurück-Geste bzw. Zurück-Knopf im Browser schließt das Fenster von unten
    window.addEventListener('popstate', () => {
      if (this.selectedSlot !== null) {
        this.selectedSlot = null;
        this.render();
      }
    });
    this.setupNavigation();

    game.on('changed', () => this.render());
    this.render();
  }

  // Knöpfe über den Details: zurück zur Übersicht (Handy), voriger und nächster Held
  setupNavigation() {
    this.root.querySelector('.hero-nav-back').addEventListener('click', () => {
      Sound.click();
      this.showingDetail = false;
      this.selectedSlot = null;
      this.render();
      window.scrollTo(0, 0);
    });
    this.root.querySelector('.hero-nav-prev').addEventListener('click', () => this.step(-1));
    this.root.querySelector('.hero-nav-next').addEventListener('click', () => this.step(1));
  }

  // Alle Helden in der Reihenfolge der Übersicht (erst alle Tanks, dann alle Heiler …)
  getOrderedHeroes() {
    const byPosition = this.game.getHeroesByPosition();
    const ordered = [];
    for (const position of POSITIONS) {
      ordered.push(...byPosition[position.id]);
    }
    return ordered;
  }

  // Zum vorigen (-1) oder nächsten (+1) Helden blättern, am Ende geht es vorne weiter.
  // Der gewählte Platz bleibt offen: So kann man z.B. alle Ringe nacheinander anschauen.
  step(direction) {
    const ordered = this.getOrderedHeroes();
    if (ordered.length === 0) {
      return;
    }
    Sound.click();
    const index = ordered.findIndex((hero) => hero.id === this.selectedHeroId);
    const next = (index + direction + ordered.length) % ordered.length;
    this.selectedHeroId = ordered[next].id;
    this.render();
  }

  render() {
    const heroes = this.game.guild.heroes;

    // Wenn noch kein Held gewählt ist (oder er weg ist), den ersten der Übersicht wählen
    if (!this.game.guild.findHero(this.selectedHeroId)) {
      const ordered = this.getOrderedHeroes();
      this.selectedHeroId = ordered.length > 0 ? ordered[0].id : null;
    }
    const selectedHero = this.game.guild.findHero(this.selectedHeroId);

    // Die Liste eines Platzes ist offen: Alles darin gilt jetzt als gesehen (die Markierung verschwindet).
    // markEquipSlotSeen löst selbst ein Neuzeichnen aus, deshalb hier aufhören.
    if (selectedHero && this.selectedSlot && this.game.getSlotsWithNewGear(selectedHero.id).includes(this.selectedSlot)) {
      this.game.markEquipSlotSeen(selectedHero.id, this.selectedSlot);
      return;
    }

    this.root.querySelector('.roster-count').textContent = '(' + heroes.length + ' / ' + this.game.guild.getMaxHeroes() + ')';
    const overview = this.root.querySelector('.role-overview');
    if (heroes.length === 0) {
      overview.innerHTML = '<p class="empty">' + t('heroes.noHeroes') + '</p>';
    } else {
      renderRoleOverview(overview, this.game, this.selectedHeroId, (heroId) => {
        this.selectedHeroId = heroId;
        this.showingDetail = true;
        this.render();
        // Auf dem Handy oben bei den Details anfangen
        if (window.innerWidth <= 700) {
          window.scrollTo(0, 0);
        }
      });
    }

    // Blättern: "3 / 12"
    const ordered = this.getOrderedHeroes();
    const index = ordered.findIndex((hero) => hero.id === this.selectedHeroId);
    this.root.querySelector('.hero-nav-position').textContent = index >= 0 ? (index + 1) + ' / ' + ordered.length : '';
    this.root.querySelector('.hero-nav').hidden = ordered.length === 0;

    this.detailPanel.showHero(selectedHero, this.selectedSlot);
    this.equipPanel.show(selectedHero, this.selectedSlot);
    // Handy: Übersicht oder Details, und die Ausrüstungsliste als Fenster von unten
    this.root.querySelector('.hero-screen').classList.toggle('show-detail', this.showingDetail);
    this.root.querySelector('.equip-panel').classList.toggle('sheet-open', this.selectedSlot !== null);
  }

  // Fenster von unten schließen. Gibt es dafür einen Verlaufs-Eintrag, über "Zurück" (dann räumt popstate auf).
  closeSheet() {
    if (history.state && history.state.equipSheet) {
      history.back();
      return;
    }
    this.selectedSlot = null;
    this.render();
  }

  // Einen bestimmten Helden zeigen (z.B. aus dem Tagesplan heraus)
  selectHero(heroId) {
    this.selectedHeroId = heroId;
    this.selectedSlot = null;
    this.showingDetail = true;
    this.render();
  }

  // Zum Talent-Bereich des gezeigten Helden scrollen (z.B. aus "Helden können ein Talent wählen")
  scrollToTalents() {
    const section = this.root.querySelector('.detail-section[data-section="talents"]');
    if (section) {
      section.open = true;
      section.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }
  }
}

// Schmaler Bildschirm (Handy-Regeln in main.css gelten ab dieser Breite)
function isPhone() {
  return window.innerWidth <= 700;
}
