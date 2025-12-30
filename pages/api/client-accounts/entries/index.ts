import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient, Prisma } from '@prisma/client';
import { logAccountingActionFromRequest } from 'lib/accountingLogger';

const prisma = new PrismaClient();

// Helper function to recalculate totals from entries
// Now supports transactions for data integrity
async function recalculateStatementTotals(
  statementId: number, 
  tx?: Prisma.TransactionClient
) {
  const client = tx || prisma;
  
  const entries = await client.clientAccountEntry.findMany({
    where: { statementId }
  });

  const totalRevenue = entries.reduce((sum, entry) => sum + Number(entry.credit), 0);
  const totalExpenses = entries.reduce((sum, entry) => sum + Number(entry.debit), 0);
  const netAmount = totalRevenue - totalExpenses;

  await client.clientAccountStatement.update({
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

      // ✅ Validation: Check required fields
      if (!statementId) {
        return res.status(400).json({ error: 'statementId is required' });
      }

      if (!date) {
        return res.status(400).json({ error: 'date is required' });
      }

      if (!description) {
        return res.status(400).json({ error: 'description is required' });
      }

      // ✅ Validation: Check for negative numbers
      const newDebit = Number(debit) || 0;
      const newCredit = Number(credit) || 0;

      if (newDebit < 0) {
        return res.status(400).json({ error: 'المدين لا يمكن أن يكون سالباً' });
      }

      if (newCredit < 0) {
        return res.status(400).json({ error: 'الدائن لا يمكن أن يكون سالباً' });
      }

      // ✅ Validation: Check that at least one of debit or credit is provided
      if (newDebit === 0 && newCredit === 0) {
        return res.status(400).json({ error: 'يجب إدخال قيمة في المدين أو الدائن' });
      }

      // ✅ Validation: Check date is not in the future
      const entryDate = new Date(date);
      const now = new Date();
      if (entryDate > now) {
        return res.status(400).json({ error: 'التاريخ لا يمكن أن يكون في المستقبل' });
      }

      // ✅ Use transaction to ensure data integrity
      const entry = await prisma.$transaction(async (tx) => {
        // Verify statement exists
        const statement = await tx.clientAccountStatement.findUnique({
          where: { id: Number(statementId) },
          include: {
            client: {
              select: {
                id: true,
                fullname: true
              }
            }
          }
        });

        if (!statement) {
          throw new Error('الحساب غير موجود');
        }

        // Get the last entry before or on the new entry's date to calculate the balance
        const previousEntry = await tx.clientAccountEntry.findFirst({
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
        const newBalance = previousBalance + newCredit - newDebit;

        // Create the entry
        const createdEntry = await tx.clientAccountEntry.create({
          data: {
            statementId: Number(statementId),
            date: entryDate,
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

        // Recalculate totals within the same transaction
        await recalculateStatementTotals(Number(statementId), tx);

        return createdEntry;
      });

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
    } catch (error: any) {
      console.error('Error creating client account entry:', error);
      const errorMessage = error.message || 'Failed to create client account entry';
      res.status(500).json({ error: errorMessage });
    } finally {
      await prisma.$disconnect();
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

