const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('srics1315', 10);
  const user = await prisma.user.upsert({
    where: { email: 'srics2425@gmail.com' },
    update: {
      passwordHash: hash,
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      firebaseUid: 'KLxYacHeRgXyNwxNv20Zpg4ZTST2',
      name: 'Sri CS (Super Admin)'
    },
    create: {
      email: 'srics2425@gmail.com',
      passwordHash: hash,
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      firebaseUid: 'KLxYacHeRgXyNwxNv20Zpg4ZTST2',
      name: 'Sri CS (Super Admin)',
      isVerified: true,
      studentProfile: {
        create: {
          username: 'srics_admin',
          isPublic: true
        }
      }
    }
  });
  console.log('SUCCESS: Prisma User Upserted ->', user.id, user.email, user.role, user.firebaseUid);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
