import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { period = 'year', startDate, endDate } = req.method === 'POST' ? req.body : req.query;

    // تحديد نطاق التاريخ
    let dateFilter = {};
    const now = new Date();

    if (period === 'year') {
      const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1);
      dateFilter = {
        createdAt: {
          gte: oneYearAgo,
          lte: now,
        },
      };
    } else if (period === 'custom' && startDate && endDate) {
      dateFilter = {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      };
    } else {
      // الافتراضي: آخر 12 شهر
      const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1);
      dateFilter = {
        createdAt: {
          gte: oneYearAgo,
          lte: now,
        },
      };
    }

    // تسجيل نطاق التاريخ
    console.log('Date Filter:', JSON.stringify(dateFilter, null, 2));

    // جلب إحصائيات المهام
    const completedTasks = await prisma.tasks.count({
      where: {
        ...dateFilter,
        isCompleted: true,
      },
    });

    const incompleteTasks = await prisma.tasks.count({
      where: {
        ...dateFilter,
        isCompleted: false,
      },
    });

    const totalTasks = completedTasks + incompleteTasks;

    // جلب البيانات الزمنية (مهام لكل شهر)
    const labels = [];
    const completedData = [];
    const incompleteData = [];

    // إنشاء بيانات لآخر 12 شهر
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);

      console.log(`Processing month: ${monthStart.toISOString().slice(0, 7)} to ${monthEnd.toISOString().slice(0, 10)}`);

      const completedCount = await prisma.tasks.count({
        where: {
          createdAt: {
            gte: monthStart,
            lte: monthEnd,
          },
          isCompleted: true,
        },
      });

      const incompleteCount = await prisma.tasks.count({
        where: {
          createdAt: {
            gte: monthStart,
            lte: monthEnd,
          },
          isCompleted: false,
        },
      });

      console.log(`Month ${monthStart.toISOString().slice(0, 7)}: Completed = ${completedCount}, Incomplete = ${incompleteCount}`);

      // تنسيق اسم الشهر بالعربية
      const monthNames = [
        'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
        'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
      ];
      const monthLabel = `${monthNames[monthStart.getMonth()]} ${monthStart.getFullYear()}`;
      labels.push(monthLabel);
      completedData.push(completedCount);
      incompleteData.push(incompleteCount);
    }

    // إرجاع البيانات
    res.status(200).json({
      total: totalTasks,
      completed: completedTasks,
      incomplete: incompleteTasks,
      timeSeriesData: {
        labels,
        completedData,
        incompleteData,
      },
    });
  } catch (error) {
    console.error('Error fetching tasks stats:', error);
    res.status(500).json({ error: 'فشل جلب إحصائيات المهام', details: (error as Error).message });
  } finally {
    await prisma.$disconnect();
  }
}