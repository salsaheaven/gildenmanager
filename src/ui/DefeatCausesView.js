// ============================================================
// DEFEATCAUSESVIEW – Kasten "Woran es lag": die größten Ursachen mit Balken, ein Tipp, kurze Hinweise
// Benutzt im Tagesabschluss (DayEndOverlay) und im gespeicherten Bericht (RunViewer).
// Die Rechnung steht in systems/combat/DefeatAnalysis.js.
// ============================================================

// Farbe der Balken je Art der Ursache
const TYPE_COLORS = {
  mechanic: '#ff8c3a',
  attack: '#ff6b6b',
  minion: '#c77dff',
  enrage: '#ff3030',
};

// analysis = Ergebnis von analyzeRun (oder null: dann gibt es nichts zu zeigen)
export function createDefeatCausesView(analysis) {
  const box = document.createElement('div');
  box.className = 'defeat-causes';
  if (!analysis || analysis.causes.length === 0) {
    box.hidden = true;
    return box;
  }
  box.innerHTML = '<div class="defeat-title">Woran es lag</div>';

  for (const cause of analysis.causes) {
    const percent = Math.round(cause.share * 100);
    const row = document.createElement('div');
    row.className = 'defeat-cause';
    row.innerHTML = `
      <span class="defeat-cause-name"></span>
      <span class="defeat-cause-bar"><span></span></span>
      <span class="defeat-cause-percent"></span>
    `;
    row.querySelector('.defeat-cause-name').textContent = cause.name;
    const fill = row.querySelector('.defeat-cause-bar span');
    fill.style.width = percent + '%';
    fill.style.background = TYPE_COLORS[cause.type] || '#ff6b6b';
    row.querySelector('.defeat-cause-percent').textContent = percent + ' %';
    box.appendChild(row);
  }

  for (const note of analysis.notes) {
    const line = document.createElement('div');
    line.className = 'defeat-note';
    line.textContent = '⚠ ' + note;
    box.appendChild(line);
  }

  if (analysis.tip) {
    const tip = document.createElement('div');
    tip.className = 'defeat-tip';
    tip.textContent = 'Tipp: ' + analysis.tip;
    box.appendChild(tip);
  }
  return box;
}
