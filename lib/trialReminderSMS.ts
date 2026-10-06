import prisma from 'lib/prisma';
import { sendSMS } from './sms';

export function getArabicDayName(date: Date): string {
  const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  return days[date.getDay()];
}

export function formatDateDMY(date: Date): string {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}-${m}-${y}`;
}

export function computeTrialDates(transfer: {
  ExperimentStart?: Date | string | null;
  ExperimentEnd?: Date | string | null;
  ExperimentDuration?: string | null;
  createdAt?: Date | string | null;
}): { startDate: Date | null; endDate: Date | null; durationDays: number } {
  const rawStart = transfer.ExperimentStart || transfer.createdAt;
  const startDate = rawStart ? new Date(rawStart) : null;
  
  let durationDays = 0;
  if (transfer.ExperimentDuration) {
    const match = String(transfer.ExperimentDuration).match(/\d+/);
    if (match) {
      durationDays = parseInt(match[0], 10);
    }
  }

  let endDate: Date | null = null;
  if (transfer.ExperimentEnd) {
    const parsed = new Date(transfer.ExperimentEnd);
    if (!isNaN(parsed.getTime())) {
      endDate = parsed;
    }
  }

  if (!endDate && startDate && !isNaN(startDate.getTime()) && durationDays > 0) {
    endDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);
  }

  if (endDate && startDate && !durationDays) {
    const diffMs = endDate.getTime() - startDate.getTime();
    durationDays = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
  }

  return { startDate, endDate, durationDays };
}

export function composeTrialReminderMessage(clientName: string, endDate: Date): string {
  const cleanName = (clientName || '').trim() || 'العميل';
  const dayName = getArabicDayName(endDate);
  const dateStr = formatDateDMY(endDate);

  return [
    `عملينا العزيز / ${cleanName}`,
    `نتمنى ان تكون العاملة قد حازت على رضاكم`,
    `ونود تذكيركم ان فترة تجربة نقل الكفالة سوف تنتهي يوم ${dayName}`,
    `${dateStr}`,
  ].join('\n');
}

export async function sendTrialReminderForTransfer(
  transferId: number,
  options?: { overridePhone?: string; force?: boolean; targetDate?: Date }
): Promise<{ success: boolean; message?: string; smsResult?: any; error?: string }> {
  try {
    const transfer = await prisma.transferSponsorShips.findUnique({
      where: { id: Number(transferId) },
      include: {
        NewClient: true,
        HomeMaid: true,
        OldClient: true,
      },
    });

    if (!transfer) {
      return { success: false, error: 'معاملة نقل الكفالة غير موجودة' };
    }

    const { startDate, endDate, durationDays } = computeTrialDates(transfer);

    if (!endDate || isNaN(endDate.getTime())) {
      return { success: false, error: 'لم يتم تحديد تاريخ انتهاء التجربة للمعاملة' };
    }

    // التحقق أن مدة التجربة أكثر من يومين
    if (durationDays <= 2 && !options?.force) {
      return {
        success: false,
        error: `مدة التجربة (${durationDays} يوم) ليست أكثر من يومين، يتم إرسال التذكير فقط للتجارب الأكثر من يومين.`,
      };
    }

    // التحقق من موعد الإرسال (قبل يومين من انتهاء التجربة)
    const now = options?.targetDate ? new Date(options.targetDate) : new Date();
    const msDiff = endDate.getTime() - now.getTime();
    const daysRemaining = msDiff / (1000 * 60 * 60 * 24);

    if (!options?.force) {
      // السماح بالإرسال إذا كان المتبقي بين 1.0 و 2.9 يوم
      if (daysRemaining < 0.9 || daysRemaining > 2.9) {
        return {
          success: false,
          error: `المتبقي على انتهاء التجربة ${daysRemaining.toFixed(1)} يوم، التذكير يرسل فقط قبل يومين من الانتهاء.`,
        };
      }
    }

    const recipientPhone =
      options?.overridePhone ||
      transfer.NewClient?.phonenumber ||
      transfer.NewClient?.alternativePhone;

    if (!recipientPhone) {
      return { success: false, error: 'لا يوجد رقم هاتف مسجل للعميل المستلم' };
    }

    const clientName = transfer.NewClient?.fullname || 'العميل';
    const message = composeTrialReminderMessage(clientName, endDate);

    console.log(`[Trial Reminder SMS] Sending to ${recipientPhone}:`);
    console.log(message);

    const smsRes = await sendSMS(recipientPhone, message);

    if (smsRes.success) {
      // توثيق إرسال الرسالة في ملاحظات المعاملة
      const logNote = `\n[SMS تذكير انتهاء التجربة]: تم إرسال رسالة تذكير للعميل (${clientName} - ${recipientPhone}) بتاريخ ${formatDateDMY(new Date())}.`;
      await prisma.transferSponsorShips.update({
        where: { id: transfer.id },
        data: {
          Notes: (transfer.Notes || '') + logNote,
        },
      });

      return {
        success: true,
        message,
        smsResult: smsRes.data,
      };
    } else {
      return {
        success: false,
        message,
        error: smsRes.error || 'فشل إرسال رسالة SMS',
      };
    }
  } catch (err: any) {
    console.error('Error in sendTrialReminderForTransfer:', err);
    return { success: false, error: err?.message || String(err) };
  }
}
