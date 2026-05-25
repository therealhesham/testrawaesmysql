import { NextApiRequest, NextApiResponse } from 'next';
import prisma from 'lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { officeName } = req.query;

  if (req.method === 'GET') {
    try {
      // Find the office id by its name
      const office = await prisma.offices.findUnique({
        where: { office: officeName as string },
      });

      if (!office) {
        return res.status(404).json({ error: 'Office not found' });
      }

      const timeline = await prisma.customTimeline.findUnique({
        where: { officeId: office.id },
      });

      if (!timeline || !timeline.isActive) {
        return res.status(404).json({ error: 'No active timeline found for this office' });
      }

      return res.status(200).json(timeline);
    } catch (error) {
      console.error('Error fetching custom timeline by office:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
