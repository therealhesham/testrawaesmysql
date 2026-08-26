import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../prismaclient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { phoneNumber, notes, clientName, source } = req.body;
      
      const newClient = await prisma.quickClient.create({
        data: {
          phoneNumber,
          notes,
          clientName: clientName || null,
          source: source || null,
        }
      });
      
      return res.status(200).json(newClient);
    } catch (error: any) {
      console.error('Error creating QuickClient:', error);
      return res.status(500).json({ 
        error: 'Failed to save client',
        details: error?.message || String(error),
        name: error?.name
      });
    }
  } else if (req.method === 'GET') {
    try {
      const clients = await prisma.quickClient.findMany({
        orderBy: { createdAt: 'desc' },
      });
      return res.status(200).json(clients);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch clients' });
    }
  }
  
  res.setHeader('Allow', ['POST', 'GET']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
