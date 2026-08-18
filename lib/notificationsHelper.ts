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
