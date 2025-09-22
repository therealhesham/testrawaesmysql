const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const orders = await prisma.neworder.findMany({
    where: {
      paid: { not: null },
      clientAccountStatement: { none: {} }
    },
    include: {
      client: true,
      HomeMaid: {
        include: { office: true }
      }
    }
  });

  for (const order of orders) {
    const officeName = order.HomeMaid?.officeName || order.HomeMaid?.office?.office || '';

    const statement = await prisma.clientAccountStatement.create({
      data: {
        clientId: order.client.id,
        orderId: order.id,
        contractNumber: `ORD-${order.id}`,
        officeName,
        totalRevenue: order.paid,
        totalExpenses: 0,
        netAmount: order.paid,
        contractStatus: 'existing',
        notes: 'Seeded from existing order'
      }
    });

    await prisma.clientAccountEntry.create({
      data: {
        statementId: statement.id,
        date: order.createdAt,
        description: 'دفعة أولى',
        debit: 0,
        credit: order.paid,
        balance: order.paid,
        entryType: 'payment'
      }
    });

    console.log(`Created statement for order ${order.id}`);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
