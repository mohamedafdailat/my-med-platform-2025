const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

// All accounts and writes are restricted to the local demo environment.
const origin = 'http://127.0.0.1:3180';
const password = 'LocalOnly-123456!';
const artifacts = path.resolve(__dirname, '../.cache/production-audit');
const syntheticPdf = () => {
  const content = 'BT /F1 12 Tf 40 100 Td (Le coeur pompe le sang vers les organes.) Tj ET';
  const objects = ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>', '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 200] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>', `<< /Length ${content.length} >>\nstream\n${content}\nendstream`];
  let pdf = '%PDF-1.4\n'; const offsets = [0];
  objects.forEach((object, i) => { offsets.push(Buffer.byteLength(pdf)); pdf += `${i + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = Buffer.byteLength(pdf);
  pdf += 'xref\n0 6\n0000000000 65535 f \n' + offsets.slice(1).map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`).join('');
  pdf += `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(pdf);
};

(async () => {
  fs.mkdirSync(artifacts, { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const errors = [];
  const contexts = [];
  const newPage = async (viewport = { width: 1440, height: 1000 }) => {
    const context = await browser.newContext({ viewport });
    contexts.push(context);
    await context.route('**/*', route => {
      const url = new URL(route.request().url());
      if (!['127.0.0.1', 'localhost'].includes(url.hostname)) return route.abort();
      return route.continue();
    });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    page.on('dialog', dialog => dialog.accept());
    page.setDefaultTimeout(20000);
    return page;
  };
  const login = async (page, email) => {
    await page.locator('#email').fill(email);
    await page.locator('#password').fill(password);
    await page.getByRole('button', { name: 'Se connecter', exact: true }).click();
  };
  try {
    const student = await newPage();
    await student.goto(origin + '/profile?tab=personal#info');
    await student.waitForURL('**/login');
    await login(student, 'audit-student@example.test');
    await student.waitForURL('**/profile?tab=personal#info');
    await student.locator('#profile-fullName').fill('Étudiant Navigateur');
    await student.locator('#profile-phoneNumber').fill('0612345678');
    assert.equal(await student.locator('#profile-semester').isDisabled(), true);
    await student.getByRole('button', { name: 'Enregistrer mon profil' }).click();
    await student.getByText('Votre profil a été enregistré.', { exact: true }).waitFor();
    await student.reload();
    await student.locator('#profile-fullName').waitFor();
    assert.equal(await student.locator('#profile-fullName').inputValue(), 'Étudiant Navigateur');
    assert.equal(await student.locator('#profile-semester').inputValue(), '1');
    await student.screenshot({ path: path.join(artifacts, 'profile-local.png'), fullPage: true });
    await student.setViewportSize({ width: 390, height: 844 });
    await student.screenshot({ path: path.join(artifacts, 'profile-mobile-local.png'), fullPage: true });
    const overflow = await student.evaluate(() => [...document.querySelectorAll('body *')].filter(e => e.getBoundingClientRect().right > innerWidth + 1).slice(0, 8).map(e => ({ tag: e.tagName, className: e.className, right: e.getBoundingClientRect().right })));
    assert.ok(await student.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Profile overflows on mobile: ' + JSON.stringify(overflow));
    console.log('PASS student login returns to requested page; profile persists; mobile layout fits');
    await student.goto(origin + '/admin/users');
    await student.waitForURL(origin + '/');
    await student.goto(origin + '/courses');
    await student.getByRole('heading', { name: 'Abonnement Premium Requis' }).waitFor();
    console.log('PASS student cannot enter admin; unpaid access guard renders');

    const teacher = await newPage();
    await teacher.goto(origin + '/profile');
    await login(teacher, 'audit-other@example.test');
    await teacher.locator('#profile-fullName').waitFor();
    console.log('PASS teacher can access personal profile');

    const registration = await newPage();
    await registration.goto(origin + '/register');
    const newEmail = `browser-audit-${Date.now()}@example.test`;
    await registration.locator('#fullName').fill('Nouveau Navigateur');
    await registration.locator('#email').fill(newEmail);
    await registration.locator('#phoneNumber').fill('0612345678');
    await registration.locator('#semester').fill('2');
    await registration.locator('#password').fill(password);
    await registration.locator('#confirmPassword').fill(password);
    await registration.locator('input[type=checkbox]').check();
    await registration.getByRole('button', { name: 'Créer mon compte', exact: true }).click();
    await registration.waitForURL('**/login');
    await registration.getByRole('button', { name: 'Se connecter', exact: true }).waitFor();
    assert.equal(await registration.locator('#email').inputValue(), newEmail);
    await login(registration, newEmail);
    await registration.waitForURL('**/dashboard');
    await registration.goto(origin + '/profile');
    await registration.locator('#profile-fullName').waitFor();
    assert.equal(await registration.locator('#profile-fullName').inputValue(), 'Nouveau Navigateur');
    console.log('PASS registration creates Auth account and Firestore profile; login prefilled');

    const manager = await newPage();
    await manager.goto(origin + '/admin/users');
    await login(manager, 'audit-admin@example.test');
    const row = manager.getByRole('row').filter({ hasText: 'audit-other@example.test' });
    await row.waitFor();
    await row.getByRole('button', { name: 'Désactiver', exact: true }).click();
    await row.getByRole('button', { name: 'Réactiver', exact: true }).waitFor();
    await row.getByRole('button', { name: 'Réactiver', exact: true }).click();
    await row.getByRole('button', { name: 'Désactiver', exact: true }).waitFor();
    await manager.screenshot({ path: path.join(artifacts, 'admin-local.png'), fullPage: true });
    await manager.goto(origin + '/users/audit-student');
    await manager.getByText('Étudiant Navigateur', { exact: true }).first().waitFor();
    console.log('PASS admin lists users, disables/reactivates account, opens user profile API');

    // Synthetic privileges only; this URL can never point to production.
    const authResponse = await fetch('http://127.0.0.1:19099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo-key', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'audit-admin@example.test', password, returnSecureToken: true }) });
    const token = (await authResponse.json()).idToken;
    for (const id of ['audit-student', 'audit-other']) {
      const response = await fetch(`http://127.0.0.1:5180/api/users/${id}`, { method: 'PATCH', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, body: JSON.stringify({ subscriptionStatus: 'paid', role: 'student' }) });
      assert.equal(response.status, 200);
    }
    await student.goto(origin + '/quizzes');
    await student.getByRole('heading', { name: 'Private API Quiz', exact: true }).waitFor();
    await student.goto(origin + '/quizzes/api-private');
    await student.getByRole('button', { name: 'Vrai', exact: true }).click();
    const submitted = student.waitForResponse(response => response.url().endsWith('/api/quizzes/api-private/attempt') && response.request().method() === 'POST');
    await student.getByRole('button', { name: 'Terminer le quiz', exact: true }).click();
    assert.equal((await submitted).status(), 200);
    await student.getByText('100%', { exact: true }).waitFor();
    console.log('PASS quiz library, quiz player and individual result submission');
    await student.route('**/api/ai/xai-chat', route => route.fulfill({ json: { choices: [{ message: { content: JSON.stringify({ cards: [{ front: 'Quel organe pompe le sang ?', back: 'Le cœur.' }] }) } }] } }));
    await student.setViewportSize({ width: 1440, height: 1000 });
    await student.goto(origin + '/flashcards');
    await student.getByRole('button', { name: 'Générer depuis PDF', exact: true }).click();
    await student.locator('input[type=file]').setInputFiles({ name: 'cours-synthetique.pdf', mimeType: 'application/pdf', buffer: syntheticPdf() });
    await student.waitForFunction(() => document.querySelector('#deck-source')?.value.includes('Le coeur pompe'));
    const deckTitle = `Deck privé navigateur ${Date.now()}`;
    await student.locator('#deck-title').fill(deckTitle);
    await student.getByRole('button', { name: 'Générer les flashcards', exact: true }).click();
    await student.getByRole('button', { name: 'Enregistrer mes flashcards', exact: true }).click();
    await student.getByRole('heading', { name: deckTitle, exact: true }).waitFor();
    await student.reload();
    await student.getByRole('heading', { name: deckTitle, exact: true }).waitFor();
    const secondStudent = await newPage();
    await secondStudent.goto(origin + '/flashcards');
    await login(secondStudent, 'audit-other@example.test');
    await secondStudent.getByRole('heading', { name: 'Flashcards médicales', exact: true }).waitFor();
    assert.equal(await secondStudent.getByRole('heading', { name: deckTitle, exact: true }).count(), 0);
    await manager.goto(origin + '/flashcards');
    const deck = manager.locator('article').filter({ has: manager.getByRole('heading', { name: deckTitle, exact: true }) });
    await deck.locator('select').selectOption('2');
    await deck.getByRole('button', { name: 'Publier dans la bibliothèque' }).click();
    await deck.getByRole('button', { name: 'Rendre personnel' }).waitFor();
    await secondStudent.reload();
    await secondStudent.getByRole('heading', { name: deckTitle, exact: true }).waitFor();
    await secondStudent.locator('section').filter({ has: secondStudent.getByRole('heading', { name: 'Bibliothèque partagée', exact: true }) }).getByRole('heading', { name: deckTitle, exact: true }).waitFor();
    await student.reload();
    await student.getByRole('heading', { name: 'Flashcards médicales', exact: true }).waitFor();
    assert.equal(await student.getByRole('heading', { name: deckTitle, exact: true }).count(), 0, 'S1 cannot see a deck published for S2');
    await deck.getByRole('button', { name: 'Rendre personnel' }).click();
    await deck.getByRole('button', { name: 'Publier dans la bibliothèque' }).waitFor();
    await secondStudent.reload();
    await secondStudent.getByRole('heading', { name: 'Flashcards médicales', exact: true }).waitFor();
    assert.equal(await secondStudent.getByRole('heading', { name: deckTitle, exact: true }).count(), 0);
    console.log('PASS PDF extraction, flashcard generation/save/reload, two-user isolation, admin publishing/unpublishing');
    assert.deepEqual(errors, [], 'Unexpected browser errors');
    console.log('PASS no uncaught browser errors');
  } finally {
    for (const context of contexts) await context.close();
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
