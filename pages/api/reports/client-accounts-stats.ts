import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { year } = req.query;
    const currentYear = year ? parseInt(year as string) : new Date().getFullYear();

    // إعداد أسماء الأشهر بالعربية
    const monthNames = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];

    // حساب البيانات لكل شهر
    const monthlyData = [];

    for (let month = 1; month <= 12; month++) {
      const startOfMonth = new Date(currentYear, month - 1, 1);
      const endOfMonth = new Date(currentYear, month, 0, 23, 59, 59, 999);

      // جلب بيانات ClientAccountStatement لهذا الشهر
      const statements = await prisma.clientAccountStatement.findMany({
        where: {
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth,
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

      // حساب عدد العملاء الفريدين في هذا الشهر
      const uniqueClients = new Set(statements.map(s => s.clientId));
      const clientsCount = uniqueClients.size;

      // حساب المجاميع
      const totalRevenue = statements.reduce((sum, statement) => sum + Number(statement.totalRevenue || 0), 0);
      const totalExpenses = statements.reduce((sum, statement) => sum + Number(statement.totalExpenses || 0), 0);
      const totalNetAmount = statements.reduce((sum, statement) => sum + Number(statement.netAmount || 0), 0);

      monthlyData.push({
        month: monthNames[month - 1],
        monthNumber: month,
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
      year: currentYear,
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

