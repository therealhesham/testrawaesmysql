import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { subDays } from 'date-fns';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { period = 'year', startDate, endDate, monthSelection } = req.method === 'POST' ? req.body : req.query;

    // تحديد نطاق التاريخ
    let dateFilter = {};
    const now = new Date();

    if (period === 'week') {
      dateFilter = {
        createdAt: {
          gte: subDays(now, 7),
          lte: now,
        },
      };
    } else if (period === 'year') {
      const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1);
      dateFilter = {
        createdAt: {
          gte: oneYearAgo,
          lte: now,
        },
      };
    } else if (period === 'month') {
      let targetMonth: Date;
      if (monthSelection === 'previous') {
        targetMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      } else {
        targetMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      }
      const monthStart = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1, 0, 0, 0, 0);
      const monthEnd = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0, 23, 59, 59, 999);
      dateFilter = {
        createdAt: {
          gte: monthStart,
          lte: monthEnd,
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

    // جلب البيانات الزمنية (حسب الفترة)
    const labels: string[] = [];
    const completedData: number[] = [];
    const incompleteData: number[] = [];

    if (period === 'week') {
      // بيانات يومية للأسبوع
      for (let i = 6; i >= 0; i--) {
        const day = new Date(subDays(now, i));
        const dayStart = new Date(day);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(day);
        dayEnd.setHours(23, 59, 59, 999);

        const completedCount = await prisma.tasks.count({
          where: {
            createdAt: {
              gte: dayStart,
              lte: dayEnd,
            },
            isCompleted: true,
          },
        });

        const incompleteCount = await prisma.tasks.count({
          where: {
            createdAt: {
              gte: dayStart,
              lte: dayEnd,
            },
            isCompleted: false,
          },
        });

        const yyyy = dayStart.getFullYear();
        const mm = String(dayStart.getMonth() + 1).padStart(2, '0');
        const dd = String(dayStart.getDate()).padStart(2, '0');
        labels.push(`${yyyy}-${mm}-${dd}`);
        completedData.push(completedCount);
        incompleteData.push(incompleteCount);
      }
    } else if (period === 'month') {
      // بيانات يومية للشهر
      let targetMonth: Date;
      if (monthSelection === 'previous') {
        targetMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      } else {
        targetMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      }
      const start = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1, 0, 0, 0, 0);
      const lastDay = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0).getDate();

      for (let day = 1; day <= lastDay; day++) {
        const dayStart = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), day, 0, 0, 0, 0);
        const dayEnd = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), day, 23, 59, 59, 999);

        const completedCount = await prisma.tasks.count({
          where: {
            createdAt: {
              gte: dayStart,
              lte: dayEnd,
            },
            isCompleted: true,
          },
        });

        const incompleteCount = await prisma.tasks.count({
          where: {
            createdAt: {
              gte: dayStart,
              lte: dayEnd,
            },
            isCompleted: false,
          },
        });

        const yyyy = dayStart.getFullYear();
        const mm = String(dayStart.getMonth() + 1).padStart(2, '0');
        const dd = String(day).padStart(2, '0');
        labels.push(`${yyyy}-${mm}-${dd}`);
        completedData.push(completedCount);
        incompleteData.push(incompleteCount);
      }
    } else if (period === 'custom' && startDate && endDate) {
      // بيانات يومية للفترة المخصصة
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      
      for (let i = 0; i <= days; i++) {
        const day = new Date(start);
        day.setDate(day.getDate() + i);
        const dayStart = new Date(day);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(day);
        dayEnd.setHours(23, 59, 59, 999);

        const completedCount = await prisma.tasks.count({
          where: {
            createdAt: {
              gte: dayStart,
              lte: dayEnd,
            },
            isCompleted: true,
          },
        });

        const incompleteCount = await prisma.tasks.count({
          where: {
            createdAt: {
              gte: dayStart,
              lte: dayEnd,
            },
            isCompleted: false,
          },
        });

        const yyyy = dayStart.getFullYear();
        const mm = String(dayStart.getMonth() + 1).padStart(2, '0');
        const dd = String(dayStart.getDate()).padStart(2, '0');
        labels.push(`${yyyy}-${mm}-${dd}`);
        completedData.push(completedCount);
        incompleteData.push(incompleteCount);
      }
    } else {
      // بيانات شهرية لآخر 12 شهر
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