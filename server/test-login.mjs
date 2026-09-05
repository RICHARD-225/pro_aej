import 'dotenv/config';
import { prisma } from './src/prisma.js';
import { authenticateUser } from './src/auth.js';
import { generateOtp, sendOtpEmail } from './src/emailService.js';

// Teste exactement ce que fait POST /api/auth/login
const email = 'sandra@gmail.com'; // ← premier user trouvé en DB
const password = 'test';          // ← mot de passe à adapter si besoin

console.log('--- TEST POST /api/auth/login ---');

try {
  console.log('1. authenticateUser...');
  const user = await authenticateUser(email, password);
  if (!user) {
    console.error('❌ Identifiants incorrects (user null)');
    process.exit(0);
  }
  console.log('✅ User authentifié:', user.email, '| role:', user.role);

  console.log('2. generateOtp...');
  const { code } = generateOtp(user.email);
  console.log('✅ Code OTP généré:', code);

  console.log('3. sendOtpEmail...');
  await sendOtpEmail(user.email, code, `${user.prenoms} ${user.nom}`);
  console.log('✅ Email envoyé');

  console.log('\n✅ Tout fonctionne — la route devrait retourner { requireOtp: true }');
} catch (err) {
  console.error('\n❌ ERREUR DÉTECTÉE:');
  console.error('  Message:', err.message);
  console.error('  Stack:', err.stack);
} finally {
  await prisma.$disconnect();
}
