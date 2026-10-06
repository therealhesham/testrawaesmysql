import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * دالة لمزامنة وإنشاء كشف الحساب المالي والقيود المحاسبية لمعاملة نقل الكفالة
 */
export async function syncTransferFinancialStatement(transferId: number) {
  try {
    const transfer = await prisma.transferSponsorShips.findUnique({
      where: { id: Number(transferId) },
      include: {
        NewClient: true,
        OldClient: true,
        HomeMaid: true,
      },
    });

    if (!transfer || !transfer.NewClientId) {
      console.warn(`[syncTransferFinancialStatement] Transfer #${transferId} not found or has no NewClientId`);
      return null;
    }

    const clientId = Number(transfer.NewClientId);
    const contractNumber = `TRF-${transfer.id}`;
    const maidName = transfer.HomeMaid?.Name || 'العاملة';
    const totalCost = Number(transfer.Cost || 0);
    const totalPaid = Number(transfer.Paid || 0);
    const remainingCost = Math.max(0, totalCost - totalPaid);
    const isFullPayment = totalPaid >= totalCost && totalCost > 0;

    // 1. البحث عن كشف الحساب الحالي المرتبط بهذه المعاملة
    let statement = await prisma.clientAccountStatement.findFirst({
      where: {
        clientId: clientId,
        contractNumber: contractNumber,
      },
      include: {
        entries: true,
      },
    });

    const statementNotes = `معاملة نقل كفالة #${transfer.id} - العاملة: ${maidName}`;
    const attachmentUrl = transfer.promissoryNoteFile || transfer.paymentReceiptFile || null;

    if (!statement) {
      // إنشاء كشف حساب جديد
      statement = await prisma.clientAccountStatement.create({
        data: {
          clientId: clientId,
          contractNumber: contractNumber,
          officeName: 'معاملات نقل الكفالة',
          totalRevenue: totalCost,
          totalExpenses: 0,
          netAmount: totalPaid,
          contractStatus: transfer.transferStage || 'تم نقل الكفالة',
          notes: statementNotes,
          attachment: attachmentUrl,
          createdAt: transfer.createdAt || new Date(),
        },
        include: {
          entries: true,
        },
      });
    } else {
      // تحديث كشف الحساب القائم
      statement = await prisma.clientAccountStatement.update({
        where: { id: statement.id },
        data: {
          totalRevenue: totalCost,
          netAmount: totalPaid,
          contractStatus: transfer.transferStage || 'تم نقل الكفالة',
          notes: statementNotes,
          attachment: attachmentUrl,
        },
        include: {
          entries: true,
        },
      });
    }

    // 2. تحديث / إنشاء القيود المحاسبية (ClientAccountEntry)
    // حذف القيود التلقائية القديمة لإعادة بنائها بدقة
    await prisma.clientAccountEntry.deleteMany({
      where: {
        statementId: statement.id,
      },
    });

    const entriesToCreate: any[] = [];
    let currentBalance = 0;

    // أ. قيد فاتورة نقل الكفالة (مدين)
    if (totalCost > 0) {
      currentBalance = totalCost;
      entriesToCreate.push({
        statementId: statement.id,
        date: transfer.ContractDate || transfer.createdAt || new Date(),
        description: `فاتورة عقد نقل خدمات / نقل كفالة (${maidName})`,
        debit: totalCost,
        credit: 0,
        balance: currentBalance,
        entryType: 'invoice',
        isEditable: false,
        displayOrder: 1,
        createdAt: transfer.createdAt || new Date(),
      });
    }

    // ب. قيود السداد (دائن)
    if (totalPaid > 0) {
      currentBalance -= totalPaid;
      entriesToCreate.push({
        statementId: statement.id,
        date: transfer.ExperimentStart || transfer.ContractDate || transfer.createdAt || new Date(),
        description:
          transfer.transferStage === 'في المرحلة التجريبية'
            ? `دفعة / عربون فترة التجربة`
            : isFullPayment
            ? `سداد كامل قيمة نقل الكفالة`
            : `سداد دفعة نقل كفالة`,
        debit: 0,
        credit: totalPaid,
        balance: currentBalance,
        entryType: 'payment',
        isEditable: false,
        displayOrder: 2,
        createdAt: transfer.ExperimentStart || transfer.createdAt || new Date(),
      });
    }

    // تنفيذ إنشاء القيود دفعة واحدة
    for (const entry of entriesToCreate) {
      await prisma.clientAccountEntry.create({
        data: entry,
      });
    }

    console.log(`[syncTransferFinancialStatement] Successfully synced statement #${statement.id} for Transfer #${transfer.id}`);
    return statement;
  } catch (error) {
    console.error(`[syncTransferFinancialStatement] Error syncing transfer #${transferId}:`, error);
    throw error;
  }
}
