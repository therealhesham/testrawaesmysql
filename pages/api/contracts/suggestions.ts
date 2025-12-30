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
      const query = q as string;

      // البحث فقط في InternalmusanedContract من arrivallist
      const arrivals = await prisma.arrivallist.findMany({
        where: {
          InternalmusanedContract: {
            contains: query,
            // mode: "insensitive", // إذا كان Prisma يدعم case-insensitive
          },
        },
        select: {
          InternalmusanedContract: true,
        },
        take: 20, // زيادة العدد للحصول على نتائج أكثر
        orderBy: {
          createdAt: 'desc', // الأحدث أولاً
        },
      });

      // إنشاء قائمة الاقتراحات مع تصفية case-insensitive
      const suggestions = new Set<string>();
      const queryLower = query.toLowerCase();
      
      arrivals.forEach((arrival) => {
        if (arrival.InternalmusanedContract) {
          const contract = arrival.InternalmusanedContract;
          // تصفية case-insensitive يدوياً
          if (contract.toLowerCase().includes(queryLower)) {
            suggestions.add(contract);
          }
        }
      });

      const suggestionsArray = Array.from(suggestions).slice(0, 10);
      res.status(200).json({ suggestions: suggestionsArray });
    } catch (error) {
      console.error("Error fetching contract suggestions:", error);
      res.status(500).json({ error: "Error fetching contract suggestions" });
    } finally {
      await prisma.$disconnect();
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

