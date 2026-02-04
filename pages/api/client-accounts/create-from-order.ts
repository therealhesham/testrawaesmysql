import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../globalprisma';

/**
 * POST /api/client-accounts/create-from-order
 * Body: { orderId: number, total?: number, paid?: number }
 * total = المبلغ المطلوب (يُحفظ في الطلب)
 * paid = المبلغ المدفوع - دفعة أولى (إن لم يُرسل يُستخدم order.paid)
 * ينشئ كشف حساب العميل + قيد "دفعة أولى" للطلب
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { orderId, total: bodyTotal, paid: bodyPaid } = req.body;
  if (!orderId) {
    return res.status(400).json({ message: 'رقم الطلب مطلوب' });
  }

  try {
    const order = await prisma.neworder.findUnique({
      where: { id: Number(orderId) },
      include: {
        client: true,
        HomeMaid: { include: { office: true } },
      },
    });

    if (!order) {
      return res.status(404).json({ message: 'الطلب غير موجود' });
    }

    const existingStatement = await prisma.clientAccountStatement.findFirst({
      where: { orderId: Number(orderId) },
    });
    if (existingStatement) {
      return res.status(400).json({
        message: 'يوجد بالفعل سجلات محاسبية لهذا الطلب',
        statementId: existingStatement.id,
      });
    }

    const clientId = order.clientID ?? order.client?.id;
    if (!clientId) {
      return res.status(400).json({ message: 'الطلب غير مرتبط بعميل' });
    }

    const officeName =
      (order.HomeMaid as any)?.officeName ||
      (order.HomeMaid as any)?.office?.office ||
      '';

    // المبلغ المدفوع (دفعة أولى): من الجسم إن وُجد وإلا من الطلب
    const paidAmount =
      bodyPaid != null && !Number.isNaN(Number(bodyPaid))
        ? Number(bodyPaid)
        : typeof order.paid === 'number' && !Number.isNaN(order.paid)
          ? order.paid
          : Number(order.paid) || 0;

    // تحديث المبلغ المطلوب في الطلب إن وُجد في الجسم
    if (bodyTotal != null && !Number.isNaN(Number(bodyTotal))) {
      await prisma.neworder.update({
        where: { id: Number(orderId) },
        data: { Total: Math.round(Number(bodyTotal)) },
      });
    }

    const statement = await prisma.clientAccountStatement.create({
      data: {
        clientId: Number(clientId),
        orderId: Number(orderId),
        contractNumber: `ORD-${orderId}`,
        officeName,
        totalRevenue: paidAmount,
        totalExpenses: 0,
        netAmount: paidAmount,
        contractStatus: order.bookingstatus || null,
        notes: 'تم إنشاؤها من صفحة تتبع الطلب (انشاء سجلات محاسبية)',
      },
    });

    await prisma.clientAccountEntry.create({
      data: {
        statementId: statement.id,
        date: new Date(),
        description: 'دفعة أولى',
        debit: 0,
        credit: paidAmount,
        balance: paidAmount,
        entryType: 'payment',
      },
    });

    return res.status(200).json({
      message: 'تم إنشاء السجلات المحاسبية بنجاح',
      statementId: statement.id,
    });
  } catch (error) {
    console.error('Error creating accounting records from order:', error);
    return res.status(500).json({
      message: 'حدث خطأ أثناء إنشاء السجلات المحاسبية',
      details: (error as Error).message,
    });
  }
}
