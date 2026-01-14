import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { id, newOrder } = req.body;

    if (!id || newOrder === undefined) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const recordId = parseInt(id);
    const newOrderValue = parseInt(newOrder);

    // Get the current record
    const currentRecord = await prisma.homemaid.findUnique({
      where: { id: recordId },
    });

    if (!currentRecord) {
      return res.status(404).json({ message: 'Record not found' });
    }

    const oldOrderValue = currentRecord.displayOrder || 0;

    // Use a transaction to shift records and update the target record
    await prisma.$transaction(async (tx) => {
      if (newOrderValue > oldOrderValue) {
        // Moving down: shift records between old and new position up by 1
        await tx.homemaid.updateMany({
          where: {
            displayOrder: {
              gt: oldOrderValue,
              lte: newOrderValue,
            },
            id: { not: recordId },
          },
          data: {
            displayOrder: {
              decrement: 1,
            },
          },
        });
      } else if (newOrderValue < oldOrderValue) {
        // Moving up: shift records between new and old position down by 1
        await tx.homemaid.updateMany({
          where: {
            displayOrder: {
              gte: newOrderValue,
              lt: oldOrderValue,
            },
            id: { not: recordId },
          },
          data: {
            displayOrder: {
              increment: 1,
            },
          },
        });
      }

      // Update the target record to the new position
      await tx.homemaid.update({
        where: { id: recordId },
        data: { displayOrder: newOrderValue },
      });
    });

    return res.status(200).json({ message: 'Display order updated successfully' });
  } catch (error) {
    console.error('Error updating display order:', error);
    return res.status(500).json({ message: 'Internal server error', error: String(error) });
  } finally {
    await prisma.$disconnect();
  }
}

