import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { period = 'year', startDate, endDate, monthSelection } = req.method === 'POST' ? req.body : req.query;

    // تحديد نطاق التاريخ
    let dateFilter: any = {};
    const now = new Date();

    if (period === 'year') {
      const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1);
      dateFilter = {
        gte: oneYearAgo,
        lte: now,
      };
    } else if (period === 'month') {
      let targetMonth: Date;
      if (monthSelection === 'previous') {
        targetMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      } else {
        targetMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      }
      const monthStart = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1);
      const monthEnd = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0, 23, 59, 59, 999);
      dateFilter = {
        gte: monthStart,
        lte: monthEnd,
      };
    } else if (period === 'week') {
      const oneWeekAgo = new Date(now);
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      dateFilter = {
        gte: oneWeekAgo,
        lte: now,
      };
    } else if (period === 'custom' && startDate && endDate) {
      dateFilter = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else {
      // الافتراضي: آخر 12 شهر
      const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1);
      dateFilter = {
        gte: oneYearAgo,
        lte: now,
      };
    }

    // جلب جميع الموظفين
    const users = await prisma.user.findMany({
      where: {
        admin: false, // فقط الموظفين وليس المديرين
      },
      select: {
        id: true,
        username: true,
        pictureurl: true,
      },
    });

    // إحصائيات لكل موظف
    const employeeStats = await Promise.all(
      users.map(async (user) => {
        // المهام المكتملة
        const completedTasks = await prisma.tasks.count({
          where: {
            userId: user.id,
            isCompleted: true,
            createdAt: dateFilter,
          },
        });

        // المهام المعلقة (غير مكتملة)
        const pendingTasks = await prisma.tasks.count({
          where: {
            userId: user.id,
            isCompleted: false,
            createdAt: dateFilter,
          },
        });

        // المهام التي أنشأها الموظف (assignedBy)
        const tasksCreated = await prisma.tasks.count({
          where: {
            assignedBy: user.id,
            createdAt: dateFilter,
          },
        });

        // الطلبات التي أنشأها الموظف (من خلال logs - البحث في Details و Status)
        const userLogs = await prisma.logs.findMany({
          where: {
            userId: user.username,
            OR: [
              { Status: { contains: 'طلب' } },
              { Status: { contains: 'حجز' } },
              { Details: { contains: 'طلب' } },
              { Details: { contains: 'حجز' } },
            ],
            createdAt: dateFilter,
          },
        });

        const ordersCreated = userLogs.filter(log => 
          log.Status?.includes('إنشاء') || 
          log.Status?.includes('طلب جديد') ||
          log.Details?.includes('إنشاء طلب')
        ).length;

        // إجمالي الطلبات المرتبطة بالموظف
        const totalOrdersRelated = userLogs.length;

        // إحصائيات الطلبات حسب الحالة (من خلال systemUserLogs)
        const newOrders = await prisma.systemUserLogs.count({
          where: {
            userId: user.id,
            OR: [
              { action: { contains: 'new_order' } },
              { action: { contains: 'create' } },
              { pageRoute: { contains: 'neworder' } },
            ],
            createdAt: dateFilter,
          },
        });

        const inProgressOrders = await prisma.systemUserLogs.count({
          where: {
            userId: user.id,
            OR: [
              { action: { contains: 'in_progress' } },
              { action: { contains: 'progress' } },
            ],
            createdAt: dateFilter,
          },
        });

        const deliveredOrders = await prisma.systemUserLogs.count({
          where: {
            userId: user.id,
            OR: [
              { action: { contains: 'delivered' } },
              { action: { contains: 'received' } },
            ],
            createdAt: dateFilter,
          },
        });

        const cancelledOrders = await prisma.systemUserLogs.count({
          where: {
            userId: user.id,
            action: {
              contains: 'cancelled',
            },
            createdAt: dateFilter,
          },
        });

        return {
          employeeId: user.id,
          employeeName: user.username,
          employeePicture: user.pictureurl,
          tasks: {
            completed: completedTasks,
            pending: pendingTasks,
            total: completedTasks + pendingTasks,
            created: tasksCreated,
          },
          orders: {
            total: totalOrdersRelated,
            created: ordersCreated,
            byStatus: {
              new: newOrders,
              inProgress: inProgressOrders,
              delivered: deliveredOrders,
              cancelled: cancelledOrders,
            },
          },
        };
      })
    );

    // ترتيب الموظفين حسب إجمالي المهام المكتملة
    employeeStats.sort((a, b) => b.tasks.completed - a.tasks.completed);

    res.status(200).json({
      period,
      dateRange: dateFilter,
      employees: employeeStats,
      summary: {
        totalEmployees: employeeStats.length,
        totalCompletedTasks: employeeStats.reduce((sum, emp) => sum + emp.tasks.completed, 0),
        totalPendingTasks: employeeStats.reduce((sum, emp) => sum + emp.tasks.pending, 0),
        totalOrders: employeeStats.reduce((sum, emp) => sum + emp.orders.total, 0),
      },
    });
  } catch (error) {
    console.error('Error fetching employee performance stats:', error);
    res.status(500).json({ error: 'فشل جلب إحصائيات أداء الموظفين', details: (error as Error).message });
  } finally {
    await prisma.$disconnect();
  }
}

