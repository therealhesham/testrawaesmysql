import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from 'lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const offices = await prisma.offices.findMany({
      select: {
        id: true,
        office: true,
        Country: true,
        phoneNumber: true,
      },
      orderBy: {
        office: 'asc',
      },
    });

    return res.status(200).json({ success: true, offices });
  } catch (error) {
    console.error('Error fetching offices:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

