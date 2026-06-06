import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const arrivals = await prisma.arrivallist.findMany({
    where: {
      KingdomentryTime: { not: null },
    },
    take: 5,
    select: {
      KingdomentryDate: true,
      KingdomentryTime: true,
      internaldeparatureDate: true,
      internaldeparatureTime: true,
      externaldeparatureDate: true,
      externaldeparatureTime: true,
    }
  });

  console.log("Arrivals with Time:");
  console.dir(arrivals, { depth: null });
}

main().catch(console.error).finally(() => prisma.$disconnect());
