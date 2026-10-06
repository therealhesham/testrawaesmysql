import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from 'lib/prisma';
import {
  computeTrialDates,
  sendTrialReminderForTransfer,
} from 'lib/trialReminderSMS';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { transferId, testPhone, force, targetDate } = req.query;

    // 1. إذا تم طلب إرسال تذكير لمعاملة محددة مباشرة (اختبار أو إرسال يدوي)
    if (transferId) {
      const result = await sendTrialReminderForTransfer(Number(transferId), {
        overridePhone: testPhone ? String(testPhone) : undefined,
        force: force === 'true' || force === '1' || req.method === 'POST',
        targetDate: targetDate ? new Date(targetDate as string) : undefined,
      });

      if (!result.success) {
        return res.status(400).json(result);
      }
      return res.status(200).json({
        success: true,
        message: 'تم إرسال رسالة التذكير بنجاح',
        details: result,
      });
    }

    // 2. الفحص التلقائي الشامل لجميع المعاملات قيد التجربة
    const activeTransfers = await prisma.transferSponsorShips.findMany({
      where: {
        transferStage: { in: ['في المرحلة التجريبية', 'فترة التجربة', 'تقييم التجربة'] },
      },
      include: {
        NewClient: true,
        HomeMaid: true,
      },
      orderBy: { id: 'desc' },
    });

    const now = targetDate ? new Date(targetDate as string) : new Date();
    const results: any[] = [];

    for (const transfer of activeTransfers) {
      const { startDate, endDate, durationDays } = computeTrialDates(transfer);

      // يجب أن تكون مدة التجربة أكثر من يومين
      if (durationDays <= 2 || !endDate) {
        continue;
      }

      // حساب المتبقي من الأيام
      const diffMs = endDate.getTime() - now.getTime();
      const daysRemaining = diffMs / (1000 * 60 * 60 * 24);

      // الفحص: قبل يومين من الانتهاء (بين 1.0 و 2.9 يوم)
      if (daysRemaining >= 0.9 && daysRemaining <= 2.9) {
        // فحص هل تم إرسال تذكير سابقاً لنفس اليوم لمنع التكرار
        const notesStr = transfer.Notes || '';
        const todayTag = `[SMS تذكير انتهاء التجربة]`;
        if (notesStr.includes(todayTag)) {
          // تم الإرسال سابقاً
          results.push({
            transferId: transfer.id,
            client: transfer.NewClient?.fullname,
            status: 'skipped_already_sent',
          });
          continue;
        }

        const sendRes = await sendTrialReminderForTransfer(transfer.id, {
          targetDate: now,
          overridePhone: testPhone ? String(testPhone) : undefined,
        });

        results.push({
          transferId: transfer.id,
          client: transfer.NewClient?.fullname,
          phone: transfer.NewClient?.phonenumber,
          daysRemaining: Math.round(daysRemaining),
          sendResult: sendRes,
        });
      }
    }

    return res.status(200).json({
      success: true,
      checkedCount: activeTransfers.length,
      sentCount: results.filter((r) => r.sendResult?.success).length,
      results,
    });
  } catch (error: any) {
    console.error('Error in trial expiration reminders cron:', error);
    return res.status(500).json({ error: 'Server error', details: error?.message || String(error) });
  }
}
