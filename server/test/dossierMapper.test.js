import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseFrenchDate,
  validateDossierPayload,
  toCreateData,
  toPublicDossier,
  checklistKeys
} from '../src/dossierMapper.js';

test('dossierMapper - parseFrenchDate', async (t) => {
  await t.test('doit parser correctement une date au format ISO (AAAA-MM-JJ)', () => {
    const d = parseFrenchDate('2026-07-01', 'Date de test');
    assert.equal(d.getUTCFullYear(), 2026);
    assert.equal(d.getUTCMonth(), 6); // Juillet (0-indexé)
    assert.equal(d.getUTCDate(), 1);
  });

  await t.test('doit parser correctement une date au format français (JJ/MM/AAAA)', () => {
    const d = parseFrenchDate('15/08/2026', 'Date de test');
    assert.equal(d.getUTCFullYear(), 2026);
    assert.equal(d.getUTCMonth(), 7); // Août (0-indexé)
    assert.equal(d.getUTCDate(), 15);
  });

  await t.test('doit rejeter une date invalide ou mal formée', () => {
    assert.throws(() => parseFrenchDate('32/01/2026', 'Date'), /invalide/);
    assert.throws(() => parseFrenchDate('texte-invalide', 'Date'), /doit être une date valide/);
  });
});

test('dossierMapper - validateDossierPayload', async (t) => {
  const validPayload = {
    candidat: {
      nom: 'KOUASSI',
      prenoms: 'Jean',
      numero_piece_identite: 'CI001234567',
      contact_1: '0708091011',
      numero_paiement: '0708091011',
      date_naissance: '2000-05-12'
    },
    entreprise: {
      raison_sociale: 'ENTREPRISE CIV',
      type_entreprise: 'Privé',
      contact_1: '0506070809'
    },
    service_affectation: 'INFORMATIQUE',
    date_debut_stage: '2026-07-01',
    date_fin_previsionnelle: '2026-07-31'
  };

  await t.test('doit valider avec succès un payload conforme', () => {
    const res = validateDossierPayload(validPayload);
    assert.ok(res.dateDebut instanceof Date);
    assert.ok(res.dateFin instanceof Date);
    assert.ok(res.dateFin >= res.dateDebut);
  });

  await t.test('doit rejeter un contact qui ne fait pas 10 chiffres', () => {
    const invalidPayload = {
      ...validPayload,
      candidat: { ...validPayload.candidat, contact_1: '070809' }
    };
    assert.throws(() => validateDossierPayload(invalidPayload), /10 chiffres/);
  });

  await t.test('doit rejeter une date de fin antérieure à la date de début', () => {
    const invalidPayload = {
      ...validPayload,
      date_debut_stage: '2026-08-01',
      date_fin_previsionnelle: '2026-07-01'
    };
    assert.throws(() => validateDossierPayload(invalidPayload), /postérieure/);
  });
});

test('dossierMapper - toCreateData & structure Prisma', () => {
  const payload = {
    candidat: {
      nom: 'kouassi',
      prenoms: 'jean-marc',
      sexe: 'HOMME',
      date_naissance: '2001-02-10',
      lieu_naissance: 'Bouaké',
      nature_piece_identite: 'Carte CNI blanc',
      numero_piece_identite: 'c00987654',
      contact_1: '0102030405',
      type_paiement: 'Trésor Money',
      numero_paiement: '0102030405',
      tuteur: {
        nom_prenoms: 'Kouassi Paul',
        lien_parente: 'Père',
        contact: '0506070809'
      }
    },
    entreprise: {
      raison_sociale: 'Techno Ivoire',
      type_entreprise: 'Privé',
      branche_activite: 'Informatique',
      contact_1: '0506070809'
    },
    service_affectation: 'Développement Web',
    date_debut_stage: '2026-09-01',
    date_fin_previsionnelle: '2026-09-30'
  };

  const createdData = toCreateData(payload, 'user-conseiller-1', 'AGENCE-001');

  // Vérification de la normalisation en majuscules
  assert.equal(createdData.candidat.nom, 'KOUASSI');
  assert.equal(createdData.candidat.prenoms, 'JEAN-MARC');
  assert.equal(createdData.candidat.typePaiement, 'TRESOR_MONEY');
  assert.equal(createdData.entreprise.raisonSociale, 'TECHNO IVOIRE');
  assert.equal(createdData.entreprise.typeEntreprise, 'PRIVE');
  assert.equal(createdData.dossier.serviceAffectation, 'DÉVELOPPEMENT WEB');
  assert.ok(createdData.candidat.tuteurs.create.tuteur.create.nomPrenoms === 'KOUASSI PAUL');
});

test('dossierMapper - checklistKeys', () => {
  assert.equal(checklistKeys.length, 9);
  assert.ok(checklistKeys.includes('identite_conforme'));
  assert.ok(checklistKeys.includes('dossier_physique_present'));
});
