import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import eventBus from 'lib/eventBus';
import { jwtDecode } from 'jwt-decode';
import { logAccountingActionFromRequest } from 'lib/accountingLogger';

const prisma = new PrismaClient();

const getUserIdFromCookie = (req: NextApiRequest): number | null => {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;
  try {
    const cookies: { [key: string]: string } = {};
    cookieHeader.split(";").forEach((cookie) => {
      const [key, value] = cookie.trim().split("=");
      cookies[key] = decodeURIComponent(value);
    });
    if (cookies.authToken) {
      const token = jwtDecode(cookies.authToken) as any;
      return Number(token.id) || null;
    }
  } catch {
    // Ignore token decode errors
  }
  return null;
};

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
      const where: any = {};
      if (id !== 'all') {
        where.employeeId = Number(id);
      }

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
      let employeeInfo = null;
      if (id !== 'all') {
        employeeInfo = await prisma.employee.findUnique({
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
      }

      // Get employee cash detail records
      const cashDetails = await prisma.employeeCashDetail.findMany({
        where,
        orderBy: {
          date: 'desc'
        }
      });

      // Get employee cash records (for settlements)
      const cashWhere: any = { isTemporary: false };
      if (id !== 'all') {
        cashWhere.employeeId = Number(id);
      }
      
      const cashRecords = await prisma.employeeCash.findMany({
        where: cashWhere,
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
        sortDate: new Date(record.date).getTime(),
        date: record.date.toLocaleDateString('en-GB'),
        month: record.month || record.date.toLocaleDateString('ar-SA', { month: 'long' }),
        mainAccount: record.mainAccount,
        subAccount: record.subAccount,
        client: record.client || employeeInfo?.name,
        debit: Number(record.debit),
        credit: Number(record.credit),
        balance: Number(record.balance),
        description: record.description,
        attachment: record.attachment || 'عرض',
        createdAt: new Date(record.createdAt).getTime(),
        type: 'detail' as const
      }));

      // Transform cash records data
      const cashTransactions = cashRecords.map((record) => ({
        id: record.id,
        sortDate: new Date(record.transactionDate).getTime(),
        date: record.transactionDate.toLocaleDateString('en-GB'),
        month: record.transactionDate.toLocaleDateString('ar-SA', { month: 'long' }),
        mainAccount: 'عهدة نقدية',
        subAccount: 'عهدة الموظف',
        client: employeeInfo?.name || 'الموظف',
        debit: Number(record.receivedAmount),
        credit: Number(record.expenseAmount),
        balance: Number(record.remainingBalance),
        description: record.description || 'عملية عهدة',
        attachment: record.attachment || 'عرض',
        createdAt: new Date(record.createdAt).getTime(),
        type: 'cash' as const
      }));

      const allTransactionsRaw = [...detailTransactions, ...cashTransactions].sort(
        (a, b) => a.sortDate - b.sortDate || a.createdAt - b.createdAt
      );

      // Calculate running balance globally first
      let currentBalance = 0;
      const allTransactionsWithBalance = allTransactionsRaw.map((t) => {
        currentBalance = currentBalance + t.debit - t.credit;
        return {
          id: t.id,
          date: t.date,
          month: t.month,
          mainAccount: t.mainAccount,
          subAccount: t.subAccount,
          client: t.client,
          debit: t.debit,
          credit: t.credit,
          balance: currentBalance,
          description: t.description,
          attachment: t.attachment,
          type: t.type,
          sortTimestamp: t.createdAt
        };
      });

      // Filter by feedStart and feedEnd if provided
      const { feedStart, feedEnd } = req.query;
      let filteredTransactions = allTransactionsWithBalance;
      
      if (feedStart) {
        const startTimestamp = Number(feedStart);
        const endTimestamp = feedEnd === 'latest' ? Infinity : Number(feedEnd);
        
        filteredTransactions = allTransactionsWithBalance.filter(t => 
          t.sortTimestamp >= startTimestamp && t.sortTimestamp < endTimestamp
        );
      }

      const allTransactions = filteredTransactions;

      const employeeDetail = {
        id: id === 'all' ? 'all' : Number(id),
        name: id === 'all' ? 'جميع الموظفين' : (employeeInfo?.name || `الموظف ${id}`),
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
        attachment,
        description
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
          description: typeof description === 'string' ? description : '',
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

      const empName = newRecord.employee?.name || `موظف #${id}`;
      await logAccountingActionFromRequest(req, {
        action: `إضافة حركة تفاصيل عهدة - الموظف: ${empName}`,
        actionType: 'add_employee_cash_detail',
        actionStatus: 'success',
        actionAmount: debitAmount || creditAmount,
        actionNotes: `إضافة حركة عهدة جديدة للموظف (${empName}) - العميل: ${client || '—'} - البيان: "${description || ''}" - مدين: ${debitAmount}، دائن: ${creditAmount}`,
      });

      const userId = getUserIdFromCookie(req);
      if (userId) {
        eventBus.emit('ACTION', {
          type: `إضافة حركة عهدة للموظف ${empName}`,
          actionType: 'create',
          pageRoute: '/admin/employee_cash',
          userId: userId,
        });
      }

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
        attachment,
        description,
        type
      } = req.body;

      // Basic validation
      if (!transactionDate) {
        return res.status(400).json({ error: 'التاريخ مطلوب' });
      }

      const debitAmount = Number(debit || 0);
      const creditAmount = Number(credit || 0);
      const balance = debitAmount - creditAmount;
      const transactionId = Number(id);
      const targetType = type || (req.query.type as string);
      const userId = getUserIdFromCookie(req);

      // If explicitly marked as 'cash' record
      if (targetType === 'cash') {
        const cashRecord = await prisma.employeeCash.findUnique({
          where: { id: transactionId },
          include: {
            employee: { select: { id: true, name: true } }
          }
        });

        if (!cashRecord) {
          return res.status(404).json({ error: 'سجل العهدة النقدية غير موجود' });
        }

        const oldDesc = cashRecord.description || '';
        const newDesc = typeof description === 'string' ? description : oldDesc;

        const updatedRecord = await prisma.employeeCash.update({
          where: { id: transactionId },
          data: {
            transactionDate: new Date(transactionDate),
            receivedAmount: debitAmount,
            expenseAmount: creditAmount,
            remainingBalance: balance,
            description: newDesc,
            attachment: typeof attachment === 'string' ? attachment : (cashRecord.attachment || '')
          },
          include: {
            employee: { select: { id: true, name: true } }
          }
        });

        const empName = updatedRecord.employee?.name || cashRecord.employee?.name || 'الموظف';
        await logAccountingActionFromRequest(req, {
          action: `تعديل سجل عهدة موظف - الموظف: ${empName}`,
          actionType: 'update_employee_cash',
          actionStatus: 'success',
          actionAmount: debitAmount || creditAmount,
          actionNotes: `تعديل عهدة نقدية #${transactionId} للموظف (${empName}) - البيان السابق: "${oldDesc}" -> البيان الجديد: "${newDesc}" - المبلغ المستلم (مدين): ${debitAmount}، المصروف (دائن): ${creditAmount}`,
        });

        if (userId) {
          eventBus.emit('ACTION', {
            type: `تعديل سجل عهدة نقدية #${transactionId} - ${empName}`,
            actionType: 'update',
            pageRoute: '/admin/employee_cash',
            userId: userId,
          });
        }

        return res.status(200).json({
          message: 'تم تحديث السجل بنجاح',
          record: updatedRecord
        });
      }

      // If explicitly marked as 'detail' record
      if (targetType === 'detail') {
        const detailRecord = await prisma.employeeCashDetail.findUnique({
          where: { id: transactionId },
          include: {
            employee: { select: { id: true, name: true } }
          }
        });

        if (!detailRecord) {
          return res.status(404).json({ error: 'سجل تفاصيل العهدة غير موجود' });
        }

        const oldDesc = detailRecord.description || '';
        const newDesc = typeof description === 'string' ? description : oldDesc;

        const updatedRecord = await prisma.employeeCashDetail.update({
          where: { id: transactionId },
          data: {
            date: new Date(transactionDate),
            month: new Date(transactionDate).toLocaleDateString('ar-SA', { month: 'long' }),
            mainAccount: mainAccount || '',
            subAccount: subAccount || '',
            client: client || '',
            debit: debitAmount,
            credit: creditAmount,
            balance: balance,
            description: newDesc,
            attachment: typeof attachment === 'string' ? attachment : ''
          },
          include: {
            employee: { select: { id: true, name: true } }
          }
        });

        const empName = updatedRecord.employee?.name || detailRecord.employee?.name || 'الموظف';
        await logAccountingActionFromRequest(req, {
          action: `تعديل حركة تفاصيل عهدة - الموظف: ${empName}`,
          actionType: 'update_employee_cash_detail',
          actionStatus: 'success',
          actionAmount: debitAmount || creditAmount,
          actionNotes: `تعديل حركة عهدة #${transactionId} للموظف (${empName}) - العميل: ${client || '—'} - البيان السابق: "${oldDesc}" -> البيان الجديد: "${newDesc}" - مدين: ${debitAmount}، دائن: ${creditAmount}`,
        });

        if (userId) {
          eventBus.emit('ACTION', {
            type: `تعديل حركة تفاصيل عهدة #${transactionId} - ${empName}`,
            actionType: 'update',
            pageRoute: '/admin/employee_cash',
            userId: userId,
          });
        }

        return res.status(200).json({
          message: 'تم تحديث السجل بنجاح',
          record: updatedRecord
        });
      }

      // Fallback if targetType wasn't specified: try detailRecord first, then cashRecord
      const detailRecord = await prisma.employeeCashDetail.findUnique({
        where: { id: transactionId },
        include: { employee: { select: { id: true, name: true } } }
      });

      if (detailRecord) {
        const oldDesc = detailRecord.description || '';
        const newDesc = typeof description === 'string' ? description : oldDesc;

        const updatedRecord = await prisma.employeeCashDetail.update({
          where: { id: transactionId },
          data: {
            date: new Date(transactionDate),
            month: new Date(transactionDate).toLocaleDateString('ar-SA', { month: 'long' }),
            mainAccount: mainAccount || '',
            subAccount: subAccount || '',
            client: client || '',
            debit: debitAmount,
            credit: creditAmount,
            balance: balance,
            description: newDesc,
            attachment: typeof attachment === 'string' ? attachment : ''
          },
          include: { employee: { select: { id: true, name: true } } }
        });

        const empName = updatedRecord.employee?.name || detailRecord.employee?.name || 'الموظف';
        await logAccountingActionFromRequest(req, {
          action: `تعديل حركة تفاصيل عهدة - الموظف: ${empName}`,
          actionType: 'update_employee_cash_detail',
          actionStatus: 'success',
          actionAmount: debitAmount || creditAmount,
          actionNotes: `تعديل حركة عهدة #${transactionId} للموظف (${empName}) - العميل: ${client || '—'} - البيان السابق: "${oldDesc}" -> البيان الجديد: "${newDesc}" - مدين: ${debitAmount}، دائن: ${creditAmount}`,
        });

        return res.status(200).json({
          message: 'تم تحديث السجل بنجاح',
          record: updatedRecord
        });
      }

      const cashRecord = await prisma.employeeCash.findUnique({
        where: { id: transactionId },
        include: { employee: { select: { id: true, name: true } } }
      });

      if (cashRecord) {
        const oldDesc = cashRecord.description || '';
        const newDesc = typeof description === 'string' ? description : oldDesc;

        const updatedRecord = await prisma.employeeCash.update({
          where: { id: transactionId },
          data: {
            transactionDate: new Date(transactionDate),
            receivedAmount: debitAmount,
            expenseAmount: creditAmount,
            remainingBalance: balance,
            description: newDesc,
            attachment: typeof attachment === 'string' ? attachment : (cashRecord.attachment || '')
          },
          include: { employee: { select: { id: true, name: true } } }
        });

        const empName = updatedRecord.employee?.name || cashRecord.employee?.name || 'الموظف';
        await logAccountingActionFromRequest(req, {
          action: `تعديل سجل عهدة موظف - الموظف: ${empName}`,
          actionType: 'update_employee_cash',
          actionStatus: 'success',
          actionAmount: debitAmount || creditAmount,
          actionNotes: `تعديل عهدة نقدية #${transactionId} للموظف (${empName}) - البيان السابق: "${oldDesc}" -> البيان الجديد: "${newDesc}" - المبلغ المستلم: ${debitAmount}، المصروف: ${creditAmount}`,
        });

        return res.status(200).json({
          message: 'تم تحديث السجل بنجاح',
          record: updatedRecord
        });
      }

      return res.status(404).json({ error: 'السجل المراد تعديله غير موجود' });

    } catch (error) {
      console.error('Error updating employee cash detail:', error);
      if (error instanceof Error && error.message.includes('Record to update not found')) {
        return res.status(404).json({ error: 'السجل المراد تعديله غير موجود' });
      }
      res.status(500).json({ error: 'فشل في تحديث السجل' });
    } finally {
      await prisma.$disconnect();
    }
  } else if (req.method === 'DELETE') {
    try {
      const transactionId = Number(id);
      const targetType = (req.query.type as string) || (req.body?.type as string);
      const userId = getUserIdFromCookie(req);

      // If explicitly marked as 'cash'
      if (targetType === 'cash') {
        const cashRecord = await prisma.employeeCash.findUnique({
          where: { id: transactionId },
          include: { employee: { select: { id: true, name: true } } }
        });

        if (!cashRecord) {
          return res.status(404).json({ error: 'سجل العهدة النقدية غير موجود' });
        }

        const empName = cashRecord.employee?.name || 'الموظف';
        const amount = Number(cashRecord.receivedAmount) || Number(cashRecord.expenseAmount) || 0;
        const desc = cashRecord.description || '';

        await prisma.employeeCash.delete({
          where: { id: transactionId }
        });

        await logAccountingActionFromRequest(req, {
          action: `حذف سجل عهدة موظف - الموظف: ${empName}`,
          actionType: 'delete_employee_cash',
          actionStatus: 'success',
          actionAmount: amount,
          actionNotes: `حذف سجل عهدة نقدية #${transactionId} للموظف (${empName}) - البيان: "${desc}" - المستلم: ${cashRecord.receivedAmount}، المصروف: ${cashRecord.expenseAmount}`,
        });

        if (userId) {
          eventBus.emit('ACTION', {
            type: `حذف سجل عهدة نقدية #${transactionId} - ${empName}`,
            actionType: 'delete',
            pageRoute: '/admin/employee_cash',
            userId: userId,
          });
        }

        return res.status(200).json({ message: 'تم حذف السجل بنجاح' });
      }

      // If explicitly marked as 'detail'
      if (targetType === 'detail') {
        const detailRecord = await prisma.employeeCashDetail.findUnique({
          where: { id: transactionId },
          include: { employee: { select: { id: true, name: true } } }
        });

        if (!detailRecord) {
          return res.status(404).json({ error: 'سجل تفاصيل العهدة غير موجود' });
        }

        const empName = detailRecord.employee?.name || 'الموظف';
        const amount = Number(detailRecord.debit) || Number(detailRecord.credit) || 0;
        const desc = detailRecord.description || '';

        await prisma.employeeCashDetail.delete({
          where: { id: transactionId }
        });

        await logAccountingActionFromRequest(req, {
          action: `حذف حركة تفاصيل عهدة - الموظف: ${empName}`,
          actionType: 'delete_employee_cash_detail',
          actionStatus: 'success',
          actionAmount: amount,
          actionNotes: `حذف حركة تفاصيل عهدة #${transactionId} للموظف (${empName}) - العميل: ${detailRecord.client || '—'} - البيان: "${desc}" - مدين: ${detailRecord.debit}، دائن: ${detailRecord.credit}`,
        });

        if (userId) {
          eventBus.emit('ACTION', {
            type: `حذف حركة تفاصيل عهدة #${transactionId} - ${empName}`,
            actionType: 'delete',
            pageRoute: '/admin/employee_cash',
            userId: userId,
          });
        }

        return res.status(200).json({ message: 'تم حذف السجل بنجاح' });
      }

      // Fallback if targetType is not provided: check detailRecord first, then cashRecord
      const detailRecord = await prisma.employeeCashDetail.findUnique({
        where: { id: transactionId },
        include: { employee: { select: { id: true, name: true } } }
      });

      if (detailRecord) {
        const empName = detailRecord.employee?.name || 'الموظف';
        const amount = Number(detailRecord.debit) || Number(detailRecord.credit) || 0;
        const desc = detailRecord.description || '';

        await prisma.employeeCashDetail.delete({
          where: { id: transactionId }
        });

        await logAccountingActionFromRequest(req, {
          action: `حذف حركة تفاصيل عهدة - الموظف: ${empName}`,
          actionType: 'delete_employee_cash_detail',
          actionStatus: 'success',
          actionAmount: amount,
          actionNotes: `حذف حركة تفاصيل عهدة #${transactionId} للموظف (${empName}) - العميل: ${detailRecord.client || '—'} - البيان: "${desc}" - مدين: ${detailRecord.debit}، دائن: ${detailRecord.credit}`,
        });

        if (userId) {
          eventBus.emit('ACTION', {
            type: `حذف حركة تفاصيل عهدة #${transactionId} - ${empName}`,
            actionType: 'delete',
            pageRoute: '/admin/employee_cash',
            userId: userId,
          });
        }

        return res.status(200).json({ message: 'تم حذف السجل بنجاح' });
      }

      const cashRecord = await prisma.employeeCash.findUnique({
        where: { id: transactionId },
        include: { employee: { select: { id: true, name: true } } }
      });

      if (cashRecord) {
        const empName = cashRecord.employee?.name || 'الموظف';
        const amount = Number(cashRecord.receivedAmount) || Number(cashRecord.expenseAmount) || 0;
        const desc = cashRecord.description || '';

        await prisma.employeeCash.delete({
          where: { id: transactionId }
        });

        await logAccountingActionFromRequest(req, {
          action: `حذف سجل عهدة موظف - الموظف: ${empName}`,
          actionType: 'delete_employee_cash',
          actionStatus: 'success',
          actionAmount: amount,
          actionNotes: `حذف سجل عهدة نقدية #${transactionId} للموظف (${empName}) - البيان: "${desc}" - المستلم: ${cashRecord.receivedAmount}، المصروف: ${cashRecord.expenseAmount}`,
        });

        if (userId) {
          eventBus.emit('ACTION', {
            type: `حذف سجل عهدة نقدية #${transactionId} - ${empName}`,
            actionType: 'delete',
            pageRoute: '/admin/employee_cash',
            userId: userId,
          });
        }

        return res.status(200).json({ message: 'تم حذف السجل بنجاح' });
      }

      return res.status(404).json({ error: 'السجل المراد حذفه غير موجود' });

    } catch (error) {
      console.error('Error deleting employee cash detail:', error);
      if (error instanceof Error && error.message.includes('Record to delete not found')) {
        return res.status(404).json({ error: 'السجل المراد حذفه غير موجود' });
      }
      res.status(500).json({ error: 'فشل في حذف السجل' });
    } finally {
      await prisma.$disconnect();
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
