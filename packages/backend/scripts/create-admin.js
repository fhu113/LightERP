const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Check if admin exists
  const adminExists = await prisma.user.findUnique({
    where: { username: 'admin' }
  });

  if (adminExists) {
    console.log('Admin user already exists');
    return;
  }

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      password: hashedPassword,
      name: '系统管理员',
      role: 'ADMIN',
      permissions: 'finance,otc,ptp,production,warehouse,reports',
      status: 'ACTIVE'
    }
  });

  console.log('Admin user created:', admin.username);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
