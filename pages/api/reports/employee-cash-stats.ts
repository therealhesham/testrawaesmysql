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

      // جلب بيانات EmployeeCash (عهدة نقدية)
      const cashRecords = await prisma.employeeCash.findMany({
        where: {
          transactionDate: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      });

      // جلب بيانات EmployeeCashDetail (تفاصيل)
      const detailRecords = await prisma.employeeCashDetail.findMany({
        where: {
          date: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      });

      // حساب إجمالي المدين (من EmployeeCash: receivedAmount + من EmployeeCashDetail: debit)
      const totalDebitFromCash = cashRecords.reduce((sum, record) => sum + Number(record.receivedAmount || 0), 0);
      const totalDebitFromDetails = detailRecords.reduce((sum, record) => sum + Number(record.debit || 0), 0);
      const totalDebit = totalDebitFromCash + totalDebitFromDetails;

      // حساب إجمالي الدائن (من EmployeeCash: expenseAmount + من EmployeeCashDetail: credit)
      const totalCreditFromCash = cashRecords.reduce((sum, record) => sum + Number(record.expenseAmount || 0), 0);
      const totalCreditFromDetails = detailRecords.reduce((sum, record) => sum + Number(record.credit || 0), 0);
      const totalCredit = totalCreditFromCash + totalCreditFromDetails;

      // حساب إجمالي الرصيد (من EmployeeCash: remainingBalance + من EmployeeCashDetail: balance)
      // أو يمكن حسابه كـ totalDebit - totalCredit
      const totalBalanceFromCash = cashRecords.reduce((sum, record) => sum + Number(record.remainingBalance || 0), 0);
      const totalBalanceFromDetails = detailRecords.reduce((sum, record) => sum + Number(record.balance || 0), 0);
      const totalBalance = totalBalanceFromCash + totalBalanceFromDetails;

      monthlyData.push({
        month: monthNames[month - 1],
        monthNumber: month,
        debit: totalDebit,
        credit: totalCredit,
        balance: totalBalance,
      });
    }

    // حساب الإجماليات
    const totalDebit = monthlyData.reduce((sum, month) => sum + month.debit, 0);
    const totalCredit = monthlyData.reduce((sum, month) => sum + month.credit, 0);
    const totalBalance = monthlyData.reduce((sum, month) => sum + month.balance, 0);

    res.status(200).json({
      year: currentYear,
      monthlyData,
      summary: {
        totalDebit,
        totalCredit,
        totalBalance,
      },
    });
  } catch (error) {
    console.error('Error fetching employee cash stats:', error);
    res.status(500).json({ error: 'فشل جلب إحصائيات العهد', details: (error as Error).message });
  } finally {
    await prisma.$disconnect();
  }
}

