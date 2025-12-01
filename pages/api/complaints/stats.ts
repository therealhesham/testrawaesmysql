import { NextApiRequest, NextApiResponse } from 'next';
import prisma from 'lib/prisma';
import { jwtDecode } from 'jwt-decode';

/**
 * API endpoint to get complaints statistics
 * Useful for dashboard widgets or notifications badge
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
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
    const canManageComplaints = !!rolePermissions?.["إدارة الشكاوى"]?.["حل"];

    // إحصائيات عامة
    const totalComplaints = await prisma.complaint.count();
    
    // إحصائيات حسب الحالة
    const statusStats = await prisma.complaint.groupBy({
      by: ['status'],
      _count: true
    });

    const statusCounts = statusStats.reduce((acc: any, curr: any) => {
      acc[curr.status] = curr._count;
      return acc;
    }, {});

    // إحصائيات المستخدم
    const myComplaints = await prisma.complaint.count({
      where: { createdById: userId }
    });

    const myPendingComplaints = await prisma.complaint.count({
      where: { 
        createdById: userId,
        status: { in: ['pending', 'in_progress'] }
      }
    });

    // إحصائيات IT (إذا كان لديه صلاحية)
    let itStats = {};
    if (canManageComplaints) {
      const unassignedComplaints = await prisma.complaint.count({
        where: { 
          assignedToId: null,
          status: { in: ['pending', 'in_progress'] }
        }
      });

      const myAssignedComplaints = await prisma.complaint.count({
        where: { 
          assignedToId: userId,
          status: { in: ['pending', 'in_progress'] }
        }
      });

      const urgentComplaints = await prisma.complaint.count({
        where: {
          status: 'pending',
          createdAt: {
            lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // أقدم من 7 أيام
          }
        }
      });

      itStats = {
        unassigned: unassignedComplaints,
        myAssigned: myAssignedComplaints,
        urgent: urgentComplaints
      };
    }

    // آخر الشكاوى
    const recentComplaints = await prisma.complaint.findMany({
      where: canManageComplaints ? {} : { createdById: userId },
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        createdBy: {
          select: {
            username: true
          }
        }
      }
    });

    return res.status(200).json({
      success: true,
      stats: {
        total: totalComplaints,
        byStatus: statusCounts,
        user: {
          total: myComplaints,
          pending: myPendingComplaints
        },
        it: itStats
      },
      recent: recentComplaints
    });

  } catch (error: any) {
    console.error('Error in complaints stats API:', error);
    return res.status(500).json({ error: 'حدث خطأ في الخادم', details: error.message });
  }
}

