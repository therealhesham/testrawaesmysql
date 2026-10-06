import { PrismaClient, Prisma } from '@prisma/client';

const defaultPrisma = new PrismaClient();

/**
 * دالة مركزية لإعادة حساب الأرصدة التراكمية (running balances) والترتيب والإجماليات لكشف الحساب
 */
export async function recalculateStatementRunningBalances(
  statementId: number,
  tx?: Prisma.TransactionClient
) {
  const client = tx || defaultPrisma;

  // 1. جلب جميع القيود مرتبة حسب displayOrder ثم date ثم id
  const entries = await client.clientAccountEntry.findMany({
    where: { statementId: Number(statementId) },
    orderBy: [
      { displayOrder: 'asc' },
      { date: 'asc' },
      { id: 'asc' }
    ]
  });

  let runningBalance = 0;
  let totalDebit = 0;
  let totalCredit = 0;

  // 2. تحديث الرصيد التراكمي وترتيب العرض لكل قيد
  for (let index = 0; index < entries.length; index++) {
    const entry = entries[index];
    const debit = Number(entry.debit || 0);
    const credit = Number(entry.credit || 0);

    totalDebit += debit;
    totalCredit += credit;
    runningBalance += debit - credit;

    // تحديث القيد إذا تغير الرصيد أو الترتيب
    if (Number(entry.balance) !== runningBalance || entry.displayOrder !== index) {
      await client.clientAccountEntry.update({
        where: { id: entry.id },
        data: {
          balance: runningBalance,
          displayOrder: index
        }
      });
    }
  }

  const netAmount = totalDebit - totalCredit;

  // 3. تحديث إجماليات كشف الحساب
  const updatedStatement = await client.clientAccountStatement.update({
    where: { id: Number(statementId) },
    data: {
      totalRevenue: totalDebit,
      totalExpenses: totalCredit,
      netAmount: netAmount
    }
  });

  // 4. إذا كان كشف الحساب مرتبطاً بمعاملة نقل كفالة (TRF-X)، مزامنة المبالغ المدفوعة في جدول نقل الكفالة
  if (updatedStatement.contractNumber && updatedStatement.contractNumber.startsWith('TRF-')) {
    const transferId = parseInt(updatedStatement.contractNumber.replace('TRF-', ''));
    if (!isNaN(transferId)) {
      try {
        await client.transferSponsorShips.update({
          where: { id: transferId },
          data: {
            Paid: totalCredit,
            ...(totalDebit > 0 ? { Cost: totalDebit } : {})
          }
        });
      } catch (err) {
        console.warn(`[recalculateStatementRunningBalances] Could not update transfer #${transferId}:`, err);
      }
    }
  }

  return { totalDebit, totalCredit, netAmount, runningBalance };
}
