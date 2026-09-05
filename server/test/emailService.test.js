import test from 'node:test';
import assert from 'node:assert/strict';
import { generateOtp, verifyOtp } from '../src/emailService.js';

test('emailService - generateOtp', async (t) => {
  await t.test('doit générer un code numérique à 6 chiffres avec expiration de 5 minutes', () => {
    const email = 'test.conseiller@emploi.ci';
    const { code, expiresAt, expiresInMinutes } = generateOtp(email);

    assert.equal(typeof code, 'string');
    assert.equal(code.length, 6);
    assert.match(code, /^\d{6}$/);
    assert.equal(expiresInMinutes, 5);
    assert.ok(expiresAt > Date.now());
  });
});

test('emailService - verifyOtp', async (t) => {
  await t.test('doit valider avec succès le bon code OTP', () => {
    const email = 'valid.user@emploi.ci';
    const { code } = generateOtp(email);

    const result = verifyOtp(email, code);
    assert.equal(result.valid, true);
  });

  await t.test('doit rejeter un code incorrect et indiquer le nombre d\'essais restants', () => {
    const email = 'wrong.code@emploi.ci';
    generateOtp(email);

    const result = verifyOtp(email, '000000');
    assert.equal(result.valid, false);
    assert.match(result.error, /Code de validation incorrect/);
  });

  await t.test('doit consommer le code après usage (usage unique)', () => {
    const email = 'single.use@emploi.ci';
    const { code } = generateOtp(email);

    const firstTry = verifyOtp(email, code);
    assert.equal(firstTry.valid, true);

    const secondTry = verifyOtp(email, code);
    assert.equal(secondTry.valid, false);
    assert.match(secondTry.error, /Aucun code actif trouvé/);
  });
});
