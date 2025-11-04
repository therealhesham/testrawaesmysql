import prisma from "lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";
import { subDays, subMonths, eachDayOfInterval, eachMonthOfInterval, format } from "date-fns"; // إضافة مكتبة date-fns للتعامل مع التواريخ

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // استخراج معايير البحث
    const { period, startDate, endDate } = req.method === 'POST' ? req.body : req.query;

    // تحديد نطاق زمني
    let dateFilter: { gte?: Date; lte?: Date } = {};
    let timeSeriesData: { labels: string[]; data: number[] } = { labels: [], data: [] };

    if (period === 'week') {
      dateFilter.gte = subDays(new Date(), 7);
      dateFilter.lte = new Date();
      // بيانات يومية للأسبوع
      const days = eachDayOfInterval({ start: dateFilter.gte, end: dateFilter.lte });
      timeSeriesData.labels = days.map((day) => format(day, 'yyyy-MM-dd'));
      timeSeriesData.data = await Promise.all(
        days.map(async (day) => {
          const nextDay = subDays(day, -1);
          return prisma.neworder.count({
            where: {
              createdAt: {
                gte: day,
                lt: nextDay,
              },
            },
          });
        })
      );
    } else if (period === 'month') {
      dateFilter.gte = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      dateFilter.lte = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1);
      // بيانات يومية للشهر
      const days = eachDayOfInterval({ start: dateFilter.gte, end: dateFilter.lte });
      timeSeriesData.labels = days.map((day) => format(day, 'yyyy-MM-dd'));
      timeSeriesData.data = await Promise.all(
        days.map(async (day) => {
          const nextDay = subDays(day, -1);
          return prisma.neworder.count({
            where: {
              createdAt: {
                gte: day,
                lt: nextDay,
              },
            },
          });
        })
      );
    } else if (period === 'custom' && startDate && endDate) {
      dateFilter.gte = new Date(startDate as string);
      dateFilter.lte = new Date(endDate as string);
      // بيانات يومية للنطاق المخصص
      const days = eachDayOfInterval({ start: dateFilter.gte, end: dateFilter.lte });
      timeSeriesData.labels = days.map((day) => format(day, 'yyyy-MM-dd'));
      timeSeriesData.data = await Promise.all(
        days.map(async (day) => {
          const nextDay = subDays(day, -1);
          return prisma.neworder.count({
            where: {
              createdAt: {
                gte: day,
                lt: nextDay,
              },
            },
          });
        })
      );
    } else {
      // السنة الحالية (افتراضي)
      dateFilter.gte = new Date(new Date().getFullYear(), 0, 1);
      dateFilter.lte = new Date(new Date().getFullYear() + 1, 0, 1);
      const months = eachMonthOfInterval({ start: dateFilter.gte, end: dateFilter.lte });
      timeSeriesData.labels = months.map((month) => format(month, 'MMMM'));
      timeSeriesData.data = await Promise.all(
        months.map(async (month, i) => {
          return prisma.neworder.count({
            where: {
              createdAt: {
                gte: month,
                lt: new Date(new Date().getFullYear(), i + 1, 1),
              },
            },
          });
        })
      );
    }

    // إحصائيات الطلبات الأساسية
    const in_progress = await prisma.neworder.count({
      where: {
        bookingstatus: {
          not: {
            in: [ "delivered", "in_progress", "received", "cancelled", "rejected"],
          },
        },
        createdAt: dateFilter,
      },
    });

    const new_order = await prisma.neworder.count({
      where: {
        bookingstatus: {
          in: ["new_order", "new_orders"],
        },
        createdAt: dateFilter,
      },
    });

    const delivered = await prisma.neworder.count({
      where: {
        bookingstatus: {
          in: ["received"],
        },
        createdAt: dateFilter,
      },
    });

    const cancelled = await prisma.neworder.count({
      where: {
        bookingstatus: {
          in: ["cancelled"],
        },
        createdAt: dateFilter,
      },
    });

    // إحصائيات الحد الأدنى للأجور
    const year = new Date().getFullYear();
    const minimummPerMonths = [];

    for (let month = 1; month <= 12; month++) {
      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 1);

      const minimum = await prisma.minimumm.findFirst({
        where: {
          createdAt: {
            gte: startOfMonth,
            lt: endOfMonth,
          },
        },
      });

      minimummPerMonths.push({
        month,
        minimum: minimum ? minimum.amount : null,
      });
    }


//احصائيات المدن\المصادر
const SourcesStats = await prisma.client.groupBy({
  by: ['Source'],
  _count: {
    id: true
  },
  where: {
    Source: {
      not: null
    }
  }
});
    // إحصائيات الحكومية
    const governmentalStats = await getGovernmentalOrderStats(dateFilter);

    res.status(200).json({
      in_progress,
      new_order,
      delivered,
      cancelled,
      thisWeekOrders: period === 'week' ? await prisma.neworder.count({ where: { createdAt: dateFilter } }) : 0,
      minimummPerMonths,
      timeSeriesData, // استبدال ordersPerMonthsAlongYear
      governmental: governmentalStats,
      SourcesStats,
    });
  } catch (error) {
    console.error('Error in orders API:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// دالة getGovernmentalOrderStats (بدون تغيير)
async function getGovernmentalOrderStats(dateFilter: { gte?: Date; lte?: Date }) {
  try {
    const ordersWithGovernmentalStatus = await prisma.neworder.findMany({
      select: {
        id: true,
        foreignLaborApproval: true,
        travelPermit: true,
        createdAt: true,
      },
      where: {
        createdAt: dateFilter,
      },
    });

    const stats = {
      totalOrders: ordersWithGovernmentalStatus.length,
      withForeignLaborApproval: ordersWithGovernmentalStatus.filter((order) => order.foreignLaborApproval).length,
      withTravelPermit: ordersWithGovernmentalStatus.filter((order) => order.travelPermit).length,
      completedGovernmental: ordersWithGovernmentalStatus.filter(
        (order) => order.foreignLaborApproval && order.travelPermit
      ).length,
      pendingGovernmental: ordersWithGovernmentalStatus.filter(
        (order) => !order.foreignLaborApproval || !order.travelPermit
      ).length,
    };

    const monthlyGovernmentalStats: { [key: string]: any } = {};

    ordersWithGovernmentalStatus.forEach((order) => {
      if (order.createdAt) {
        const month = order.createdAt.toISOString().substring(0, 7);
        if (!monthlyGovernmentalStats[month]) {
          monthlyGovernmentalStats[month] = {
            total: 0,
            completed: 0,
            pending: 0,
          };
        }

        monthlyGovernmentalStats[month].total++;
        if (order.foreignLaborApproval && order.travelPermit) {
          monthlyGovernmentalStats[month].completed++;
        } else {
          monthlyGovernmentalStats[month].pending++;
        }
      }
    });

    return {
      ...stats,
      monthlyStats: monthlyGovernmentalStats,
    };
  } catch (error) {
    console.error('Error getting governmental stats:', error);
    return {
      totalOrders: 0,
      withForeignLaborApproval: 0,
      withTravelPermit: 0,
      completedGovernmental: 0,
      pendingGovernmental: 0,
      monthlyStats: {},
    };
  }
}