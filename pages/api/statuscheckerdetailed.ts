import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    // Get the date 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
console.log(sevenDaysAgo)
    // Raw MySQL query to count active housed workers without recent status updates
   const result = await prisma.$queryRaw`
  SELECT 
    hw.*
   FROM housedworker hw
  JOIN homemaid hm ON hw.homeMaid_id = hm.id
  WHERE 
    hw.deparatureHousingDate IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM weeklyStatus ws 
      WHERE ws.homeMaid_id = hm.id 
      AND ws.date >= ${sevenDaysAgo}
    )
`;

  
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error checking housed worker status:', error);
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  } finally {
    await prisma.$disconnect();
  }
}