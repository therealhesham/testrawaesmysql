import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { logAccountingActionFromRequest } from 'lib/accountingLogger';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { 
        employee, 
        fromDate, 
        toDate,
        page = 1,
        limit = 10000
      } = req.query;

      const takeLimit = Math.min(Math.max(Number(limit) || 10000, 1), 50000);

      // Build where clause for filtering (عهدة نقدية)
      const where: any = {
        isTemporary: false // استبعاد السجلات المؤقتة من الاستعلامات العادية
      };
      
      if (employee && employee !== 'all') {
        where.employeeId = Number(employee);
      }
      
      if (fromDate || toDate) {
        where.transactionDate = {};
        if (fromDate) {
          where.transactionDate.gte = new Date(fromDate as string);
        }
        if (toDate) {
          where.transactionDate.lte = new Date(toDate as string);
        }
      }

      const detailWhere: any = {};
      if (employee && employee !== 'all') {
        detailWhere.employeeId = Number(employee);
      }
      if (fromDate || toDate) {
        detailWhere.date = {};
        if (fromDate) {
          detailWhere.date.gte = new Date(fromDate as string);
        }
        if (toDate) {
          detailWhere.date.lte = new Date(toDate as string);
        }
      }

      const [
        employeeCashRecords,
        detailRecords,
        cashCount,
        detailCount,
        summary,
        detailSum
      ] = await Promise.all([
        prisma.employeeCash.findMany({
          where,
          include: {
            employee: {
              select: {
                id: true,
                name: true,
                position: true,
                department: true
              }
            }
          },
          orderBy: {
            transactionDate: 'asc'
          },
          skip: 0,
          take: takeLimit
        }),
        prisma.employeeCashDetail.findMany({
          where: detailWhere,
          orderBy: {
            date: 'asc'
          },
          take: takeLimit
        }),
        prisma.employeeCash.count({ where }),
        prisma.employeeCashDetail.count({ where: detailWhere }),
        prisma.employeeCash.aggregate({
          where,
          _sum: {
            receivedAmount: true,
            expenseAmount: true,
            remainingBalance: true
          }
        }),
        prisma.employeeCashDetail.aggregate({
          where: detailWhere,
          _sum: {
            debit: true,
            credit: true
          }
        })
      ]);

      // Get unique employees for filter dropdown
      const employees = await prisma.employee.findMany({
        select: {
          id: true,
          name: true,
          position: true,
          department: true
        },
        where: {
          isActive: true
        },
        orderBy: {
          name: 'asc'
        }
      });

      const cashReceivedSum = Number(summary._sum.receivedAmount || 0);
      const cashExpenseSum = Number(summary._sum.expenseAmount || 0);
      const detailDebitSum = Number(detailSum._sum.debit || 0);
      const detailCreditSum = Number(detailSum._sum.credit || 0);

      const totalReceived = cashReceivedSum + detailDebitSum;
      const totalExpenses = cashExpenseSum + detailCreditSum;
      const totalRemaining = totalReceived - totalExpenses;

      // Group records by employee — دمج عهدة نقدية + تفاصيل كشف الحساب
      const employeesData = employees.map((emp) => {
        const employeeRecords = employeeCashRecords.filter((record) => record.employeeId === emp.id);
        const employeeDetailRecords = detailRecords.filter((record) => record.employeeId === emp.id);

        const cashReceived = employeeRecords.reduce((sum, record) => sum + Number(record.receivedAmount), 0);
        const cashExpense = employeeRecords.reduce((sum, record) => sum + Number(record.expenseAmount), 0);
        const detailDebit = employeeDetailRecords.reduce((sum, record) => sum + Number(record.debit), 0);
        const detailCredit = employeeDetailRecords.reduce((sum, record) => sum + Number(record.credit), 0);

        const empTotalReceived = cashReceived + detailDebit;
        const empTotalExpenses = cashExpense + detailCredit;
        const remainingBalance = empTotalReceived - empTotalExpenses;

        const cashTransactions = employeeRecords.map((record) => ({
          recordType: 'cash' as const,
          employeeId: emp.id,
          id: record.id,
          sortTime: record.transactionDate.getTime(),
          date: record.transactionDate.toLocaleDateString('en-GB'),
          employeeName: emp.name,
          cashNumber: record.cashNumber || record.id.toString(),
          receivedAmount: Number(record.receivedAmount),
          expenseAmount: Number(record.expenseAmount),
          remainingBalance: Number(record.remainingBalance),
          createdAt: new Date(record.createdAt).getTime()
        }));

        const detailTransactions = employeeDetailRecords.map((record) => ({
          recordType: 'detail' as const,
          employeeId: emp.id,
          id: record.id,
          sortTime: record.date.getTime(),
          date: record.date.toLocaleDateString('en-GB'),
          employeeName: emp.name,
          cashNumber: 'تفاصيل',
          receivedAmount: Number(record.debit),
          expenseAmount: Number(record.credit),
          remainingBalance: Number(record.balance),
          createdAt: new Date(record.createdAt).getTime()
        }));

        const transactions = [...cashTransactions, ...detailTransactions]
          .sort((a, b) => a.sortTime - b.sortTime || a.createdAt - b.createdAt)
          .map((t) => {
            const { sortTime, ...rest } = t;
            return { 
              ...rest, 
              sortTimestamp: t.createdAt 
            };
          });

        return {
          id: emp.id,
          name: emp.name,
          position: emp.position,
          department: emp.department,
          totalReceived: empTotalReceived,
          totalExpenses: empTotalExpenses,
          remainingBalance,
          transactions
        };
      });

      const mergedTotalRows = cashCount + detailCount;

      res.status(200).json({
        employees: employeesData,
        summary: {
          totalEmployees: employees.length,
          totalReceived,
          totalExpenses,
          totalRemaining
        },
        pagination: {
          page: Number(page),
          limit: takeLimit,
          total: mergedTotalRows,
          pages: Math.ceil(mergedTotalRows / takeLimit) || 1
        },
        filters: {
          employees: employees.map(emp => ({
            id: emp.id,
            name: emp.name,
            position: emp.position,
            department: emp.department
          }))
        }
      });

    } catch (error) {
      console.error('Error fetching employee cash data:', error);
      res.status(500).json({ error: 'Failed to fetch employee cash data' });
    } finally {
      await prisma.$disconnect();
    }
  } else if (req.method === 'POST') {
    try {
      const {
        id, // ID السجل المؤقت (إن وجد)
        employeeId,
        cashNumber,
        receivedAmount,
        expenseAmount,
        description,
        attachment,
        transactionDate,
        isTemporary = false
      } = req.body;

      const received = Number(receivedAmount || 0);
      const expense = Number(expenseAmount || 0);
      const remaining = received - expense;

      let employeeCashRecord;

      // إذا كان هناك ID، فهذا تحديث لسجل مؤقت
      if (id) {
        // التحقق من صحة السجل المؤقت
        const existingRecord = await prisma.employeeCash.findUnique({
          where: { id: Number(id) }
        });

        if (!existingRecord || !existingRecord.isTemporary) {
          return res.status(400).json({ error: 'السجل المؤقت غير موجود' });
        }

        // التحقق من وجود الموظف إذا لم يكن مؤقتاً
        if (!isTemporary && !employeeId) {
          return res.status(400).json({ error: 'الموظف مطلوب' });
        }

        // تحديث السجل
        employeeCashRecord = await prisma.employeeCash.update({
          where: { id: Number(id) },
          data: {
            employeeId: employeeId ? Number(employeeId) : null,
            cashNumber: cashNumber || '',
            receivedAmount: received,
            expenseAmount: expense,
            remainingBalance: remaining,
            description: description || '',
            attachment: attachment || '',
            transactionDate: transactionDate ? new Date(transactionDate) : new Date(),
            isTemporary: isTemporary
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
      } else {
        // إنشاء سجل جديد
        // التحقق من وجود الموظف إذا لم يكن مؤقتاً
        if (!isTemporary && !employeeId) {
          return res.status(400).json({ error: 'الموظف مطلوب' });
        }

        employeeCashRecord = await prisma.employeeCash.create({
          data: {
            employeeId: employeeId ? Number(employeeId) : null,
            cashNumber: cashNumber || '', // سيتم تحديثه بعد الحصول على ID
            receivedAmount: received,
            expenseAmount: expense,
            remainingBalance: remaining,
            description: description || '',
            attachment: attachment || '',
            transactionDate: transactionDate ? new Date(transactionDate) : new Date(),
            isTemporary: isTemporary
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

        // إذا لم يُحدد رقم عهدة، استخدم معرف السجل (واحد للسجلات المؤقتة والنهائية)
        if (!cashNumber || !String(cashNumber).trim()) {
          employeeCashRecord = await prisma.employeeCash.update({
            where: { id: employeeCashRecord.id },
            data: {
              cashNumber: employeeCashRecord.id.toString()
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
        }
      }

      // Log accounting action (only for non-temporary records)
      if (!isTemporary && employeeCashRecord.employee) {
        await logAccountingActionFromRequest(req, {
          action: id ? `تعديل سجل عهدة موظف - الموظف: ${employeeCashRecord.employee.name}` : `إضافة سجل عهدة موظف جديد - الموظف: ${employeeCashRecord.employee.name}`,
          actionType: id ? 'update_employee_cash' : 'add_employee_cash',
          actionStatus: 'success',
          actionAmount: received || expense,
          actionNotes: `سجل عهدة موظف - رقم العهدة: ${employeeCashRecord.cashNumber} - المستلم: ${received}، المصروف: ${expense}، المتبقي: ${remaining}${description ? ` - الوصف: ${description}` : ''}`,
        });
      }

      res.status(201).json({ 
        message: isTemporary ? 'تم إنشاء سجل العهدة المؤقت بنجاح' : 'تم إضافة سجل العهدة بنجاح', 
        employeeCashRecord 
      });

    } catch (error) {
      console.error('Error creating/updating employee cash record:', error);
      res.status(500).json({ error: 'Failed to create/update employee cash record' });
    } finally {
      await prisma.$disconnect();
    }
  } else if (req.method === 'DELETE') {
    try {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ error: 'معرف السجل مطلوب' });
      }

      // التحقق من أن السجل مؤقت
      const existingRecord = await prisma.employeeCash.findUnique({
        where: { id: Number(id) }
      });

      if (!existingRecord) {
        return res.status(404).json({ error: 'السجل غير موجود' });
      }

      if (!existingRecord.isTemporary) {
        return res.status(400).json({ error: 'يمكن حذف السجلات المؤقتة فقط' });
      }

      // Get employee info before deletion for logging
      const employeeInfo = existingRecord.employeeId ? await prisma.employee.findUnique({
        where: { id: existingRecord.employeeId },
        select: { name: true }
      }) : null;

      await prisma.employeeCash.delete({
        where: { id: Number(id) }
      });

      // Log accounting action (only for non-temporary records that had employee)
      if (employeeInfo) {
        await logAccountingActionFromRequest(req, {
          action: `حذف سجل عهدة موظف - الموظف: ${employeeInfo.name}`,
          actionType: 'delete_employee_cash',
          actionStatus: 'success',
          actionAmount: Number(existingRecord.receivedAmount) || Number(existingRecord.expenseAmount),
          actionNotes: `حذف سجل عهدة موظف - رقم العهدة: ${existingRecord.cashNumber}`,
        });
      }

      res.status(200).json({ 
        message: 'تم حذف السجل المؤقت بنجاح' 
      });

    } catch (error) {
      console.error('Error deleting temporary employee cash record:', error);
      res.status(500).json({ error: 'Failed to delete temporary employee cash record' });
    } finally {
      await prisma.$disconnect();
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
