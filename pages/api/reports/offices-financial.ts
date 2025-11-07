import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { year } = req.query;
    const currentYear = year ? parseInt(year as string) : new Date().getFullYear();

    // جلب جميع المكاتب
    const offices = await prisma.offices.findMany({
      select: {
        id: true,
        office: true,
      },
    });

    // إحصائيات لكل مكتب خلال شهور السنة
    const officesStats = await Promise.all(
      offices.map(async (office) => {
        const monthlyData = [];

        // حساب البيانات لكل شهر
        for (let month = 1; month <= 12; month++) {
          const startOfMonth = new Date(currentYear, month - 1, 1);
          const endOfMonth = new Date(currentYear, month, 0, 23, 59, 59, 999);

          // جلب السجلات المالية لهذا الشهر
          const records = await prisma.foreignOfficeFinancial.findMany({
            where: {
              officeId: office.id,
              date: {
                gte: startOfMonth,
                lte: endOfMonth,
              },
            },
          });

          // حساب المجاميع
          const totalCredit = records.reduce((sum, record) => sum + Number(record.credit), 0);
          const totalDebit = records.reduce((sum, record) => sum + Number(record.debit), 0);
          
          // الرصيد هو آخر رصيد في الشهر
          const lastRecord = records[records.length - 1];
          const balance = lastRecord ? Number(lastRecord.balance) : 0;

          monthlyData.push({
            month,
            credit: totalCredit,
            debit: totalDebit,
            balance: balance,
          });
        }

        return {
          officeId: office.id,
          officeName: office.office,
          monthlyData,
        };
      })
    );

    // إعداد البيانات للرسم البياني
    const monthNames = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];

    // تجميع البيانات حسب الشهر لجميع المكاتب
    const aggregatedByMonth = monthNames.map((monthName, index) => {
      const month = index + 1;
      const allOfficesData = officesStats.flatMap(office => 
        office.monthlyData.filter(data => data.month === month)
      );

      const totalCredit = allOfficesData.reduce((sum, data) => sum + data.credit, 0);
      const totalDebit = allOfficesData.reduce((sum, data) => sum + data.debit, 0);
      const avgBalance = allOfficesData.length > 0
        ? allOfficesData.reduce((sum, data) => sum + data.balance, 0) / allOfficesData.length
        : 0;

      return {
        month: monthName,
        credit: totalCredit,
        debit: totalDebit,
        balance: avgBalance,
      };
    });

    res.status(200).json({
      year: currentYear,
      offices: officesStats,
      aggregatedByMonth,
    });
  } catch (error) {
    console.error('Error fetching offices financial stats:', error);
    res.status(500).json({ error: 'فشل جلب إحصائيات المكاتب المالية', details: (error as Error).message });
  } finally {
    await prisma.$disconnect();
  }
}

