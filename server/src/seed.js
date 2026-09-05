import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma.js';

const users = [
  { id: 'user-cons-1', email: 'richard.kouame@emploi.ci', nom: 'KOUAME', prenoms: 'Yao Richard', role: 'CONSEILLER', titre: 'Conseiller Emploi #1' },
  { id: 'user-cons-2', email: 'patricia.koffi@emploi.ci', nom: 'KOFFI', prenoms: 'Affoué Patricia', role: 'CONSEILLER', titre: 'Conseiller Emploi #2' },
  { id: 'user-cons-3', email: 'stephane.konan@emploi.ci', nom: 'KONAN', prenoms: 'Brou Stéphane', role: 'CONSEILLER', titre: 'Conseiller Emploi #3' },
  { id: 'user-info-1', email: 'service.info@emploi.ci', nom: 'DIABATE', prenoms: 'Lamine', role: 'SERVICE_INFO', titre: 'Chef Service Informatique' },
  { id: 'user-dir-1', email: 'direction@emploi.ci', nom: 'TOURE', prenoms: 'Ibrahim', role: 'DIRECTION', titre: 'Directeur Régional AEJ Bouaké' }
];

const superAdmin = { id: 'user-super-admin', email: 'aejsuperadmin@gmail.com', nom: 'SUPER', prenoms: 'Administrateur AEJ', role: 'SUPER_ADMIN', titre: 'Super Administrateur National' };

const password = process.env.SEED_PASSWORD;
if (!password || password.length < 8) {
  throw new Error('SEED_PASSWORD doit contenir au moins 8 caractères.');
}

const passwordHash = await bcrypt.hash(password, 8);
const superAdminPasswordHash = await bcrypt.hash(process.env.SUPER_ADMIN_PASSWORD || 'AEjadmin2026', 10);

const agence = {
  id: 'AGENCE-BOUAKE-001',
  nom: 'AEJ Bouaké',
  ville: 'Bouaké',
  directeurNom: 'TOURE',
  directeurPrenoms: 'Ibrahim',
  directeurTitre: 'Directeur Régional AEJ Bouaké'
};

const typesVerification = [
  ['Identité conforme', "Vérification de l'identité du candidat.", 1],
  ['Téléphone conforme', 'Vérification du contact candidat.', 2],
  ["Pièce d'identité conforme", "Vérification de la pièce d'identité.", 3],
  ['Convention conforme', 'Vérification de la convention de stage.', 4],
  ['Entreprise conforme', "Vérification de la structure d'accueil.", 5],
  ["Service d'affectation conforme", "Vérification du poste d'affectation.", 6],
  ['Dates conformes', 'Vérification de la période de stage.', 7],
  ['Signatures conformes', 'Vérification des signatures et cachets.', 8],
  ['Dossier physique présent', 'Vérification de la fiche physique.', 9]
];

try {
  await prisma.agence.upsert({
    where: { id: agence.id },
    update: agence,
    create: agence
  });

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: { ...user, agenceId: 'AGENCE-BOUAKE-001', motDePasseHash: passwordHash, actif: true },
      create: { ...user, agenceId: 'AGENCE-BOUAKE-001', motDePasseHash: passwordHash, actif: true }
    });
  }

  await prisma.user.upsert({
    where: { email: superAdmin.email },
    update: { ...superAdmin, agenceId: null, motDePasseHash: superAdminPasswordHash, actif: true },
    create: { ...superAdmin, agenceId: null, motDePasseHash: superAdminPasswordHash, actif: true }
  });

  for (const [libelle, description, ordreAffichage] of typesVerification) {
    await prisma.typeVerification.upsert({
      where: { ordreAffichage },
      update: { libelle, description, obligatoire: true, actif: true },
      create: { libelle, description, ordreAffichage, obligatoire: true, actif: true }
    });
  }

  console.log(`${users.length} utilisateurs et ${typesVerification.length} types de vérification créés ou mis à jour.`);
} finally {
  await prisma.$disconnect();
} 
