import { NextApiRequest, NextApiResponse } from "next";
import prisma from "lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { clientID, searchTerm } = req.query;
    
    try {
      if (!clientID) {
        return res.status(400).json({ error: 'Client ID is required' });
      }

      let whereClause: any = {
        clientID: Number(clientID)
      };

      // If searchTerm is provided, search in visa numbers
      if (searchTerm) {
        whereClause.visaNumber = {
          contains: searchTerm as string,
          mode: 'insensitive'
        };
      }

      const visas = await prisma.visa.findMany({
        where: whereClause,
        select: {
          id: true,
          visaNumber: true,
          gender: true,
          nationality: true,
          profession: true,
          createdAt: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      res.status(200).json({ data: visas });
    } catch (error) {
      console.error('Error searching visas:', error);
      res.status(500).json({ error: 'Failed to search visas' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
