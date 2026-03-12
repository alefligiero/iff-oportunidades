import { prisma } from '@/lib/prisma';

const GLOBAL_CONFIG_ID = 'global';

export async function getSystemConfig() {
  return prisma.systemConfig.upsert({
    where: { id: GLOBAL_CONFIG_ID },
    update: {},
    create: { id: GLOBAL_CONFIG_ID },
  });
}

export async function updateSystemConfig(requireLifeInsuranceForNewInternships: boolean) {
  return prisma.systemConfig.upsert({
    where: { id: GLOBAL_CONFIG_ID },
    update: {
      requireLifeInsuranceForNewInternships,
    },
    create: {
      id: GLOBAL_CONFIG_ID,
      requireLifeInsuranceForNewInternships,
    },
  });
}
