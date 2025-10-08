import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ message: 'Query parameter is required' });
    }

    const searchTerm = q.trim();
    
    if (searchTerm.length < 2) {
      return res.status(400).json({ message: 'Search term must be at least 2 characters' });
    }

    // Search clients by name or phone number
    const clients = await prisma.client.findMany({
      where: {
        OR: [
          {
            fullname: {
              contains: searchTerm
            }
          },
          {
            phonenumber: {
              contains: searchTerm
            }
          }
        ]
      },
      select: {
        id: true,
        fullname: true,
        phonenumber: true,
        city: true,
        nationalId: true
      },
      // take: 10,
      orderBy: {
        fullname: 'asc'
      }
    });

    const suggestions = clients.map(client => ({
      id: client.id,
      fullname: client.fullname,
      phonenumber: client.phonenumber,
      city: client.city,
      nationalId: client.nationalId
    }));
console.log(suggestions);
    res.status(200).json({ suggestions });
  } catch (error) {
    console.error('Error searching clients:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}