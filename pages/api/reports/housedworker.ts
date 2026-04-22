import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../globalprisma';

/** جنسية العاملة: خارجية من السجل، أو من مكتب الطلب، أو من حقل النسخة النصية */
function nationalityLabel(worker: {
  externalHomedmaid?: { nationality?: string | null } | null;
  Order?: {
    Nationalitycopy?: string | null;
    office?: { Country?: string | null } | null;
  } | null;
}): string {
  const ext = worker.externalHomedmaid?.nationality?.trim();
  if (ext) return ext;
  const officeCountry = worker.Order?.office?.Country?.trim();
  if (officeCountry) return officeCountry;
  const copy = worker.Order?.Nationalitycopy?.trim();
  if (copy) return copy;
  return 'غير معروف';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { period, startDate, endDate } = req.body || {};

  try {
    const whereClause = {
      /** مطابق لصفحة التسكين: من لم يغادر السكن بعد */
      deparatureHousingDate: null,
      ...(period === 'custom' && startDate && endDate
        ? {
            houseentrydate: {
              gte: new Date(startDate),
              lte: new Date(endDate),
            },
          }
        : {}),
    };

    const housedWorkers = await prisma.housedworker.findMany({
      where: whereClause,
      include: {
        Order: {
          select: {
            Nationalitycopy: true,
            office: {
              select: { Country: true },
            },
          },
        },
        externalHomedmaid: {
          select: { nationality: true },
        },
      },
    });

    const nationalityStats: Record<string, Record<string, number>> = {};
    const reasonStats: Record<string, number> = {};

    housedWorkers.forEach((worker) => {
      const reason = worker.Reason?.trim() || 'لم يحدد سبب';
      const country = nationalityLabel(worker);

      reasonStats[reason] = (reasonStats[reason] || 0) + 1;

      if (!nationalityStats[reason]) {
        nationalityStats[reason] = {};
      }
      nationalityStats[reason][country] = (nationalityStats[reason][country] || 0) + 1;
    });

    const total = housedWorkers.length;

    const nationalityStatsWithPercentages = Object.keys(nationalityStats).reduce((acc, reason) => {
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
