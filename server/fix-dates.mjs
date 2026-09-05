/**
 * Script de correction des dates nulles/zéro (0000-00-00) en base MySQL.
 * Remplace toutes les valeurs invalides par la date courante dans les tables Prisma.
 */
import 'dotenv/config';
import { prisma } from './src/prisma.js';

const NOW = new Date();

console.log('🔧 Correction des dates invalides (0000-00-00 00:00:00) en base...\n');

try {
  // Table users
  const fixedUsers = await prisma.$executeRaw`
    UPDATE users 
    SET updated_at = ${NOW} 
    WHERE updated_at = '0000-00-00 00:00:00' 
       OR updated_at IS NULL`;
  console.log(`✅ users.updated_at : ${fixedUsers} ligne(s) corrigée(s)`);

  const fixedUsersCreated = await prisma.$executeRaw`
    UPDATE users 
    SET created_at = ${NOW} 
    WHERE created_at = '0000-00-00 00:00:00' 
       OR created_at IS NULL`;
  console.log(`✅ users.created_at : ${fixedUsersCreated} ligne(s) corrigée(s)`);

  // Table candidats
  const fixedCandidats = await prisma.$executeRaw`
    UPDATE candidats 
    SET updated_at = ${NOW} 
    WHERE updated_at = '0000-00-00 00:00:00' 
       OR updated_at IS NULL`;
  console.log(`✅ candidats.updated_at : ${fixedCandidats} ligne(s) corrigée(s)`);

  // Table dossiers_immersion
  const fixedDossiers = await prisma.$executeRaw`
    UPDATE dossiers_immersion 
    SET updated_at = ${NOW} 
    WHERE updated_at = '0000-00-00 00:00:00' 
       OR updated_at IS NULL`;
  console.log(`✅ dossiers_immersion.updated_at : ${fixedDossiers} ligne(s) corrigée(s)`);

  // Table entreprises
  const fixedEntreprises = await prisma.$executeRaw`
    UPDATE entreprises 
    SET updated_at = ${NOW} 
    WHERE updated_at = '0000-00-00 00:00:00' 
       OR updated_at IS NULL`;
  console.log(`✅ entreprises.updated_at : ${fixedEntreprises} ligne(s) corrigée(s)`);

  // Table agences
  const fixedAgences = await prisma.$executeRaw`
    UPDATE agences 
    SET updated_at = ${NOW} 
    WHERE updated_at = '0000-00-00 00:00:00' 
       OR updated_at IS NULL`;
  console.log(`✅ agences.updated_at : ${fixedAgences} ligne(s) corrigée(s)`);

  console.log('\n✅ Toutes les dates invalides ont été corrigées.');
} catch (err) {
  console.error('❌ Erreur:', err.message);
} finally {
  await prisma.$disconnect();
}
