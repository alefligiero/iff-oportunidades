import { loadEnvConfig } from '@next/env';
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

loadEnvConfig(process.cwd());

const prisma = new PrismaClient();

function asBool(value: string | undefined): boolean {
  return value === 'true';
}

async function main() {
  const adminEmail = process.env.ADMIN_BOOTSTRAP_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_BOOTSTRAP_PASSWORD;
  const forcePasswordUpdate = asBool(process.env.ADMIN_BOOTSTRAP_FORCE_PASSWORD_UPDATE);

  if (!adminEmail || !adminPassword) {
    throw new Error(
      'Defina ADMIN_BOOTSTRAP_EMAIL e ADMIN_BOOTSTRAP_PASSWORD para executar o bootstrap de admin.',
    );
  }

  const existingUser = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!existingUser) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    await prisma.user.create({
      data: {
        email: adminEmail,
        password: passwordHash,
        role: Role.ADMIN,
      },
    });

    console.log(`Admin criado com sucesso: ${adminEmail}`);
    return;
  }

  if (existingUser.role !== Role.ADMIN) {
    throw new Error(`Ja existe um usuario com este email e papel ${existingUser.role}.`);
  }

  if (!forcePasswordUpdate) {
    console.log(`Admin ja existe: ${adminEmail} (nenhuma alteracao aplicada)`);
    return;
  }

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await prisma.user.update({
    where: { id: existingUser.id },
    data: { password: passwordHash },
  });

  console.log(`Senha do admin atualizada com sucesso: ${adminEmail}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error('Erro no bootstrap de admin:', error);
    await prisma.$disconnect();
    process.exit(1);
  });
