import { PrismaClient } from '@prisma/client';
import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../globalprisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { period, startDate, endDate } = req.body || {};

  try {
    // تحديد شرط الفلترة الزمنية
    const whereClause = {
      Reason: { not: null },
      ...(period === 'custom' && startDate && endDate
        ? {
            houseentrydate: {
              gte: new Date(startDate),
              lte: new Date(endDate),
            },
          }
        : {}),
    };

    // جلب البيانات مع العلاقات
    const housedWorkers = await prisma.housedworker.findMany({
      where: whereClause,
      include: {
        Order: {
          include: {
            office: {
              select: { Country: true },
            },
          },
        },
      },
    });

    // تجميع البيانات يدويًا
    const nationalityStats: Record<string, Record<string, number>> = {};
    const reasonStats: Record<string, number> = {};

    housedWorkers.forEach((worker) => {
      const reason = worker.Reason;
      const country = worker.Order?.office?.Country || 'غير معروف';

      // تجميع حسب السبب
      if (reason) {
        reasonStats[reason] = (reasonStats[reason] || 0) + 1;

        // تجميع حسب السبب والجنسية
        if (!nationalityStats[reason]) {
          nationalityStats[reason] = {};
        }
        nationalityStats[reason][country] = (nationalityStats[reason][country] || 0) + 1;
      }
    });

    // حساب العدد الإجمالي
    const total = housedWorkers.length;

    // تحويل nationalityStats إلى نسب مئوية
    const nationalityStatsWithPercentages = Object.keys(nationalityStats).reduce((acc, reason) => {
      const totalForReason = reasonStats[reason] || 1;
      acc[reason] = Object.keys(nationalityStats[reason]).reduce((countryAcc, country) => {
        const count = nationalityStats[reason][country];
        countryAcc[country] = {
          count,
          percentage: total > 0 ? Math.round((count / total) * 100) : 0,
        };
        return countryAcc;
      }, {} as Record<string, { count: number; percentage: number }>);
      return acc;
    }, {} as Record<string, Record<string, { count: number; percentage: number }>>);

    res.status(200).json({
      reasonStats: Object.keys(reasonStats).map((reason) => ({
        Reason: reason,
        _count: { id: reasonStats[reason] },
      })),
      nationalityStats: nationalityStatsWithPercentages,
      total,
    });
  } catch (error) {
    console.error('Error fetching housed worker data:', error);
    res.status(500).json({ error: 'Failed to fetch housed worker data', details: error.message });
  }
}