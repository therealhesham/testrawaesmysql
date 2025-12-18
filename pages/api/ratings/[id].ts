import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import eventBus from 'lib/eventBus';
import { jwtDecode } from 'jwt-decode';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const { method } = req;

  if (!id || Array.isArray(id)) {
    return res.status(400).json({ error: 'Rating ID is required' });
  }

  try {
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
        
        // Check if rating exists
        const existingRating = await prisma.rating.findUnique({
          where: { id: Number(id) },
        });
        
        if (!existingRating) {
          return res.status(404).json({ error: 'Rating not found' });
        }

        const updatedRating = await prisma.rating.update({
          where: { id: Number(id) },
          data: {
            ...(idOrder !== undefined && { idOrder: idOrder ? Number(idOrder) : null }),
            ...(isRated !== undefined && { isRated: Boolean(isRated) }),
            ...(reason !== undefined && { reason: reason || null }),
          },
        });
        return res.status(200).json(updatedRating);

      // DELETE rating
      case 'DELETE':
        const ratingToDelete = await prisma.rating.findUnique({
          where: { id: Number(id) },
        });
        
        if (!ratingToDelete) {
          return res.status(404).json({ error: 'Rating not found' });
        }

        // Get user info for logging
        const cookieHeader = req.headers.cookie;
        let userId: number | null = null;
        if (cookieHeader) {
          try {
            const cookies: { [key: string]: string } = {};
            cookieHeader.split(";").forEach((cookie) => {
              const [key, value] = cookie.trim().split("=");
              cookies[key] = decodeURIComponent(value);
            });
            if (cookies.authToken) {
              const token = jwtDecode(cookies.authToken) as any;
              userId = Number(token.id);
            }
          } catch (e) {
            // Ignore token errors
          }
        }

        await prisma.rating.delete({
          where: { id: Number(id) },
        });

        // تسجيل الحدث
        if (userId) {
          eventBus.emit('ACTION', {
            type: `حذف تقييم #${id}`,
            actionType: 'delete',
            userId: userId,
          });
        }

        return res.status(204).end();

      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        return res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error('Error in ratings API:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error instanceof Error ? error.message : 'Unknown error' });
  } finally {
    await prisma.$disconnect();
  }
}

