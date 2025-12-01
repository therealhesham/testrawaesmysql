import { NextApiRequest, NextApiResponse } from 'next';
import prisma from 'lib/prisma';
import { jwtDecode } from 'jwt-decode';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ error: 'معرف الشكوى غير صالح' });
    }

    // التحقق من المصادقة
    const token = req.cookies.authToken;
    if (!token) {
      return res.status(401).json({ error: 'غير مصرح' });
    }

    const decoded = jwtDecode(token) as any;
    const userId = Number(decoded.id);

    // التحقق من وجود المستخدم
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    const rolePermissions = user.role?.permissions as any;

    if (req.method === 'GET') {
      // جلب شكوى محددة
      const complaint = await prisma.complaint.findUnique({
        where: { id: Number(id) },
        include: {
          createdBy: {
            select: {
              id: true,
              username: true,
              pictureurl: true,
              phonenumber: true,
              role: {
                select: {
                  name: true
                }
              }
            }
          },
          assignedTo: {
            select: {
              id: true,
              username: true,
              pictureurl: true,
              phonenumber: true,
              role: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      });

      if (!complaint) {
        return res.status(404).json({ error: 'الشكوى غير موجودة' });
      }

      // التحقق من الصلاحيات
      const canView = 
        complaint.createdById === userId || 
        rolePermissions?.["إدارة الشكاوى"]?.["حل"] ||
        complaint.assignedToId === userId;

      if (!canView) {
        return res.status(403).json({ error: 'ليس لديك صلاحية لعرض هذه الشكوى' });
      }

      return res.status(200).json({
        success: true,
        complaint
      });
    }

    return res.status(405).json({ error: 'الطريقة غير مسموح بها' });
  } catch (error: any) {
    console.error('Error in complaint details API:', error);
    return res.status(500).json({ error: 'حدث خطأ في الخادم', details: error.message });
  }
}

