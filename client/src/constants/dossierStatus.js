export const DOSSIER_STATUS = {
  BROUILLON: { label: 'Brouillon', nextAction: 'Soumettre le dossier' },
  SOUMIS: { label: 'Soumis', nextAction: 'Ouvrir la vérification' },
  EN_VERIFICATION: { label: 'En vérification', nextAction: 'Poursuivre le contrôle' },
  CORRECTION_DEMANDEE: { label: 'Correction demandée', nextAction: 'Corriger le dossier' },
  RESOUMIS: { label: 'Resoumis', nextAction: 'Reprendre la vérification' },
  VALIDE: { label: 'Validé' },
  ATTESTATION_GENEREE: { label: 'Attestation entreprise générée' },
  REJETE: { label: 'Rejeté', nextAction: 'Consulter le motif' },
  ARCHIVE: { label: 'Archivé', nextAction: 'Consulter le dossier' }
};

export const DOSSIER_STATUS_KEYS = Object.keys(DOSSIER_STATUS);
