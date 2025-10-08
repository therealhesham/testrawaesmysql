// pages/api/reports/governmental.ts
import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      const amount = await prisma.minimumm.create({
        data: {
          amount: req.body.amount,
        },
      });
      return res.status(200).json({ amount });
    } catch (error) {
      console.error("Minimum API error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  } else if (req.method === "GET") {
    try {
      const year = new Date().getFullYear(); // السنة الحالية
      const minimummPerMonths = [];

      // Loop على كل الشهور (من 1 إلى 12)
      for (let month = 1; month <= 12; month++) {
        const startOfMonth = new Date(year, month - 1, 1); // بداية الشهر
        const endOfMonth = new Date(year, month, 1); // بداية الشهر التالي

        const minimum = await prisma.minimumm.findFirst({
          where: {
            createdAt: {
              gte: startOfMonth,
              lt: endOfMonth,
            },
          },
        });

        // إضافة بيانات الشهر إلى المصفوفة (حتى لو مافيش بيانات)
        minimummPerMonths.push({
          month,
          minimum: minimum ? minimum.amount : null, // إرجاع null لو مافيش بيانات
        });
      }

      return res.status(200).json({ year, minimummPerMonths });
    } catch (error) {
      console.error("Minimum API error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  } else {
    return res.status(405).json({ message: "Method not allowed" });
  }
}