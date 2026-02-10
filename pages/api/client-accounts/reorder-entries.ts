import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { logAccountingActionFromRequest } from 'lib/accountingLogger';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { orderedIds } = req.body;

    if (!Array.isArray(orderedIds)) {
      return res.status(400).json({ error: 'Invalid input: orderedIds must be an array' });
    }

    // Use a transaction to ensure all updates succeed or fail together
    await prisma.$transaction(
      orderedIds.map((id: number, index: number) =>
        prisma.clientAccountEntry.update({
          where: { id },
          data: { displayOrder: index },
        })
      )
    );

    // Optional: Log this action
    // await logAccountingActionFromRequest(req, {
    //   action: 'Reordered client account entries',
    //   actionType: 'update_client_account_order',
    //   actionStatus: 'success',
    //   actionNotes: `Reordered ${orderedIds.length} entries`,
    // });

    res.status(200).json({ message: 'Entries reordered successfully' });
  } catch (error) {
    console.error('Error reordering entries:', error);
    res.status(500).json({ error: 'Failed to reorder entries' });
  } finally {
    await prisma.$disconnect();
  }
}
