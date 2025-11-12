import prisma from "lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";
import { subDays, subMonths, eachDayOfInterval, eachMonthOfInterval, format } from "date-fns";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // استخراج معايير البحث
    const { period, startDate, endDate, monthSelection } = req.method === 'POST' ? req.body : req.query;

    // تحديد نطاق زمني
    let dateFilter: { gte?: Date; lte?: Date } = {};
    let timeSeriesData: { labels: string[]; data: number[] } = { labels: [], data: [] };
    let nationalityTimeSeries: { [nationality: string]: number[] } = {}; // بيانات سلسلة زمنية لكل جنسية
    let nationalityStats: { nationality: string; count: number }[] = [];

    if (period === 'week') {
      dateFilter.gte = subDays(new Date(), 7);
      dateFilter.lte = new Date();
      // بيانات يومية للأسبوع
      const days = eachDayOfInterval({ start: dateFilter.gte, end: dateFilter.lte });
      timeSeriesData.labels = days.map((day) => format(day, 'yyyy-MM-dd'));
      
      // جلب الطلبات مع معلومات المكتب (الجنسية)
      const orders = await prisma.neworder.findMany({
        where: {
          createdAt: dateFilter,
        },
        include: {
          HomeMaid: {
            include: {
              office: {
                select: {
                  Country: true,
                },
              },
            },
          },
        },
      });

      // تجميع البيانات حسب الجنسية واليوم
      const nationalityByDay: { [key: string]: { [nationality: string]: number } } = {};
      days.forEach((day) => {
        const dayStr = format(day, 'yyyy-MM-dd');
        nationalityByDay[dayStr] = {};
      });

      orders.forEach((order) => {
        if (order.HomeMaid?.office?.Country && order.createdAt) {
          const orderDate = order.createdAt instanceof Date ? order.createdAt : new Date(order.createdAt);
          const dayStr = format(orderDate, 'yyyy-MM-dd');
          const nationality = order.HomeMaid.office.Country;
          if (nationalityByDay[dayStr]) {
            nationalityByDay[dayStr][nationality] = (nationalityByDay[dayStr][nationality] || 0) + 1;
          }
        }
      });

      // إحصائيات الجنسيات الإجمالية
      const nationalityCounts: { [key: string]: number } = {};
      orders.forEach((order) => {
        if (order.HomeMaid?.office?.Country) {
          const nationality = order.HomeMaid.office.Country;
          nationalityCounts[nationality] = (nationalityCounts[nationality] || 0) + 1;
        }
      });
      nationalityStats = Object.entries(nationalityCounts)
        .map(([nationality, count]) => ({ nationality, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10); // أعلى 10 جنسيات

      // الحصول على أعلى 5 جنسيات
      const topNationalities = nationalityStats.slice(0, 5).map(stat => stat.nationality);

      // حساب بيانات السلسلة الزمنية لكل جنسية من أعلى 5
      topNationalities.forEach((nationality) => {
        nationalityTimeSeries[nationality] = days.map((day) => {
          const dayStr = format(day, 'yyyy-MM-dd');
          const dayData = nationalityByDay[dayStr] || {};
          return dayData[nationality] || 0;
        });
      });

      // حساب إجمالي الطلبات لكل يوم (للعرض القديم - اختياري)
      timeSeriesData.data = days.map((day) => {
        const dayStr = format(day, 'yyyy-MM-dd');
        const dayData = nationalityByDay[dayStr] || {};
        const values = Object.values(dayData);
        return values.length > 0 ? Math.max(...values) : 0;
      });

    } else if (period === 'month') {
      let targetMonth: Date;
      if (monthSelection === 'previous') {
        targetMonth = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
      } else {
        targetMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      }
      dateFilter.gte = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1);
      dateFilter.lte = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0, 23, 59, 59, 999);
      // بيانات يومية للشهر
      const days = eachDayOfInterval({ start: dateFilter.gte, end: dateFilter.lte });
      timeSeriesData.labels = days.map((day) => format(day, 'yyyy-MM-dd'));
      
      const orders = await prisma.neworder.findMany({
        where: {
          createdAt: dateFilter,
        },
        include: {
          HomeMaid: {
            include: {
              office: {
                select: {
                  Country: true,
                },
              },
            },
          },
        },
      });

      const nationalityByDay: { [key: string]: { [nationality: string]: number } } = {};
      days.forEach((day) => {
        const dayStr = format(day, 'yyyy-MM-dd');
        nationalityByDay[dayStr] = {};
      });

      orders.forEach((order) => {
        if (order.HomeMaid?.office?.Country && order.createdAt) {
          const orderDate = order.createdAt instanceof Date ? order.createdAt : new Date(order.createdAt);
          const dayStr = format(orderDate, 'yyyy-MM-dd');
          const nationality = order.HomeMaid.office.Country;
          if (nationalityByDay[dayStr]) {
            nationalityByDay[dayStr][nationality] = (nationalityByDay[dayStr][nationality] || 0) + 1;
          }
        }
      });

      const nationalityCounts: { [key: string]: number } = {};
      orders.forEach((order) => {
        if (order.HomeMaid?.office?.Country) {
          const nationality = order.HomeMaid.office.Country;
          nationalityCounts[nationality] = (nationalityCounts[nationality] || 0) + 1;
        }
      });
      nationalityStats = Object.entries(nationalityCounts)
        .map(([nationality, count]) => ({ nationality, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // الحصول على أعلى 5 جنسيات
      const topNationalities = nationalityStats.slice(0, 5).map(stat => stat.nationality);

      // حساب بيانات السلسلة الزمنية لكل جنسية من أعلى 5
      topNationalities.forEach((nationality) => {
        nationalityTimeSeries[nationality] = days.map((day) => {
          const dayStr = format(day, 'yyyy-MM-dd');
          const dayData = nationalityByDay[dayStr] || {};
          return dayData[nationality] || 0;
        });
      });

      // حساب إجمالي الطلبات لكل يوم (للعرض القديم - اختياري)
      timeSeriesData.data = days.map((day) => {
        const dayStr = format(day, 'yyyy-MM-dd');
        const dayData = nationalityByDay[dayStr] || {};
        const values = Object.values(dayData);
        return values.length > 0 ? Math.max(...values) : 0;
      });

    } else if (period === 'custom' && startDate && endDate) {
      dateFilter.gte = new Date(startDate as string);
      dateFilter.lte = new Date(endDate as string);
      // بيانات يومية للنطاق المخصص
      const days = eachDayOfInterval({ start: dateFilter.gte, end: dateFilter.lte });
      timeSeriesData.labels = days.map((day) => format(day, 'yyyy-MM-dd'));
      
      const orders = await prisma.neworder.findMany({
        where: {
          createdAt: dateFilter,
        },
        include: {
          HomeMaid: {
            include: {
              office: {
                select: {
                  Country: true,
                },
              },
            },
          },
        },
      });

      const nationalityByDay: { [key: string]: { [nationality: string]: number } } = {};
      days.forEach((day) => {
        const dayStr = format(day, 'yyyy-MM-dd');
        nationalityByDay[dayStr] = {};
      });

      orders.forEach((order) => {
        if (order.HomeMaid?.office?.Country && order.createdAt) {
          const orderDate = order.createdAt instanceof Date ? order.createdAt : new Date(order.createdAt);
          const dayStr = format(orderDate, 'yyyy-MM-dd');
          const nationality = order.HomeMaid.office.Country;
          if (nationalityByDay[dayStr]) {
            nationalityByDay[dayStr][nationality] = (nationalityByDay[dayStr][nationality] || 0) + 1;
          }
        }
      });

      const nationalityCounts: { [key: string]: number } = {};
      orders.forEach((order) => {
        if (order.HomeMaid?.office?.Country) {
          const nationality = order.HomeMaid.office.Country;
          nationalityCounts[nationality] = (nationalityCounts[nationality] || 0) + 1;
        }
      });
      nationalityStats = Object.entries(nationalityCounts)
        .map(([nationality, count]) => ({ nationality, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // الحصول على أعلى 5 جنسيات
      const topNationalities = nationalityStats.slice(0, 5).map(stat => stat.nationality);

      // حساب بيانات السلسلة الزمنية لكل جنسية من أعلى 5
      topNationalities.forEach((nationality) => {
        nationalityTimeSeries[nationality] = days.map((day) => {
          const dayStr = format(day, 'yyyy-MM-dd');
          const dayData = nationalityByDay[dayStr] || {};
          return dayData[nationality] || 0;
        });
      });

      // حساب إجمالي الطلبات لكل يوم (للعرض القديم - اختياري)
      timeSeriesData.data = days.map((day) => {
        const dayStr = format(day, 'yyyy-MM-dd');
        const dayData = nationalityByDay[dayStr] || {};
        const values = Object.values(dayData);
        return values.length > 0 ? Math.max(...values) : 0;
      });

    } else {
      // السنة الحالية (افتراضي) - بيانات شهرية
      dateFilter.gte = new Date(new Date().getFullYear(), 0, 1);
      dateFilter.lte = new Date(new Date().getFullYear() + 1, 0, 1);
      const months = eachMonthOfInterval({ start: dateFilter.gte, end: dateFilter.lte });
      timeSeriesData.labels = months.map((month) => format(month, 'MMMM'));
      
      // جلب الطلبات مع معلومات المكتب (الجنسية)
      const orders = await prisma.neworder.findMany({
        where: {
          createdAt: dateFilter,
        },
        include: {
          HomeMaid: {
            include: {
              office: {
                select: {
                  Country: true,
                },
              },
            },
          },
        },
      });

      // تجميع البيانات حسب الجنسية والشهر
      const nationalityByMonth: { [key: string]: { [nationality: string]: number } } = {};
      months.forEach((month, i) => {
        const monthStr = format(month, 'MMMM');
        nationalityByMonth[monthStr] = {};
      });

      orders.forEach((order) => {
        if (order.HomeMaid?.office?.Country && order.createdAt) {
          const orderDate = order.createdAt instanceof Date ? order.createdAt : new Date(order.createdAt);
          const monthStr = format(orderDate, 'MMMM');
          const nationality = order.HomeMaid.office.Country;
          if (nationalityByMonth[monthStr]) {
            nationalityByMonth[monthStr][nationality] = (nationalityByMonth[monthStr][nationality] || 0) + 1;
          }
        }
      });

      // إحصائيات الجنسيات الإجمالية
      const nationalityCounts: { [key: string]: number } = {};
      orders.forEach((order) => {
        if (order.HomeMaid?.office?.Country) {
          const nationality = order.HomeMaid.office.Country;
          nationalityCounts[nationality] = (nationalityCounts[nationality] || 0) + 1;
        }
      });
      nationalityStats = Object.entries(nationalityCounts)
        .map(([nationality, count]) => ({ nationality, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10); // أعلى 10 جنسيات

      // الحصول على أعلى 5 جنسيات
      const topNationalities = nationalityStats.slice(0, 5).map(stat => stat.nationality);

      // حساب بيانات السلسلة الزمنية لكل جنسية من أعلى 5
      topNationalities.forEach((nationality) => {
        nationalityTimeSeries[nationality] = months.map((month) => {
          const monthStr = format(month, 'MMMM');
          const monthData = nationalityByMonth[monthStr] || {};
          return monthData[nationality] || 0;
        });
      });

      // حساب أعلى جنسية لكل شهر (للعرض القديم - اختياري)
      timeSeriesData.data = months.map((month) => {
        const monthStr = format(month, 'MMMM');
        const monthData = nationalityByMonth[monthStr] || {};
        const values = Object.values(monthData);
        return values.length > 0 ? Math.max(...values) : 0;
      });
    }

    res.status(200).json({
      timeSeriesData,
      nationalityTimeSeries, // بيانات السلسلة الزمنية لأعلى 5 جنسيات
      nationalityStats, // أعلى الجنسيات طلباً
    });
  } catch (error) {
    console.error('Error in nationality-trends API:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

