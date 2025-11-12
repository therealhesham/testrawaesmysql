import prisma from "lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";
import { subDays, subMonths } from "date-fns";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // استخراج معايير البحث
    const { period, startDate, endDate, monthSelection } = req.method === 'POST' ? req.body : req.query;

    // تحديد نطاق زمني
    let dateFilter: { gte?: Date; lte?: Date } = {};

    if (period === 'week') {
      dateFilter.gte = subDays(new Date(), 7);
      dateFilter.lte = new Date();
    } else if (period === 'month') {
      let targetMonth: Date;
      if (monthSelection === 'previous') {
        targetMonth = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
      } else {
        targetMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      }
      dateFilter.gte = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1);
      dateFilter.lte = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (period === 'custom' && startDate && endDate) {
      dateFilter.gte = new Date(startDate as string);
      dateFilter.lte = new Date(endDate as string);
    } else {
      // السنة الحالية (افتراضي)
      dateFilter.gte = new Date(new Date().getFullYear(), 0, 1);
      dateFilter.lte = new Date(new Date().getFullYear() + 1, 0, 1);
    }

    // جلب جميع المكاتب
    const offices = await prisma.offices.findMany({
      select: {
        office: true,
      },
    });

    // جلب عدد الطلبات (العاملات المحجوزة) لكل مكتب خلال الفترة الزمنية
    const bookedEmployeesByOffice = await Promise.all(
      offices.map(async (office) => {
        // جلب عدد الطلبات المرتبطة بهذا المكتب خلال الفترة الزمنية
        // neworder -> HomeMaid -> officeName
        const count = await prisma.neworder.count({
          where: {
            createdAt: dateFilter,
            HomeMaid: {
              officeName: office.office,
            },
          },
        });

        return {
          office: office.office || 'غير محدد',
          count: count,
        };
      })
    );

    // ترتيب النتائج حسب العدد (من الأكبر للأصغر)
    bookedEmployeesByOffice.sort((a, b) => b.count - a.count);

    res.status(200).json(bookedEmployeesByOffice);
  } catch (error) {
    console.error('Error in booked-employees-by-office API:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

