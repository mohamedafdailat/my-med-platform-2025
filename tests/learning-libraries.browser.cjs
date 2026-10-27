const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const { seedLearningLibrary, ids } = require('./learning-library-fixtures.cjs');

const origin = 'http://127.0.0.1:3180';
const artifacts = path.resolve(__dirname, '../.cache/learning-library-qa');
const password = 'LocalOnly-123456!';

(async () => {
  await seedLearningLibrary();
  fs.mkdirSync(artifacts, { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const contexts = [];
  const errors = [];
  const newPage = async () => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    contexts.push(context);
    await context.route('**/*', route => ['127.0.0.1', 'localhost'].includes(new URL(route.request().url()).hostname) ? route.continue() : route.abort());
    const page = await context.newPage();
    page.setDefaultTimeout(20000);
    page.on('pageerror', error => errors.push(error.message));
    return page;
  };
  const login = async (page, email, destination) => {
    await page.goto(origin + destination);
    await page.waitForURL('**/login');
    await page.locator('#email').fill(email);
    await page.locator('#password').fill(password);
    await page.getByRole('button', { name: 'Se connecter', exact: true }).click();
    await page.waitForURL(origin + destination);
  };
  const navigate = async (page, route) => {
    await page.evaluate(destination => { window.history.pushState({}, '', destination); window.dispatchEvent(new PopStateEvent('popstate')); }, route);
  };
  const capture = async (page, name) => {
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.screenshot({ path: path.join(artifacts, name), fullPage: true, animations: 'disabled' });
  };
  const fits = async (page, label) => assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), label + ' overflows the viewport');
  const actionsAreClear = async page => assert.ok(await page.evaluate(() => {
    const trigger = document.querySelector('.docbuddy-trigger')?.getBoundingClientRect();
    if (!trigger) return true;
    return [...document.querySelectorAll('.fcl-rating-actions button, .fcl-summary-actions button')].every(button => {
      const box = button.getBoundingClientRect();
      return box.right <= trigger.left || box.left >= trigger.right || box.bottom <= trigger.top || box.top >= trigger.bottom;
    });
  }), 'Floating assistant must not overlap revision actions');
  const quizCard = (page, id) => page.locator(`[data-quiz-id="${id}"]`);
  const deckCard = (page, id) => page.locator(`[data-deck-id="${id}"]`);

  try {
    const student = await newPage();
    await login(student, 'audit-student@example.test', '/quizzes');
    await quizCard(student, ids.quizzes.private).waitFor();
    await quizCard(student, ids.quizzes.sharedAI).waitFor();
    await student.locator('[data-quiz-stat="average"]').filter({ hasText: /40(?:[,.]0)?\s*%/ }).waitFor();
    for (const id of [ids.quizzes.otherPrivate, ids.quizzes.semester2, ids.quizzes.inactive]) assert.equal(await quizCard(student, id).count(), 0, 'Unauthorized or inactive quiz is visible: ' + id);
    assert.match(await quizCard(student, ids.quizzes.private).innerText(), /\b0\s*%/, 'A measured zero must be displayed');
    assert.match(await student.locator('[data-quiz-stat="average"]').innerText(), /40(?:[,.]0)?\s*%/);
    const globalStats = await student.locator('[data-quiz-stat]').allInnerTexts();
    await student.locator('#quiz-search').fill('REPERES');
    assert.equal(await student.locator('.ql-card').count(), 1, 'Quiz search must ignore accents');
    assert.deepEqual(await student.locator('[data-quiz-stat]').allInnerTexts(), globalStats, 'Filtering must not change global learning statistics');
    await student.locator('#quiz-search').fill('');
    await student.locator('[data-quiz-space="library"]').click();
    await student.locator('#quiz-source').selectOption('ai-generated');
    await quizCard(student, ids.quizzes.sharedAI).waitFor();
    assert.equal(await quizCard(student, ids.quizzes.private).count(), 0, 'Private content belongs in its own space');
    await student.locator('[data-quiz-space="personal"]').click();
    await quizCard(student, ids.quizzes.private).waitFor();
    await student.locator('#quiz-status').selectOption('todo');
    assert.equal(await quizCard(student, ids.quizzes.private).count(), 0);
    await student.locator('#quiz-status').selectOption('completed');
    await quizCard(student, ids.quizzes.private).waitFor();
    await student.locator('[data-quiz-space="all"]').click();
    await student.locator('#quiz-status').selectOption('all');
    await student.locator('#quiz-source').selectOption('all');
    await student.locator('#quiz-sort').selectOption('title');
    const quizTitles = await student.locator('.ql-card h3').allInnerTexts();
    assert.deepEqual(quizTitles, [...quizTitles].sort((a, b) => a.localeCompare(b, 'fr')));
    await capture(student, 'quizzes-desktop.png');
    for (const width of [768, 390, 320]) { await student.setViewportSize({ width, height: 900 }); await fits(student, `Quiz ${width}px`); }
    await capture(student, 'quizzes-mobile.png');
    await student.locator('#quiz-search').fill('zzzz-no-results');
    assert.equal(await student.locator('.ql-card').count(), 0);
    await student.locator('#quiz-search').fill('');

    await student.setViewportSize({ width: 1440, height: 1000 });
    await navigate(student, '/flashcards');
    await deckCard(student, ids.flashcards.private).waitFor();
    await deckCard(student, ids.flashcards.shared).waitFor();
    await deckCard(student, ids.flashcards.legacyItems).waitFor();
    await deckCard(student, ids.flashcards.legacyFlashcards).waitFor();
    for (const id of [ids.flashcards.otherPrivate, ids.flashcards.semester2, ids.flashcards.inactive]) assert.equal(await deckCard(student, id).count(), 0, 'Unauthorized or inactive deck is visible: ' + id);
    assert.equal(await deckCard(student, ids.flashcards.shared).getByRole('button', { name: /^Supprimer/ }).count(), 0, 'Shared deck cannot be deleted by a student');
    assert.ok(await deckCard(student, ids.flashcards.private).getByRole('button', { name: /^Supprimer/ }).count() > 0);
    await student.locator('#flashcard-search').fill('CLINIQUES');
    assert.equal(await student.locator('[data-deck-id]').count(), 1, 'Deck search must ignore accents');
    await deckCard(student, ids.flashcards.legacyItems).waitFor();
    await student.locator('#flashcard-search').fill('');
    await student.locator('#flashcard-difficulty').selectOption('hard');
    await deckCard(student, ids.flashcards.legacyFlashcards).waitFor();
    assert.equal(await deckCard(student, ids.flashcards.private).count(), 0);
    await student.locator('#flashcard-difficulty').selectOption('all');
    await student.getByRole('button', { name: /^Mes decks\b/ }).click();
    await deckCard(student, ids.flashcards.private).waitFor();
    assert.equal(await deckCard(student, ids.flashcards.shared).count(), 0);
    await student.getByRole('button', { name: /^Bibliothèque/ }).click();
    await student.locator('#flashcard-sort').selectOption('title');
    const deckTitles = await student.locator('[data-deck-id] h3').allInnerTexts();
    assert.deepEqual(deckTitles, [...deckTitles].sort((a, b) => a.localeCompare(b, 'fr')));
    await student.getByRole('button', { name: /^Tous les decks/ }).click();
    await student.locator('#flashcard-sort').selectOption('recent');
    await capture(student, 'flashcards-desktop.png');
    for (const width of [768, 390, 320]) { await student.setViewportSize({ width, height: 900 }); await fits(student, `Flashcards ${width}px`); }
    await capture(student, 'flashcards-mobile.png');

    // A session evaluates each real card once even if an answer is revised.
    await deckCard(student, ids.flashcards.private).getByRole('button', { name: 'Étudier', exact: true }).click();
    const study = student.locator('.fcl-study-page');
    await study.waitFor();
    await study.getByRole('checkbox', { name: 'Passer automatiquement à la carte suivante', exact: true }).uncheck();
    await study.getByRole('button', { name: 'Voir la réponse', exact: true }).click();
    await study.getByText('Le cœur.', { exact: true }).waitFor();
    await study.getByRole('button', { name: 'Correct', exact: true }).click();
    await study.getByRole('button', { name: 'Incorrect', exact: true }).click();
    assert.equal(await study.locator('progress').getAttribute('value'), '1', 'Regrading a card cannot inflate the number reviewed');
    await fits(student, 'Flashcard study 320px');
    await actionsAreClear(student);
    await capture(student, 'flashcards-study-mobile.png');
    await study.getByRole('button', { name: 'Suivant', exact: true }).click();
    await student.evaluate(() => document.activeElement?.blur());
    await student.keyboard.press('Space');
    await study.getByRole('button', { name: 'Masquer la réponse', exact: true }).waitFor();
    await study.getByRole('button', { name: 'Correct', exact: true }).click();
    await study.getByRole('button', { name: 'Suivant', exact: true }).click();
    await study.getByRole('button', { name: 'Terminer', exact: true }).click();
    await student.locator('.fcl-summary-page').waitFor();
    assert.match(await student.locator('.fcl-summary-grid').innerText(), /2\s*\/\s*3/);
    await actionsAreClear(student);
    await capture(student, 'flashcards-summary-mobile.png');
    await student.getByRole('button', { name: 'Retour aux decks', exact: true }).click();
    await deckCard(student, ids.flashcards.private).waitFor();

    // The existing PDF generation/persistence/publication journey runs separately
    // in browser-audit.cjs before this fixture-based library journey.
    await navigate(student, '/settings');
    await student.locator('#language').selectOption('ar');
    await navigate(student, '/quizzes');
    await quizCard(student, ids.quizzes.sharedAI).waitFor();
    assert.equal(await student.locator('#quiz-search').evaluate(element => getComputedStyle(element).direction), 'rtl');
    await fits(student, 'Arabic quiz mobile');
    await capture(student, 'quizzes-arabic-mobile.png');
    await navigate(student, '/flashcards');
    await deckCard(student, ids.flashcards.shared).waitFor();
    await fits(student, 'Arabic flashcards mobile');
    await capture(student, 'flashcards-arabic-mobile.png');

    const manager = await newPage();
    await login(manager, 'audit-admin@example.test', '/quizzes');
    const published = quizCard(manager, ids.quizzes.private);
    await published.waitFor();
    await published.locator(`#publish-quizzes-${ids.quizzes.private}`).selectOption('2');
    await published.getByRole('button', { name: 'Publier dans la bibliothèque', exact: true }).click();
    await published.getByRole('button', { name: 'Rendre personnel', exact: true }).waitFor();
    const other = await newPage();
    await login(other, 'audit-other@example.test', '/quizzes');
    await quizCard(other, ids.quizzes.private).waitFor();
    await other.locator('[data-quiz-space="library"]').click();
    await other.locator('#quiz-source').selectOption('ai-generated');
    await quizCard(other, ids.quizzes.private).waitFor();
    await navigate(student, '/quizzes');
    await student.locator('#quiz-search').waitFor();
    await student.locator('.ql-card').first().waitFor();
    assert.equal(await quizCard(student, ids.quizzes.private).count(), 0, 'S1 cannot read a quiz published for S2');
    await published.getByRole('button', { name: 'Rendre personnel', exact: true }).click();
    await published.getByRole('button', { name: 'Publier dans la bibliothèque', exact: true }).waitFor();
    await other.reload();
    await other.locator('#quiz-search').waitFor();
    await other.locator('.ql-card').first().waitFor();
    assert.equal(await quizCard(other, ids.quizzes.private).count(), 0, 'Unpublished personal quiz must disappear from other accounts');
    assert.deepEqual(errors, [], 'Unexpected browser errors');
    console.log('PASS quiz personal/library/AI spaces, real 0% score and fixed global stats, search/status/sort, protected deck isolation, legacy cards, session flip/keyboard/regrading/summary, admin publish/unpublish, mobile 320/390/768 and Arabic RTL.');
  } finally { for (const context of contexts) await context.close(); await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
