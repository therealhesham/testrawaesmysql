import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { workerId } = req.query;

    if (!workerId) {
      return res.status(400).json({ error: 'Worker ID is required' });
    }

    // Check if there's an existing order for this worker
    const existingOrder = await prisma.neworder.findFirst({
      where: {
        HomemaidId: parseInt(workerId as string),
        NOT: {
          bookingstatus: {
            in: ['delivered', 'rejected', 'cancelled']
          }
        }
      }
    });

    return res.status(200).json({ hasOrder: !!existingOrder });
  } catch (error) {
    console.error('Error checking existing order:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
