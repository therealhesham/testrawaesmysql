import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const { method } = req;

  try {
    // Handle requests to /api/ratings
    if (!id) {
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
          const newRating = await prisma.rating.create({
            data: {
              idOrder: idOrder ? Number(idOrder) : undefined,
              isRated: isRated !== undefined ? Boolean(isRated) : false,
              reason: reason || undefined,
            },
          });
          return res.status(201).json(newRating);

        default:
          res.setHeader('Allow', ['GET', 'POST']);
          return res.status(405).end(`Method ${method} Not Allowed`);
      }
    }

    // Handle requests to /api/ratings/[id]
    switch (method) {
      // GET single rating by ID
      case 'GET':
        const rating = await prisma.rating.findUnique({
          where: { id: Number(id) },
          include: { Order: true },
        });
        if (!rating) {
          return res.status(404).json({ error: 'Rating not found' });
        }
        return res.status(200).json(rating);

      // UPDATE rating
      case 'PUT':
        const { idOrder, isRated, reason } = req.body;
        const updatedRating = await prisma.rating.update({
          where: { id: Number(id) },
          data: {
            idOrder: idOrder ? Number(idOrder) : undefined,
            isRated: isRated !== undefined ? Boolean(isRated) : undefined,
            reason: reason || undefined,
          },
        });
        return res.status(200).json(updatedRating);

      // DELETE rating
      case 'DELETE':
        await prisma.rating.delete({
          where: { id: Number(id) },
        });
        return res.status(204).end();

      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        return res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error('Error in ratings API:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    await prisma.$disconnect();
  }
}