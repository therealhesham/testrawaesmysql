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

    // Update the display order for the specific homemaid
    await prisma.homemaid.update({
      where: { id: parseInt(id) },
      data: { displayOrder: parseInt(newOrder) },
    });

    return res.status(200).json({ message: 'Display order updated successfully' });
  } catch (error) {
    console.error('Error updating display order:', error);
    return res.status(500).json({ message: 'Internal server error', error: String(error) });
  } finally {
    await prisma.$disconnect();
  }
}

