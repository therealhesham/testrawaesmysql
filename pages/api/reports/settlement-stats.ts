import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
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
    const monthlyData = months.map((month, index) => {
      const monthStart = new Date(currentYear, index, 1);
      const monthEnd = new Date(currentYear, index + 1, 0, 23, 59, 59, 999);

      // تصفية العقود التي تم إنشاؤها في هذا الشهر
      const monthStatements = statements.filter(statement => {
        const statementDate = new Date(statement.createdAt);
        return statementDate >= monthStart && statementDate <= monthEnd;
      });

      // حساب قيمة العقود (totalRevenue) لهذا الشهر
      const contractValue = monthStatements.reduce((sum, statement) => sum + Number(statement.totalRevenue || 0), 0);

      // حساب المدفوعات والمصروفات من entries لهذا الشهر
      let totalPaid = 0;
      let totalExpenses = 0;

      // جمع من جميع entries في جميع العقود (حتى لو كان العقد من شهر آخر)
      statements.forEach(statement => {
        statement.entries.forEach(entry => {
          const entryDate = new Date(entry.date);
          if (entryDate >= monthStart && entryDate <= monthEnd) {
            totalPaid += Number(entry.credit || 0);
            totalExpenses += Number(entry.debit || 0);
          }
        });
      });

      // حساب الصافي
      const netAmount = totalPaid - totalExpenses;

      return {
        month: monthNames[index],
        monthNumber: index + 1,
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
      year: currentYear,
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

