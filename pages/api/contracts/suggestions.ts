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

      // البحث في أرقام العقود
      const contracts = await prisma.clientAccountStatement.findMany({
        where: {
          OR: [
            {
              contractNumber: {
                contains: query,
                // mode: "insensitive",
              },
            },
          ],
        },
        select: {
          contractNumber: true,
          client: {
            select: {
              fullname: true,
            },
          },
        },
        take: 10,
      });

      // إنشاء قائمة الاقتراحات
      const suggestions = new Set<string>();
      contracts.forEach((contract) => {
        if (contract.contractNumber) {
          suggestions.add(contract.contractNumber);
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

