// ============================================================
// NEWSLINE – eine Zeile aus dem Neuigkeiten-Ticker des Servers
// Benutzt im Tagesplan (neueste Meldungen) und im Tagesabschluss (Meldungen des Abends).
// Die Meldungen schreibt systems/RivalSystem.js.
// ============================================================

// Eine Zeile im Ticker: "Tag 5 · Aschenkrone: Grimmzahn besiegt …" (Server-First hervorgehoben)
export function createNewsLine(news) {
  const line = document.createElement('div');
  line.className = 'news-line' + (news.kind === 'serverFirst' ? ' server-first' : '') + (news.isPlayer ? ' player' : '');
  line.style.setProperty('--news-color', news.color);
  line.innerHTML = '<span class="news-day"></span><span class="news-text"></span>';
  line.querySelector('.news-day').textContent = 'Tag ' + news.day;
  line.querySelector('.news-text').textContent = news.text;
  return line;
}
