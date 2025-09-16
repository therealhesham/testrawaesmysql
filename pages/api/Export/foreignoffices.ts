import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const offices = await prisma.offices.findMany({
      select: {
        id: true,
        office: true,
      },
      orderBy: {
        office: 'asc',
      },
    });

    return res.status(200).json(offices);
  } catch (error) {
    console.error('Error fetching offices:', error);
    return res.status(500).json({ message: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}
