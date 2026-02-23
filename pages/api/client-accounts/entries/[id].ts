import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient, Prisma } from '@prisma/client';
import eventBus from 'lib/eventBus';
import { jwtDecode } from 'jwt-decode';
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

  const totalDebit = entries.reduce((sum, entry) => sum + Number(entry.debit), 0);
  const totalCredit = entries.reduce((sum, entry) => sum + Number(entry.credit), 0);
  const netAmount = totalDebit - totalCredit; // الرصيد: مدين يزيد، دائن يقلل

  await client.clientAccountStatement.update({
    where: { id: statementId },
    data: {
      totalRevenue: totalDebit,
      totalExpenses: totalCredit,
      netAmount
    }
  });

  return { totalDebit, totalCredit, netAmount };
}

// Helper function to recalculate all balances after a specific date
// This ensures balance integrity when entries are modified or deleted
async function recalculateBalancesAfterDate(
  statementId: number,
  fromDate: Date,
  tx?: Prisma.TransactionClient
) {
  const client = tx || prisma;
  
  // Get all entries for this statement ordered by date
  const allEntries = await client.clientAccountEntry.findMany({
    where: { statementId },
    orderBy: { date: 'asc' }
  });

  // Calculate running balance: مدين يزيد الرصيد، دائن يقلله
  let runningBalance = 0;
  for (const entry of allEntries) {
    runningBalance = runningBalance + Number(entry.debit) - Number(entry.credit);
    
    // Update balance if it's after the fromDate or if balance is incorrect
    if (entry.date >= fromDate || Number(entry.balance) !== runningBalance) {
      await client.clientAccountEntry.update({
        where: { id: entry.id },
        data: { balance: runningBalance }
      });
    }
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const entry = await prisma.clientAccountEntry.findUnique({
        where: {
          id: Number(id)
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

      if (!entry) {
        return res.status(404).json({ error: 'Client account entry not found' });
      }

      res.status(200).json(entry);
    } catch (error) {
      console.error('Error fetching client account entry:', error);
      res.status(500).json({ error: 'Failed to fetch client account entry' });
    } finally {
      await prisma.$disconnect();
    }
  } else if (req.method === 'PUT') {
    try {
      const {
        date,
        description,
        debit,
        credit,
        entryType
      } = req.body;

      // ✅ Validation: Check for negative numbers
      const newDebit = Number(debit) || 0;
      const newCredit = Number(credit) || 0;

      if (newDebit < 0) {
        return res.status(400).json({ error: 'المدين لا يمكن أن يكون سالباً' });
      }

      if (newCredit < 0) {
        return res.status(400).json({ error: 'الدائن لا يمكن أن يكون سالباً' });
      }

      // ✅ Use transaction for update and recalculation
      const entry = await prisma.$transaction(async (tx) => {
        // Get the current entry to know its statementId and date
        const currentEntry = await tx.clientAccountEntry.findUnique({
          where: { id: Number(id) }
        });

        if (!currentEntry) {
          throw new Error('القيد غير موجود');
        }

        const entryDate = new Date(date);
        const oldDate = currentEntry.date;

        // Update the entry
        const updatedEntry = await tx.clientAccountEntry.update({
          where: { id: Number(id) },
          data: {
            date: entryDate,
            description,
            debit: newDebit,
            credit: newCredit,
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

        // ✅ Recalculate all balances after the earliest affected date
        const earliestDate = entryDate < oldDate ? entryDate : oldDate;
        await recalculateBalancesAfterDate(currentEntry.statementId, earliestDate, tx);

        // Recalculate totals
        await recalculateStatementTotals(currentEntry.statementId, tx);

        return updatedEntry;
      });

      // Log accounting action
      await logAccountingActionFromRequest(req, {
        action: `تعديل قيد محاسبي - رقم العقد: ${entry.statement.contractNumber}`,
        actionType: 'update_client_entry',
        actionStatus: 'success',
        actionClientId: entry.statement.clientId,
        actionAmount: Number(entry.debit) || Number(entry.credit),
        actionNotes: `تعديل قيد محاسبي - ${description} - المدين: ${newDebit}، الدائن: ${newCredit}`,
      });

      res.status(200).json(entry);
    } catch (error: any) {
      console.error('Error updating client account entry:', error);
      const errorMessage = error.message || 'Failed to update client account entry';
      res.status(500).json({ error: errorMessage });
    } finally {
      await prisma.$disconnect();
    }
  } else if (req.method === 'DELETE') {
    try {
      // ✅ Use transaction for delete and recalculation
      const deletedInfo = await prisma.$transaction(async (tx) => {
        // Get entry before deletion to know statementId and date
        const entryToDelete = await tx.clientAccountEntry.findUnique({
          where: { id: Number(id) },
          include: {
            statement: {
              include: {
                client: {
                  select: {
                    fullname: true
                  }
                }
              }
            }
          }
        });

        if (!entryToDelete) {
          throw new Error('القيد غير موجود');
        }

        const statementId = entryToDelete.statementId;
        const deletedDate = entryToDelete.date;

        // Delete the entry
        await tx.clientAccountEntry.delete({
          where: { id: Number(id) }
        });

        // ✅ Recalculate all balances after the deleted entry's date
        await recalculateBalancesAfterDate(statementId, deletedDate, tx);

        // Recalculate totals
        await recalculateStatementTotals(statementId, tx);

        return entryToDelete;
      });

      // Log accounting action
      await logAccountingActionFromRequest(req, {
        action: `حذف قيد محاسبي - رقم العقد: ${deletedInfo.statement.contractNumber}`,
        actionType: 'delete_client_entry',
        actionStatus: 'success',
        actionClientId: deletedInfo.statement.clientId,
        actionAmount: Number(deletedInfo.debit) || Number(deletedInfo.credit),
        actionNotes: `حذف قيد محاسبي - ${deletedInfo.description} - المدين: ${deletedInfo.debit}، الدائن: ${deletedInfo.credit}`,
      });

      res.status(200).json({ message: 'Client account entry deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting client account entry:', error);
      const errorMessage = error.message || 'Failed to delete client account entry';
      res.status(500).json({ error: errorMessage });
    } finally {
      await prisma.$disconnect();
    }
  } else {
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

