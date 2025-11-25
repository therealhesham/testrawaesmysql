import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  try {
    switch (method) {
      // GET all ratings
      case 'GET':
        const ratings = await prisma.rating.findMany({
          include: { Order: true },
        });
        return res.status(200).json(ratings);

      // CREATE rating
      case 'POST':
        const { idOrder, isRated, reason } = req.body;
        
        if (!idOrder) {
          return res.status(400).json({ error: 'Order ID is required' });
        }

        const newRating = await prisma.rating.create({
          data: {
            idOrder: Number(idOrder),
            isRated: isRated !== undefined ? Boolean(isRated) : false,
            reason: reason || null,
          },
        });
        return res.status(201).json(newRating);

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error('Error in ratings API:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error instanceof Error ? error.message : 'Unknown error' });
  } finally {
    await prisma.$disconnect();
  }
}