import { NextApiRequest, NextApiResponse } from 'next';
import prisma from 'lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { country } = req.query;

  if (req.method === 'GET') {
    try {
      const timeline = await prisma.customTimeline.findUnique({
        where: { country: country as string },
      });

      if (!timeline || !timeline.isActive) {
        return res.status(404).json({ error: 'No active timeline found for this country' });
      }

      return res.status(200).json(timeline);
    } catch (error) {
      console.error('Error fetching custom timeline by country:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

