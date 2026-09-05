import test from 'node:test';
import assert from 'node:assert/strict';
import { groupAttestationDossiers } from '../src/attestationPdf.js';

test('attestationPdf - groupAttestationDossiers', async (t) => {
  await t.test('regroupe les dossiers d’une même entreprise pour un lot valide', () => {
    const dossiers = [
      { id: 'D1', entrepriseId: 'E1', statutWorkflow: 'VALIDE', entreprise: { id: 'E1', raisonSociale: 'Alpha' } },
      { id: 'D2', entrepriseId: 'E1', statutWorkflow: 'VALIDE', entreprise: { id: 'E1', raisonSociale: 'Alpha' } }
    ];

    const result = groupAttestationDossiers(dossiers);
    assert.equal(result.groupKey, 'E1');
    assert.equal(result.items.length, 2);
    assert.equal(result.entrepriseName, 'Alpha');
  });

  await t.test('rejette un lot mixte avec plusieurs entreprises', () => {
    const dossiers = [
      { id: 'D1', entrepriseId: 'E1', statutWorkflow: 'VALIDE', entreprise: { id: 'E1', raisonSociale: 'Alpha' } },
      { id: 'D2', entrepriseId: 'E2', statutWorkflow: 'VALIDE', entreprise: { id: 'E2', raisonSociale: 'Beta' } }
    ];

    assert.throws(() => groupAttestationDossiers(dossiers), /même entreprise/i);
  });
});
