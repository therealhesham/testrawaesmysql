import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { 
        employee, 
        fromDate, 
        toDate,
        page = 1,
        limit = 10
      } = req.query;

      const skip = (Number(page) - 1) * Number(limit);

      // Build where clause for filtering
      const where: any = {};
      
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

      // Get employee cash records with pagination and include employee data
      const [employeeCashRecords, total] = await Promise.all([
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
            transactionDate: 'desc'
          },
          skip,
          take: Number(limit)
        }),
        prisma.employeeCash.count({ where })
      ]);

      // Calculate summary totals
      const summary = await prisma.employeeCash.aggregate({
        where,
        _sum: {
          receivedAmount: true,
          expenseAmount: true,
          remainingBalance: true
        }
      });

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

      // Group records by employee
      const employeesData = employees.map((emp) => {
        const employeeRecords = employeeCashRecords.filter(record => record.employeeId === emp.id);
        const totalReceived = employeeRecords.reduce((sum, record) => sum + Number(record.receivedAmount), 0);
        const totalExpenses = employeeRecords.reduce((sum, record) => sum + Number(record.expenseAmount), 0);
        const remainingBalance = totalReceived - totalExpenses;

        return {
          id: emp.id,
          name: emp.name,
          position: emp.position,
          department: emp.department,
          totalReceived,
          totalExpenses,
          remainingBalance,
          transactions: employeeRecords.map(record => ({
            id: record.id,
            date: record.transactionDate.toLocaleDateString('ar-SA'),
            employeeName: emp.name,
            cashNumber: record.cashNumber || record.id.toString(),
            receivedAmount: Number(record.receivedAmount),
            expenseAmount: Number(record.expenseAmount),
            remainingBalance: Number(record.remainingBalance)
          }))
        };
      });

      // Calculate overall summary
      const totalReceived = Number(summary._sum.receivedAmount || 0);
      const totalExpenses = Number(summary._sum.expenseAmount || 0);
      const totalRemaining = totalReceived - totalExpenses;

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
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
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
        employeeId,
        cashNumber,
        receivedAmount,
        expenseAmount,
        description,
        attachment
      } = req.body;

      // Basic validation
      if (!employeeId) {
        return res.status(400).json({ error: 'الموظف مطلوب' });
      }

      const received = Number(receivedAmount || 0);
      const expense = Number(expenseAmount || 0);
      const remaining = received - expense;

      const employeeCashRecord = await prisma.employeeCash.create({
        data: {
          employeeId: Number(employeeId),
          cashNumber: cashNumber || '',
          receivedAmount: received,
          expenseAmount: expense,
          remainingBalance: remaining,
          description: description || '',
          attachment: attachment || '',
          transactionDate: new Date()
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
        message: 'تم إضافة سجل العهدة بنجاح', 
        employeeCashRecord 
      });

    } catch (error) {
      console.error('Error creating employee cash record:', error);
      res.status(500).json({ error: 'Failed to create employee cash record' });
    } finally {
      await prisma.$disconnect();
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
