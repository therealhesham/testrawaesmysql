import prisma from 'pages/api/globalprisma';
// @ts-ignore
import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';

export interface GuaranteeAlertWorker {
  housedWorkerId: number;
  maidName: string;
  passportNumber: string;
  nationality: string;
  clientName: string;
  clientPhone: string;
  internalContract: string;
  houseEntryDate: string;
  guaranteeEndDate: string;
  remainingDays: number;
}

export interface GuaranteeCheckResult {
  success: boolean;
  checkedAt: string;
  totalActiveHoused: number;
  matchingCount: number;
  thresholds: {
    days15: GuaranteeAlertWorker[];
    days10: GuaranteeAlertWorker[];
    days5: GuaranteeAlertWorker[];
    days2: GuaranteeAlertWorker[];
    other?: GuaranteeAlertWorker[];
  };
  notificationsSent: number;
  emailsSent: number;
}

/**
 * دالة مركزية لفحص تواريخ انتهاء ضمان العاملات في السكن وإرسال تنبيهات مجمعة على الموقع والإيميل
 * المواعيد المحددة: 15 يوم، 10 أيام، 5 أيام، ويومان
 */
export async function checkAndSendHousingGuaranteeNotifications(options?: {
  forceDays?: number[];
  io?: any;
}): Promise<GuaranteeCheckResult> {
  const targetThresholds = options?.forceDays || [15, 10, 5, 2];
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // 1. جلب جميع العاملات الداخليات المتواجدات حالياً في السكن فقط (استبعاد العاملات الخارجيات)
  const activeWorkers = await prisma.housedworker.findMany({
    where: {
      deparatureHousingDate: null,
      homeMaid_id: { not: null },
      externalHomedmaidId: null,
      isExternal: { not: true },
    },
    include: {
      Order: {
        include: {
          office: true,
          NewOrder: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            include: {
              arrivals: true,
              client: true,
            },
          },
        },
      },
    },
  });

  const matchingWorkers: GuaranteeAlertWorker[] = [];
  const thresholds: GuaranteeCheckResult['thresholds'] = {
    days15: [],
    days10: [],
    days5: [],
    days2: [],
    other: [],
  };

  for (const hw of activeWorkers) {
    if (!hw.Order) continue;
    const arrival = hw.Order.NewOrder?.[0]?.arrivals?.[0];
    
    // شرط صارم: الضمان يشمل فقط العاملات الداخليات اللاتي لديهن تاريخ وصول للمملكة أو تاريخ نهاية ضمان مسجل
    if (!arrival) continue;

    let guaranteeEndDateObj: Date | null = null;
    if (arrival.GuaranteeDurationEnd) {
      guaranteeEndDateObj = new Date(arrival.GuaranteeDurationEnd);
    } else if (arrival.KingdomentryDate) {
      guaranteeEndDateObj = new Date(new Date(arrival.KingdomentryDate).getTime() + 90 * 24 * 60 * 60 * 1000);
    }

    if (!guaranteeEndDateObj || isNaN(guaranteeEndDateObj.getTime())) continue;

    const maidName = String(hw.Order.Name || 'غير محدد');
    const passportNumber = String(hw.Order.Passportnumber || 'غير متوفر');
    const nationality = String(hw.Order.Nationality || hw.Order.Nationalitycopy || 'غير محدد');
    const clientName = String(hw.Order.NewOrder?.[0]?.client?.fullname || hw.Order.NewOrder?.[0]?.ClientName || 'غير محدد');
    const clientPhone = String(hw.Order.NewOrder?.[0]?.client?.phonenumber || hw.Order.NewOrder?.[0]?.PhoneNumber || 'غير متوفر');
    const internalContract = String(arrival.InternalmusanedContract || arrival.externalmusanedContract || `HW-${hw.id}`);

    const guaranteeDateNormalized = new Date(
      guaranteeEndDateObj.getFullYear(),
      guaranteeEndDateObj.getMonth(),
      guaranteeEndDateObj.getDate()
    );

    const diffMs = guaranteeDateNormalized.getTime() - today.getTime();
    const remainingDays = Math.round(diffMs / (24 * 60 * 60 * 1000));

    // فحص ما إذا كانت الأيام المتبقية تطابق أحد التنبيهات المطلوبة (15, 10, 5, 2)
    if (targetThresholds.includes(remainingDays)) {
      const workerItem: GuaranteeAlertWorker = {
        housedWorkerId: hw.id,
        maidName,
        passportNumber,
        nationality,
        clientName,
        clientPhone,
        internalContract,
        houseEntryDate: hw.houseentrydate ? new Date(hw.houseentrydate).toISOString().split('T')[0] : 'غير محدد',
        guaranteeEndDate: guaranteeDateNormalized.toISOString().split('T')[0],
        remainingDays,
      };

      matchingWorkers.push(workerItem);

      if (remainingDays === 15) thresholds.days15.push(workerItem);
      else if (remainingDays === 10) thresholds.days10.push(workerItem);
      else if (remainingDays === 5) thresholds.days5.push(workerItem);
      else if (remainingDays === 2) thresholds.days2.push(workerItem);
      else thresholds.other?.push(workerItem);
    }
  }

  if (matchingWorkers.length === 0) {
    return {
      success: true,
      checkedAt: now.toISOString(),
      totalActiveHoused: activeWorkers.length,
      matchingCount: 0,
      thresholds,
      notificationsSent: 0,
      emailsSent: 0,
    };
  }

  // 2. إعداد نص ورسائل التنبيه المجمعة
  const totalAlertCount = matchingWorkers.length;
  
  // بناء ملخص موجز
  const summaryParts: string[] = [];
  if (thresholds.days2.length > 0) summaryParts.push(`${thresholds.days2.length} عاملة متبقي يومان (حرج)`);
  if (thresholds.days5.length > 0) summaryParts.push(`${thresholds.days5.length} متبقي 5 أيام`);
  if (thresholds.days10.length > 0) summaryParts.push(`${thresholds.days10.length} متبقي 10 أيام`);
  if (thresholds.days15.length > 0) summaryParts.push(`${thresholds.days15.length} متبقي 15 يوم`);
  if (thresholds.other && thresholds.other.length > 0) summaryParts.push(`${thresholds.other.length} عاملة أخرى`);

  const summaryText = summaryParts.join(' • ');

  const shortMessage = totalAlertCount === 1
    ? `تنبيه ضمان السكن: العاملة ${matchingWorkers[0].maidName} (جواز: ${matchingWorkers[0].passportNumber}) متبقي على انتهاء ضمانها ${matchingWorkers[0].remainingDays} يوم (تاريخ الانتهاء: ${matchingWorkers[0].guaranteeEndDate}).`
    : `تنبيه ضمان السكن: يوجد ${totalAlertCount} عاملات في السكن اقترب موعد انتهاء ضمانهن [${summaryText}]. يرجى اتخاذ الإجراءات اللازمة.`;

  // 3. جلب المستخدمين المخولين باستلام التنبيهات عبر البريد الإلكتروني والموقع بناءً على تفعيل الصلاحية حصراً (حتى المالك)
  const users = await prisma.user.findMany({ include: { role: true } });

  const authorizedUsers = users.filter((u) => {
    let perms: any = u.role?.permissions || {};
    if (typeof perms === 'string') {
      try {
        perms = JSON.parse(perms);
      } catch {
        perms = {};
      }
    }

    const notifPerms = perms['إدارة الإشعارات'] || {};
    return (
      notifPerms['اشعارات انتهاء ضمان عاملات السكن - موقع وايميل'] === true ||
      notifPerms['اشعارات انتهاء ضمان عاملات السكن'] === true
    );
  });

  let notificationsSent = 0;
  let emailsSent = 0;

  // إعداد Nodemailer للإيميلات
  const transporter = (process.env.SMTP_HOST && process.env.SMTP_USER)
    ? nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      })
    : null;

  const logoPath = path.join(process.cwd(), 'public', 'coloredlogo.png');
  const hasLogo = fs.existsSync(logoPath);

  // إعداد قالب البريد الإلكتروني المجمع
  const getBadgeStyle = (days: number) => {
    if (days <= 2) return 'background-color: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5;';
    if (days <= 5) return 'background-color: #ffedd5; color: #c2410c; border: 1px solid #fdba74;';
    if (days <= 10) return 'background-color: #fef9c3; color: #a16207; border: 1px solid #fde047;';
    return 'background-color: #e0f2fe; color: #0369a1; border: 1px solid #7dd3fc;';
  };

  const getBadgeText = (days: number) => {
    if (days === 2) return 'متبقي يومان (حرج)';
    if (days === 1) return 'متبقي يوم واحد';
    if (days <= 0) return 'منتهي الضمان';
    return `متبقي ${days} أيام`;
  };

  const emailRowsHtml = matchingWorkers
    .map(
      (w, idx) => `
      <tr style="border-bottom: 1px solid #e2e8f0; ${idx % 2 === 1 ? 'background-color: #f8fafc;' : 'background-color: #ffffff;'}">
        <td style="padding: 12px 10px; font-weight: bold; color: #1e293b;">${w.maidName}</td>
        <td style="padding: 12px 10px; font-family: monospace; color: #475569;"><span dir="ltr">${w.passportNumber}</span></td>
        <td style="padding: 12px 10px; color: #334155;">${w.clientName}<br><small style="color: #64748b;" dir="ltr">${w.clientPhone}</small></td>
        <td style="padding: 12px 10px; font-family: monospace; color: #0f766e;">${w.guaranteeEndDate}</td>
        <td style="padding: 12px 10px; text-align: center;">
          <span style="display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: bold; ${getBadgeStyle(w.remainingDays)}">
            ${getBadgeText(w.remainingDays)}
          </span>
        </td>
      </tr>
    `
    )
    .join('');

  const emailHtml = `
    <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 24px; background-color: #f4f7f6; border-radius: 12px; max-width: 720px; margin: 0 auto; color: #333; border: 1px solid #e0e7e5;">
      ${hasLogo ? `
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="cid:rawaeslogo" alt="روائع الاستقدام" style="max-height: 75px;" />
        </div>
      ` : ''}
      
      <div style="background: linear-gradient(135deg, #1A4D4F 0%, #164044 100%); color: #ffffff; padding: 20px 24px; border-radius: 10px; text-align: center; margin-bottom: 24px;">
        <h2 style="margin: 0; font-size: 22px; font-weight: bold;">تنبيه انتهاء فترة ضمان عاملات السكن</h2>
        <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.95;">
          ${summaryText}
        </p>
      </div>

      <div style="background-color: #ffffff; border-radius: 10px; padding: 18px; border: 1px solid #e2e8f0; margin-bottom: 24px; overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px; text-align: right;">
          <thead>
            <tr style="background-color: #f1f5f9; border-bottom: 2px solid #cbd5e1;">
              <th style="padding: 10px; color: #475569; font-size: 13px;">اسم العاملة</th>
              <th style="padding: 10px; color: #475569; font-size: 13px;">رقم الجواز</th>
              <th style="padding: 10px; color: #475569; font-size: 13px;">العميل / الهاتف</th>
              <th style="padding: 10px; color: #475569; font-size: 13px;">نهاية الضمان</th>
              <th style="padding: 10px; color: #475569; font-size: 13px; text-align: center;">المدة المتبقية</th>
            </tr>
          </thead>
          <tbody>
            ${emailRowsHtml}
          </tbody>
        </table>
      </div>

      <div style="text-align: center; margin-top: 24px;">
        <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://admins.rawaes.com'}/admin/housedarrivals" target="_blank" style="display: inline-block; background-color: #1A4D4F; color: #ffffff; padding: 14px 36px; border-radius: 8px; font-weight: bold; text-decoration: none; font-size: 15px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          فتح جدول السكن والتسكين &larr;
        </a>
      </div>
    </div>
  `;

  const notifTitle = `تنبيه ضمان السكن (${totalAlertCount} عاملات)`;
  const notifMsg = shortMessage.length > 250 ? shortMessage.substring(0, 247) + '...' : shortMessage;

  // 4. إرسال التنبيهات (الموقع + الإيميل) حصراً لكل مستخدم يمتلك الصلاحية
  for (const user of authorizedUsers) {
    const targetUsername = user.username?.trim();
    if (!targetUsername) continue;

    // أ. إنشاء إشعار خاص في الموقع يظهر حصراً لهذا المستخدم في قائمة إشعاراته
    try {
      await prisma.notifications.create({
        data: {
          title: notifTitle,
          message: notifMsg,
          userId: targetUsername,
          type: 'housing_guarantee_alert',
          isRead: false,
        },
      });
      notificationsSent++;
    } catch (err: any) {
      console.error(`Error creating housing guarantee notification record for ${targetUsername}:`, err.message);
    }

    // ب. إرسال تنبيه عبر Socket.IO إذا كان متاحاً
    if (options?.io) {
      try {
        options.io.emit('newNotification', {
          userId: user.id,
          username: user.username,
          title: notifTitle,
          message: shortMessage,
          type: 'housing_guarantee_alert',
        });
      } catch (ioErr) {
        console.error('Socket.IO emit error:', ioErr);
      }
    }

    // ج. إرسال الإيميل المجمع للمستخدم المخول
    if (user.email && transporter) {
      try {
        const mailOptions: any = {
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: user.email,
          subject: `⚠️ تنبيه ضمان السكن: ${totalAlertCount} عاملات اقترب انتهاء ضمانهن [${summaryText}]`,
          text: shortMessage,
          html: emailHtml,
        };

        if (hasLogo) {
          mailOptions.attachments = [
            {
              filename: 'coloredlogo.png',
              path: logoPath,
              cid: 'rawaeslogo',
            },
          ];
        }

        await transporter.sendMail(mailOptions);
        emailsSent++;
        console.log(`Housing guarantee alert email sent successfully to ${user.email}`);
      } catch (emailErr: any) {
        console.error(`Error sending guarantee alert email to ${user.email}:`, emailErr.message);
      }
    }
  }

  return {
    success: true,
    checkedAt: now.toISOString(),
    totalActiveHoused: activeWorkers.length,
    matchingCount: totalAlertCount,
    thresholds,
    notificationsSent,
    emailsSent,
  };
}
