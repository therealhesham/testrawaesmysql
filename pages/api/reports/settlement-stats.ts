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

    // إعداد أسماء الأشهر بالعربية
    const monthNames = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];

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
        const monthYear = `${day.getFullYear()}-${(day.getMonth() + 1).toString().padStart(2, '0')}`;
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
        // الشهر السابق
        targetMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      } else {
        // الشهر الحالي (افتراضي)
        targetMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      }
      dateFilter.gte = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1);
      dateFilter.lte = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0, 23, 59, 59, 999);
      periodsToProcess = [{
        month: targetMonth.getMonth() + 1,
        monthName: monthNames[targetMonth.getMonth()],
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
          monthName: monthNames[month.getMonth()],
          start,
          end,
        };
      });
    } else {
      // السنة الحالية (افتراضي)
      const currentYear = year ? parseInt(year as string) : new Date().getFullYear();
      dateFilter.gte = new Date(currentYear, 0, 1);
      dateFilter.lte = new Date(currentYear, 11, 31, 23, 59, 59, 999);
      
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

    // جلب جميع ClientAccountStatement مع entries
    const statements = await prisma.clientAccountStatement.findMany({
      include: {
        entries: {
          select: {
            date: true,
            debit: true,
            credit: true,
          }
        }
      },
    });

    // حساب البيانات الشهرية
    const monthlyData = periodsToProcess.map((periodData) => {
      // تصفية العقود التي تم إنشاؤها في هذه الفترة
      const periodStatements = statements.filter(statement => {
        const statementDate = new Date(statement.createdAt);
        return statementDate >= periodData.start && statementDate <= periodData.end;
      });

      // حساب قيمة العقود (totalRevenue) لهذه الفترة
      const contractValue = periodStatements.reduce((sum, statement) => sum + Number(statement.totalRevenue || 0), 0);

      // حساب المدفوعات والمصروفات من entries لهذه الفترة
      let totalPaid = 0;
      let totalExpenses = 0;

      // جمع من جميع entries في جميع العقود (حتى لو كان العقد من فترة أخرى)
      statements.forEach(statement => {
        statement.entries.forEach(entry => {
          const entryDate = new Date(entry.date);
          if (entryDate >= periodData.start && entryDate <= periodData.end) {
            totalPaid += Number(entry.credit || 0);
            totalExpenses += Number(entry.debit || 0);
          }
        });
      });

      // حساب الصافي
      const netAmount = totalPaid - totalExpenses;

      return {
        month: periodData.monthName,
        monthNumber: periodData.month,
        contractValue: contractValue,
        totalPaid: totalPaid,
        totalExpenses: totalExpenses,
        netAmount: netAmount,
      };
    });

    // حساب الإجماليات
    const totalContractValue = monthlyData.reduce((sum, month) => sum + month.contractValue, 0);
    const totalPaid = monthlyData.reduce((sum, month) => sum + month.totalPaid, 0);
    const totalExpenses = monthlyData.reduce((sum, month) => sum + month.totalExpenses, 0);
    const totalNet = monthlyData.reduce((sum, month) => sum + month.netAmount, 0);

    res.status(200).json({
      period: period || 'year',
      dateRange: dateFilter,
      year: periodsToProcess.length > 0 ? periodsToProcess[0].start.getFullYear() : new Date().getFullYear(),
      monthlyData,
      totals: {
        totalContractValue,
        totalPaid,
        totalExpenses,
        totalNet,
      },
    });
  } catch (error) {
    console.error('Error fetching settlement stats:', error);
    res.status(500).json({ error: 'فشل جلب إحصائيات التسوية المالية', details: (error as Error).message });
  } finally {
    await prisma.$disconnect();
  }
}

