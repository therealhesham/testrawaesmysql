import { PrismaClient } from '@prisma/client';
import { jwtDecode } from 'jwt-decode';
import type { NextApiRequest, NextApiResponse } from 'next';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  if (method !== 'PUT') {
    res.setHeader('Allow', ['PUT']);
    return res.status(405).end(`Method ${method} Not Allowed`);
  }

  try {
    // التحقق من أن المستخدم هو owner فقط
    const cookieHeader = req.headers.cookie;
    let userId: number | null = null;

    if (cookieHeader) {
      try {
        const cookies: { [key: string]: string } = {};
        cookieHeader.split(";").forEach((cookie: string) => {
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

    if (!userId) {
      return res.status(401).json({ error: 'غير مصرح لك بهذه العملية' });
    }

    // التحقق من أن المستخدم هو owner
    const findUser = await prisma.user.findFirst({
      where: { id: Number(userId) },
      select: { role: true }
    });

    if (!findUser?.role) {
      return res.status(403).json({ error: 'غير مصرح لك بهذه العملية' });
    }

    const userRoleName = findUser.role.name?.toLowerCase();
    if (userRoleName !== 'owner') {
      return res.status(403).json({ error: 'فقط المالك يمكنه ترتيب الأدوار' });
    }

    const { roles } = req.body;

    if (!Array.isArray(roles)) {
      return res.status(400).json({ error: 'roles must be an array' });
    }

    // تحديث ترتيب جميع الأدوار
    const updatePromises = roles.map((role: { id: number; order: number }) =>
      prisma.role.update({
        where: { id: role.id },
        data: { order: role.order },
      })
    );

    await Promise.all(updatePromises);

    res.status(200).json({ success: true, message: 'تم تحديث ترتيب الأدوار بنجاح' });
  } catch (error) {
    console.error('Error updating roles order:', error);
    res.status(500).json({ error: 'Failed to update roles order' });
  } finally {
    await prisma.$disconnect();
  }
}

