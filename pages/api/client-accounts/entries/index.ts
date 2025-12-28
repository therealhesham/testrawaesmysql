import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { logAccountingActionFromRequest } from 'lib/accountingLogger';

const prisma = new PrismaClient();

// Helper function to recalculate totals from entries
async function recalculateStatementTotals(statementId: number) {
  const entries = await prisma.clientAccountEntry.findMany({
    where: { statementId }
  });

  const totalRevenue = entries.reduce((sum, entry) => sum + Number(entry.credit), 0);
  const totalExpenses = entries.reduce((sum, entry) => sum + Number(entry.debit), 0);
  const netAmount = totalRevenue - totalExpenses;

  await prisma.clientAccountStatement.update({
    where: { id: statementId },
    data: {
      totalRevenue,
      totalExpenses,
      netAmount
    }
  });

  return { totalRevenue, totalExpenses, netAmount };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { 
        statementId,
        entryType,
        fromDate,
        toDate
      } = req.query;

      const where: any = {};
      
      if (statementId) {
        where.statementId = Number(statementId);
      }
      
      if (entryType && entryType !== 'all') {
        where.entryType = entryType;
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

      const entries = await prisma.clientAccountEntry.findMany({
        where,
        include: {
          statement: {
            include: {
              client: {
                select: {
                  id: true,
                  fullname: true
                }
              }
            }
          }
        },
        orderBy: {
          date: 'desc'
        }
      });

      res.status(200).json(entries);
    } catch (error) {
      console.error('Error fetching client account entries:', error);
      res.status(500).json({ error: 'Failed to fetch client account entries' });
    } finally {
      await prisma.$disconnect();
    }
  } else if (req.method === 'POST') {
    try {
      const {
        statementId,
        date,
        description,
        debit,
        credit,
        entryType,
        userId
      } = req.body;

      // Get the last entry before or on the new entry's date to calculate the balance
      const entryDate = new Date(date);
      const previousEntry = await prisma.clientAccountEntry.findFirst({
        where: {
          statementId: Number(statementId),
          date: { lte: entryDate }
        },
        orderBy: {
          date: 'desc'
        }
      });

      // Calculate balance: previous balance + credit - debit
      const previousBalance = previousEntry ? Number(previousEntry.balance) : 0;
      const newDebit = Number(debit) || 0;
      const newCredit = Number(credit) || 0;
      const newBalance = previousBalance + newCredit - newDebit;

      const entry = await prisma.clientAccountEntry.create({
        data: {
          statementId: Number(statementId),
          date: new Date(date),
          description,
          debit: newDebit,
          credit: newCredit,
          balance: newBalance,
          entryType
        },
        include: {
          statement: {
            include: {
              client: {
                select: {
                  id: true,
                  fullname: true
                }
              }
            }
          }
        }
      });

      // Recalculate totals after creating entry
      await recalculateStatementTotals(Number(statementId));

      res.status(201).json(entry);
      
      // Log accounting action
      await logAccountingActionFromRequest(req, {
        action: `إضافة قيد محاسبي جديد - رقم العقد: ${entry.statement.contractNumber}`,
        actionType: 'add_client_entry',
        actionStatus: 'success',
        actionClientId: Number(entry.statement.clientId),
        actionAmount: Number(entry.debit) || Number(entry.credit),
        actionNotes: `إضافة قيد محاسبي - ${entry.description} - المدين: ${entry.debit}، الدائن: ${entry.credit}، الرصيد: ${entry.balance}`,
      });
    } catch (error) {
      console.error('Error creating client account entry:', error);
      res.status(500).json({ error: 'Failed to create client account entry' });
    } finally {
      await prisma.$disconnect();
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

