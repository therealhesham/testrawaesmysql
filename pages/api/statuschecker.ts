import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();

// HTML Email Template
const generateEmailTemplate = (count: number, tableRows: string) => `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>تنبيه تحديث الحالة</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Arial', sans-serif; background-color: #f4f4f4; direction: rtl;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 10px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
    <tr>
      <td style="background: linear-gradient(90deg, #007BFF, #00A3FF); padding: 20px; text-align: center; border-top-left-radius: 10px; border-top-right-radius: 10px;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold;">تنبيه تحديث الحالة</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px;">
        <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
          مرحبًا،<br>
          يوجد <strong>${count}</strong> عامل/عاملة لم يتم تحديث حالتهم خلال الـ 7 أيام الماضية. يرجى مراجعة التفاصيل أدناه والمتابعة.
        </p>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr>
              <th style="background-color: #f8f9fa; padding: 12px; font-size: 14px; color: #333333; border-bottom: 2px solid #dee2e6; text-align: right;">اسم العامل</th>
              <th style="background-color: #f8f9fa; padding: 12px; font-size: 14px; color: #333333; border-bottom: 2px solid #dee2e6; text-align: right;">رقم العامل</th>
              <th style="background-color: #f8f9fa; padding: 12px; font-size: 14px; color: #333333; border-bottom: 2px solid #dee2e6; text-align: right;">تاريخ السكن</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
        <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 20px 0;">
          للاطلاع على النظام <a href="https://admins.rawaes.com/admin/workersstatus" style="color: #007BFF; text-decoration: none; font-weight: bold;">اضغط هنا</a>
        </p>
        <p style="color: #333333; font-size: 14px; line-height: 1.6; margin: 0;">
          شكرًا لمتابعتكم،<br>
          فريق الاستقدام
        </p>
      </td>
    </tr>
    <tr>
      <td style="background-color: #f8f9fa; padding: 15px; text-align: center; border-bottom-left-radius: 10px; border-bottom-right-radius: 10px;">
        <p style="color: #777777; font-size: 12px; margin: 0;">
          © 2025 شركة روائس. جميع الحقوق محفوظة.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
`;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Count workers with no recent status
    const countResult = await prisma.$queryRaw<{ count: number }[]>`
      SELECT 
        COUNT(*) as count
      FROM housedworker hw
      JOIN homemaid hm ON hw.homeMaid_id = hm.id
      WHERE 
        hw.deparatureHousingDate IS NULL
        AND NOT EXISTS (
          SELECT 1 FROM weeklyStatus ws 
          WHERE ws.homeMaid_id = hm.id 
          AND ws.date >= ${sevenDaysAgo}
        )
    `;

    // Fetch details of workers with no recent status
    const active = await prisma.$queryRaw<any[]>`
      SELECT 
        hm.name AS workerName,
        hm.id AS idNumber,
        hw.houseentrydate AS housingDate
      FROM housedworker hw
      JOIN homemaid hm ON hw.homeMaid_id = hm.id
      WHERE 
        hw.deparatureHousingDate IS NULL
        AND NOT EXISTS (
          SELECT 1 FROM weeklyStatus ws 
          WHERE ws.homeMaid_id = hm.id 
          AND ws.date >= ${sevenDaysAgo}
        )
    `;

    const noRecentStatusCount = countResult && Array.isArray(countResult) && countResult[0]?.count ? Number(countResult[0].count) : 0;

    if (noRecentStatusCount > 0) {
      // Create notification
      const notification = await prisma.notifications.create({
        data: {
          title: 'لا يوجد تحديثات حالة',
          message: `هناك ${noRecentStatusCount} لم يتم تحديث حالتهم`,
          isRead: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Fetch email list for the recruitment department
      const emailList = await prisma.emaillist.findMany({
        where: { department: 'الاستقدام' },
        select: { email: true },
      });

      const emailAddresses = emailList.map(item => item.email).join(',');

      // Generate table rows for the email
      const tableRows = active
        .map(
          worker => `
            <tr>
              <td style="padding: 12px; font-size: 14px; color: #333333; border-bottom: 1px solid #dee2e6; text-align: right;">${worker.workerName || 'غير متوفر'}</td>
              <td style="padding: 12px; font-size: 14px; color: #333333; border-bottom: 1px solid #dee2e6; text-align: right;">${worker.idNumber || 'غير متوفر'}</td>
              <td style="padding: 12px; font-size: 14px; color: #333333; border-bottom: 1px solid #dee2e6; text-align: right;">${worker.housingDate ? new Date(worker.housingDate).toLocaleDateString('ar-SA') : 'غير متوفر'}</td>
            </tr>
          `
        )
        .join('');

      // Generate email content
      const emailContent = generateEmailTemplate(noRecentStatusCount, tableRows);

      // Setup Nodemailer
      const transporter = nodemailer.createTransport({
        host: 'mail.rawaes.com',
        port: 465,
        secure: true,
        auth: {
          user: 'hrdoc@rawaes.com',
          pass: 'a-f09JRnpZOk',
        },
        debug: true,
        logger: true,
      });

      // Verify SMTP connection
      await new Promise((resolve, reject) => {
        transporter.verify((error, success) => {
          if (error) {
            console.error('SMTP verification failed:', error);
            reject(error);
          } else {
            console.log('SMTP connection verified successfully:', success);
            resolve(success);
          }
        });
      });

      // Send email
      const mailOptions = {
        from: 'hrdoc@rawaes.com',
        to: emailAddresses,
        subject: 'تنبيه بعدم وجود تحديثات حالة',
        html: emailContent, // Use HTML template
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', info.messageId);

      return res.status(200).json({
        message: `${noRecentStatusCount} active workers have no recent status updates.`,
        count: noRecentStatusCount,
        notification,
        emailSentTo: emailAddresses,
      });
    }

    return res.status(200).json({
      message: 'All active workers have recent status updates. No notification needed.',
      count: 0,
    });
  } catch (error) {
    console.error('Error checking housed worker status:', error);
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  } finally {
    await prisma.$disconnect();
  }
}