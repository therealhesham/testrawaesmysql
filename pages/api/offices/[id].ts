import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from 'lib/prisma'
import { jwtDecode } from 'jwt-decode'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ success: false, message: 'Invalid ID' })
  }

  try {
    const cookies = req.cookies;
    let findUser: any = null;

    if (req.method === 'PUT' || req.method === 'DELETE') {
      if (!cookies.authToken) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const token = jwtDecode(cookies.authToken) as any;

      findUser = await prisma.user.findUnique({
        where: { id: token.id },
        include: { role: true },
      });

      if (!findUser || !(findUser.role?.permissions as any)?.['إدارة المكاتب الخارجية']?.['عرض']) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }
    }

    if (req.method === 'GET') {
      const item = await prisma.offices.findUnique({
        where: { id: Number(id) },
        select: {
          id: true,
          office: true,
          Country: true,
          phoneNumber: true,
        },
      })

      if (!item) {
        return res.status(404).json({ success: false, message: 'Office not found' })
      }

      return res.status(200).json({ success: true, item })
    }

    if (req.method === 'PUT') {
      const { name, country, phoneNumber } = req.body;
      
      const item = await prisma.offices.findUnique({ where: { id: Number(id) } });
      if (!item) return res.status(404).json({ success: false, message: 'Office not found' });

      const updatedOffice = await prisma.offices.update({
        where: { id: Number(id) },
        data: {
          office: name !== undefined ? name : undefined,
          Country: country !== undefined ? country : undefined,
          phoneNumber: phoneNumber !== undefined ? phoneNumber : undefined,
        }
      });

      await prisma.systemUserLogs.create({
        data: {
          actionType: 'إدارة المكاتب',
          action: 'تعديل مكتب',
          details: `تم تعديل بيانات مكتب ${item.office}`,
          userId: findUser.id,
          pageRoute: '/admin/system_settings',
        }
      });

      return res.status(200).json({ success: true, item: updatedOffice });
    }

    if (req.method === 'DELETE') {
      const item = await prisma.offices.findUnique({ where: { id: Number(id) } });
      if (!item) return res.status(404).json({ success: false, message: 'Office not found' });

      await prisma.offices.delete({
        where: { id: Number(id) }
      });

      await prisma.systemUserLogs.create({
        data: {
          actionType: 'إدارة المكاتب',
          action: 'حذف مكتب',
          details: `تم حذف المكتب ${item.office}`,
          userId: findUser.id,
          pageRoute: '/admin/system_settings',
        }
      });

      return res.status(200).json({ success: true, message: 'Deleted successfully' });
    }

    res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
    return res.status(405).json({ success: false, message: `Method ${req.method} Not Allowed` })
  } catch (error: any) {
    console.error('Office API error:', error)
    return res.status(500).json({ success: false, message: 'Internal Server Error' })
  }
}
