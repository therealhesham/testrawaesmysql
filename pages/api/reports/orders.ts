import prisma from "lib/prisma";
import { getBookingQuotaWindow, getPreviousBookingQuotaWindow } from "lib/bookingGenderQuota";
import { NextApiRequest, NextApiResponse } from "next";
import { subDays, eachDayOfInterval, eachMonthOfInterval, format } from "date-fns";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // استخراج معايير البحث
    const { period, startDate, endDate, monthSelection, referenceMonth } = req.method === 'POST' ? req.body : req.query;

    // تحديد نطاق زمني
    let dateFilter: { gte?: Date; lte?: Date } | undefined = {};
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
      const refMatch = typeof referenceMonth === 'string' ? referenceMonth.match(/^(\d{4})-(\d{1,2})$/) : null;
      if (refMatch) {
        const y = Number(refMatch[1]);
        const mIdx = Number(refMatch[2]) - 1;
        dateFilter.gte = new Date(y, mIdx, 1, 0, 0, 0, 0);
        dateFilter.lte = new Date(y, mIdx + 1, 0, 23, 59, 59, 999);
      } else if (monthSelection === 'previous') {
        const now = new Date();
        dateFilter.gte = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
        dateFilter.lte = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      } else if (monthSelection === 'last30') {
        dateFilter.gte = subDays(new Date(), 30);
        dateFilter.lte = new Date();
      } else if (monthSelection === 'quota') {
        const { start, end } = getBookingQuotaWindow();
        dateFilter.gte = start;
        dateFilter.lte = end;
      } else {
        // الشهر الحالي تقويمياً
        const now = new Date();
        dateFilter.gte = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        dateFilter.lte = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      }

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
      const end = new Date(endDate as string);
      end.setHours(23, 59, 59, 999);
      dateFilter.lte = end;
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
    } else if (period === 'all') {
      dateFilter = undefined;
      const now = new Date();
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      const months = eachMonthOfInterval({ start: startOfYear, end: endOfYear });
      timeSeriesData.labels = months.map((month) => format(month, 'MMMM'));
      timeSeriesData.data = await Promise.all(
        months.map(async (month, i) => {
          return prisma.neworder.count({
            where: {
              createdAt: {
                gte: month,
                lt: new Date(now.getFullYear(), i + 1, 1),
              },
            },
          });
        })
      );
    } else {
      // السنة الحالية (افتراضي)
      const now = new Date();
      dateFilter.gte = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      dateFilter.lte = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      const months = eachMonthOfInterval({ start: dateFilter.gte, end: dateFilter.lte });
      timeSeriesData.labels = months.map((month) => format(month, 'MMMM'));
      timeSeriesData.data = await Promise.all(
        months.map(async (month, i) => {
          return prisma.neworder.count({
            where: {
              createdAt: {
                gte: month,
                lt: new Date(now.getFullYear(), i + 1, 1),
              },
            },
          });
        })
      );
    }

    const whereClause: any = dateFilter && Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};

    // 1. إجمالي الطلبات التي تم إنشاؤها في هذه الفترة
    const totalOrders = await prisma.neworder.count({
      where: whereClause,
    });

    // 2. طلبات جديدة لا تزال قيد الانتظار (لم يتخذ قرار قبول/رفض بعد)
    const new_order = await prisma.neworder.count({
      where: {
        ...whereClause,
        bookingstatus: { in: ["new_order", "new_orders"] },
      },
    });

    // 3. طلبات مرفوضة
    const rejected = await prisma.neworder.count({
      where: {
        ...whereClause,
        OR: [
          { bookingstatus: "rejected" },
          { rejectedOrders: { some: {} } },
        ],
      },
    });

    // 4. طلبات ملغاة
    const cancelled = await prisma.neworder.count({
      where: {
        ...whereClause,
        AND: [
          { bookingstatus: { not: "rejected" } },
          { rejectedOrders: { none: {} } },
          {
            OR: [
              { bookingstatus: "cancelled" },
              { cancelledOrders: { some: {} } },
            ],
          },
        ],
      },
    });

    // 5. طلبات مكتملة ومستلمة بنجاح
    const delivered = await prisma.neworder.count({
      where: {
        ...whereClause,
        AND: [
          { bookingstatus: { notIn: ["new_order", "new_orders", "rejected", "cancelled"] } },
          { rejectedOrders: { none: {} } },
          { cancelledOrders: { none: {} } },
          {
            OR: [
              { bookingstatus: { in: ["received", "delivered", "closed", "مغلق", "مغلق لهروب العاملة من المطار"] } },
              { isContractEnded: true },
              { DeliveryDetails: { some: { deliveryFile: { not: null } } } },
            ],
          },
        ],
      },
    });

    // 6. طلبات قيد الإجراء حالياً (مقبولة وجارية في مراحل الاستقدام)
    const in_progress = await prisma.neworder.count({
      where: {
        ...whereClause,
        AND: [
          { bookingstatus: { notIn: ["new_order", "new_orders", "rejected", "cancelled", "received", "delivered", "closed", "مغلق", "مغلق لهروب العاملة من المطار"] } },
          { rejectedOrders: { none: {} } },
          { cancelledOrders: { none: {} } },
          { isContractEnded: { not: true } },
          { DeliveryDetails: { none: { deliveryFile: { not: null } } } },
        ],
      },
    });

    // إجمالي المقبولة = قيد الإجراء + المكتملة
    const accepted = in_progress + delivered;

    // نسب التحويل ومصير الطلبات
    const rates = {
      acceptanceRate: totalOrders > 0 ? Number(((accepted / totalOrders) * 100).toFixed(1)) : 0,
      rejectionRate: totalOrders > 0 ? Number(((rejected / totalOrders) * 100).toFixed(1)) : 0,
      cancellationRate: totalOrders > 0 ? Number(((cancelled / totalOrders) * 100).toFixed(1)) : 0,
      completionRate: accepted > 0 ? Number(((delivered / accepted) * 100).toFixed(1)) : 0,
      pendingRate: totalOrders > 0 ? Number(((new_order / totalOrders) * 100).toFixed(1)) : 0,
    };

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

    // إحصائيات المدن\المصادر
    const SourcesStats = await prisma.client.groupBy({
      by: ['Source'],
      _count: {
        id: true,
      },
      where: {
        Source: {
          not: null,
        },
      },
    });

    // إحصائيات الحكومية
    const governmentalStats = await getGovernmentalOrderStats(dateFilter || {});

    // تفاصيل أسباب الرفض إن وجدت
    const rejectionReasons = await prisma.rejectedOrders.groupBy({
      by: ['ReasonOfRejection'],
      _count: { id: true },
      where: dateFilter ? { createdAt: dateFilter } : {},
    });

    // تفاصيل أسباب الإلغاء إن وجدت
    const cancellationReasons = await prisma.cancelledOrders.groupBy({
      by: ['ReasonOfCancellation'],
      _count: { id: true },
      where: dateFilter ? { createdAt: dateFilter } : {},
    });

    res.status(200).json({
      totalOrders,
      accepted,
      in_progress,
      delivered,
      completed: delivered,
      rejected,
      cancelled,
      new_order,
      rates,
      rejectionReasons,
      cancellationReasons,
      thisWeekOrders: period === 'week' ? totalOrders : 0,
      minimummPerMonths,
      timeSeriesData,
      governmental: governmentalStats,
      SourcesStats,
    });
  } catch (error) {
    console.error('Error in orders API:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// دالة getGovernmentalOrderStats
async function getGovernmentalOrderStats(dateFilter: { gte?: Date; lte?: Date }) {
  try {
    const where: any = dateFilter && Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};
    const ordersWithGovernmentalStatus = await prisma.neworder.findMany({
      select: {
        id: true,
        foreignLaborApproval: true,
        travelPermit: true,
        createdAt: true,
      },
      where,
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
