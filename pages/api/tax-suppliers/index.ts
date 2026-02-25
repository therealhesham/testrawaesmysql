import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from 'lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const list = await prisma.taxSupplier.findMany({
        orderBy: { displayOrder: 'asc' },
        select: { id: true, name: true, displayOrder: true, createdAt: true },
      });
      return res.status(200).json({ success: true, suppliers: list });
    }

    if (req.method === 'POST') {
      const { name } = req.body;
      if (!name || typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ success: false, message: 'اسم المورد مطلوب' });
      }

      const maxOrder = await prisma.taxSupplier.aggregate({
        _max: { displayOrder: true },
      });
      const displayOrder = (maxOrder._max.displayOrder ?? -1) + 1;

      const created = await prisma.taxSupplier.create({
        data: { name: name.trim(), displayOrder },
      });
      return res.status(201).json({ success: true, supplier: created });
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ success: false, message: `Method ${req.method} Not Allowed` });
  } catch (error: any) {
    console.error('Tax suppliers API error:', error);
    return res.status(500).json({ success: false, message: error?.message || 'Internal Server Error' });
  }
}
