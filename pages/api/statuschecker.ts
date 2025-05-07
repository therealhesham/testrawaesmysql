import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const result = await prisma.$queryRaw<{ count: number }[]>`
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

    const noRecentStatusCount = result && Array.isArray(result) && result[0]?.count ? Number(result[0].count) : 0;

    if (noRecentStatusCount > 0) {
      const notification = await prisma.notifications.create({
        data: {
          title: 'لا يوجد تحديثات حالة',
          message: ` هناك ${noRecentStatusCount}  لم يتم تحديث حالتهم`,
          isRead: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // استرجاع عناوين البريد الإلكتروني للأشخاص في قسم الاستقدام
      const emailList = await prisma.emaillist.findMany({
        where: {
          department: 'الاستقدام', // تأكد من أن هذه القيمة هي بالضبط اسم القسم في قاعدة البيانات
        },
        select: {
          email: true,
        },
      });

      const emailAddresses = emailList.map(item => item.email).join(',');

      // إعداد Nodemailer
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

      // التحقق من الاتصال
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

      // إرسال البريد
      const mailOptions = {
        from: 'hrdoc@rawaes.com',
        to: emailAddresses, // إرسال إلى جميع الأشخاص في قسم الاستقدام
        subject: 'تنبيه بعدم وجود تحديثات حالة',
        text: `مرحبًا،\n\nيوجد ${noRecentStatusCount} عامل/عاملة لم يتم تحديث حالتهم خلال آخر 7 أيام.\n\nيرجى المتابعة.\n\nشكرًا.`,
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
