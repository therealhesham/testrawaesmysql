import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST' || req.method === 'PUT') {
    const { officeId, commission } = req.body;

    if (!officeId) {
      return res.status(400).json({ error: 'officeId is required' });
    }

    try {
      const updatedOffice = await prisma.offices.update({
        where: { id: Number(officeId) },
        data: {
          commission: commission ? Number(commission) : 0,
        } as any,
      });

      return res.status(200).json({ message: 'تم تحديث الإعدادات المالية بنجاح', office: updatedOffice });
    } catch (error: any) {
      console.error('Error updating financial settings:', error);
      return res.status(500).json({ error: 'حدث خطأ داخلي في السيرفر' });
    }
  } else {
    res.setHeader('Allow', ['POST', 'PUT']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
