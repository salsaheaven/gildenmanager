// ============================================================
// DUNGEONGUIDE – der Dungeonführer: alles, was man zum Planen eines Dungeons wissen muss
//   - Niveau: Stufe, empfohlenes Level und Ausrüstungswert, Item-Level der Beute, Wissensstand, bekannte Schadensarten
//   - Gegner (aufklappbar): Trash-Gruppen und Bosse. Details (Leben, Raserei, Fähigkeiten mit Tipps)
//     nur für erkundete Bosse, sonst nur Bild und Name (siehe systems/DungeonKnowledge.js).
//   - Beute (aufklappbar): Gold, Boss-Kiste und die besonderen Boss-Items mit Platz, Rüstungsart,
//     passenden Klassen und Sammelbuch-Sternen
// Benutzt vom Dungeon-Bildschirm. Die Daten kommen aus data/dungeons.js, enemies.js und lootBoxes.js.
// ============================================================

import { t } from '../core/Language.js';
import { getBoss, MINIONS, MECHANIC_TYPE_TEXTS } from '../data/enemies.js';
import { getDamageType } from '../data/damageTypes.js';
import { getLootBoxType } from '../data/lootBoxes.js';
import { getRarity } from '../data/rarities.js';
import { getItemTemplate, SLOT_NAMES, getArmorTypeName } from '../data/items.js';
import { getSuitableClasses, getHeroClass } from '../data/heroClasses.js';
import { getCounterIds, getCounter } from '../data/counters.js';
import { findTalent } from '../data/talents.js';
import { getEnemyLevelFactors } from '../data/scaling.js';
import { Item } from '../entities/Item.js';
import { createSpriteCanvas, createChestCanvas, createItemCanvas } from './PixelArt.js';

// Sterne für die beste gefundene Seltenheit (wie im Sammelbuch)
const STARS = { rare: '★', epic: '★★', legendary: '★★★' };

// openSections = { enemies: true/false, loot: true/false } (bleibt beim Neuzeichnen erhalten, wird hier geändert)
export function renderDungeonGuide(container, game, dungeon, openSections) {
  container.innerHTML = '';
  container.appendChild(createLevelBox(game, dungeon));

  const enemies = createSection('enemies', t('guide.enemies', { count: dungeon.encounters.length }), openSections);
  dungeon.encounters.forEach((encounter, index) => {
    if (encounter.type === 'boss') {
      const known = game.isEncounterKnown(dungeon.id, index);
      enemies.body.appendChild(createBossCard(getBoss(encounter.bossId), dungeon.level, index, known));
    } else {
      enemies.body.appendChild(createTrashRow(encounter, index));
    }
  });
  container.appendChild(enemies.section);

  const chest = getLootBoxType(dungeon.rewards.chest);
  const loot = createSection('loot', t('guide.loot', { name: chest.name }), openSections);
  renderLoot(loot.body, game, dungeon, chest);
  container.appendChild(loot.section);
}

// Aufklappbarer Bereich, merkt sich den Zustand in openSections
function createSection(name, title, openSections) {
  const section = document.createElement('details');
  section.className = 'guide-section';
  section.open = openSections[name] !== false; // anfangs offen
  section.innerHTML = '<summary></summary><div class="guide-body"></div>';
  section.querySelector('summary').textContent = title;
  section.addEventListener('toggle', () => {
    openSections[name] = section.open;
  });
  return { section, body: section.querySelector('.guide-body') };
}

// Kasten "Niveau": Stufe, Empfehlung, Item-Level der Beute, Wissensstand, bekannte Schadensarten
function createLevelBox(game, dungeon) {
  const knowledge = game.getDungeonKnowledge(dungeon.id);
  const box = document.createElement('div');
  box.className = 'guide-level';
  box.innerHTML = `
    <div>${t('guide.level', { level: dungeon.level, gear: dungeon.recommendedGearScore })}</div>
    <div class="hint">Beute hat Item-Level ${dungeon.level}</div>
    <div class="guide-knowledge knowledge-${knowledge.level}"></div>
    <div class="guide-damage-types"></div>
  `;
  box.querySelector('.guide-knowledge').textContent = knowledge.level === 'full'
    ? t('guide.fullyScouted', { known: knowledge.known, total: knowledge.total })
    : t('guide.scouted', { known: knowledge.known, total: knowledge.total });

  const damageTypes = game.getKnownDamageTypes(dungeon.id);
  const line = box.querySelector('.guide-damage-types');
  if (damageTypes.length > 0) {
    line.innerHTML = '<span class="hint">' + t('guide.knownDamage') + '</span> ';
    for (const damageTypeId of damageTypes) {
      line.appendChild(createDamageTypeChip(damageTypeId));
    }
  } else if (knowledge.level !== 'full') {
    line.innerHTML = '<span class="hint">' + t('guide.damageUnknown') + '</span>';
  }
  return box;
}

function createDamageTypeChip(damageTypeId) {
  const chip = document.createElement('span');
  chip.className = 'resistance-chip';
  chip.style.color = getDamageType(damageTypeId).color;
  chip.textContent = getDamageType(damageTypeId).name;
  return chip;
}

// Trash-Gruppe: Bilder der Gegner und ihre Namen
function createTrashRow(encounter, index) {
  const row = document.createElement('div');
  row.className = 'encounter-row';
  row.innerHTML = '<div class="encounter-icons"></div><div class="encounter-text"><b></b><span></span></div>';
  for (const enemyId of encounter.enemies) {
    const enemy = MINIONS[enemyId];
    row.querySelector('.encounter-icons').appendChild(createSpriteCanvas(enemy.sprite, 2, enemy.colors || {}));
  }
  row.querySelector('b').textContent = (index + 1) + '. ' + encounter.name;
  const names = [...new Set(encounter.enemies.map((enemyId) => MINIONS[enemyId].name))];
  row.querySelector('span').textContent = encounter.enemies.length + ' Gegner: ' + names.join(', ');
  return row;
}

// Boss im Detail: Bild, Name, Leben (auf der Stufe des Dungeons), Raserei, Angriffsart, Fähigkeiten mit Tipps.
// known = false: Nur Bild und Name, der Rest ist noch nicht erkundet.
function createBossCard(boss, level, index, known) {
  const card = document.createElement('div');
  card.className = 'boss-card';
  card.innerHTML = `
    <div class="boss-card-head">
      <div class="boss-card-icon"></div>
      <div>
        <b class="boss-card-name"></b>
        <div class="boss-card-stats hint"></div>
      </div>
    </div>
    <ul class="boss-mechanics"></ul>
  `;
  card.querySelector('.boss-card-icon').appendChild(createSpriteCanvas(boss.sprite, 4, boss.colors || {}));
  card.querySelector('.boss-card-name').textContent = (index + 1) + '. Boss: ' + boss.name + ' – ' + boss.title;
  if (!known) {
    card.classList.add('unknown');
    card.querySelector('.boss-card-stats').textContent = 'Noch nicht erkundet: Leben, Fähigkeiten und Schadensarten sind unbekannt.';
    return card;
  }

  const health = Math.round(boss.stats.health * getEnemyLevelFactors(level).health);
  const stats = [t('guide.health', { health })];
  if (boss.enrageRound) {
    stats.push(t('guide.enrage', { round: boss.enrageRound }));
  }
  if (boss.attackDamageType && boss.attackDamageType !== 'physical') {
    stats.push(t('guide.attacksWith', { type: getDamageType(boss.attackDamageType).name }));
  }
  card.querySelector('.boss-card-stats').textContent = stats.join(' · ');

  const list = card.querySelector('.boss-mechanics');
  for (const mechanic of boss.mechanics) {
    const item = document.createElement('li');
    item.innerHTML = '<b class="mechanic-name"></b> <span class="mechanic-what"></span><div class="mechanic-tip"></div>';
    item.querySelector('.mechanic-name').textContent = mechanic.name;
    const what = [MECHANIC_TYPE_TEXTS[mechanic.type]];
    if (mechanic.damageType && mechanic.damageType !== 'physical') {
      what.push(getDamageType(mechanic.damageType).name);
    }
    if (mechanic.interruptible) {
      what.push(t('guide.interruptible'));
    }
    item.querySelector('.mechanic-what').textContent = '– ' + what.join(' · ');
    item.querySelector('.mechanic-tip').textContent = t('guide.tip', { text: mechanic.hint });
    // Wer kann kontern? z.B. "Unterbrechen: Schurke · per Talent: Jäger (Netzwurf), Magier (Bannendes Eis)"
    for (const counterId of getCounterIds(mechanic)) {
      item.appendChild(createCounterLine(getCounter(counterId)));
    }
    list.appendChild(item);
  }
  return card;
}

// Beute: Gold, Kiste und die Boss-Items (eines davon ist garantiert in der Kiste)
function renderLoot(container, game, dungeon, chest) {
  const reward = document.createElement('div');
  reward.className = 'reward-line';
  reward.appendChild(createSpriteCanvas('coin', 2));
  reward.insertAdjacentHTML('beforeend', '<span></span>');
  reward.querySelector('span').textContent = t('guide.reward', { gold: dungeon.rewards.gold, trash: dungeon.rewards.trashGold });
  container.appendChild(reward);

  const chestLine = document.createElement('div');
  chestLine.className = 'reward-line';
  chestLine.appendChild(createChestCanvas(chest, 2));
  chestLine.insertAdjacentHTML('beforeend', '<span></span>');
  chestLine.querySelector('span').textContent = t('guide.chest', { name: chest.name, count: chest.itemCount });
  container.appendChild(chestLine);

  const book = game.guild.collection;
  for (const entry of chest.bossLoot || []) {
    container.appendChild(createBossItemRow(entry, book.getBestRarity(entry.id)));
  }
}

// Ein Boss-Item: Bild, Name, Platz und Rüstungsart, für welche Klassen, Sterne aus dem Sammelbuch
function createBossItemRow(entry, bestRarity) {
  const template = getItemTemplate(entry.templateId);
  const row = document.createElement('div');
  row.className = 'boss-item-row';
  // Ein Item nur fürs Bild, in der besten gefundenen Seltenheit (sonst der Mindest-Seltenheit)
  const previewItem = new Item(0, entry.templateId, bestRarity || entry.minRarity, entry.name, {});
  row.appendChild(createItemCanvas(previewItem, 3));
  row.insertAdjacentHTML('beforeend', `
    <span class="boss-item-text">
      <span class="boss-item-name"></span>
      <span class="boss-item-kind hint"></span>
      <span class="boss-item-for hint"></span>
    </span>
    <span class="boss-item-found"></span>
  `);
  const name = row.querySelector('.boss-item-name');
  name.textContent = entry.name;
  name.style.color = getRarity(entry.minRarity).color;
  const armorTypeName = getArmorTypeName(template);
  row.querySelector('.boss-item-kind').textContent = SLOT_NAMES[template.slot] + (armorTypeName ? ' · ' + armorTypeName : '') +
    t('guide.atLeast', { rarity: getRarity(entry.minRarity).name });
  row.querySelector('.boss-item-for').textContent = t('parts.for', { names: getSuitableClasses(template).map((heroClass) => heroClass.name).join(', ') });

  const found = row.querySelector('.boss-item-found');
  if (bestRarity) {
    found.textContent = STARS[bestRarity] || '✓';
    found.style.color = getRarity(bestRarity).color;
    found.title = t('guide.inCollection', { rarity: getRarity(bestRarity).name });
  } else {
    found.textContent = '???';
    found.classList.add('boss-item-missing');
    found.title = t('guide.notFound');
  }
  return row;
}

// Zeile "Unterbrechen: Schurke · per Talent: Jäger (Netzwurf), Magier (Bannendes Eis)"
function createCounterLine(counter) {
  const line = document.createElement('div');
  line.className = 'mechanic-counter';
  const fixed = counter.classIds.map((classId) => getHeroClass(classId).name).join(', ');
  const byTalent = counter.talents.map((entry) => getHeroClass(entry.classId).name + ' (' + findTalent(entry.talentId).name + ')').join(', ');
  line.textContent = t('guide.counterLine', { name: counter.name, fixed, talents: byTalent });
  return line;
}
