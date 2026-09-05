import 'dotenv/config';
import { prisma } from './src/prisma.js';

try {
  const user = await prisma.user.findFirst();
  console.log('✅ DB OK — Premier utilisateur:', user?.email ?? 'Aucun utilisateur trouvé');
  await prisma.$disconnect();
} catch (e) {
  console.error('❌ DB ERROR:', e.message);
  await prisma.$disconnect();
}
