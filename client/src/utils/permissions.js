import { ROLES } from '../constants/roles';

export const canCreateDossier = (user) => (
  user?.role === ROLES.CONSEILLER || user?.role === ROLES.SERVICE_INFO
);

export const canVerifyDossier = (user) => user?.role === ROLES.SERVICE_INFO;

export const canValidateDossier = (user, dossier) => (
  canVerifyDossier(user) && ['SOUMIS', 'EN_VERIFICATION', 'RESOUMIS'].includes(dossier?.statut_workflow)
);

export const canEditDossier = (user, dossier) => (
  user?.role === ROLES.CONSEILLER &&
  dossier?.conseiller_id === user.id &&
  ['BROUILLON', 'CORRECTION_DEMANDEE'].includes(dossier?.statut_workflow)
);
