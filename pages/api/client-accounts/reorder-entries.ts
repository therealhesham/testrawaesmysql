import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { recalculateStatementRunningBalances } from 'lib/accountingBalanceHelper';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { orderedIds } = req.body;

    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return res.status(400).json({ error: 'Invalid input: orderedIds must be a non-empty array' });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Update displayOrder for all entries in the ordered array
      for (let index = 0; index < orderedIds.length; index++) {
        await tx.clientAccountEntry.update({
          where: { id: Number(orderedIds[index]) },
          data: { displayOrder: index },
        });
      }

      // 2. Find the statementId from the first entry
      const firstEntry = await tx.clientAccountEntry.findUnique({
        where: { id: Number(orderedIds[0]) },
        select: { statementId: true }
      });

      if (firstEntry?.statementId) {
        // 3. Recalculate running balances for all entries in this statement in the new order
        await recalculateStatementRunningBalances(firstEntry.statementId, tx);
      }
    });

    res.status(200).json({ message: 'Entries reordered and balances recalculated successfully' });
  } catch (error) {
    console.error('Error reordering entries:', error);
    res.status(500).json({ error: 'Failed to reorder entries' });
  } finally {
    await prisma.$disconnect();
  }
}

