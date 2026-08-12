import { PrismaClient } from '@prisma/client';
import { NextApiRequest, NextApiResponse } from 'next';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const orders = await prisma.neworder.findMany({
      where: {
        orderDocument: { not: null },
        clientAccountStatement: { some: {} }
      },
      include: {
        client: true,
        clientAccountStatement: {
          include: {
            entries: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json(orders);
  } catch (error) {
    console.error('Error fetching orders with promissory notes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
