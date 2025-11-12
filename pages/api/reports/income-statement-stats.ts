import { NextApiRequest, NextApiResponse } from 'next';
import prisma from 'lib/prisma';
import { subDays, eachMonthOfInterval, format } from 'date-fns';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { period, startDate, endDate, zakatRate = 2.5, year, monthSelection } = req.method === 'POST' ? req.body : req.query;
    
    // تحديد نطاق التاريخ
    let dateFilter: { gte?: Date; lte?: Date } = {};
    let periodsToProcess: { month: string; monthName: string; start: Date; end: Date }[] = [];
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
        const monthYear = `${day.getFullYear()}-${(day.getMonth() + 1).toString().padStart(2, '0')}`;
        days.push({
          month: monthYear,
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
      const monthYear = `${targetMonth.getFullYear()}-${(targetMonth.getMonth() + 1).toString().padStart(2, '0')}`;
      periodsToProcess = [{
        month: monthYear,
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
        const monthYear = `${month.getFullYear()}-${(month.getMonth() + 1).toString().padStart(2, '0')}`;
        return {
          month: monthYear,
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
        const monthYear = `${currentYear}-${month.toString().padStart(2, '0')}`;
        return {
          month: monthYear,
          monthName,
          start: new Date(currentYear, month - 1, 1),
          end: new Date(currentYear, month, 0, 23, 59, 59, 999),
        };
      });
    }

    // جلب جميع income statements مع الفئات
    const incomeStatements = await prisma.incomeStatement.findMany({
      include: {
        subCategory: {
          include: {
            mainCategory: true
          }
        }
      },
      orderBy: { date: 'desc' }
    });

    // جلب جميع main categories مع subcategories
    const mainCategories = await prisma.mainCategory.findMany({
      include: {
        subs: {
          include: {
            incomeStatement: true
          }
        }
      }
    });

    // معالجة البيانات الشهرية
    const processedMainCategories = mainCategories.map(mainCat => {
      const processedSubs = mainCat.subs.map(subCat => {
        const values: Record<string, number> = {};
        periodsToProcess.forEach(period => {
          values[period.month] = 0;
        });

        subCat.incomeStatement.forEach(statement => {
          const statementDate = new Date(statement.date);
          // التحقق من أن التاريخ ضمن الفترة المحددة
          if (dateFilter.gte && statementDate < dateFilter.gte) return;
          if (dateFilter.lte && statementDate > dateFilter.lte) return;
          
          const monthYear = `${statementDate.getFullYear()}-${(statementDate.getMonth() + 1)
            .toString()
            .padStart(2, '0')}`;
          const amount = Number(statement.amount);
          const mathProcess = mainCat.mathProcess || 'add';

          const processedAmount = mathProcess === 'add' ? amount : -amount;

          if (values[monthYear] !== undefined) {
            values[monthYear] += processedAmount;
          }
        });

        const total = Object.values(values).reduce((sum, value) => sum + value, 0);

        return {
          id: subCat.id,
          name: subCat.name,
          mainCategory_id: subCat.mainCategory_id,
          values,
          total
        };
      });

      return {
        id: mainCat.id,
        name: mainCat.name,
        mathProcess: mainCat.mathProcess,
        subCategories: processedSubs
      };
    });

    // جلب بيانات العقود أولاً
    const contractsData = await prisma.clientAccountStatement.findMany({
      select: {
        createdAt: true,
        totalRevenue: true
      }
    });

    // معالجة العقود حسب الشهر
    const contractsByMonth: Record<string, { count: number; revenue: number }> = {};
    periodsToProcess.forEach(period => {
      contractsByMonth[period.month] = { count: 0, revenue: 0 };
    });

    contractsData.forEach(contract => {
      const contractDate = new Date(contract.createdAt);
      // التحقق من أن التاريخ ضمن الفترة المحددة
      if (dateFilter.gte && contractDate < dateFilter.gte) return;
      if (dateFilter.lte && contractDate > dateFilter.lte) return;
      
      const monthYear = `${contractDate.getFullYear()}-${(contractDate.getMonth() + 1)
        .toString()
        .padStart(2, '0')}`;

      if (contractsByMonth[monthYear] !== undefined) {
        contractsByMonth[monthYear].count += 1;
        contractsByMonth[monthYear].revenue += Number(contract.totalRevenue || 0);
      }
    });

    // حساب البيانات الشهرية
    const monthlyData = periodsToProcess.map((periodData, index) => {
      // حساب الإيرادات الشهرية من income statements
      const monthlyRevenuesFromStatements = processedMainCategories
        .filter(cat => cat.mathProcess === 'add')
        .reduce(
          (sum, cat) =>
            sum + cat.subCategories.reduce((subSum, sub) => subSum + (sub.values[periodData.month] || 0), 0),
          0
        );

      // إضافة إيرادات العقود إلى الإيرادات الشهرية
      const monthlyRevenuesFromContracts = contractsByMonth[periodData.month]?.revenue || 0;
      const totalMonthlyRevenues = monthlyRevenuesFromStatements + monthlyRevenuesFromContracts;

      // حساب المصروفات الشهرية
      const monthlyExpenses = processedMainCategories
        .filter(cat => cat.mathProcess === 'subtract')
        .reduce(
          (sum, cat) =>
            sum + cat.subCategories.reduce((subSum, sub) => subSum + (sub.values[periodData.month] || 0), 0),
          0
        );

      // حساب صافي الربح قبل الزكاة
      const netProfitBeforeZakat = totalMonthlyRevenues + monthlyExpenses; // expenses سالبة بالفعل

      // حساب الزكاة
      const zakatAmount = Math.max(0, netProfitBeforeZakat * (Number(zakatRate) / 100));

      // حساب صافي الربح بعد الزكاة
      const netProfitAfterZakat = netProfitBeforeZakat - zakatAmount;

      return {
        month: periodData.monthName,
        monthNumber: index + 1,
        totalRevenues: totalMonthlyRevenues, // إجمالي الإيرادات (من income statements + العقود)
        totalExpenses: Math.abs(monthlyExpenses), // تحويل إلى موجب للعرض
        netProfitAfterZakat: netProfitAfterZakat,
        contractsCount: contractsByMonth[periodData.month]?.count || 0,
      };
    });

    // حساب الإجماليات
    const totalContracts = Object.values(contractsByMonth).reduce((sum, data) => sum + data.count, 0);
    const totalRevenues = monthlyData.reduce((sum, month) => sum + month.totalRevenues, 0);
    const totalExpenses = monthlyData.reduce((sum, month) => sum + month.totalExpenses, 0);
    const totalNetProfit = monthlyData.reduce((sum, month) => sum + month.netProfitAfterZakat, 0);

    res.status(200).json({
      period: period || 'year',
      dateRange: dateFilter,
      monthlyData,
      totals: {
        contractsCount: totalContracts,
        totalRevenues,
        totalExpenses,
        netProfitAfterZakat: totalNetProfit,
      },
    });
  } catch (error) {
    console.error('Error fetching income statement stats:', error);
    res.status(500).json({ error: 'فشل جلب إحصائيات قائمة الدخل', details: (error as Error).message });
  }
}

