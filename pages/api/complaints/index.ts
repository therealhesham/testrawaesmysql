import { NextApiRequest, NextApiResponse } from 'next';
import prisma from 'lib/prisma';
import { jwtDecode } from 'jwt-decode';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
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
      // جلب الشكاوى
      const { status, myComplaints } = req.query;

      let where: any = {};

      // إذا كان المستخدم يريد شكاواه فقط
      if (myComplaints === 'true') {
        where.createdById = userId;
      } 
      // إذا كان لديه صلاحية حل الشكاوى، يرى الشكاوى المسندة إليه أو الجميع
      else if (rolePermissions?.["إدارة الشكاوى"]?.["حل"]) {
        // يرى جميع الشكاوى أو المسندة إليه فقط
        if (req.query.assignedToMe === 'true') {
          where.assignedToId = userId;
        }
        // لا نضع شرط إضافي - يرى الجميع
      } else {
        // المستخدم العادي يرى شكاواه فقط
        where.createdById = userId;
      }

      // فلترة حسب الحالة
      if (status && status !== 'all') {
        where.status = status;
      }

      const complaints = await prisma.complaint.findMany({
        where,
        include: {
          createdBy: {
            select: {
              id: true,
              username: true,
              pictureurl: true,
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
              role: {
                select: {
                  name: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      // إحصائيات
      const stats = await prisma.complaint.groupBy({
        by: ['status'],
        _count: true,
        where: myComplaints === 'true' ? { createdById: userId } : {}
      });

      return res.status(200).json({
        success: true,
        complaints,
        stats: {
          total: complaints.length,
          byStatus: stats.reduce((acc: any, curr: any) => {
            acc[curr.status] = curr._count;
            return acc;
          }, {})
        }
      });
    }

    if (req.method === 'POST') {
      // إنشاء شكوى جديدة
      const { title, description, screenshot } = req.body;

      if (!title || !description) {
        return res.status(400).json({ error: 'العنوان والوصف مطلوبان' });
      }

      const complaint = await prisma.complaint.create({
        data: {
          title,
          description,
          screenshot: screenshot || null,
          status: 'pending',
          createdById: userId
        },
        include: {
          createdBy: {
            select: {
              id: true,
              username: true,
              pictureurl: true,
              role: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      });

      // إنشاء إشعار للمستخدمين الذين لديهم صلاحية حل الشكاوى
      const itUsers = await prisma.user.findMany({
        where: {
          role: {
            permissions: {
              path: ['إدارة الشكاوى']?.['حل'],
              equals: true
            }
          }
        }
      });

      // إنشاء إشعار عام لجميع مستخدمي IT
      if (itUsers.length > 0) {
        await prisma.notifications.create({
          data: {
            title: 'شكوى جديدة',
            message: `شكوى جديدة من ${user.username}: ${title}`,
            type: 'complaint',
            userId: null, // إشعار عام
            isRead: false
          }
        });
      }

      return res.status(201).json({
        success: true,
        complaint,
        message: 'تم إرسال الشكوى بنجاح'
      });
    }

    if (req.method === 'PUT') {
      // تحديث شكوى
      const { id, status, assignedToId, resolutionNotes } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'معرف الشكوى مطلوب' });
      }

      // التحقق من الصلاحيات
      const complaint = await prisma.complaint.findUnique({
        where: { id: Number(id) }
      });

      if (!complaint) {
        return res.status(404).json({ error: 'الشكوى غير موجودة' });
      }

      // التحقق من الصلاحيات
      const canResolve = rolePermissions?.["إدارة الشكاوى"]?.["حل"];
      const isOwner = complaint.createdById === userId;

      if (!canResolve && !isOwner) {
        return res.status(403).json({ error: 'ليس لديك صلاحية لتعديل هذه الشكوى' });
      }

      const updateData: any = {};

      if (status) updateData.status = status;
      if (assignedToId !== undefined) updateData.assignedToId = assignedToId;
      if (resolutionNotes !== undefined) updateData.resolutionNotes = resolutionNotes;
      
      // إذا تم تغيير الحالة إلى resolved أو closed
      if (status === 'resolved' || status === 'closed') {
        updateData.resolvedAt = new Date();
      }

      const updatedComplaint = await prisma.complaint.update({
        where: { id: Number(id) },
        data: updateData,
        include: {
          createdBy: {
            select: {
              id: true,
              username: true,
              pictureurl: true,
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
              role: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      });

      // إرسال إشعار لصاحب الشكوى عند التحديث
      if (status && complaint.createdById !== userId) {
        const statusMessages: any = {
          'in_progress': 'جاري العمل على شكواك',
          'resolved': 'تم حل شكواك',
          'closed': 'تم إغلاق شكواك'
        };

        await prisma.notifications.create({
          data: {
            title: 'تحديث على شكواك',
            message: statusMessages[status] || `تم تحديث حالة شكواك إلى ${status}`,
            type: 'complaint_update',
            userId: complaint.createdById.toString(),
            isRead: false
          }
        });
      }

      return res.status(200).json({
        success: true,
        complaint: updatedComplaint,
        message: 'تم تحديث الشكوى بنجاح'
      });
    }

    if (req.method === 'DELETE') {
      // حذف شكوى
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ error: 'معرف الشكوى مطلوب' });
      }

      const complaint = await prisma.complaint.findUnique({
        where: { id: Number(id) }
      });

      if (!complaint) {
        return res.status(404).json({ error: 'الشكوى غير موجودة' });
      }

      // فقط صاحب الشكوى أو من لديه صلاحية يمكنه الحذف
      const canResolve = rolePermissions?.["إدارة الشكاوى"]?.["حل"];
      const isOwner = complaint.createdById === userId;

      if (!canResolve && !isOwner) {
        return res.status(403).json({ error: 'ليس لديك صلاحية لحذف هذه الشكوى' });
      }

      await prisma.complaint.delete({
        where: { id: Number(id) }
      });

      return res.status(200).json({
        success: true,
        message: 'تم حذف الشكوى بنجاح'
      });
    }

    return res.status(405).json({ error: 'الطريقة غير مسموح بها' });
  } catch (error: any) {
    console.error('Error in complaints API:', error);
    return res.status(500).json({ error: 'حدث خطأ في الخادم', details: error.message });
  }
}
