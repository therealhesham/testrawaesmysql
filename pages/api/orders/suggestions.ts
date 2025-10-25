import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    const { q } = req.query;

    if (!q || (q as string).length < 1) {
      return res.status(200).json({ suggestions: [] });
    }

    try {
      const query = (q as string).toLowerCase();

      // البحث في أرقام الطلبات وأسماء HomeMaid معًا
      const orderIds = await prisma.neworder.findMany({
        where: {
          OR: [
            {
              id: {
                equals: isNaN(Number(query)) ? -1 : Number(query),
              },
            },
            {
              HomeMaid: {
                Name: {
                  contains: query,
                  // mode: "insensitive", // لجعل البحث غير حساس لحالة الأحرف
                },
              },
            },
          ],
        },
        select: {
          id: true,
          HomeMaid: {
            select: {
              Name: true,
            },
          },
        },
        take: 10,
      });

      // البحث في أرقام الطلبات التي تحتوي على النص المدخل
      const orderIdsContaining = await prisma.neworder.findMany({
        where: {
          id: {
            gte: isNaN(Number(query)) ? 0 : Number(query),
          },
        },
include:{
  HomeMaid:{
    select:{
      Name:true,
    },
  },
},
        take: 10,
      });

      // دمج النتائج وإزالة التكرار
      const suggestions = new Set<string>();
// console.log(suggestions);
      orderIds.forEach(item => {
        if (item.id) {
          suggestions.add(`${item.id.toString()} - ${item.HomeMaid?.Name}`);
        }
      });

      orderIdsContaining.forEach(item => {
        if (item.id && item.id.toString().includes(query)) {
          suggestions.add(`${item.id.toString()} - ${item.HomeMaid?.Name}`);
          // suggestions.add(item.id.toString());
        }
      });

      const suggestionsArray = Array.from(suggestions).slice(0, 10);
console.log(suggestionsArray);
      res.status(200).json({ suggestions: suggestionsArray });
    } catch (error) {
      console.error("Error fetching order suggestions:", error);
      res.status(500).json({ error: "Error fetching order suggestions" });
    } finally {
      await prisma.$disconnect();
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}