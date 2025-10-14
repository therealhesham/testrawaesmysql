import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../globalprisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get counts for both contract types
    const [recruitmentCount, rentalCount] = await Promise.all([
      // Count for recruitment contract type
      prisma.housing.count({
        where: {
        deparatureHousingDate: null // Only housed workers
,
          HomeMaid: {
            NewOrder: {
              some: {
                typeOfContract: 'recruitment'
              }
            }
          },
        }
      }),
      // Count for rental contract type  
      prisma.housing.count({
        where: {
          HomeMaid: {
            contracttype: 'rental'
          },
          deparatureHousingDate: null // Only housed workers
        }
      })
    ]);

    return res.status(200).json({
      success: true,
      counts: {
        recruitment: recruitmentCount,
        rental: rentalCount
      }
    });

  } catch (error) {
    console.error('Error fetching housing counts:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error fetching counts',
      counts: {
        recruitment: 0,
        rental: 0
      }
    });
  }
}
