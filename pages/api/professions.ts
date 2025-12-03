import { PrismaClient } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from "next";

// نستخدم نسخة جديدة لضمان الاتصال
const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log("🟢 API Hit: /api/professions method:", req.method); // رسالة 1: تأكيد وصول الطلب للسيرفر

  try {
    if (req.method === 'GET') {
      const { id } = req.query;

      if (id) {
        // جلب مهنة واحدة
        const profession = await prisma.professions.findUnique({
          where: { id: Number(id) },
        });
        return res.status(200).json(profession);
      } else {
        // جلب كل المهن
        const professions = await prisma.professions.findMany({
            orderBy: { name: 'asc' } 
        });
        
        console.log("🟢 DB Data fetched:", professions); // رسالة 2: هل جلبت الداتا بيس بيانات؟
        
        return res.status(200).json(professions);
      }
    }

    // باقي العمليات (POST, PUT, DELETE)
    if (req.method === 'POST') {
      const { name } = req.body;
      const profession = await prisma.professions.create({ data: { name } });
      return res.status(200).json(profession);
    }

    if (req.method === 'PUT') {
      const { id, name } = req.body;
      const profession = await prisma.professions.update({ where: { id }, data: { name } });
      return res.status(200).json(profession);
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      const profession = await prisma.professions.delete({ where: { id } });
      return res.status(200).json(profession);
    }

    return res.status(405).json({ message: 'Method not allowed' });

  } catch (error) {
    console.error("🔴 Server Error:", error); // رسالة 3: في حال وجود خطأ في السيرفر
    return res.status(500).json({ error: "Failed to fetch data", details: String(error) });
  } finally {
    await prisma.$disconnect();
  }
}