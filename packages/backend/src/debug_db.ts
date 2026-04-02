import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('--- System Config ---');
    const configs = await prisma.systemConfig.findMany();
    console.log(JSON.stringify(configs, null, 2));

    console.log('\n--- Material (MAT001) ---');
    const material = await prisma.material.findFirst({
        where: { code: 'MAT001' }
    });
    console.log(JSON.stringify(material, null, 2));

    console.log('\n--- Accounting Subjects (All) ---');
    const subjects = await prisma.accountingSubject.findMany();
    console.log(JSON.stringify(subjects, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
