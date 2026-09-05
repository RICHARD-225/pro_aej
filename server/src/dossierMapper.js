import { randomUUID } from 'node:crypto';

const paiementMap = {
  'Trésor Money': 'TRESOR_MONEY',
  TRESOR_MONEY: 'TRESOR_MONEY',
  Wave: 'WAVE',
  WAVE: 'WAVE',
  'Orange Money': 'ORANGE_MONEY',
  ORANGE_MONEY: 'ORANGE_MONEY',
  'MTN MoMo': 'MTN_MOMO',
  MTN_MOMO: 'MTN_MOMO',
  'Moov Money': 'MOOV_MONEY',
  MOOV_MONEY: 'MOOV_MONEY'
};

const entrepriseMap = {
  Privé: 'PRIVE',
  PRIVE: 'PRIVE',
  'Public non EPN': 'PUBLIC_NON_EPN',
  PUBLIC_NON_EPN: 'PUBLIC_NON_EPN',
  EPN: 'EPN'
};

const paiementLabels = {
  TRESOR_MONEY: 'Trésor Money', WAVE: 'Wave', ORANGE_MONEY: 'Orange Money',
  MTN_MOMO: 'MTN MoMo', MOOV_MONEY: 'Moov Money', AUTRE: 'Autre'
};
const entrepriseLabels = { PRIVE: 'Privé', PUBLIC_NON_EPN: 'Public non EPN', EPN: 'EPN' };

export const checklistKeys = [
  'identite_conforme', 'telephone_conforme', 'piece_identite_conforme',
  'convention_conforme', 'entreprise_conforme', 'poste_conforme',
  'dates_conformes', 'signature_conforme', 'dossier_physique_present'
];

export function parseFrenchDate(value, field) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  const raw = String(value || '').trim();
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/) || raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) throw new Error(`${field} doit être une date valide.`);
  const [, first, second, third] = match.map(Number);
  const [year, month, day] = raw.includes('-') ? [first, second, third] : [third, second, first];
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    throw new Error(`${field} est invalide.`);
  }
  return date;
}

function formatDate(value) {
  return new Intl.DateTimeFormat('fr-FR', { timeZone: 'UTC' }).format(value);
}

export function validateDossierPayload(payload) {
  const candidat = payload?.candidat;
  const entreprise = payload?.entreprise;
  if (!candidat || !entreprise) throw new Error('Les informations candidat et entreprise sont requises.');
  for (const [label, value] of Object.entries({
    'Nom du candidat': candidat.nom, 'Prénoms du candidat': candidat.prenoms,
    "Numéro de pièce d'identité": candidat.numero_piece_identite,
    'Contact candidat': candidat.contact_1,
    'Date de naissance': candidat.date_naissance,
    'N° de paiement': candidat.numero_paiement,
    "Raison sociale de l'entreprise": entreprise.raison_sociale,
    "Contact de l'entreprise": entreprise.contact_1,
    "Service d'affectation": payload.service_affectation
  })) if (!String(value || '').trim()) throw new Error(`${label} est requis.`);
  const phones = [
    ['Le contact candidat', candidat.contact_1],
    ['Le contact de l’entreprise', entreprise.contact_1],
    ['Le numéro de paiement', candidat.numero_paiement]
  ];
  if (candidat.contact_2) phones.push(['Le contact candidat 2', candidat.contact_2]);
  if (entreprise.contact_2) phones.push(['Le contact de l’entreprise 2', entreprise.contact_2]);
  if (candidat.tuteur?.contact) phones.push(['Le contact du tuteur', candidat.tuteur.contact]);
  for (const [label, value] of phones) if (!/^\d{10}$/.test(String(value).trim())) throw new Error(`${label} doit contenir 10 chiffres.`);
  const dateNaissance = parseFrenchDate(candidat.date_naissance, 'La date de naissance');
  const currentYear = new Date().getUTCFullYear();
  if (dateNaissance.getUTCFullYear() < 1900 || dateNaissance.getUTCFullYear() > currentYear) throw new Error('La date de naissance est hors période valide.');
  const dateDebut = parseFrenchDate(payload.date_debut_stage, 'La date de début');
  const dateFin = parseFrenchDate(payload.date_fin_previsionnelle, 'La date de fin');
  if (dateFin < dateDebut) throw new Error('La date de fin doit être postérieure à la date de début.');
  return { dateDebut, dateFin, dateNaissance };
}

export function toCreateData(payload, conseillerId, agenceId) {
  const { dateDebut, dateFin, dateNaissance } = validateDossierPayload(payload);
  const candidat = payload.candidat;
  const entreprise = payload.entreprise;
  const tuteur = candidat.tuteur;
  return {
    candidat: {
      id: randomUUID(), nom: candidat.nom.trim().toUpperCase(), prenoms: candidat.prenoms.trim().toUpperCase(),
      sexe: candidat.sexe === 'HOMME' ? 'HOMME' : 'FEMME', dateNaissance,
      lieuNaissance: candidat.lieu_naissance?.trim() || 'BOUAKÉ', sousPrefectureNaissance: candidat.sous_prefecture_naissance?.trim() || 'BOUAKÉ',
      handicap: Boolean(candidat.handicap), autreTypeHandicap: candidat.autre_type_handicap?.trim() || null,
      naturePieceIdentite: candidat.nature_piece_identite?.trim() || 'Autre', numeroPieceIdentite: candidat.numero_piece_identite.trim().toUpperCase(),
      contact1: candidat.contact_1.trim(), contact2: candidat.contact_2?.trim() || null, niveauEtude: candidat.niveau_etude?.trim() || 'Non renseigné',
      etablissementFrequente: candidat.etablissement_frequente?.trim() || 'Non renseigné', typeEnseignement: candidat.type_enseignement?.trim() || 'Non renseigné',
      sousPrefectureResidence: candidat.sous_prefecture_residence?.trim() || 'BOUAKÉ', localiteResidence: candidat.localite_residence_habituelle?.trim() || 'BOUAKÉ',
      typePaiement: paiementMap[candidat.type_paiement] || 'AUTRE', numeroPaiement: candidat.numero_paiement.trim(),
      ...(tuteur?.nom_prenoms?.trim() ? {
        tuteurs: {
          create: {
            lienParente: tuteur.lien_parente?.trim() || 'Autre',
            tuteur: {
              create: {
                id: randomUUID(),
                nomPrenoms: tuteur.nom_prenoms.trim().toUpperCase(),
                contact: tuteur.contact?.trim() || null
              }
            }
          }
        }
      } : {})
    },
    entreprise: {
      id: randomUUID(), raisonSociale: entreprise.raison_sociale.trim().toUpperCase(), typeEntreprise: entrepriseMap[entreprise.type_entreprise] || 'PRIVE',
      brancheActivite: entreprise.branche_activite?.trim() || 'Autre', contact1: entreprise.contact_1.trim(), contact2: entreprise.contact_2?.trim() || null,
      sousPrefecture: entreprise.sous_prefecture?.trim() || 'BOUAKÉ', localite: entreprise.localite?.trim() || 'BOUAKÉ'
    },
    dossier: { agenceId, conseillerId, serviceAffectation: payload.service_affectation.trim().toUpperCase(), dateDebutStage: dateDebut, dateFinPrevisionnelle: dateFin,
      departementAdministratifStage: entreprise.sous_prefecture?.trim() || 'BOUAKÉ', sousPrefectureLieuStage: entreprise.sous_prefecture?.trim() || 'BOUAKÉ', localiteLieuStage: entreprise.localite?.trim() || 'BOUAKÉ' }
  };
}

export function toPublicDossier(dossier) {
  const tuteur = dossier.candidat.tuteurs?.[0];
  return {
    id: dossier.id,
    numero_ordre_excel: dossier.numeroOrdreExcel,
    date_saisie: formatDate(dossier.dateSaisie),
    agence_regionale: dossier.agence?.ville,
    agence_directeur: dossier.agence ? `${dossier.agence.directeurPrenoms} ${dossier.agence.directeurNom}` : '',
    agence_directeur_titre: dossier.agence?.directeurTitre || '',
    entreprise_id: dossier.entrepriseId,
    candidat: {
      nom: dossier.candidat.nom,
      prenoms: dossier.candidat.prenoms,
      sexe: dossier.candidat.sexe,
      date_naissance: formatDate(dossier.candidat.dateNaissance),
      lieu_naissance: dossier.candidat.lieuNaissance,
      sous_prefecture_naissance: dossier.candidat.sousPrefectureNaissance,
      handicap: dossier.candidat.handicap,
      autre_type_handicap: dossier.candidat.autreTypeHandicap || '',
      nature_piece_identite: dossier.candidat.naturePieceIdentite,
      numero_piece_identite: dossier.candidat.numeroPieceIdentite,
      contact_1: dossier.candidat.contact1,
      contact_2: dossier.candidat.contact2 || '',
      niveau_etude: dossier.candidat.niveauEtude,
      etablissement_frequente: dossier.candidat.etablissementFrequente,
      type_enseignement: dossier.candidat.typeEnseignement,
      sous_prefecture_residence: dossier.candidat.sousPrefectureResidence,
      localite_residence_habituelle: dossier.candidat.localiteResidence,
      type_paiement: paiementLabels[dossier.candidat.typePaiement],
      numero_paiement: dossier.candidat.numeroPaiement,
      tuteur: tuteur ? { nom_prenoms: tuteur.tuteur.nomPrenoms, lien_parente: tuteur.lienParente, contact: tuteur.tuteur.contact || '' } : null
    },
    entreprise: {
      raison_sociale: dossier.entreprise.raisonSociale,
      type_entreprise: entrepriseLabels[dossier.entreprise.typeEntreprise],
      branche_activite: dossier.entreprise.brancheActivite,
      contact_1: dossier.entreprise.contact1,
      contact_2: dossier.entreprise.contact2 || '',
      sous_prefecture: dossier.entreprise.sousPrefecture,
      localite: dossier.entreprise.localite
    },
    dispositif: 'IMMERSION',
    service_affectation: dossier.serviceAffectation,
    date_debut_stage: formatDate(dossier.dateDebutStage),
    date_fin_previsionnelle: formatDate(dossier.dateFinPrevisionnelle),
    departement_administratif_stage: dossier.departementAdministratifStage,
    sous_prefecture_lieu_stage: dossier.sousPrefectureLieuStage,
    localite_lieu_stage: dossier.localiteLieuStage,
    statut_workflow: dossier.statutWorkflow,
    motif_correction: dossier.corrections?.[0]?.motif || (dossier.historiquesAudit?.find((h) => h.action === 'Demande de correction')?.description) || null,
    observations_controle: dossier.verificationItems?.[0]?.observation || null,
    conseiller_id: dossier.conseillerId,
    conseiller_nom: `${dossier.conseiller.prenoms} ${dossier.conseiller.nom}`,
    checklist: Object.fromEntries(checklistKeys.map((key, index) => [key, dossier.verificationItems?.find((item) => item.typeVerification.ordreAffichage === index + 1)?.conforme || false])),
    historique: (dossier.historiquesAudit || []).map((item) => ({ date: new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short' }).format(item.createdAt), auteur: `${item.auteur.prenoms} ${item.auteur.nom}`, action: item.action, statut: item.nouveauStatut }))
  };
}
