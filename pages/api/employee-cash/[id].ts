import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import eventBus from 'lib/eventBus';
import { jwtDecode } from 'jwt-decode';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const {
        client,
        movementType,
        fromDate,
        toDate
      } = req.query;

      // Build where clause for filtering employee cash records
      const where: any = {
        employeeId: Number(id)
      };

      if (client && client !== 'all') {
        where.client = client;
      }

      if (fromDate || toDate) {
        where.date = {};
        if (fromDate) {
          where.date.gte = new Date(fromDate as string);
        }
        if (toDate) {
          where.date.lte = new Date(toDate as string);
        }
      }

      // Get employee info from Employee table
      const employeeInfo = await prisma.employee.findUnique({
        where: {
          id: Number(id)
        },
        select: {
          id: true,
          name: true,
          position: true,
          department: true
        }
      });

      // Get employee cash detail records
      const cashDetails = await prisma.employeeCashDetail.findMany({
        where,
        orderBy: {
          date: 'desc'
        }
      });

      // Get employee cash records (for settlements)
      const cashRecords = await prisma.employeeCash.findMany({
        where: {
          employeeId: Number(id),
          isTemporary: false // استبعاد السجلات المؤقتة
        },
        orderBy: {
          transactionDate: 'desc'
        }
      });

      // Calculate totals from both tables
      const totalDebitFromDetails = cashDetails.reduce((sum, record) => sum + Number(record.debit), 0);
      const totalCreditFromDetails = cashDetails.reduce((sum, record) => sum + Number(record.credit), 0);
      
      const totalReceivedFromCash = cashRecords.reduce((sum, record) => sum + Number(record.receivedAmount), 0);
      const totalExpensesFromCash = cashRecords.reduce((sum, record) => sum + Number(record.expenseAmount), 0);
      
      // Combined totals
      const totalDebit = totalDebitFromDetails + totalReceivedFromCash;
      const totalCredit = totalCreditFromDetails + totalExpensesFromCash;
      const totalBalance = totalDebit - totalCredit;

      // Transform cash details data
      const detailTransactions = cashDetails.map((record) => ({
        id: record.id,
        date: record.date.toLocaleDateString('ar-SA'),
        month: record.month || record.date.toLocaleDateString('ar-SA', { month: 'long' }),
        mainAccount: record.mainAccount || 'تسوية عهدة',
        subAccount: record.subAccount || 'تسوية عهدة',
        client: record.client || employeeInfo?.name || 'الموظف',
        debit: Number(record.debit),
        credit: Number(record.credit),
        balance: Number(record.balance),
        description: record.description || 'سداد رسوم توثيق',
        attachment: record.attachment || 'عرض',
        type: 'detail'
      }));

      // Transform cash records data
      const cashTransactions = cashRecords.map((record) => ({
        id: record.id,
        date: record.transactionDate.toLocaleDateString('ar-SA'),
        month: record.transactionDate.toLocaleDateString('ar-SA', { month: 'long' }),
        mainAccount: 'عهدة نقدية',
        subAccount: 'عهدة الموظف',
        client: employeeInfo?.name || 'الموظف',
        debit: Number(record.receivedAmount),
        credit: Number(record.expenseAmount),
        balance: Number(record.remainingBalance),
        description: record.description || 'عملية عهدة',
        attachment: record.attachment || 'عرض',
        type: 'cash'
      }));

      // Combine and sort all transactions by date
      const allTransactions = [...detailTransactions, ...cashTransactions].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      const employeeDetail = {
        id: Number(id),
        name: employeeInfo?.name || `الموظف ${id}`,
        position: employeeInfo?.position,
        department: employeeInfo?.department,
        totalDebit,
        totalCredit,
        totalBalance,
        transactions: allTransactions,
        settlements: {
          totalDetailsDebit: totalDebitFromDetails,
          totalDetailsCredit: totalCreditFromDetails,
          totalCashReceived: totalReceivedFromCash,
          totalCashExpenses: totalExpensesFromCash
        }
      };

      res.status(200).json(employeeDetail);

    } catch (error) {
      console.error('Error fetching employee detail:', error);
      res.status(500).json({ error: 'Failed to fetch employee detail' });
    } finally {
      await prisma.$disconnect();
    }
  } else if (req.method === 'POST') {
    try {
      const {
        transactionDate,
        client,
        mainAccount,
        subAccount,
        debit,
        credit,
        attachment
      } = req.body;

      // Basic validation
      if (!transactionDate) {
        return res.status(400).json({ error: 'التاريخ مطلوب' });
      }

      const debitAmount = Number(debit || 0);
      const creditAmount = Number(credit || 0);
      const balance = debitAmount - creditAmount;

      const newRecord = await prisma.employeeCashDetail.create({
        data: {
          employeeId: Number(id),
          date: new Date(transactionDate),
          month: new Date(transactionDate).toLocaleDateString('ar-SA', { month: 'long' }),
          mainAccount: mainAccount || '',
          subAccount: subAccount || '',
          client: client || '',
          debit: debitAmount,
          credit: creditAmount,
          balance: balance,
          attachment: typeof attachment === 'string' ? attachment : ''
        },
        include: {
          employee: {
            select: {
              id: true,
              name: true,
              position: true,
              department: true
            }
          }
        }
      });

      res.status(201).json({
        message: 'تم إضافة السجل بنجاح',
        record: newRecord
      });

    } catch (error) {
      console.error('Error creating employee cash detail:', error);
      res.status(500).json({ error: 'Failed to create employee cash detail' });
    } finally {
      await prisma.$disconnect();
    }
  } else if (req.method === 'PUT') {
    try {
      const {
        transactionDate,
        client,
        mainAccount,
        subAccount,
        debit,
        credit,
        attachment
      } = req.body;

      // Basic validation
      if (!transactionDate) {
        return res.status(400).json({ error: 'التاريخ مطلوب' });
      }

      const debitAmount = Number(debit || 0);
      const creditAmount = Number(credit || 0);
      const balance = debitAmount - creditAmount;
      const transactionId = Number(id);

      // First, check if the record exists in EmployeeCashDetail
      const detailRecord = await prisma.employeeCashDetail.findUnique({
        where: { id: transactionId }
      });

      if (detailRecord) {
        // Update EmployeeCashDetail record
        const updatedRecord = await prisma.employeeCashDetail.update({
          where: {
            id: transactionId
          },
          data: {
            date: new Date(transactionDate),
            month: new Date(transactionDate).toLocaleDateString('ar-SA', { month: 'long' }),
            mainAccount: mainAccount || '',
            subAccount: subAccount || '',
            client: client || '',
            debit: debitAmount,
            credit: creditAmount,
            balance: balance,
            attachment: typeof attachment === 'string' ? attachment : ''
          }
        });

        return res.status(200).json({
          message: 'تم تحديث السجل بنجاح',
          record: updatedRecord
        });
      }

      // If not found in EmployeeCashDetail, check EmployeeCash
      const cashRecord = await prisma.employeeCash.findUnique({
        where: { id: transactionId }
      });

      if (cashRecord) {
        // Update EmployeeCash record
        // For cash records, debit maps to receivedAmount and credit maps to expenseAmount
        const updatedRecord = await prisma.employeeCash.update({
          where: {
            id: transactionId
          },
          data: {
            transactionDate: new Date(transactionDate),
            receivedAmount: debitAmount,
            expenseAmount: creditAmount,
            remainingBalance: balance,
            description: client || cashRecord.description || '',
            attachment: typeof attachment === 'string' ? attachment : cashRecord.attachment || ''
          }
        });

        return res.status(200).json({
          message: 'تم تحديث السجل بنجاح',
          record: updatedRecord
        });
      }

      // If record not found in either table
      return res.status(404).json({ error: 'record to update not found' });

    } catch (error) {
      console.error('Error updating employee cash detail:', error);
      if (error instanceof Error && error.message.includes('Record to update not found')) {
        return res.status(404).json({ error: 'record to update not found' });
      }
      res.status(500).json({ error: 'Failed to update employee cash detail' });
    } finally {
      await prisma.$disconnect();
    }
  } else if (req.method === 'DELETE') {
    try {
      const transactionId = Number(id);

      // Get user info for logging
      const cookieHeader = req.headers.cookie;
      let userId: number | null = null;
      if (cookieHeader) {
        try {
          const cookies: { [key: string]: string } = {};
          cookieHeader.split(";").forEach((cookie) => {
            const [key, value] = cookie.trim().split("=");
            cookies[key] = decodeURIComponent(value);
          });
          if (cookies.authToken) {
            const token = jwtDecode(cookies.authToken) as any;
            userId = Number(token.id);
          }
        } catch (e) {
          // Ignore token errors
        }
      }

      // First, check if the record exists in EmployeeCashDetail
      const detailRecord = await prisma.employeeCashDetail.findUnique({
        where: { id: transactionId }
      });

      if (detailRecord) {
        // Delete from EmployeeCashDetail
        await prisma.employeeCashDetail.delete({
          where: {
            id: transactionId
          }
        });

        // تسجيل الحدث
        if (userId) {
          eventBus.emit('ACTION', {
            type: `حذف سجل عهدة موظف #${transactionId} - ${detailRecord.client || 'غير محدد'}`,
            actionType: 'delete',
            userId: userId,
          });
        }

        return res.status(200).json({ message: 'تم حذف السجل بنجاح' });
      }

      // If not found in EmployeeCashDetail, check EmployeeCash
      const cashRecord = await prisma.employeeCash.findUnique({
        where: { id: transactionId }
      });

      if (cashRecord) {
        // Delete from EmployeeCash
        await prisma.employeeCash.delete({
          where: {
            id: transactionId
          }
        });

        // تسجيل الحدث
        if (userId) {
          eventBus.emit('ACTION', {
            type: `حذف سجل عهدة موظف #${transactionId}`,
            actionType: 'delete',
            userId: userId,
          });
        }

        return res.status(200).json({ message: 'تم حذف السجل بنجاح' });
      }

      // If record not found in either table
      return res.status(404).json({ error: 'record to delete not found' });

    } catch (error) {
      console.error('Error deleting employee cash detail:', error);
      if (error instanceof Error && error.message.includes('Record to delete not found')) {
        return res.status(404).json({ error: 'record to delete not found' });
      }
      res.status(500).json({ error: 'Failed to delete employee cash detail' });
    } finally {
      await prisma.$disconnect();
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
