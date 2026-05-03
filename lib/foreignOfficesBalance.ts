import { Prisma } from '@prisma/client'
import prisma from 'lib/prisma'

/**
 * إعادة حساب الأرصدة لكل سجلات مكتب خارجي بترتيب زمني (تاريخ ثم id).
 * المعادلة: balance += credit - debit (المدين ينقص من الرصيد، الدائن يزيده).
 * تستدعى بعد أي إضافة/تعديل/حذف لضمان اتساق كشف الحساب.
 */
export async function recalculateOfficeBalances(officeId: number): Promise<void> {
  const records = await prisma.foreignOfficeFinancial.findMany({
    where: { officeId },
    orderBy: [{ date: 'asc' }, { id: 'asc' }],
    select: { id: true, debit: true, credit: true, balance: true },
  })

  if (records.length === 0) return

  let running = 0
  const updates: Prisma.PrismaPromise<unknown>[] = []
  for (const r of records) {
    const debit = Number(r.debit) || 0
    const credit = Number(r.credit) || 0
    running = running + credit - debit
    if (Number(r.balance) !== running) {
      updates.push(
        prisma.foreignOfficeFinancial.update({
          where: { id: r.id },
          data: { balance: new Prisma.Decimal(running) },
        })
      )
    }
  }

  if (updates.length > 0) {
    await prisma.$transaction(updates)
  }
}
