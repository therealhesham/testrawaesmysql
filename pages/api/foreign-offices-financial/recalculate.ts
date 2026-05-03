import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from 'lib/prisma'
import { recalculateOfficeBalances } from 'lib/foreignOfficesBalance'

/**
 * يعيد حساب الأرصدة لمكتب محدد عبر `officeId` أو لكل المكاتب الخارجية إذا لم يُمرر.
 * يُستخدم بعد تغيير اتجاه المعادلة المحاسبية أو لتصحيح بيانات قديمة غير متسقة.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ success: false, message: `Method ${req.method} Not Allowed` })
  }

  try {
    const officeIdParam = req.query.officeId ?? req.body?.officeId

    if (officeIdParam) {
      const officeId = Number(officeIdParam)
      if (!Number.isFinite(officeId)) {
        return res.status(400).json({ success: false, message: 'officeId غير صالح' })
      }
      await recalculateOfficeBalances(officeId)
      return res.status(200).json({ success: true, message: 'تم إعادة حساب الأرصدة', recalculatedOffices: 1 })
    }

    const offices = await prisma.foreignOfficeFinancial.findMany({
      distinct: ['officeId'],
      select: { officeId: true },
    })

    for (const o of offices) {
      await recalculateOfficeBalances(o.officeId)
    }

    return res.status(200).json({
      success: true,
      message: 'تم إعادة حساب الأرصدة لكل المكاتب',
      recalculatedOffices: offices.length,
    })
  } catch (error: any) {
    console.error('Recalculate balances error:', error)
    return res.status(500).json({ success: false, message: 'Internal Server Error' })
  }
}
