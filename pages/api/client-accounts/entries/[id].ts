import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import eventBus from 'lib/eventBus';
import { jwtDecode } from 'jwt-decode';

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

      // Get the current entry to know its statementId
      const currentEntry = await prisma.clientAccountEntry.findUnique({
        where: { id: Number(id) }
      });

      if (!currentEntry) {
        return res.status(404).json({ error: 'Entry not found' });
      }

      // Get the last entry before this one (ordered by date) to calculate balance
      const previousEntry = await prisma.clientAccountEntry.findFirst({
        where: {
          statementId: currentEntry.statementId,
          id: { not: Number(id) },
          date: { lte: new Date(date) }
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

      const entry = await prisma.clientAccountEntry.update({
        where: {
          id: Number(id)
        },
        data: {
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

      // Recalculate totals after updating entry
      await recalculateStatementTotals(currentEntry.statementId);

      res.status(200).json(entry);
    } catch (error) {
      console.error('Error updating client account entry:', error);
      res.status(500).json({ error: 'Failed to update client account entry' });
    } finally {
      await prisma.$disconnect();
    }
  } else if (req.method === 'DELETE') {
    try {
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

      // Get entry before deletion to know statementId
      const entryToDelete = await prisma.clientAccountEntry.findUnique({
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
        return res.status(404).json({ error: 'Entry not found' });
      }

      await prisma.clientAccountEntry.delete({
        where: {
          id: Number(id)
        }
      });

      // Recalculate totals after deleting entry
      await recalculateStatementTotals(entryToDelete.statementId);

      // تسجيل الحدث
      if (userId) {
        eventBus.emit('ACTION', {
          type: `حذف قيد حساب عميل #${id} - ${entryToDelete.statement?.client?.fullname || 'غير محدد'}`,
          actionType: 'delete',
          userId: userId,
        });
      }

      res.status(200).json({ message: 'Client account entry deleted successfully' });
    } catch (error) {
      console.error('Error deleting client account entry:', error);
      res.status(500).json({ error: 'Failed to delete client account entry' });
    } finally {
      await prisma.$disconnect();
    }
  } else {
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

