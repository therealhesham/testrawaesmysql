import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from 'lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    const { from, to } = req.query;

    const where: any = {};
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(String(from));
      if (to) where.date.lte = new Date(String(to));
    }

    // Get counts for sales and purchases
    const [salesCount, purchasesCount] = await Promise.all([
      prisma.taxSalesRecord.count({ where }),
      prisma.taxPurchaseRecord.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      counts: {
        sales: salesCount,
        purchases: purchasesCount,
        vat: 3, // VAT tab always shows 3 (fixed value as per original design)
      },
    });
  } catch (error: any) {
    console.error('Tax counts API error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
  }
}

