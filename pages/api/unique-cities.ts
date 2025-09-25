import { NextApiRequest, NextApiResponse } from 'next';
import prisma from 'lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // الحصول على المدن الفريدة من قاعدة البيانات
    const uniqueCities = await prisma.client.findMany({
      select: {
        city: true,
      },
      distinct: ['city'],
      where: {
        city: {
          not: null,
        },
      },
      orderBy: {
        city: 'asc',
      },
    });

    // استخراج أسماء المدن فقط
    const cities = uniqueCities
      .map(item => item.city)
      .filter(city => city !== null && city.trim() !== '') as string[];

    return res.status(200).json({
      success: true,
      cities,
    });
  } catch (error) {
    console.error('Error fetching unique cities:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}
