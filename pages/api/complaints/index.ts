import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from 'lib/prisma';
import { jwtDecode } from 'jwt-decode';

const setCorsHeaders = (res: NextApiResponse) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // التحقق من التوثيق
    const authToken = req.cookies.authToken;
    if (!authToken) {
      return res.status(401).json({ error: 'غير مصرح' });
    }

    const token = jwtDecode(authToken) as any;
    const user = await prisma.user.findUnique({
      where: { id: Number(token.id) },
      include: { role: true }
    });

    if (!user) {
      return res.status(401).json({ error: 'المستخدم غير موجود' });
    }

    // التحقق إذا كان المستخدم IT
    const isITUser = user.role?.name?.toLowerCase().includes('it') || 
                     user.role?.name?.toLowerCase().includes('تقنية') ||
                     user.role?.name?.toLowerCase().includes('نظم');

    // جلب الشكاوى
    let complaints;
    if (isITUser) {
      // مستخدم IT يرى جميع الشكاوى
      complaints = await prisma.complaint.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: {
            select: {
              id: true,
              username: true,
              pictureurl: true,
            }
          },
          assignedTo: {
            select: {
              id: true,
              username: true,
              pictureurl: true,
            }
          }
        }
      });
    } else {
      // الأدمنز يرون فقط الشكاوى التي أنشأوها
      complaints = await prisma.complaint.findMany({
        where: { createdById: user.id },
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: {
            select: {
              id: true,
              username: true,
              pictureurl: true,
            }
          },
          assignedTo: {
            select: {
              id: true,
              username: true,
              pictureurl: true,
            }
          }
        }
      });
    }

    return res.status(200).json({ complaints, isITUser });
  } catch (error: any) {
    console.error('Error fetching complaints:', error);
    return res.status(500).json({ error: error.message || 'حدث خطأ أثناء جلب الشكاوى' });
  }
}

