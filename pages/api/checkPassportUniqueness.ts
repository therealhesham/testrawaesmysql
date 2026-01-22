import { NextApiRequest, NextApiResponse } from "next";
import prisma from "./globalprisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { passport } = req.body;

  if (!passport) {
    return res.status(400).json({ error: 'Passport number is required' });
  }

  try {
    // تنظيف رقم الجواز (إزالة المسافات وتحويل إلى uppercase للمقارنة)
    const cleanedPassport = passport.trim().toUpperCase().replace(/\s/g, '');
    
    if (!cleanedPassport || cleanedPassport.length === 0) {
      return res.status(400).json({ error: 'Passport number is required' });
    }

    // البحث في جدول homemaid - البحث الدقيق أولاً
    let homemaid = await prisma.homemaid.findFirst({ 
      where: { 
        Passportnumber: cleanedPassport
      } 
    });

    // إذا لم نجد تطابقاً دقيقاً، نبحث في جميع السجلات للتحقق من وجود الرقم
    if (!homemaid) {
      const allHomemaids = await prisma.homemaid.findMany({
        where: {
          Passportnumber: {
            not: null
          }
        },
        select: {
          Passportnumber: true
        }
      });

      // التحقق من وجود الرقم في أي من أرقام الجوازات المسجلة (مقارنة بعد التنظيف)
      const found = allHomemaids.find(h => {
        if (!h.Passportnumber) return false;
        const existingPassport = String(h.Passportnumber).trim().toUpperCase().replace(/\s/g, '');
        // مقارنة دقيقة فقط (نفس الرقم بعد التنظيف)
        return existingPassport === cleanedPassport;
      });

      if (found) {
        // إذا وجدنا تطابقاً، نبحث عن السجل الكامل
        homemaid = await prisma.homemaid.findFirst({
          where: {
            Passportnumber: found.Passportnumber
          }
        });
      }
    }

    if (homemaid) {
      return res.status(200).json({ exists: true, message: 'رقم الجواز مستخدم من قبل' });
    }

    return res.status(200).json({ exists: false });
  } catch (error) {
    console.error('Error checking passport uniqueness:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}


