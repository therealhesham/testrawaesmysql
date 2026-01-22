import { NextApiRequest, NextApiResponse } from "next";
import prisma from "./globalprisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  try {
    // تنظيف رقم الهاتف (إزالة المسافات والرموز الخاصة)
    const cleanedPhone = phone.trim().replace(/[\s\-\(\)\+]/g, '');
    
    if (!cleanedPhone || cleanedPhone.length === 0) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    // البحث في جدول homemaid - البحث الدقيق أولاً
    let homemaid = await prisma.homemaid.findFirst({ 
      where: { 
        phone: cleanedPhone
      } 
    });

    // إذا لم نجد تطابقاً دقيقاً، نبحث في جميع السجلات للتحقق من وجود الرقم
    if (!homemaid) {
      const allHomemaids = await prisma.homemaid.findMany({
        where: {
          phone: {
            not: null
          }
        },
        select: {
          phone: true
        }
      });

      // التحقق من وجود الرقم في أي من أرقام الهواتف المسجلة (مقارنة بعد التنظيف)
      const found = allHomemaids.find(h => {
        if (!h.phone) return false;
        const existingPhone = String(h.phone).trim().replace(/[\s\-\(\)\+]/g, '');
        // مقارنة دقيقة فقط (نفس الرقم بعد التنظيف)
        return existingPhone === cleanedPhone;
      });

      if (found) {
        // إذا وجدنا تطابقاً، نبحث عن السجل الكامل
        homemaid = await prisma.homemaid.findFirst({
          where: {
            phone: found.phone
          }
        });
      }
    }

    if (homemaid) {
      return res.status(200).json({ exists: true, message: 'رقم الهاتف مستخدم من قبل' });
    }

    // البحث أيضاً في جدول Client للتحقق الشامل
    const client = await prisma.client.findFirst({ 
      where: { 
        phonenumber: cleanedPhone
      } 
    });

    if (client) {
      return res.status(200).json({ exists: true, message: 'رقم الهاتف مستخدم من قبل' });
    }

    return res.status(200).json({ exists: false });
  } catch (error) {
    console.error('Error checking phone uniqueness:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

