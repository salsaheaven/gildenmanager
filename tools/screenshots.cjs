// ============================================================
// SCREENSHOTS – nimmt die Bilder für die README auf (docs/screenshots/)
// Startet frische Spiele (Standard: Englisch, wie die README) und bringt sie mit dem Test-Menü in einen ansehnlichen Zustand.
// Vorher den Spiel-Server starten: npm run dev   Dann: node tools/screenshots.cjs (oder: node tools/screenshots.cjs de)
// Braucht Playwright (npx playwright install chromium, falls noch kein Browser da ist).
// ============================================================
const { chromium } = require('playwright');
const OUT = require('path').join(__dirname, '..', 'docs', 'screenshots') + '/';
const URL = 'http://localhost:5173/';
// Sprache der Bilder und die Beschriftungen, auf die das Skript klickt (das Test-Menü bleibt immer deutsch)
const LANG = process.argv[2] === 'de' ? 'de' : 'en';
const WORDS = {
  de: { locale: 'de-DE', today: 'Heute', heroes: 'Helden', dungeons: 'Dungeons', loot: 'Beute', skipAll: 'Alles überspringen', nextDay: 'Weiter zu Tag', chapel: 'Kapelle', throne: 'Thronschatz' },
  en: { locale: 'en-US', today: 'Today', heroes: 'Heroes', dungeons: 'Dungeons', loot: 'Loot', skipAll: 'Skip all', nextDay: 'On to day', chapel: 'Chapel', throne: 'Throne Treasure' },
}[LANG];
async function newPage(browser, mobile) {
  const ctx = await browser.newContext(mobile
    ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: WORDS.locale }
    : { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2, locale: WORDS.locale });
  const page = await ctx.newPage();
  await page.addInitScript((lang) => { try { localStorage.setItem('gildenmanager-sprache', lang); } catch (e) {} }, LANG);
  await page.goto(URL);
  await page.waitForTimeout(700);
  await page.evaluate(() => document.querySelector('.founding-start-button').click());
  await page.waitForTimeout(400);
  return page;
}
const js = (page, css, text) => page.evaluate(([c, t]) => {
  const el = [...document.querySelectorAll(c)].find((e) => (e.offsetParent || e.closest('.debug-panel')) && (!t || e.textContent.includes(t)));
  if (el) { el.click(); return true; } return false;
}, [css, text || '']);
async function debug(page, label, times = 1) {
  for (let i = 0; i < times; i++) {
    await page.evaluate((l) => { const b = [...document.querySelectorAll('button')].find((e) => e.textContent.trim() === l); if (b) b.click(); }, label);
    await page.waitForTimeout(120);
  }
}
async function hideToasts(page) { await page.evaluate(() => { const t = document.getElementById('toasts'); if (t) t.innerHTML = ''; }); }
async function nav(page, label) { await js(page, '.nav-tab', label); await page.waitForTimeout(350); }

(async () => {
  const browser = await chromium.launch();

  // 1) Tagesplan (Handy) nach ein paar Tagen
  let page = await newPage(browser, true);
  await debug(page, 'Alles freischalten');
  await debug(page, '+1000 Gold');
  await nav(page, WORDS.dungeons); await js(page, 'button', 'Auto'); await page.waitForTimeout(300); await js(page, '.start-button'); await page.waitForTimeout(300);
  for (let d = 0; d < 2; d++) {
    await page.evaluate(() => document.querySelector('.end-day-button').click()); await page.waitForTimeout(1200);
    await js(page, 'button', WORDS.skipAll); await page.waitForTimeout(800);
    await js(page, 'button', WORDS.nextDay); await page.waitForTimeout(3500);
    await page.evaluate(() => document.querySelector('.level-up-banner')?.click());
  }
  await nav(page, WORDS.today); await hideToasts(page); await page.waitForTimeout(300);
  await page.screenshot({ path: OUT + 'day-plan.png' });
  // Dungeon-Bildschirm mit Gruppe
  await nav(page, WORDS.dungeons); await hideToasts(page);
  await js(page, '.dungeon-card', WORDS.chapel); await page.waitForTimeout(300); await js(page, 'button', 'Auto'); await page.waitForTimeout(500);
  await page.screenshot({ path: OUT + 'dungeon.png' });
  // Held im Detail
  await debug(page, '+1 Level (alle Helden)', 4);
  await nav(page, WORDS.heroes); await js(page, '.hero-tile'); await page.waitForTimeout(400); await hideToasts(page);
  await page.screenshot({ path: OUT + 'hero.png' });
  // Kiste öffnen
  await page.context().close();
  page = await newPage(browser, false);
  await debug(page, 'Alles freischalten');
  await debug(page, 'Raid-Beute-Test: Raid-Kisten + Set-Kiste');
  await nav(page, WORDS.loot); await page.waitForTimeout(300);
  await js(page, '.box-entry', WORDS.throne); await page.waitForTimeout(5000); await hideToasts(page);
  await page.screenshot({ path: OUT + 'loot.png' });
  await page.context().close();

  // 2) Kampfszene (PC und Handy)
  for (const mobile of [false, true]) {
    page = await newPage(browser, mobile);
    await nav(page, WORDS.dungeons); await js(page, 'button', 'Auto'); await page.waitForTimeout(300); await js(page, '.start-button'); await page.waitForTimeout(300);
    await page.evaluate(() => document.querySelector('.end-day-button').click()); await page.waitForTimeout(1500);
    await hideToasts(page);
    await page.waitForTimeout(mobile ? 9500 : 9500); await hideToasts(page);
    await page.screenshot({ path: OUT + (mobile ? 'battle-mobile.png' : 'battle.png') });
    await page.context().close();
  }

  // 3) Raid (PC): Raid-Test, Kampfszene am Raid-Tag
  page = await newPage(browser, false);
  await debug(page, 'Alles freischalten');
  await debug(page, 'Raid-Test: 20 Helden auf Level 30');
  await debug(page, 'Zum nächsten Raid-Tag springen');
  await nav(page, WORDS.dungeons); await js(page, '.sub-tab', 'Raid'); await page.waitForTimeout(400);
  await js(page, '.auto-raid-button'); await page.waitForTimeout(500); await hideToasts(page);
  await page.evaluate(() => document.querySelector('.end-day-button').click()); await page.waitForTimeout(800);
  await js(page, '.end-day-check-confirm'); await page.waitForTimeout(1500);
  await page.waitForTimeout(6000); await hideToasts(page);
  await page.screenshot({ path: OUT + 'raid.png' });
  await page.context().close();
  await browser.close();
})();
