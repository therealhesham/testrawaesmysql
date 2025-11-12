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

    // حساب البيانات لكل فترة
    const monthlyData = [];

    for (const periodData of periodsToProcess) {

      // جلب بيانات ClientAccountStatement لهذه الفترة
      const statements = await prisma.clientAccountStatement.findMany({
        where: {
          createdAt: {
            gte: periodData.start,
            lte: periodData.end,
          },
        },
        select: {
          id: true,
          clientId: true,
          totalRevenue: true,
          totalExpenses: true,
          netAmount: true,
        },
      });

      // حساب عدد العملاء الفريدين في هذه الفترة
      const uniqueClients = new Set(statements.map(s => s.clientId));
      const clientsCount = uniqueClients.size;

      // حساب المجاميع
      const totalRevenue = statements.reduce((sum, statement) => sum + Number(statement.totalRevenue || 0), 0);
      const totalExpenses = statements.reduce((sum, statement) => sum + Number(statement.totalExpenses || 0), 0);
      const totalNetAmount = statements.reduce((sum, statement) => sum + Number(statement.netAmount || 0), 0);

      monthlyData.push({
        month: periodData.monthName,
        monthNumber: periodData.month,
        clientsCount,
        totalRevenue,
        totalExpenses,
        netAmount: totalNetAmount,
      });
    }

    // حساب الإجماليات
    const totalClients = monthlyData.reduce((sum, month) => sum + month.clientsCount, 0);
    const totalRevenue = monthlyData.reduce((sum, month) => sum + month.totalRevenue, 0);
    const totalExpenses = monthlyData.reduce((sum, month) => sum + month.totalExpenses, 0);
    const totalNetAmount = monthlyData.reduce((sum, month) => sum + month.netAmount, 0);

    res.status(200).json({
      period: period || 'year',
      dateRange: dateFilter,
      monthlyData,
      summary: {
        totalClients,
        totalRevenue,
        totalExpenses,
        totalNetAmount,
      },
    });
  } catch (error) {
    console.error('Error fetching client accounts stats:', error);
    res.status(500).json({ error: 'فشل جلب إحصائيات كشف حساب العملاء', details: (error as Error).message });
  } finally {
    await prisma.$disconnect();
  }
}

