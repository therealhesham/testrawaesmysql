import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

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

      // Build where clause for filtering employee cash details
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

      // Get employee cash details
      const cashDetails = await prisma.employeeCashDetail.findMany({
        where,
        orderBy: {
          date: 'desc'
        }
      });

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

      // Calculate totals
      const totalDebit = cashDetails.reduce((sum, record) => sum + Number(record.debit), 0);
      const totalCredit = cashDetails.reduce((sum, record) => sum + Number(record.credit), 0);
      const totalBalance = totalDebit - totalCredit;

      // Transform data to match the expected format
      const transactions = cashDetails.map((record, index) => ({
        id: record.id,
        date: record.date.toLocaleDateString('ar-SA'),
        month: record.month || record.date.toLocaleDateString('ar-SA', { month: 'long' }),
        mainAccount: record.mainAccount || 'تسوية عهدة',
        subAccount: record.subAccount || 'تسوية عهدة',
        client: record.client || 'خالد إبراهيم',
        debit: Number(record.debit),
        credit: Number(record.credit),
        balance: Number(record.balance),
        description: record.description || 'سداد رسوم توثيق',
        attachment: record.attachment || 'عرض'
      }));

      const employeeDetail = {
        id: Number(id),
        name: employeeInfo?.name || `الموظف ${id}`,
        position: employeeInfo?.position,
        department: employeeInfo?.department,
        totalDebit,
        totalCredit,
        totalBalance,
        transactions
      };

      res.status(200).json(employeeDetail);

    } catch (error) {
      console.error('Error fetching employee detail:', error);
      res.status(500).json({ error: 'Failed to fetch employee detail' });
    }
  } else if (req.method === 'PUT') {
    try {
      const {
        mainAccount,
        subAccount,
        debit,
        credit,
        description,
        client
      } = req.body;

      // Basic validation
      if (!mainAccount || !subAccount) {
        return res.status(400).json({ error: 'الحساب الرئيسي والفرعي مطلوبان' });
      }

      const debitAmount = Number(debit || 0);
      const creditAmount = Number(credit || 0);
      const balance = debitAmount - creditAmount;

      const updatedRecord = await prisma.employeeCashDetail.update({
        where: {
          id: Number(id)
        },
        data: {
          mainAccount,
          subAccount,
          debit: debitAmount,
          credit: creditAmount,
          balance,
          description: description || '',
          client: client || '',
          updatedAt: new Date()
        }
      });

      res.status(200).json({ 
        message: 'تم تحديث السجل بنجاح', 
        record: updatedRecord 
      });

    } catch (error) {
      console.error('Error updating employee cash detail:', error);
      res.status(500).json({ error: 'Failed to update employee cash detail' });
    }
  } else if (req.method === 'DELETE') {
    try {
      await prisma.employeeCashDetail.delete({
        where: {
          id: Number(id)
        }
      });

      res.status(200).json({ message: 'تم حذف السجل بنجاح' });

    } catch (error) {
      console.error('Error deleting employee cash detail:', error);
      res.status(500).json({ error: 'Failed to delete employee cash detail' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
