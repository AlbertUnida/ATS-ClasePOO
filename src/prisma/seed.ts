import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
    const root = await prisma.tenants.upsert({
        where: { slug: 'root' },
        update: {},
        create: { name: 'Root', slug: 'root' },
    });

    const superRole = await prisma.roles.upsert({
        where: { tenantId_name: { tenantId: root.id, name: 'SUPERADMIN' } },
        update: {},
        create: { tenantId: root.id, name: 'SUPERADMIN' },
    });

    const email = process.env.SEED_SUPERADMIN_EMAIL!;
    const pwd = await argon2.hash(process.env.SEED_SUPERADMIN_PWD!);

    const su = await prisma.usuarios.upsert({
        where: { tenantId_email: { tenantId: root.id, email } },
        update: {},
        create: { tenantId: root.id, name: 'Super', email, password: pwd },
    });

    await prisma.usuarioRoles.upsert({
        where: { userId_roleId: { userId: su.id, roleId: superRole.id } },
        update: {},
        create: { userId: su.id, roleId: superRole.id },
    });

    console.log('Seed ok:', { root: root.slug, superadmin: email });
}

main().finally(() => prisma.$disconnect());
