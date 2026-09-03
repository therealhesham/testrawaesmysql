import prisma from 'pages/api/globalprisma';
import { sendSMS } from './sms';
import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';

export async function sendOrderNotifications(orderId: number | string, clientName: string, homemaidId: number | string, io?: any) {
  try {
    // جلب جميع المستخدمين مع أدوارهم
    const users = await prisma.user.findMany({ include: { role: true } });

    // Fetch full order details for the email and notifications
    const orderData = await prisma.neworder.findUnique({
      where: { id: Number(orderId) },
      include: { client: true, HomeMaid: true }
    });
    
    const clientFullName = orderData?.client?.fullname || orderData?.ClientName || clientName;
    const clientPhone = orderData?.client?.phonenumber || orderData?.PhoneNumber || 'غير متوفر';
    const maidName = orderData?.HomeMaid?.Name || 'غير متوفر';
    const maidNationality = orderData?.HomeMaid?.Nationality || orderData?.HomeMaid?.Nationalitycopy || 'غير متوفر';
    
    // Format date in Arabic locale
    let orderDateFormatted = 'غير متوفر';
    if (orderData?.createdAt) {
      orderDateFormatted = new Date(orderData.createdAt).toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }

    const messageText = `تم إضافة طلب جديد (رقم ${orderId}) للعميل ${clientFullName} (${clientPhone}). العاملة ${maidName} (رقم ${homemaidId}) - ${maidNationality}.`;

    for (const user of users) {
      const isOwner = user.role?.name?.toLowerCase() === 'owner';
      const perms = (user.role?.permissions as any) || {};
      const notifPerms = perms['إدارة الإشعارات'] || {};
      // نعتمد على ما حدده المستخدم في الصلاحيات سواء كان مدير أو غيره
      const wantsWebEmail = notifPerms['اشعارات الطلب الجديد - موقع وايميل'] === true;
      const wantsSms = notifPerms['اشعارات الطلب الجديد - sms'] === true;

      await prisma.logs.create({
        data: {
          Details: JSON.stringify({ w: wantsWebEmail, s: wantsSms }),
          userId: user.username,
          Status: 'NotifDebug'
        }
      });

      // إرسال إشعار للموقع (حفظ في قاعدة البيانات)
      if (wantsWebEmail) {
        // إنشاء إشعار في قاعدة البيانات إذا لزم الأمر
        // يمكننا استخدام جدول الإشعارات الموجود إذا كان موجوداً
        await prisma.notifications.create({
          data: {
            title: "طلب جديد",
            message: messageText,
            userId: user.username?.toLowerCase().trim(),
            type: "new_order"
          }
        }).then(() => console.log("Notification created successfully for", user.username))
        .catch(err => {
          // Ignore if table structure is different
          console.error("Error creating notification DB record", err.message);
        });

        if (io) {
          // بث الإشعار للموقع
          io.emit("newNotification", {
            userId: user.id,
            message: messageText,
            orderId: orderId,
            type: 'new_order'
          });
        }

        // إرسال الإيميل إذا كان البريد الإلكتروني متوفراً
        if (user.email && process.env.SMTP_HOST && process.env.SMTP_USER) {
          try {
            const transporter = nodemailer.createTransport({
              host: process.env.SMTP_HOST,
              port: Number(process.env.SMTP_PORT) || 587,
              secure: Number(process.env.SMTP_PORT) === 465, // true for 465, false for other ports
              auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
              },
            });

            await transporter.sendMail({
              from: process.env.SMTP_FROM || process.env.SMTP_USER,
              to: user.email,
              subject: 'إشعار طلب جديد',
              text: messageText,
              attachments: [{
                filename: 'coloredlogo.png',
                path: path.join(process.cwd(), 'public', 'coloredlogo.png'),
                cid: 'rawaeslogo'
              }],
              html: `<div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9; border-radius: 10px; max-width: 600px; margin: 0 auto; color: #333; border: 1px solid #ddd;">
                       <div style="text-align: center; margin-bottom: 20px;">
                         <img src="cid:rawaeslogo" alt="روائع" style="max-height: 80px;" />
                       </div>
                       <h2 style="color: #00796B; text-align: center; border-bottom: 2px solid #00796B; padding-bottom: 10px;">إشعار طلب جديد</h2>
                       <p style="font-size: 16px; margin-bottom: 20px;">تم إضافة طلب جديد بنجاح. إليك التفاصيل:</p>
                       <table style="width: 100%; border-collapse: collapse; font-size: 15px;">
                         <tr>
                           <td style="padding: 10px; border: 1px solid #ddd; background-color: #fff; font-weight: bold; width: 30%;">رقم الطلب</td>
                           <td style="padding: 10px; border: 1px solid #ddd; background-color: #fff;">${orderId}</td>
                         </tr>
                         <tr>
                           <td style="padding: 10px; border: 1px solid #ddd; background-color: #fafafa; font-weight: bold;">اسم العميل</td>
                           <td style="padding: 10px; border: 1px solid #ddd; background-color: #fafafa;">${clientFullName}</td>
                         </tr>
                         <tr>
                           <td style="padding: 10px; border: 1px solid #ddd; background-color: #fff; font-weight: bold;">رقم العميل</td>
                           <td style="padding: 10px; border: 1px solid #ddd; background-color: #fff;"><span dir="ltr">${clientPhone}</span></td>
                         </tr>
                         <tr>
                           <td style="padding: 10px; border: 1px solid #ddd; background-color: #fafafa; font-weight: bold;">اسم العاملة</td>
                           <td style="padding: 10px; border: 1px solid #ddd; background-color: #fafafa;">${maidName} (رقم: ${homemaidId})</td>
                         </tr>
                         <tr>
                           <td style="padding: 10px; border: 1px solid #ddd; background-color: #fff; font-weight: bold;">الجنسية</td>
                           <td style="padding: 10px; border: 1px solid #ddd; background-color: #fff;">${maidNationality}</td>
                         </tr>
                         <tr>
                           <td style="padding: 10px; border: 1px solid #ddd; background-color: #fafafa; font-weight: bold;">تاريخ الطلب</td>
                           <td style="padding: 10px; border: 1px solid #ddd; background-color: #fafafa;">${orderDateFormatted}</td>
                         </tr>
                       </table>
                     </div>`,
            });
            console.log("Email sent successfully to", user.email);
          } catch (emailError: any) {
            console.error("Error sending email to", user.email, emailError.message);
          }
        }
      }

      // إرسال SMS
      if (wantsSms && user.phonenumber) {
        // تأكد أن الرقم بصيغة صحيحة (يبدأ ب 966)
        let phone = user.phonenumber;
        if (phone.startsWith('05')) {
          phone = '966' + phone.substring(1);
        }
        await sendSMS(phone, messageText).catch(e => console.error("SMS Error:", e));
      }
    }
  } catch (error) {
    console.error('Error sending order notifications:', error);
  }
}

/**
 * إرسال إشعار وإيميل للمحاسبين عند تسجيل بيانات مالية جديدة أو طلب جديد بحاجة لترحيل القيد
 */
export async function sendAccountingReviewNotification(orderId: number | string, io?: any) {
  try {
    const orderData = await (prisma as any).neworder.findUnique({
      where: { id: Number(orderId) },
      include: {
        client: true,
        HomeMaid: { include: { office: true } },
        arrivals: true
      }
    });

    if (!orderData) return;

    // التحقق من وجود مبالغ مالية للطلب
    const totalAmount = Number(orderData.Total) || 0;
    if (totalAmount <= 0) return;

    const amountWithoutTax = orderData.AmountWithoutTax != null
      ? Number(orderData.AmountWithoutTax)
      : Math.round((totalAmount / 1.15) * 100) / 100;
    const taxAmount = orderData.TaxAmount != null
      ? Number(orderData.TaxAmount)
      : Math.round((totalAmount - amountWithoutTax) * 100) / 100;

    const clientFullName = orderData.client?.fullname || orderData.ClientName || 'غير محدد';
    const clientPhone = orderData.client?.phonenumber || orderData.PhoneNumber || 'غير متوفر';
    const maidName = orderData.HomeMaid?.Name || 'غير متوفر';
    const internalContract = orderData.arrivals?.[0]?.InternalmusanedContract || `ORD-${orderId}`;
    const officeName = (orderData.HomeMaid as any)?.officeName || (orderData.HomeMaid as any)?.office?.office || 'غير محدد';

    const orderDateFormatted = new Date().toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // جلب جميع المستخدمين مع أدوارهم
    const users = await prisma.user.findMany({ include: { role: true } });

    const messageText = `تنبيه للمحاسبين: معاملة جديدة بانتظار الترحيل لدفترة - طلب #${orderId} (عقد: ${internalContract}) للعميل ${clientFullName} بإجمالي ${totalAmount.toLocaleString('en-US')} ر.س.`;

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

    for (const user of users) {
      let perms: any = user.role?.permissions || {};
      if (typeof perms === 'string') {
        try {
          perms = JSON.parse(perms);
        } catch {
          perms = {};
        }
      }
      const notifPerms = perms['إدارة الإشعارات'] || {};

      // استلام الإشعار والإيميل مقتصر حصراً وبشكل صارم على من لديه هذه الصلاحية مفعلة في إدارة الإشعارات
      const hasAccountingNotifPerm = 
        notifPerms['اشعارات ترحيل القيود المالية - موقع وايميل'] === true ||
        notifPerms['اشعارات ترحيل القيود المالية'] === true;

      if (!hasAccountingNotifPerm) continue;

      // 1. إشعار النظام وقاعدة البيانات
      try {
        await prisma.notifications.create({
          data: {
            title: "معاملة بانتظار الترحيل المحاسبي",
            message: messageText,
            userId: user.username?.toLowerCase().trim() || '',
            type: "accounting_review"
          }
        });
      } catch (err: any) {
        console.error("Error creating accounting notification DB record:", err.message);
      }

      if (io) {
        io.emit("newNotification", {
          userId: user.id,
          message: messageText,
          orderId: orderId,
          type: 'accounting_review'
        });
      }

      // 2. إرسال الإيميل للمحاسب
      if (user.email && transporter) {
        try {
          const emailHtml = `
            <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 24px; background-color: #f4f7f6; border-radius: 12px; max-width: 620px; margin: 0 auto; color: #333; border: 1px solid #e0e7e5;">
              ${hasLogo ? `
                <div style="text-align: center; margin-bottom: 20px;">
                  <img src="cid:rawaeslogo" alt="روائع الاستقدام" style="max-height: 75px;" />
                </div>
              ` : ''}
              
              <div style="background: linear-gradient(135deg, #1A4D4F 0%, #164044 100%); color: #ffffff; padding: 18px 24px; border-radius: 10px; text-align: center; margin-bottom: 24px;">
                <h2 style="margin: 0; font-size: 20px; font-weight: bold;">تنبيه للمحاسبين: معاملة بانتظار ترحيل القيد لدفترة</h2>
                <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.9;">تم تسجيل بيانات مالية جديدة وتحتاج إلى مراجعة واعتماد القيد</p>
              </div>

              <div style="background-color: #ffffff; border-radius: 10px; padding: 20px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                  <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 10px 8px; font-weight: bold; color: #64748b; width: 35%;">رقم الطلب</td>
                    <td style="padding: 10px 8px; font-weight: bold; color: #1e293b; font-family: monospace; font-size: 15px;">#${orderId}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #f1f5f9; background-color: #f8fafc;">
                    <td style="padding: 10px 8px; font-weight: bold; color: #64748b;">رقم العقد</td>
                    <td style="padding: 10px 8px; font-weight: bold; color: #0d9488; font-family: monospace;">${internalContract}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 10px 8px; font-weight: bold; color: #64748b;">اسم العميل</td>
                    <td style="padding: 10px 8px; font-weight: bold; color: #1e293b;">${clientFullName}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #f1f5f9; background-color: #f8fafc;">
                    <td style="padding: 10px 8px; font-weight: bold; color: #64748b;">هاتف العميل</td>
                    <td style="padding: 10px 8px; color: #1e293b;"><span dir="ltr">${clientPhone}</span></td>
                  </tr>
                  <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 10px 8px; font-weight: bold; color: #64748b;">العاملة / المكتب</td>
                    <td style="padding: 10px 8px; color: #1e293b;">${maidName} • ${officeName}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #f1f5f9; background-color: #f8fafc;">
                    <td style="padding: 10px 8px; font-weight: bold; color: #64748b;">المبلغ قبل الضريبة</td>
                    <td style="padding: 10px 8px; font-weight: 600; color: #334155;">${amountWithoutTax.toLocaleString('en-US', { minimumFractionDigits: 2 })} ر.س</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 10px 8px; font-weight: bold; color: #64748b;">ضريبة القيمة المضافة (15%)</td>
                    <td style="padding: 10px 8px; font-weight: 600; color: #334155;">${taxAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} ر.س</td>
                  </tr>
                  <tr style="background-color: #ecfdf5; border-top: 2px solid #a7f3d0;">
                    <td style="padding: 12px 8px; font-weight: bold; color: #065f46; font-size: 15px;">المبلغ الإجمالي الشامل</td>
                    <td style="padding: 12px 8px; font-weight: bold; color: #047857; font-size: 16px;">${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} ر.س</td>
                  </tr>
                </table>
              </div>

              <div style="text-align: center; margin-top: 24px;">
                <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://rawaes.com'}/admin/accounting-review" target="_blank" style="display: inline-block; background-color: #1A4D4F; color: #ffffff; padding: 13px 32px; border-radius: 8px; font-weight: bold; text-decoration: none; font-size: 15px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                  فتح صفحة مراجعة وترحيل القيود &larr;
                </a>
              </div>

              <p style="text-align: center; font-size: 12px; color: #94a3b8; margin-top: 24px;">
                تم إنشاء هذا الإشعار تلقائياً من نظام روائع للاستقدام • ${orderDateFormatted}
              </p>
            </div>
          `;

          const mailOptions: any = {
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: user.email,
            subject: `تنبيه محاسبي: معاملة بانتظار ترحيل القيد لدفترة (طلب #${orderId})`,
            text: messageText,
            html: emailHtml,
          };

          if (hasLogo) {
            mailOptions.attachments = [{
              filename: 'coloredlogo.png',
              path: logoPath,
              cid: 'rawaeslogo'
            }];
          }

          await transporter.sendMail(mailOptions);
          console.log("Accounting review email sent successfully to", user.email);
        } catch (emailError: any) {
          console.error("Error sending accounting review email to", user.email, emailError.message);
        }
      }
    }
  } catch (error) {
    console.error('Error in sendAccountingReviewNotification:', error);
  }
}

