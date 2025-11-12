import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { subDays, subMonths, eachMonthOfInterval, format } from 'date-fns';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { period, startDate, endDate, year, monthSelection } = req.method === 'POST' ? req.body : req.query;
    
    // تحديد نطاق التاريخ
    let dateFilter: { gte?: Date; lte?: Date } = {};
    let monthsToProcess: { month: number; monthName: string; start: Date; end: Date }[] = [];
    const now = new Date();

    if (period === 'week') {
      dateFilter.gte = subDays(now, 7);
      dateFilter.lte = now;
      // بيانات يومية للأسبوع
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const day = new Date(subDays(now, i));
        const start = new Date(day);
        start.setHours(0, 0, 0, 0);
        const end = new Date(day);
        end.setHours(23, 59, 59, 999);
        days.push({
          month: day.getMonth() + 1,
          monthName: format(day, 'd/M'),
          start,
          end,
        });
      }
      monthsToProcess = days;
    } else if (period === 'month') {
      let targetMonth: Date;
      if (monthSelection === 'previous') {
        targetMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      } else {
        targetMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      }
      dateFilter.gte = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1);
      dateFilter.lte = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0, 23, 59, 59, 999);
      monthsToProcess = [{
        month: targetMonth.getMonth() + 1,
        monthName: format(targetMonth, 'MMMM'),
        start: dateFilter.gte,
        end: dateFilter.lte,
      }];
    } else if (period === 'custom' && startDate && endDate) {
      dateFilter.gte = new Date(startDate as string);
      dateFilter.lte = new Date(endDate as string);
      const months = eachMonthOfInterval({ start: dateFilter.gte, end: dateFilter.lte });
      monthsToProcess = months.map((month, i) => {
        const start = i === 0 ? dateFilter.gte! : new Date(month.getFullYear(), month.getMonth(), 1);
        const end = i === months.length - 1 
          ? dateFilter.lte! 
          : new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59, 999);
        return {
          month: month.getMonth() + 1,
          monthName: format(month, 'MMMM'),
          start,
          end,
        };
      });
    } else {
      // السنة الحالية (افتراضي)
      const currentYear = year ? parseInt(year as string) : new Date().getFullYear();
      dateFilter.gte = new Date(currentYear, 0, 1);
      dateFilter.lte = new Date(currentYear, 11, 31, 23, 59, 59, 999);
      
      const monthNames = [
        'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
        'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
      ];
      
      monthsToProcess = monthNames.map((monthName, index) => {
        const month = index + 1;
        return {
          month,
          monthName,
          start: new Date(currentYear, month - 1, 1),
          end: new Date(currentYear, month, 0, 23, 59, 59, 999),
        };
      });
    }

    // جلب جميع المكاتب
    const offices = await prisma.offices.findMany({
      select: {
        id: true,
        office: true,
      },
    });

    // إحصائيات لكل مكتب خلال الفترات المحددة
    const officesStats = await Promise.all(
      offices.map(async (office) => {
        const monthlyData = [];

        // حساب البيانات لكل فترة
        for (const periodData of monthsToProcess) {
          // جلب السجلات المالية لهذه الفترة
          const records = await prisma.foreignOfficeFinancial.findMany({
            where: {
              officeId: office.id,
              date: {
                gte: periodData.start,
                lte: periodData.end,
              },
            },
            orderBy: {
              date: 'asc',
            },
          });

          // حساب المجاميع
          const totalCredit = records.reduce((sum, record) => sum + Number(record.credit), 0);
          const totalDebit = records.reduce((sum, record) => sum + Number(record.debit), 0);
          
          // الرصيد هو آخر رصيد في الفترة
          const lastRecord = records[records.length - 1];
          const balance = lastRecord ? Number(lastRecord.balance) : 0;

          monthlyData.push({
            month: periodData.month,
            monthName: periodData.monthName,
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

    // تجميع البيانات حسب الفترة لجميع المكاتب
    const aggregatedByMonth = monthsToProcess.map((periodData) => {
      const allOfficesData = officesStats.flatMap(office => 
        office.monthlyData.filter(data => data.month === periodData.month)
      );

      const totalCredit = allOfficesData.reduce((sum, data) => sum + data.credit, 0);
      const totalDebit = allOfficesData.reduce((sum, data) => sum + data.debit, 0);
      const avgBalance = allOfficesData.length > 0
        ? allOfficesData.reduce((sum, data) => sum + data.balance, 0) / allOfficesData.length
        : 0;

      return {
        month: periodData.monthName,
        credit: totalCredit,
        debit: totalDebit,
        balance: avgBalance,
      };
    });

    res.status(200).json({
      period: period || 'year',
      dateRange: dateFilter,
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

