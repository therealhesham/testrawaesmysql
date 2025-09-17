import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    const { year, month } = req.query;
    
    const where: any = {};
    if (year) where.year = parseInt(year as string);
    if (month) where.month = parseInt(month as string);

    // Get the latest tax declaration for the specified period
    const latestDeclaration = await prisma.taxDeclaration.findFirst({
      where,
      include: {
        salesRecords: true,
        purchaseRecords: true,
        vatRecords: true,
      },
      orderBy: [
        { year: 'desc' },
        { month: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    if (!latestDeclaration) {
      // Return default values if no declaration found
      return res.status(200).json({
        taxableSales: 0,
        zeroRateSales: 0,
        adjustments: 0,
        taxValue: 0,
        salesCount: 0,
        purchasesCount: 0,
        vatCount: 0,
        declaration: null,
      });
    }

    // Calculate summary data
    const summary = {
      taxableSales: latestDeclaration.taxableSales,
      zeroRateSales: latestDeclaration.zeroRateSales,
      adjustments: latestDeclaration.adjustments,
      taxValue: latestDeclaration.taxValue,
      salesCount: latestDeclaration.salesRecords.length,
      purchasesCount: latestDeclaration.purchaseRecords.length,
      vatCount: latestDeclaration.vatRecords.length,
      declaration: latestDeclaration,
    };

    return res.status(200).json(summary);
  } catch (error) {
    console.error('Tax summary API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
