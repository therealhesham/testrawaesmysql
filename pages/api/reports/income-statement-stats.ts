import { NextApiRequest, NextApiResponse } from 'next';
import prisma from 'lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { zakatRate = 2.5 } = req.query;

    const currentYear = new Date().getFullYear();
    
    // إعداد أسماء الأشهر بالعربية
    const monthNames = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];

    // جميع أشهر السنة الحالية (12 شهر)
    const months = Array.from({ length: 12 }, (_, i) => {
      return `${currentYear}-${(i + 1).toString().padStart(2, '0')}`;
    });

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
        months.forEach(month => {
          values[month] = 0;
        });

        subCat.incomeStatement.forEach(statement => {
          const statementDate = new Date(statement.date);
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
    months.forEach(month => {
      contractsByMonth[month] = { count: 0, revenue: 0 };
    });

    contractsData.forEach(contract => {
      const contractDate = new Date(contract.createdAt);
      const monthYear = `${contractDate.getFullYear()}-${(contractDate.getMonth() + 1)
        .toString()
        .padStart(2, '0')}`;

      if (contractsByMonth[monthYear] !== undefined) {
        contractsByMonth[monthYear].count += 1;
        contractsByMonth[monthYear].revenue += Number(contract.totalRevenue || 0);
      }
    });

    // حساب البيانات الشهرية
    const monthlyData = months.map((month, index) => {
      // حساب الإيرادات الشهرية من income statements
      const monthlyRevenuesFromStatements = processedMainCategories
        .filter(cat => cat.mathProcess === 'add')
        .reduce(
          (sum, cat) =>
            sum + cat.subCategories.reduce((subSum, sub) => subSum + (sub.values[month] || 0), 0),
          0
        );

      // إضافة إيرادات العقود إلى الإيرادات الشهرية
      const monthlyRevenuesFromContracts = contractsByMonth[month]?.revenue || 0;
      const totalMonthlyRevenues = monthlyRevenuesFromStatements + monthlyRevenuesFromContracts;

      // حساب المصروفات الشهرية
      const monthlyExpenses = processedMainCategories
        .filter(cat => cat.mathProcess === 'subtract')
        .reduce(
          (sum, cat) =>
            sum + cat.subCategories.reduce((subSum, sub) => subSum + (sub.values[month] || 0), 0),
          0
        );

      // حساب صافي الربح قبل الزكاة
      const netProfitBeforeZakat = totalMonthlyRevenues + monthlyExpenses; // expenses سالبة بالفعل

      // حساب الزكاة
      const zakatAmount = Math.max(0, netProfitBeforeZakat * (Number(zakatRate) / 100));

      // حساب صافي الربح بعد الزكاة
      const netProfitAfterZakat = netProfitBeforeZakat - zakatAmount;

      return {
        month: monthNames[index],
        monthNumber: index + 1,
        totalRevenues: totalMonthlyRevenues, // إجمالي الإيرادات (من income statements + العقود)
        totalExpenses: Math.abs(monthlyExpenses), // تحويل إلى موجب للعرض
        netProfitAfterZakat: netProfitAfterZakat,
        contractsCount: contractsByMonth[month]?.count || 0,
      };
    });

    // حساب الإجماليات
    const totalContracts = Object.values(contractsByMonth).reduce((sum, data) => sum + data.count, 0);
    const totalRevenues = monthlyData.reduce((sum, month) => sum + month.totalRevenues, 0);
    const totalExpenses = monthlyData.reduce((sum, month) => sum + month.totalExpenses, 0);
    const totalNetProfit = monthlyData.reduce((sum, month) => sum + month.netProfitAfterZakat, 0);

    res.status(200).json({
      year: currentYear,
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

