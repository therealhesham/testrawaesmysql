import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { subDays, eachMonthOfInterval, format } from 'date-fns';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { period, startDate, endDate, year, monthSelection } = req.method === 'POST' ? req.body : req.query;
    
    // تحديد نطاق التاريخ
    let dateFilter: { gte?: Date; lte?: Date } = {};
    let periodsToProcess: { month: number; monthName: string; start: Date; end: Date }[] = [];
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
      periodsToProcess = days;
    } else if (period === 'month') {
      let targetMonth: Date;
      if (monthSelection === 'previous') {
        targetMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      } else {
        targetMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      }
      dateFilter.gte = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1);
      dateFilter.lte = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0, 23, 59, 59, 999);
      periodsToProcess = [{
        month: targetMonth.getMonth() + 1,
        monthName: format(targetMonth, 'MMMM'),
        start: dateFilter.gte,
        end: dateFilter.lte,
      }];
    } else if (period === 'custom' && startDate && endDate) {
      dateFilter.gte = new Date(startDate as string);
      dateFilter.lte = new Date(endDate as string);
      const months = eachMonthOfInterval({ start: dateFilter.gte, end: dateFilter.lte });
      periodsToProcess = months.map((month, i) => {
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
      
      periodsToProcess = monthNames.map((monthName, index) => {
        const month = index + 1;
        return {
          month,
          monthName,
          start: new Date(currentYear, month - 1, 1),
          end: new Date(currentYear, month, 0, 23, 59, 59, 999),
        };
      });
    }

    // جلب جميع السجلات المالية المساندة
    const records = await prisma.musanadFinancialRecord.findMany({
      where: {
        transferDate: dateFilter,
      },
      select: {
        transferDate: true,
        revenue: true,
        expenses: true,
        netAmount: true,
      },
    });

    // حساب البيانات الشهرية
    const monthlyData = periodsToProcess.map((periodData, index) => {
      // تصفية السجلات لهذه الفترة (بناءً على transferDate)
      const periodRecords = records.filter(record => {
        const recordDate = new Date(record.transferDate);
        return recordDate >= periodData.start && recordDate <= periodData.end;
      });

      // حساب المجاميع الشهرية
      const totalRevenue = periodRecords.reduce((sum, record) => sum + Number(record.revenue || 0), 0);
      const totalExpenses = periodRecords.reduce((sum, record) => sum + Number(record.expenses || 0), 0);
      const totalNet = periodRecords.reduce((sum, record) => sum + Number(record.netAmount || 0), 0);

      return {
        month: periodData.monthName,
        monthNumber: periodData.month,
        totalRevenues: totalRevenue,
        totalExpenses: totalExpenses,
        totalNet: totalNet,
      };
    });

    // حساب الإجماليات
    const totalRevenues = monthlyData.reduce((sum, month) => sum + month.totalRevenues, 0);
    const totalExpenses = monthlyData.reduce((sum, month) => sum + month.totalExpenses, 0);
    const totalNet = monthlyData.reduce((sum, month) => sum + month.totalNet, 0);

    res.status(200).json({
      period: period || 'year',
      dateRange: dateFilter,
      monthlyData,
      totals: {
        totalRevenues,
        totalExpenses,
        totalNet,
      },
    });
  } catch (error) {
    console.error('Error fetching musanad financial stats:', error);
    res.status(500).json({ error: 'فشل جلب إحصائيات التقرير المالي المساند', details: (error as Error).message });
  } finally {
    await prisma.$disconnect();
  }
}

