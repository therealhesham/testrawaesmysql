import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient, Prisma } from '@prisma/client';
import eventBus from 'lib/eventBus';
import { jwtDecode } from 'jwt-decode';
import { logAccountingAction } from 'lib/accountingLogger';

const prisma = new PrismaClient();

// Helper to authenticate user and extract role permissions directly from DB
async function getAuthUserWithPermissions(req: NextApiRequest) {
  let rawToken = '';
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    rawToken = authHeader.substring(7).trim();
  }

  const cookieHeader = req.headers.cookie;
  let cookies: { [key: string]: string } = {};
  if (cookieHeader) {
    cookieHeader.split(";").forEach((cookie) => {
      const [key, value] = cookie.trim().split("=");
      cookies[key] = decodeURIComponent(value);
    });
  }

  if (!rawToken) {
    rawToken = cookies.authToken || cookies.token || '';
  }

  if (!rawToken) return null;

  try {
    const token = jwtDecode(rawToken) as any;
    if (!token?.id) return null;

    const user = await prisma.user.findUnique({
      where: { id: Number(token.id) },
      include: { role: true }
    });

    if (!user) return null;

    let permissions: any = user.role?.permissions;
    if (typeof permissions === 'string') {
      try {
        permissions = JSON.parse(permissions);
      } catch {
        permissions = {};
      }
    }

    return {
      id: user.id,
      username: user.username || token.username || 'مستخدم',
      role: user.role?.name || token.role || '',
      permissions: permissions || {}
    };
  } catch (error) {
    console.error('Error authenticating user in entry handler:', error);
    return null;
  }
}

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
      const authUser = await getAuthUserWithPermissions(req);
      if (!authUser) {
        return res.status(401).json({ error: 'يجب تسجيل الدخول أولاً' });
      }

      const hasEditPermission = authUser.permissions?.['إدارة المحاسبة']?.['تعديل'] === true;
      if (!hasEditPermission) {
        return res.status(403).json({ error: 'غير مصرح لك بتعديل القيود المحاسبية. يجب تفعيل صلاحية التعديل في إدارة المحاسبة.' });
      }

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
      await logAccountingAction({
        action: `تعديل قيد محاسبي - رقم العقد: ${entry.statement.contractNumber || 'غير محدد'} - العميل: ${entry.statement.client?.fullname || 'غير محدد'}`,
        actionType: 'update_client_entry',
        actionStatus: 'success',
        actionClientId: entry.statement.clientId,
        actionUserId: authUser.id,
        actionAmount: Number(entry.debit) || Number(entry.credit),
        actionNotes: `تم تعديل القيد #${entry.id} بواسطة المستخدم: ${authUser.username} (ID: ${authUser.id}) | البيان: ${description} | المدين: ${newDebit}، الدائن: ${newCredit} | نوع الحركة: ${entryType || 'عادي'}`,
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
      const authUser = await getAuthUserWithPermissions(req);
      if (!authUser) {
        return res.status(401).json({ error: 'يجب تسجيل الدخول أولاً' });
      }

      const hasDeletePermission = authUser.permissions?.['إدارة المحاسبة']?.['حذف'] === true;
      if (!hasDeletePermission) {
        return res.status(403).json({ error: 'غير مصرح لك بحذف القيود المحاسبية. يجب تفعيل صلاحية الحذف في إدارة المحاسبة.' });
      }

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
                    id: true,
                    fullname: true,
                    nationalId: true
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

      // Log accounting action with detailed audit info
      const formattedDate = deletedInfo.date ? new Date(deletedInfo.date).toISOString().split('T')[0] : 'غير محدد';
      const debitVal = Number(deletedInfo.debit) || 0;
      const creditVal = Number(deletedInfo.credit) || 0;
      const amountVal = debitVal > 0 ? debitVal : creditVal;
      const clientName = deletedInfo.statement?.client?.fullname || 'غير محدد';
      const contractNum = deletedInfo.statement?.contractNumber || 'غير محدد';

      await logAccountingAction({
        action: `حذف قيد محاسبي - رقم العقد: ${contractNum} - العميل: ${clientName}`,
        actionType: 'delete_client_entry',
        actionStatus: 'success',
        actionClientId: deletedInfo.statement.clientId,
        actionUserId: authUser.id,
        actionAmount: amountVal,
        actionNotes: `تم حذف القيد #${deletedInfo.id} بواسطة المستخدم: ${authUser.username} (ID: ${authUser.id}) | البيان: ${deletedInfo.description} | مدين: ${debitVal} | دائن: ${creditVal} | التاريخ: ${formattedDate} | نوع القيد: ${deletedInfo.entryType || 'عادي'} | كشف حساب العقد: ${contractNum} | العميل: ${clientName}`,
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
