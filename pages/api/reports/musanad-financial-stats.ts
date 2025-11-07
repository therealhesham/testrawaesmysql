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

    // جلب جميع السجلات المالية المساندة
    const records = await prisma.musanadFinancialRecord.findMany({
      select: {
        transferDate: true,
        revenue: true,
        expenses: true,
        netAmount: true,
      },
    });

    // حساب البيانات الشهرية
    const monthlyData = months.map((month, index) => {
      const monthStart = new Date(currentYear, index, 1);
      const monthEnd = new Date(currentYear, index + 1, 0, 23, 59, 59, 999);

      // تصفية السجلات لهذا الشهر (بناءً على transferDate)
      const monthRecords = records.filter(record => {
        const recordDate = new Date(record.transferDate);
        return recordDate >= monthStart && recordDate <= monthEnd;
      });

      // حساب المجاميع الشهرية
      const totalRevenue = monthRecords.reduce((sum, record) => sum + Number(record.revenue || 0), 0);
      const totalExpenses = monthRecords.reduce((sum, record) => sum + Number(record.expenses || 0), 0);
      const totalNet = monthRecords.reduce((sum, record) => sum + Number(record.netAmount || 0), 0);

      return {
        month: monthNames[index],
        monthNumber: index + 1,
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
      year: currentYear,
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

