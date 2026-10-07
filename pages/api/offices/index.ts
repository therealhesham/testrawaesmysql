import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from 'lib/prisma';
import { jwtDecode } from 'jwt-decode';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const items = await prisma.offices.findMany({
        select: {
          id: true,
          office: true,
          Country: true,
          phoneNumber: true,
        },
        orderBy: { office: 'asc' }
      });

      return res.status(200).json({ success: true, items, finder: items });
    } catch (error) {
      console.error('Offices API error:', error);
      return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  }

  try {
    const cookies = req.cookies;
    if (!cookies.authToken) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const token = jwtDecode(cookies.authToken) as any;

    const findUser = await prisma.user.findUnique({
      where: { id: Number(token.id) },
      include: { role: true },
    });

    if (!findUser || !(findUser.role?.permissions as any)?.['إدارة المكاتب الخارجية']?.['عرض']) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    if (req.method === 'POST') {
      const { name, country, phoneNumber } = req.body;
      
      if (!name || !country) {
        return res.status(400).json({ success: false, message: 'Name and Country are required' });
      }

      const newOffice = await prisma.offices.create({
        data: {
          office: name,
          Country: country,
          phoneNumber: phoneNumber || null,
        }
      });

      // Log the action
      await prisma.systemUserLogs.create({
        data: {
          actionType: 'إدارة المكاتب',
          action: 'إضافة مكتب جديد',
          details: `تمت إضافة مكتب ${name} التابع لدولة ${country}`,
          userId: findUser.id,
          pageRoute: '/admin/system_settings',
        }
      });

      return res.status(200).json({ success: true, item: newOffice });
    }

    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, message: `Method ${req.method} Not Allowed` });
  } catch (error: any) {
    console.error('Offices API error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}
