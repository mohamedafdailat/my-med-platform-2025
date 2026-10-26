const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { chromium } = require('playwright');

// Run after integration tests, with the local demo API and frontend running.
// Fixtures and every browser request are restricted to localhost.
const origin = 'http://127.0.0.1:3180';
const artifacts = path.resolve(__dirname, '../.cache/student-experience-qa');
execFileSync(process.execPath, [path.join(__dirname, 'student-experience-fixtures.cjs')], { stdio: 'inherit' });

(async () => {
  fs.mkdirSync(artifacts, { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, permissions: ['clipboard-read', 'clipboard-write'] });
  // Exercise clipboard fallback without opening the operating system's share sheet.
  await context.addInitScript(() => Object.defineProperty(navigator, 'share', { value: undefined, configurable: true }));
  await context.route('**/*', route => ['127.0.0.1', 'localhost'].includes(new URL(route.request().url()).hostname) ? route.continue() : route.abort());
  const page = await context.newPage();
  page.setDefaultTimeout(20000);
  const errors = [];
  const mediaRequests = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (/\/api\/videos\/[^/]+\/media/.test(request.url())) mediaRequests.push(request.url()); });
  const fits = async label => assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${label} overflows viewport`);
  // Keep the same React application mounted when changing the current route/language.
  const navigate = async route => {
    await page.evaluate(destination => { window.history.pushState({}, '', destination); window.dispatchEvent(new PopStateEvent('popstate')); }, route);
  };
  const capture = async name => {
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.screenshot({ path: path.join(artifacts, name), fullPage: true, animations: 'disabled' });
  };
  try {
    await page.goto(origin + '/dashboard');
    await page.waitForURL('**/login');
    await page.locator('#email').fill('audit-student@example.test');
    await page.locator('#password').fill('LocalOnly-123456!');
    await page.getByRole('button', { name: 'Se connecter', exact: true }).click();
    await page.waitForURL('**/dashboard');
    await page.locator('.sd-content[aria-busy="false"]').waitFor();
    await page.getByRole('heading', { name: 'Votre rythme de révision' }).waitFor();
    assert.equal(await page.locator('.sd-activity-total strong').innerText(), '6');
    await page.getByRole('button', { name: '30 jours', exact: true }).click();
    assert.equal(await page.locator('.sd-activity-total strong').innerText(), '11');
    await page.locator('.sd-data-details summary').click();
    assert.equal(await page.locator('.sd-data-details tbody tr').count(), 30);
    await page.locator('.sd-data-details summary').click();
    await fits('desktop dashboard');
    await capture('dashboard-desktop.png');
    await page.setViewportSize({ width: 390, height: 844 });
    await fits('mobile dashboard');
    await capture('dashboard-mobile.png');
    await page.setViewportSize({ width: 1440, height: 1000 });
    await navigate('/videos');
    await page.locator('.vl-card').first().waitFor();
    assert.ok(await page.locator('.vl-card').count() >= 6);
    assert.equal(await page.locator('.video-library iframe, .video-library video').count(), 0, 'Library must not load players or protected media');
    assert.equal(mediaRequests.length, 0);
    assert.equal(await page.locator('.vl-card a[href*="experience-s2-hidden"], .vl-card a[href*="experience-inactive-hidden"]').count(), 0);
    assert.ok(await page.locator('.vl-card a[href*="experience-general-upload"]').count() > 0, 'Storage-only video remains discoverable');
    await page.locator('#video-search').fill('MEDECINE');
    await page.getByRole('heading', { name: 'Les essentiels de la consultation', exact: true }).waitFor();
    assert.equal(await page.locator('.vl-card').count(), 1, 'Search matches legacy categories without accents');
    await page.getByRole('button', { name: 'Effacer la recherche', exact: true }).click();
    await page.getByRole('button', { name: /^Pharmacie/ }).click();
    assert.equal(await page.locator('.vl-card').count(), 1);
    await page.getByRole('button', { name: 'Réinitialiser les filtres', exact: true }).click();
    await page.getByRole('button', { name: 'Affichage en liste', exact: true }).click();
    await page.locator('.vl-list').waitFor();
    await page.getByRole('button', { name: 'Affichage en grille', exact: true }).click();
    await page.locator('#video-sort').selectOption('title');
    const titles = await page.locator('.vl-card h3').allInnerTexts();
    assert.deepEqual(titles, [...titles].sort((a, b) => a.localeCompare(b, 'fr')));
    await page.locator('.vl-card').first().getByRole('button', { name: /^Partager/ }).click();
    await page.getByRole('status').filter({ hasText: 'Lien copié' }).waitFor();
    assert.match(await page.evaluate(() => navigator.clipboard.readText()), /^http:\/\/127\.0\.0\.1:3180\/videos\/[^?]+$/);
    await capture('videos-desktop.png');
    for (const width of [768, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      await fits(`videos ${width}px`);
    }
    await capture('videos-mobile.png');
    await page.locator('#video-search').fill('zzzz-no-result');
    await page.getByRole('heading', { name: 'Pas encore la bonne vidéo ?' }).waitFor();
    await page.getByRole('button', { name: 'Réinitialiser les filtres', exact: true }).first().click();
    await navigate('/settings');
    await page.locator('#language').selectOption('ar');
    await navigate('/videos');
    await page.locator('.video-library[dir="rtl"] .vl-card').first().waitFor();
    await fits('Arabic videos mobile');
    await capture('videos-arabic-mobile.png');
    await navigate('/dashboard');
    await page.locator('.student-space[dir="rtl"] .sd-content[aria-busy="false"]').waitFor();
    await fits('Arabic dashboard mobile');
    await capture('dashboard-arabic-mobile.png');
    assert.deepEqual(errors, [], 'Unexpected browser errors');
    console.log('PASS dashboard real activity 7/30 days, accessible table, video search/categories/sorting/views/share, semester isolation, mobile 320/390/768, Arabic RTL, no uncaught errors.');
  } finally { await context.close(); await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
