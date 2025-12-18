import { NextApiRequest, NextApiResponse } from 'next';
import prisma from './globalprisma';
import eventBus from 'lib/eventBus';
import { jwtDecode } from 'jwt-decode';

type SlaRule = {
  id: number;
  officeName: string;
  stage: string;
  days: number;
  createdAt?: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const items = await (prisma as any).officeSlaRule.findMany({ orderBy: { createdAt: 'desc' } });
      return res.status(200).json({ success: true, items });
    }

    if (req.method === 'POST') {
      const { officeName, stage, days } = req.body || {};
      if (!officeName || !stage || typeof days !== 'number') {
        return res.status(400).json({ success: false, message: 'officeName, stage, days مطلوبة' });
      }
      const created = await (prisma as any).officeSlaRule.create({ data: { officeName, stage, days } });
      return res.status(201).json({ success: true, item: created });
    }

    if (req.method === 'PUT') {
      const { id, officeName, stage, days } = req.body || {};
      if (!id) return res.status(400).json({ success: false, message: 'id مطلوب' });
      const updated = await (prisma as any).officeSlaRule.update({
        where: { id: Number(id) },
        data: {
          officeName: officeName ?? undefined,
          stage: stage ?? undefined,
          days: typeof days === 'number' ? days : undefined,
        },
      });
      return res.status(200).json({ success: true, item: updated });
    }

    if (req.method === 'DELETE') {
      const { id } = (req.query || {}) as { id?: string };
      if (!id) return res.status(400).json({ success: false, message: 'id مطلوب' });
      
      // Get user info for logging
      const cookieHeader = req.headers.cookie;
      let userId: number | null = null;
      if (cookieHeader) {
        try {
          const cookies: { [key: string]: string } = {};
          cookieHeader.split(";").forEach((cookie) => {
            const [key, value] = cookie.trim().split("=");
            cookies[key] = decodeURIComponent(value);
          });
          if (cookies.authToken) {
            const token = jwtDecode(cookies.authToken) as any;
            userId = Number(token.id);
          }
        } catch (e) {
          // Ignore token errors
        }
      }

      const rule = await (prisma as any).officeSlaRule.findUnique({
        where: { id: Number(id) },
      });

      await (prisma as any).officeSlaRule.delete({ where: { id: Number(id) } });

      // تسجيل الحدث
      if (rule && userId) {
        eventBus.emit('ACTION', {
          type: `حذف قاعدة SLA #${id} - ${rule.officeName || 'غير محدد'}`,
          actionType: 'delete',
          userId: userId,
        });
      }

      return res.status(200).json({ success: true });
    }

    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    return res.status(405).json({ success: false, message: `Method ${req.method} not allowed` });
  } catch (e) {
    console.error('offices-sla error', e);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  } finally {
    await prisma.$disconnect();
  }
}


