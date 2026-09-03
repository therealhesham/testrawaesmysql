import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../globalprisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { orderId, daftraJournalNumber, notes, userId, clientName, contractNumber } = req.body;

  if (!orderId) {
    return res.status(400).json({ message: 'معرف الطلب مطلوب' });
  }

  try {
    const existingOrder: any = await (prisma as any).neworder.findUnique({
      where: { id: Number(orderId) },
      select: {
        id: true,
        ClientName: true,
        clientId: true,
        Total: true,
        isJournalPosted: true,
        daftraJournalId: true,
        arrivals: {
          select: {
            InternalmusanedContract: true
          }
        }
      }
    });

    if (!existingOrder) {
      return res.status(404).json({ message: 'الطلب غير موجود' });
    }

    const journalNum = (daftraJournalNumber || '').trim() || 'مرحل يدوياً';

    // Update order status as posted
    const updatedOrder = await (prisma as any).neworder.update({
      where: { id: Number(orderId) },
      data: {
        isJournalPosted: true,
        daftraJournalId: journalNum,
        journalPostedAt: new Date()
      }
    });

    // Log action to accounting_actions_log
    try {
      const contract = contractNumber || existingOrder.arrivals?.[0]?.InternalmusanedContract || '';
      const client = clientName || existingOrder.ClientName || 'عميل';
      const parsedUserId = userId ? Number(userId) : null;

      let validUserId: number | null = null;
      if (parsedUserId) {
        try {
          const u = await prisma.user.findUnique({ where: { id: parsedUserId }, select: { id: true } });
          if (u) validUserId = u.id;
        } catch (e) {}
      }

      await (prisma as any).accounting_actions_log.create({
        data: {
          TransactionType: 'قيد محاسبي مرحل يدوياً',
          BeneficiaryType: 'طلب',
          BeneficiaryId: Number(orderId),
          BeneficiaryName: client,
          Statement: notes 
            ? `تم تعيين القيد كمرحل مسبقاً (يدوياً): ${notes}`
            : `تم تعيين قيد العقد ${contract} للعميل ${client} كمرحل مسبقاً برقم قيد (${journalNum})`,
          Amount: existingOrder.Total ? Number(existingOrder.Total) : 0,
          AccountSystem: 'دفترة ERP',
          UserId: validUserId,
          OperationDate: new Date(),
        }
      });
    } catch (logErr) {
      console.warn('Warning creating accounting action log:', logErr);
    }

    return res.status(200).json({
      success: true,
      message: 'تم تعيين القيد كمرحل مسبقاً بنجاح ونقله إلى قائمة القيود المرحلة',
      order: updatedOrder
    });
  } catch (error: any) {
    console.error('Error marking order as manually posted:', error);
    return res.status(500).json({
      message: 'فشل في تحديث حالة القيد',
      error: error.message
    });
  }
}
